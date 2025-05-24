import joblib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import annoy
import implicit
import redis
import os
import sys
import logging
from datetime import datetime, timedelta
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn
from scipy.sparse import csr_matrix
import threadpoolctl
import time
import pickle
import socketio
from contextlib import asynccontextmanager

# Thiết lập logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Thêm thư mục cha (/ai/) vào sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from data.fetch_data import fetch_data, fetch_likes
    from scripts.preprocess_data import preprocess_data
except ImportError as e:
    logging.error(f"Cannot import fetch_data, fetch_likes or preprocess_data: {e}")
    raise

# FastAPI app
app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='http://localhost:3000')
app.mount("/socket.io", socketio.ASGIApp(sio))

# Pydantic model cho request
class RecommendationRequest(BaseModel):
    user_id: str
    top_n: int = 5
    public_post_ids: List[str] = []
    viewed_post_ids: List[str] = []

class MultiplePostsRequest(BaseModel):
    post_ids: List[str]

# Kết nối Redis
def connect_to_redis(max_retries=5, retry_delay=3):
    redis_host = os.getenv('REDIS_HOST', 'localhost')
    redis_port = int(os.getenv('REDIS_PORT', 6379))
    for attempt in range(max_retries):
        try:
            redis_client = redis.Redis(host=redis_host, port=redis_port, db=0, decode_responses=False)
            redis_client.ping()
            logging.info(f"Connected to Redis at {redis_host}:{redis_port}")
            return redis_client
        except redis.ConnectionError as e:
            logging.warning(f"Cannot connect to Redis at {redis_host}:{redis_port} (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
    logging.warning("Failed to connect to Redis after retries. Ensure Redis is running and check host/port settings.")
    return None

redis_client = connect_to_redis()

def load_data():
    """Tải dữ liệu từ MongoDB hoặc từ cache nếu có"""
    cache_key = 'processed_data'
    df_likes_cache_key = 'df_likes'
    
    df_processed = None
    if redis_client and redis_client.exists(cache_key):
        try:
            df_processed = pickle.loads(redis_client.get(cache_key))
            if 'image_features' not in df_processed.columns:
                logging.warning("Cached data missing 'image_features', clearing cache and reloading.")
                redis_client.delete(cache_key)
                df_processed = None
            else:
                logging.info("Loaded processed data from Redis cache.")
        except Exception as e:
            logging.warning(f"Failed to load processed data from cache: {e}")
            df_processed = None
    
    if df_processed is None:
        df_processed = fetch_and_process_data()
        if redis_client:
            try:
                redis_client.set(cache_key, pickle.dumps(df_processed), ex=2592000)  # Cache 30 ngày
                logging.info("Cached processed data in Redis.")
            except Exception as e:
                logging.warning(f"Failed to cache processed data: {e}")
    
    df_likes = None
    if redis_client and redis_client.exists(df_likes_cache_key):
        try:
            df_likes = pickle.loads(redis_client.get(df_likes_cache_key))
            logging.info("Loaded likes data from Redis cache.")
        except Exception as e:
            logging.warning(f"Failed to load likes data from cache: {e}")
            df_likes = fetch_and_process_likes()
    else:
        df_likes = fetch_and_process_likes()
        if redis_client:
            try:
                redis_client.set(df_likes_cache_key, pickle.dumps(df_likes), ex=2592000)
                logging.info("Cached likes data in Redis.")
            except Exception as e:
                logging.warning(f"Failed to cache likes data: {e}")
    
    return df_processed, df_likes

def fetch_and_process_data(post_ids=None):
    """Tải và xử lý dữ liệu bài viết từ MongoDB, tích hợp image_features"""
    try:
        df_processed = fetch_data(visibility='public', skip=0, limit=1000, post_ids=post_ids)
        logging.info(f"Fetched {len(df_processed)} posts from MongoDB.")
        if df_processed.empty:
            logging.warning("No posts found in the database.")
            return df_processed
        
        if '_id' not in df_processed.columns and 'post_id' in df_processed.columns:
            df_processed['_id'] = df_processed['post_id']
        elif '_id' not in df_processed.columns:
            logging.error("Missing '_id' column in fetched data.")
            raise ValueError("Fetched data does not contain '_id' column.")
        
        df_processed['post_id'] = df_processed['_id'].astype(str)
        df_processed['combined_text'] = (
            df_processed['content'].fillna('') + ' ' +
            df_processed['hashtags'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '').fillna('')
        )
        
        logging.debug(f"Processed posts: {df_processed[['post_id', 'author', 'createdAt']].to_dict('records')}")
        
        processed_data_file = '../scripts/processed_data.pkl'
        if os.path.exists(processed_data_file):
            try:
                df_preprocessed = joblib.load(processed_data_file)
                if 'image_features' in df_preprocessed.columns:
                    df_processed = df_processed.merge(
                        df_preprocessed[['post_id', 'image_features']],
                        on='post_id',
                        how='left'
                    )
                    logging.info("Merged image_features from processed_data.pkl.")
                    valid_features = df_processed['image_features'].apply(
                        lambda x: isinstance(x, list) and x and all(f.shape[0] == 2048 for f in x if f is not None)
                    )
                    invalid_count = len(df_processed) - valid_features.sum()
                    logging.info(f"Found {valid_features.sum()} posts with valid image_features, {invalid_count} with invalid/empty image_features.")
                    df_processed['image_features'] = df_processed['image_features'].apply(
                        lambda x: x if isinstance(x, list) and x else []
                    )
                else:
                    logging.warning("processed_data.pkl does not contain 'image_features'.")
                    df_processed['image_features'] = [[] for _ in range(len(df_processed))]
            except Exception as e:
                logging.warning(f"Failed to load processed_data.pkl: {e}")
                df_processed['image_features'] = [[] for _ in range(len(df_processed))]
        else:
            logging.warning("processed_data.pkl not found, running preprocess_data.")
            df_processed = preprocess_data(df_processed)
            if 'image_features' not in df_processed.columns or df_processed['image_features'].isna().all():
                logging.warning("preprocess_data did not generate valid image_features.")
                df_processed['image_features'] = [[] for _ in range(len(df_processed))]
        
        required_columns = [
            'post_id', 'likesCount', 'combined_text', 'createdAt', 'author', 'image_features', 'hashtags'
        ]
        for col in required_columns:
            if col not in df_processed.columns:
                logging.warning(f"Missing column {col}, initializing with default values.")
                if col == 'image_features':
                    df_processed[col] = [[] for _ in range(len(df_processed))]
                elif col == 'likesCount':
                    df_processed[col] = 0
                elif col == 'combined_text':
                    df_processed[col] = ''
                elif col == 'createdAt':
                    df_processed[col] = datetime.now().isoformat()
                elif col == 'author':
                    df_processed[col] = [{'_id': '', 'username': 'Unknown', 'avatar': ''} for _ in range(len(df_processed))]
                elif col == 'hashtags':
                    df_processed[col] = [[] for _ in range(len(df_processed))]
        
        return df_processed
    except Exception as e:
        logging.error(f"Error loading posts: {e}")
        raise

def fetch_and_process_likes():
    """Tải và xử lý dữ liệu lượt thích từ MongoDB"""
    try:
        df_likes = fetch_likes(skip=0, limit=1000)
        logging.info(f"Fetched {len(df_likes)} likes from MongoDB.")
        
        if df_likes.empty:
            logging.warning("No likes found in the database.")
            return df_likes
        
        required_columns = ['user_id', 'post_id']
        for col in required_columns:
            if col not in df_likes.columns:
                raise ValueError(f"Missing required column {col} in df_likes")
        
        df_likes['like'] = 1
        df_likes['post_id'] = df_likes['post_id'].astype(str)
        return df_likes
    except Exception as e:
        logging.error(f"Error loading likes: {e}")
        raise

def load_or_build_vectors(df_processed):
    """Tải hoặc xây dựng vector đặc trưng từ dữ liệu văn bản và hình ảnh"""
    vector_file = '../scripts/text_vectors.pkl'
    vectorizer_file = '../scripts/vectorizer.pkl'
    image_index_file = '../scripts/image_index.ann'
    
    if redis_client and redis_client.exists('text_vectors') and redis_client.exists('vectorizer'):
        try:
            text_vectors = pickle.loads(redis_client.get('text_vectors'))
            vectorizer = pickle.loads(redis_client.get('vectorizer'))
            logging.info("Loaded text vectors from Redis.")
        except Exception as e:
            logging.warning(f"Failed to load text vectors from Redis: {e}")
            vectorizer, text_vectors = build_vectors(df_processed)
    elif os.path.exists(vector_file) and os.path.exists(vectorizer_file):
        try:
            text_vectors = joblib.load(vector_file)
            vectorizer = joblib.load(vectorizer_file)
            logging.info("Loaded text vectors from disk.")
        except Exception as e:
            logging.warning(f"Failed to load text vectors: {e}")
            vectorizer, text_vectors = build_vectors(df_processed)
    else:
        vectorizer, text_vectors = build_vectors(df_processed)
    
    image_index = None
    if 'image_features' in df_processed.columns and df_processed['image_features'].apply(
        lambda x: isinstance(x, list) and x and any(f.shape[0] == 2048 for f in x if f is not None)
    ).any():
        if os.path.exists(image_index_file):
            try:
                image_index = annoy.AnnoyIndex(2048, 'angular')
                image_index.load(image_index_file)
                logging.info("Loaded image index from disk.")
            except Exception as e:
                logging.warning(f"Failed to load image index from disk: {e}")
                image_index = build_image_index(df_processed)
        else:
            logging.info("No image index found, building new image index.")
            image_index = build_image_index(df_processed)
    else:
        logging.warning("No valid image_features in df_processed, skipping image index.")
    
    return vectorizer, text_vectors, image_index

def build_vectors(df_processed):
    """Xây dựng vector TF-IDF với giới hạn max_features"""
    vectorizer = TfidfVectorizer(max_features=15000)
    text_vectors = vectorizer.fit_transform(df_processed['combined_text'].fillna('')).toarray()
    os.makedirs('../scripts', exist_ok=True)
    joblib.dump(text_vectors, '../scripts/text_vectors.pkl')
    joblib.dump(vectorizer, '../scripts/vectorizer.pkl')
    if redis_client:
        try:
            redis_client.set('text_vectors', pickle.dumps(text_vectors), ex=2592000)
            redis_client.set('vectorizer', pickle.dumps(vectorizer), ex=2592000)
            logging.info("Cached text vectors in Redis.")
        except Exception as e:
            logging.warning(f"Failed to cache text vectors: {e}")
    logging.info(f"Built and saved text vectors with {text_vectors.shape[1]} features.")
    return vectorizer, text_vectors

def build_image_index(df_processed, n_trees=10):
    """Xây dựng chỉ mục Annoy cho đặc trưng hình ảnh"""
    if 'image_features' not in df_processed.columns:
        logging.warning("No image_features column, returning empty image index.")
        return None
    
    image_index = annoy.AnnoyIndex(2048, 'angular')
    valid_indices = 0
    for idx, row in df_processed.iterrows():
        image_features = row['image_features']
        if isinstance(image_features, list) and image_features:
            valid_features = [f for f in image_features if f is not None and f.shape[0] == 2048]
            if valid_features:
                avg_features = np.mean(valid_features, axis=0)
                if avg_features.shape[0] == 2048:
                    image_index.add_item(idx, avg_features)
                    valid_indices += 1
    if valid_indices > 0:
        image_index.build(n_trees)
        image_index.save('../scripts/image_index.ann')
        logging.info(f"Built and saved image index with {valid_indices} valid items.")
    else:
        logging.warning("No valid image features found, image index not built.")
    return image_index

def build_collaborative_model(df_likes):
    """Xây dựng mô hình collaborative filtering với implicit ALS"""
    if df_likes.empty:
        logging.warning("No likes data available, skipping collaborative model.")
        return None, {}, {}, [], [], None
    
    try:
        with threadpoolctl.threadpool_limits(1, "blas"):
            user_ids = df_likes['user_id'].unique()
            post_ids = [str(pid) for pid in df_likes['post_id'].unique()]
            user_id_map = {uid: i for i, uid in enumerate(user_ids)}
            post_id_map = {pid: i for i, pid in enumerate(post_ids)}
            
            rows = [user_id_map[uid] for uid in df_likes['user_id']]
            cols = [post_id_map[str(pid)] for pid in df_likes['post_id']]
            data = df_likes['like'].values
            user_item_matrix = csr_matrix((data, (rows, cols)), shape=(len(user_ids), len(post_ids)))
            
            model = implicit.als.AlternatingLeastSquares(factors=50, iterations=15)
            model.fit(user_item_matrix)
            logging.info("Built collaborative filtering model.")
            if redis_client:
                try:
                    redis_client.set('collab_model', pickle.dumps(model), ex=2592000)
                    redis_client.set('user_id_map', pickle.dumps(user_id_map), ex=2592000)
                    redis_client.set('post_id_map', pickle.dumps(post_id_map), ex=2592000)
                    redis_client.set('user_ids', pickle.dumps(user_ids), ex=2592000)
                    redis_client.set('post_ids', pickle.dumps(post_ids), ex=2592000)
                    redis_client.set('user_item_matrix', pickle.dumps(user_item_matrix), ex=2592000)
                    logging.info("Cached collaborative model in Redis.")
                except Exception as e:
                    logging.warning(f"Failed to cache collaborative model: {e}")
            return model, user_id_map, post_id_map, user_ids, post_ids, user_item_matrix
    except Exception as e:
        logging.error(f"Error building collaborative model: {e}")
        return None, {}, {}, [], [], None

def build_user_profile(user_id, df_likes, text_vectors, df_processed, image_index):
    """Tạo hồ sơ người dùng từ lượt thích, ưu tiên hashtag và văn bản"""
    profile_cache_key = f"user_profile:{user_id}"
    if redis_client and redis_client.exists(profile_cache_key):
        try:
            profile_data = pickle.loads(redis_client.get(profile_cache_key))
            text_profile, image_profile = profile_data['text_profile'], profile_data['image_profile']
            logging.info(f"Loaded user profile for {user_id} from Redis.")
            return text_profile, image_profile
        except Exception as e:
            logging.warning(f"Failed to load user profile for {user_id} from Redis: {e}")

    liked_posts = df_likes[df_likes['user_id'] == user_id]['post_id'].astype(str).tolist()
    liked_indices = df_processed[df_processed['post_id'].isin(liked_posts)].index
    
    if len(liked_indices) == 0:
        logging.warning(f"No liked posts for user {user_id}.")
        popular_hashtags = df_processed['hashtags'].explode().value_counts().head(10).index.tolist()
        hashtag_indices = df_processed[df_processed['hashtags'].apply(
            lambda x: any(h in popular_hashtags for h in x) if isinstance(x, list) else False
        )].index
        text_profile = text_vectors[hashtag_indices].mean(axis=0) if len(hashtag_indices) > 0 else np.zeros(text_vectors.shape[1])
        image_profile = np.zeros(2048)
    else:
        liked_df = df_processed[df_processed['post_id'].isin(liked_posts)]
        liked_hashtags = liked_df['hashtags'].explode().value_counts().head(5).index.tolist()
        hashtag_weights = {}
        for hashtag in liked_hashtags:
            hashtag_indices = liked_df[liked_df['hashtags'].apply(
                lambda x: hashtag in x if isinstance(x, list) else False
            )].index
            hashtag_weights[hashtag] = len(hashtag_indices) / len(liked_indices) if len(liked_indices) > 0 else 0
        
        weights = []
        for idx in liked_indices:
            post_hashtags = df_processed.iloc[idx]['hashtags']
            weight = sum(hashtag_weights.get(h, 0) for h in post_hashtags if isinstance(post_hashtags, list)) + 1
            weights.append(weight)
        weights = np.array(weights) / sum(weights) if sum(weights) > 0 else np.ones(len(liked_indices)) / len(liked_indices)
        
        liked_text_vectors = text_vectors[liked_indices]
        text_profile = np.average(liked_text_vectors, axis=0, weights=weights) if liked_text_vectors.size > 0 else np.zeros(text_vectors.shape[1])
        
        image_profile = np.zeros(2048)
        if 'image_features' in df_processed.columns and image_index:
            image_features = []
            for idx in liked_indices:
                features = df_processed.iloc[idx]['image_features']
                if isinstance(features, list) and features:
                    valid_features = [f for f in features if f is not None and f.shape[0] == 2048]
                    if valid_features:
                        avg_features = np.mean(valid_features, axis=0)
                        if avg_features.shape[0] == 2048:
                            image_features.append(avg_features)
            image_profile = np.mean(image_features, axis=0) if image_features else np.zeros(2048)
    
    if redis_client:
        try:
            profile_data = {'text_profile': text_profile, 'image_profile': image_profile}
            redis_client.set(profile_cache_key, pickle.dumps(profile_data), ex=2592000)
            logging.info(f"Cached user profile for {user_id} in Redis.")
        except Exception as e:
            logging.warning(f"Failed to cache user profile for {user_id}: {e}")
    
    return text_profile, image_profile

def get_global_recommendations(df_processed, top_n=50):
    """Tạo danh sách bài viết phổ biến dựa trên lượt thích và độ mới"""
    recent_df = df_processed[
        pd.to_datetime(df_processed['createdAt']) >= datetime.now() - timedelta(days=7)
    ]
    if recent_df.empty:
        logging.warning("No recent posts for global recommendations, using all posts.")
        recent_df = df_processed
    
    popular_hashtags = recent_df['hashtags'].explode().value_counts().head(10).index.tolist()
    hashtag_filtered = recent_df[recent_df['hashtags'].apply(
        lambda x: any(h in popular_hashtags for h in x) if isinstance(x, list) else False
    )]
    if not hashtag_filtered.empty:
        recent_df = hashtag_filtered
    
    sorted_df = recent_df.sort_values(by=['likesCount', 'createdAt'], ascending=[False, False])
    global_recs = sorted_df['post_id'].head(top_n).tolist()
    
    if redis_client:
        try:
            redis_client.set('global_recommendations', pickle.dumps(global_recs), ex=2592000)
            logging.info("Cached global recommendations in Redis.")
        except Exception as e:
            logging.warning(f"Failed to cache global recommendations: {e}")
    
    return global_recs

def get_top_posts(df_processed, top_n=5, liked_posts=None, public_post_ids=None, viewed_post_ids=None):
    """Trả về top N bài viết mới nhất, ưu tiên hashtag phổ biến"""
    liked_posts = set(liked_posts or [])
    public_post_ids = set(public_post_ids or [])
    viewed_post_ids = set(viewed_post_ids or [])
    
    global_recs = []
    if redis_client and redis_client.exists('global_recommendations'):
        try:
            global_recs = pickle.loads(redis_client.get('global_recommendations'))
            logging.info("Loaded global recommendations from Redis.")
        except Exception as e:
            logging.warning(f"Failed to load global recommendations: {e}")
            global_recs = get_global_recommendations(df_processed, top_n=50)
    
    filtered_recs = [
        post_id for post_id in global_recs
        if post_id not in liked_posts and post_id not in public_post_ids and post_id not in viewed_post_ids
    ]
    
    if len(filtered_recs) >= top_n:
        return filtered_recs[:top_n]
    
    logging.warning("Not enough global recommendations, fetching additional posts.")
    filtered_df = df_processed[
        (~df_processed['post_id'].isin(liked_posts)) &
        (~df_processed['post_id'].isin(viewed_post_ids)) &
        (~df_processed['post_id'].isin(public_post_ids)) &
        (pd.to_datetime(df_processed['createdAt']) >= datetime.now() - timedelta(days=7))
    ]
    if filtered_df.empty:
        logging.warning("No recent posts available after filtering, relaxing constraints.")
        filtered_df = df_processed[
            (~df_processed['post_id'].isin(liked_posts)) &
            (~df_processed['post_id'].isin(viewed_post_ids)) &
            (~df_processed['post_id'].isin(public_post_ids))
        ]
    filtered_df = filtered_df.sort_values(by='createdAt', ascending=False)
    additional_recs = filtered_df['post_id'].head(top_n - len(filtered_recs)).tolist()
    return filtered_recs + additional_recs

async def recommend_posts_for_user(user_id, df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info, top_n=5, public_post_ids=None, viewed_post_ids=None):
    """Đề xuất bài viết cho một người dùng, ưu tiên sở thích và độ mới"""
    model, user_id_map, post_id_map, user_ids, post_ids, user_item_matrix = collab_model_info
    text_profile, image_profile = build_user_profile(user_id, df_likes, text_vectors, df_processed, image_index)
    
    liked_posts = set(df_likes[df_likes['user_id'] == user_id]['post_id'].astype(str))
    public_post_ids = set(public_post_ids or [])
    viewed_post_ids = set(viewed_post_ids or [])
    
    valid_posts = df_processed[
        (~df_processed['post_id'].isin(liked_posts)) &
        (~df_processed['post_id'].isin(viewed_post_ids)) &
        (~df_processed['post_id'].isin(public_post_ids)) &
        (pd.to_datetime(df_processed['createdAt']) >= datetime.now() - timedelta(days=7))
    ]
    if valid_posts.empty:
        logging.warning(f"No valid recent posts for user {user_id} after filtering. Falling back to all posts.")
        valid_posts = df_processed[
            (~df_processed['post_id'].isin(liked_posts)) &
            (~df_processed['post_id'].isin(viewed_post_ids)) &
            (~df_processed['post_id'].isin(public_post_ids))
        ]
    
    if valid_posts.empty:
        logging.warning(f"No posts available for user {user_id}. Returning top posts.")
        return get_top_posts(df_processed, top_n, liked_posts, public_post_ids, viewed_post_ids)
    
    valid_indices = valid_posts.index.tolist()
    
    if text_profile is None or np.all(text_profile == 0):
        logging.warning(f"No valid text profile for user {user_id}, returning top posts.")
        return get_top_posts(df_processed, top_n, liked_posts, public_post_ids, viewed_post_ids)
    
    num_likes = len(liked_posts)
    collab_weight = 0.2 if num_likes >= 10 else 0.15
    text_weight = 0.5
    image_weight = 0.2
    recency_weight = 0.5
    
    text_recs = []
    if text_index:
        try:
            indices, distances = text_index.get_nns_by_vector(text_profile, top_n * 3, include_distances=True)
            text_recs = [
                (df_processed.iloc[idx]['post_id'], 1 - dist, pd.to_datetime(df_processed.iloc[idx]['createdAt']))
                for idx, dist in zip(indices, distances)
                if idx in valid_indices
            ]
        except Exception as e:
            logging.warning(f"Failed to get text recommendations for user {user_id}: {e}")
    
    image_recs = []
    if image_index and image_profile is not None and not np.all(image_profile == 0):
        try:
            indices, distances = image_index.get_nns_by_vector(image_profile, top_n * 3, include_distances=True)
            image_recs = [
                (df_processed.iloc[idx]['post_id'], 1 - dist, pd.to_datetime(df_processed.iloc[idx]['createdAt']))
                for idx, dist in zip(indices, distances)
                if idx in valid_indices
            ]
        except Exception as e:
            logging.warning(f"Failed to get image recommendations for user {user_id}: {e}")
    
    collab_recs = []
    if model and user_id in user_id_map:
        user_idx = user_id_map[user_id]
        user_items = user_item_matrix[user_idx]
        try:
            collab_indices, scores = model.recommend(user_idx, user_items, N=top_n * 3, filter_already_liked_items=True)
            collab_recs = [
                (
                    post_ids[idx], 
                    score, 
                    pd.to_datetime(df_processed[df_processed['post_id'] == post_ids[idx]]['createdAt'].iloc[0] 
                                  if not df_processed[df_processed['post_id'] == post_ids[idx]].empty 
                                  else datetime.now())
                )
                for idx, score in zip(collab_indices, scores)
                if post_ids[idx] in valid_posts['post_id'].values
            ]
        except Exception as e:
            logging.warning(f"Failed to get collaborative recommendations for user {user_id}: {e}")
    
    max_date = pd.to_datetime(df_processed['createdAt']).max()
    def normalize_recency(created_at):
        days_diff = (max_date - pd.to_datetime(created_at)).days
        return 1 / (1 + np.log1p(max(1, days_diff)))
    
    combined_recs = {}
    for rec_id, score, created_at in text_recs:
        recency_score = normalize_recency(created_at)
        combined_recs[rec_id] = {
            'score': combined_recs.get(rec_id, {'score': 0})['score'] + score * text_weight + recency_score * recency_weight,
            'created_at': created_at
        }
    for rec_id, score, created_at in image_recs:
        recency_score = normalize_recency(created_at)
        combined_recs[rec_id] = {
            'score': combined_recs.get(rec_id, {'score': 0})['score'] + score * image_weight + recency_score * recency_weight,
            'created_at': created_at
        }
    for rec_id, score, created_at in collab_recs:
        recency_score = normalize_recency(created_at)
        combined_recs[rec_id] = {
            'score': combined_recs.get(rec_id, {'score': 0})['score'] + score * collab_weight + recency_score * recency_weight,
            'created_at': created_at
        }
    
    sorted_recs = sorted(
        combined_recs.items(),
        key=lambda x: (x[1]['score'], x[1]['created_at']),
        reverse=True
    )
    final_recs = [str(rec) for rec, _ in sorted_recs][:top_n]
    
    if any(rec in liked_posts for rec in final_recs):
        logging.error(f"Recommendations for user {user_id} contain liked posts: {final_recs}")
    if any(rec in public_post_ids for rec in final_recs):
        logging.error(f"Recommendations for user {user_id} contain public posts: {final_recs}")
    if any(rec in viewed_post_ids for rec in final_recs):
        logging.error(f"Recommendations for user {user_id} contain viewed posts: {final_recs}")
    
    if not final_recs:
        logging.warning(f"No valid recommendations for user {user_id}, falling back to top posts.")
        final_recs = get_top_posts(df_processed, top_n, liked_posts, public_post_ids, viewed_post_ids)
    
    if redis_client and final_recs:
        try:
            existing_viewed = pickle.loads(redis_client.get(f"viewed_posts:{user_id}") or b'[]')
            updated_viewed = list(set(existing_viewed + final_recs))
            redis_client.set(f"viewed_posts:{user_id}", pickle.dumps(updated_viewed), ex=2592000)
            logging.info(f"Updated viewed posts for user {user_id} in Redis: {final_recs}")
        except Exception as e:
            logging.warning(f"Failed to update viewed posts for user {user_id}: {e}")
    
    logging.debug(f"Final recommendations for user {user_id}: {final_recs}")
    return final_recs

async def update_user_recommendations(user_id, df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info, top_n=5):
    """Cập nhật đề xuất cho một người dùng khi có hành động như like/unlike"""
    viewed_posts = []
    if redis_client and redis_client.exists(f"viewed_posts:{user_id}"):
        try:
            viewed_posts = pickle.loads(redis_client.get(f"viewed_posts:{user_id}"))
        except Exception as e:
            logging.warning(f"Failed to load viewed posts for user {user_id}: {e}")
    
    recs = await recommend_posts_for_user(
        user_id, df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info, top_n, viewed_post_ids=viewed_posts
    )
    
    if redis_client:
        try:
            redis_client.set(f"recommendations:{user_id}", pickle.dumps(recs), ex=2592000)
            redis_client.set(f"recommendations_timestamp:{user_id}", str(time.time()), ex=2592000)
            logging.info(f"Updated recommendations for user {user_id} in Redis.")
        except Exception as e:
            logging.warning(f"Failed to cache recommendations for user {user_id}: {e}")
    
    await sio.emit('newRecommendations', {'userId': user_id, 'postIds': recs})
    logging.info(f"Emitted newRecommendations for user {user_id}")
    return recs

async def update_global_recommendations(df_processed):
    """Cập nhật danh sách đề xuất toàn cục"""
    global_recs = get_global_recommendations(df_processed, top_n=50)
    logging.info(f"Updated global recommendations: {global_recs}")
    return global_recs

async def update_recommendations_for_all_users(df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info, top_n=5):
    """Cập nhật định kỳ đề xuất cho tất cả người dùng"""
    if redis_client:
        lock_key = 'recommendation_update_lock'
        if redis_client.get(lock_key):
            logging.info("Recommendation update already in progress, skipping.")
            return
        
        try:
            redis_client.set(lock_key, '1', ex=7200)
            user_ids = df_likes['user_id'].unique()
            logging.info(f"Updating recommendations for {len(user_ids)} users")
            
            recommendations = {}
            changed_users = set()
            await update_global_recommendations(df_processed)
            
            for user_id in user_ids:
                viewed_posts = []
                if redis_client and redis_client.exists(f"viewed_posts:{user_id}"):
                    try:
                        viewed_posts = pickle.loads(redis_client.get(f"viewed_posts:{user_id}"))
                    except Exception as e:
                        logging.warning(f"Failed to load viewed posts for user {user_id}: {e}")
                cached_recs = []
                if redis_client and redis_client.exists(f"recommendations:{user_id}"):
                    try:
                        cached_recs = pickle.loads(redis_client.get(f"recommendations:{user_id}"))
                    except Exception as e:
                        logging.warning(f"Failed to load cached recommendations for user {user_id}: {e}")
                
                recs = await recommend_posts_for_user(
                    user_id, df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info, top_n, viewed_post_ids=viewed_posts
                )
                recommendations[user_id] = recs
                if set(recs) != set(cached_recs):
                    changed_users.add(user_id)
                if redis_client:
                    try:
                        redis_client.set(f"recommendations:{user_id}", pickle.dumps(recs), ex=2592000)
                        redis_client.set(f"recommendations_timestamp:{user_id}", str(time.time()), ex=2592000)
                        logging.info(f"Cached recommendations for user {user_id} in Redis.")
                    except Exception as e:
                        logging.warning(f"Failed to cache recommendations for user {user_id}: {e}")
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f'../scripts/recommendations_{timestamp}.pkl'
            os.makedirs('../scripts', exist_ok=True)
            joblib.dump(recommendations, output_file)
            logging.info(f"Recommendations saved to {output_file}")
            
            for user_id in changed_users:
                await sio.emit('newRecommendations', {'userId': user_id, 'postIds': recommendations[user_id]})
                logging.info(f"Emitted newRecommendations for user {user_id}")
        finally:
            redis_client.delete(lock_key)
    
    return recommendations

async def periodic_recommendation_update():
    """Cập nhật định kỳ đề xuất cho tất cả người dùng"""
    while True:
        try:
            if redis_client and redis_client.get('recommendation_update_lock'):
                logging.info("Periodic update skipped due to active recommendation update.")
                await asyncio.sleep(7200)
                continue
            
            df_processed, df_likes = load_data()
            vectorizer, text_vectors, image_index = load_or_build_vectors(df_processed)
            text_index = build_annoy_index(text_vectors)
            collab_model_info = build_collaborative_model(df_likes)
            await update_recommendations_for_all_users(
                df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info
            )
            logging.info("Completed periodic recommendation update.")
        except Exception as e:
            logging.error(f"Error in periodic recommendation update: {e}")
        await asyncio.sleep(7200)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Quản lý vòng đời ứng dụng, khởi động task định kỳ"""
    task = asyncio.create_task(periodic_recommendation_update())
    logging.info("Started periodic recommendation update task.")
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            logging.info("Periodic recommendation update task cancelled.")

app.lifespan = lifespan

async def background_recommendation_task(user_id, df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info, top_n, public_post_ids, viewed_post_ids):
    """Tính toán đề xuất trong nền cho người dùng"""
    try:
        recs = await recommend_posts_for_user(
            user_id, df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info, 
            top_n, public_post_ids, viewed_post_ids
        )
        if redis_client:
            try:
                redis_client.set(f"recommendations:{user_id}", pickle.dumps(recs), ex=2592000)
                redis_client.set(f"recommendations_timestamp:{user_id}", str(time.time()), ex=2592000)
                logging.info(f"Cached background recommendations for user {user_id}.")
                await sio.emit('newRecommendations', {'userId': user_id, 'postIds': recs})
            except Exception as e:
                logging.warning(f"Failed to cache background recommendations for user {user_id}: {e}")
    except Exception as e:
        logging.error(f"Error in background recommendation task for user {user_id}: {e}")

@app.post("/recommendations", response_model=List[str])
async def get_recommendations(request: RecommendationRequest, background_tasks: BackgroundTasks):
    """API endpoint để lấy đề xuất bài viết cho một người dùng"""
    try:
        cache_key = f"recommendations:{request.user_id}"
        cache_timestamp_key = f"recommendations_timestamp:{request.user_id}"
        viewed_posts = []
        if redis_client and redis_client.exists(f"viewed_posts:{request.user_id}"):
            try:
                viewed_posts = pickle.loads(redis_client.get(f"viewed_posts:{request.user_id}"))
            except Exception as e:
                logging.warning(f"Failed to load viewed posts for user {request.user_id}: {e}")
        
        # Kiểm tra cache
        if redis_client and redis_client.exists(cache_key):
            try:
                cache_timestamp = redis_client.get(cache_timestamp_key)
                if cache_timestamp:
                    cache_time = float(cache_timestamp)
                    if (time.time() - cache_time) < 600:  # 10 phút
                        recommendations = pickle.loads(redis_client.get(cache_key))
                        logging.info(f"Retrieved fresh cached recommendations for user {request.user_id}.")
                        return recommendations
            except Exception as e:
                logging.warning(f"Failed to check cache timestamp for user {request.user_id}: {e}")
        
        # Nếu không có cache, trả về global recommendations và tính toán cá nhân hóa trong nền
        df_processed, df_likes = load_data()
        recommendations = get_top_posts(df_processed, request.top_n, None, request.public_post_ids, viewed_posts)
        logging.info(f"Returning global recommendations for user {request.user_id} while computing personalized ones.")
        
        # Tải dữ liệu và chạy tính toán trong nền
        vectorizer, text_vectors, image_index = load_or_build_vectors(df_processed)
        text_index = None
        for attempt in range(3):
            try:
                text_index = build_annoy_index(text_vectors)
                break
            except Exception as e:
                logging.warning(f"Attempt {attempt + 1}/3 failed to build text index: {e}")
                if attempt == 2:
                    logging.error(f"Failed to build text index after retries: {e}")
                    raise
                time.sleep(1)
        
        collab_model_info = build_collaborative_model(df_likes)
        background_tasks.add_task(
            background_recommendation_task,
            request.user_id, df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info,
            request.top_n, request.public_post_ids, viewed_posts
        )
        
        return recommendations
    except Exception as e:
        logging.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommendations/all/{user_id}", response_model=List[str])
async def get_all_recommendations(user_id: str):
    """API endpoint để lấy đề xuất đã được tính trước cho một người dùng"""
    viewed_posts = []
    if redis_client and redis_client.exists(f"viewed_posts:{user_id}"):
        try:
            viewed_posts = pickle.loads(redis_client.get(f"viewed_posts:{user_id}"))
        except Exception as e:
            logging.warning(f"Failed to load viewed posts for user {user_id}: {e}")
    
    cache_key = f"recommendations:{user_id}"
    cache_timestamp_key = f"recommendations_timestamp:{user_id}"
    if redis_client and redis_client.exists(cache_key):
        try:
            cache_timestamp = redis_client.get(cache_timestamp_key)
            if cache_timestamp:
                cache_time = float(cache_timestamp)
                if (time.time() - cache_time) < 600:
                    recommendations = pickle.loads(redis_client.get(cache_key))
                    logging.info(f"Retrieved fresh cached recommendations for user {user_id}.")
                    return recommendations
        except Exception as e:
            logging.warning(f"Failed to load cached recommendations for user {user_id}: {e}")
    
    try:
        df_processed, df_likes = load_data()
        recommendations = get_top_posts(df_processed, 5, None, [], viewed_posts)
        logging.info(f"Returning global recommendations for user {user_id}.")
        return recommendations
    except Exception as e:
        logging.error(f"Error generating recommendations for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/posts/multiple")
async def get_multiple_posts(request: MultiplePostsRequest):
    """API endpoint để lấy thông tin nhiều bài viết"""
    try:
        df_processed = fetch_and_process_data(post_ids=request.post_ids)
        if df_processed.empty:
            raise HTTPException(status_code=404, detail="No posts found")
        
        posts = df_processed[[
            'post_id', 'content', 'hashtags', 'likesCount', 'createdAt', 'author', 'images', 'videos'
        ]].to_dict(orient="records")
        
        formatted_posts = [
            {
                '_id': str(post['post_id']),
                'content': post['content'] or '',
                'hashtags': post['hashtags'] if isinstance(post['hashtags'], list) else [],
                'likesCount': post['likesCount'] or 0,
                'createdAt': post['createdAt'],
                'author': {
                    '_id': str(post['author']['_id']) if post['author'].get('_id') else '',
                    'username': post['author']['username'] if post['author'].get('username') else 'Unknown',
                    'avatar': post['author']['avatar'] if post['author'].get('avatar') else ''
                },
                'images': post['images'] if isinstance(post['images'], list) else [],
                'videos': post['videos'] if isinstance(post['videos'], list) else []
            }
            for post in posts
        ]
        
        logging.debug(f"Returning {len(formatted_posts)} posts: {formatted_posts}")
        return {"posts": formatted_posts}
    except Exception as e:
        logging.error(f"Error fetching posts: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/like")
async def handle_like(request: dict):
    """Chuyển tiếp yêu cầu lượt thích đến endpoint cũ và cập nhật đề xuất"""
    try:
        user_id = request.get('user_id')
        post_id = request.get('threadId')
        is_liked = request.get('isLiked')
        if not user_id or not post_id:
            raise HTTPException(status_code=400, detail="Missing user_id or threadId")

        import requests
        auth_token = request.get('headers', {}).get('Authorization', '').replace('Bearer ', '')
        like_url = "http://your-old-backend-api/like"  # Thay bằng URL endpoint thực tế
        response = requests.post(
            like_url,
            json={"user_id": user_id, "post_id": post_id, "is_liked": is_liked},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        response.raise_for_status()
        like_data = response.json()

        await sio.emit('likePost', {
            'postId': post_id,
            'isLiked': is_liked,
            'likesCount': like_data.get('likesCount', 0)
        })

        if redis_client:
            try:
                redis_client.delete(f"recommendations:{user_id}")
                redis_client.delete(f"recommendations_timestamp:{user_id}")
                redis_client.delete(f"user_profile:{user_id}")
                logging.info(f"Cleared recommendation cache and user profile for user {user_id} after like action")
                
                df_processed, df_likes = load_data()
                vectorizer, text_vectors, image_index = load_or_build_vectors(df_processed)
                text_index = build_annoy_index(text_vectors)
                collab_model_info = build_collaborative_model(df_likes)
                await update_user_recommendations(
                    user_id, df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info
                )
            except Exception as e:
                logging.warning(f"Failed to update recommendations after like for user {user_id}: {e}")

        return {"isLiked": is_liked, "likesCount": like_data.get('likesCount', 0)}
    except requests.exceptions.RequestException as e:
        logging.error(f"Error calling old like endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to process like request")
    except Exception as e:
        logging.error(f"Error handling like: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

def build_annoy_index(text_vectors):
    """Xây dựng chỉ mục Annoy cho vector văn bản"""
    try:
        if not isinstance(text_vectors, np.ndarray) or text_vectors.size == 0:
            logging.error("Invalid text_vectors: empty or not a numpy array.")
            raise ValueError("text_vectors must be a non-empty numpy array")
        
        text_index_file = '../scripts/text_index.ann'
        os.makedirs('../scripts', exist_ok=True)
        
        if os.path.exists(text_index_file):
            try:
                text_index = annoy.AnnoyIndex(text_vectors.shape[1], 'angular')
                text_index.load(text_index_file)
                logging.info("Loaded text index from disk.")
                return text_index
            except Exception as e:
                logging.warning(f"Failed to load text_index.ann: {e}. Rebuilding index.")
                os.remove(text_index_file)
        
        text_index = annoy.AnnoyIndex(text_vectors.shape[1], 'angular')
        for i, vec in enumerate(text_vectors):
            if not isinstance(vec, np.ndarray) or vec.size != text_vectors.shape[1]:
                logging.warning(f"Skipping invalid vector at index {i}: {vec}")
                continue
            text_index.add_item(i, vec)
        
        if text_index.get_n_items() == 0:
            logging.error("No valid vectors added to text index.")
            raise ValueError("No valid vectors added to text index")
        
        text_index.build(10)
        try:
            text_index.save(text_index_file)
            logging.info("Built and saved text index to disk.")
        except Exception as e:
            logging.warning(f"Failed to save text_index.ann: {e}")
        
        return text_index
    except Exception as e:
        logging.error(f"Error building text index: {e}")
        raise

if __name__ == "__main__":
    try:
        df_processed, df_likes = load_data()
        vectorizer, text_vectors, image_index = load_or_build_vectors(df_processed)
        text_index = build_annoy_index(text_vectors)
        collab_model_info = build_collaborative_model(df_likes)
        asyncio.run(update_recommendations_for_all_users(
            df_likes, text_vectors, df_processed, text_index, image_index, collab_model_info
        ))
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        logging.error(f"Error in main execution: {e}")
        raise