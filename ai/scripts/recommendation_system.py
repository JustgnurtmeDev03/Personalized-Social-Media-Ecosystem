import joblib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
from sklearn.decomposition import TruncatedSVD
import dask.array as da
import implicit
import redis
import os
import sys
import logging
from datetime import datetime
import asyncio
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uvicorn
from scipy.sparse import csr_matrix
import threadpoolctl

# Kiểm tra phiên bản NumPy
import numpy
if not numpy.__version__.startswith('2'):
    raise ImportError("This code requires NumPy >=2.0. Please run `pip install numpy` to upgrade to the latest version.")

# Thiết lập logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Kết nối Redis
redis_available = False
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    redis_available = True
    logging.info("Redis connection established.")
except redis.ConnectionError:
    logging.warning("Cannot connect to Redis. Falling back to local storage.")

# Thêm thư mục cha (/ai/) vào sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from data.fetch_data import fetch_data, fetch_likes

# FastAPI app
app = FastAPI()

# Pydantic model cho request
class RecommendationRequest(BaseModel):
    user_id: str
    top_n: int = 5

def load_data():
    """Tải dữ liệu từ MongoDB"""
    try:
        df_processed = fetch_data(visibility='public', skip=0, limit=1000)
        df_processed['combined_text'] = (
            df_processed['content'].fillna('') + ' ' +
            df_processed['hashtags'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '').fillna('')
        )
        required_post_columns = ['post_id', 'likesCount', 'combined_text']
        if not all(col in df_processed.columns for col in required_post_columns):
            missing = [col for col in required_post_columns if col not in df_processed.columns]
            raise ValueError(f"df_processed missing required columns: {missing}")
        
        os.makedirs('../scripts', exist_ok=True)
        joblib.dump(df_processed, '../scripts/processed_data.pkl')
        
        df_likes = fetch_likes(skip=0, limit=1000)
        df_likes['like'] = 1
        required_like_columns = ['user_id', 'post_id', 'like']
        if not all(col in df_likes.columns for col in required_like_columns):
            missing = [col for col in required_like_columns if col not in df_likes.columns]
            raise ValueError(f"df_likes missing required columns: {missing}")
        
        return df_processed, df_likes
    except Exception as e:
        logging.error(f"Error loading data: {e}")
        raise

def load_or_build_vectors(df_processed):
    """Tải hoặc xây dựng vector đặc trưng"""
    vector_file = '../scripts/text_vectors.pkl'
    vectorizer_file = '../scripts/vectorizer.pkl'
    if os.path.exists(vector_file) and os.path.exists(vectorizer_file):
        try:
            text_vectors = joblib.load(vector_file)
            vectorizer = joblib.load(vectorizer_file)
        except Exception as e:
            logging.warning(f"Failed to load vectors, rebuilding: {e}")
            vectorizer = TfidfVectorizer(max_features=1000)
            text_vectors = vectorizer.fit_transform(df_processed['combined_text']).toarray()
            os.makedirs('../scripts', exist_ok=True)
            joblib.dump(text_vectors, vector_file)
            joblib.dump(vectorizer, vectorizer_file)
    else:
        vectorizer = TfidfVectorizer(max_features=1000)
        text_vectors = vectorizer.fit_transform(df_processed['combined_text']).toarray()
        os.makedirs('../scripts', exist_ok=True)
        joblib.dump(text_vectors, vector_file)
        joblib.dump(vectorizer, vectorizer_file)
    return vectorizer, da.from_array(text_vectors, chunks=(1000, 1000))

def build_knn_model(text_vectors, n_neighbors=10):
    """Xây dựng mô hình KNN"""
    knn = NearestNeighbors(n_neighbors=n_neighbors, metric='cosine')
    knn.fit(text_vectors.compute() if isinstance(text_vectors, da.Array) else text_vectors)
    return knn

def build_collaborative_model(df_likes):
    """Xây dựng mô hình collaborative filtering với implicit ALS"""
    try:
        with threadpoolctl.threadpool_limits(1, "blas"):
            user_ids = df_likes['user_id'].unique()
            post_ids = df_likes['post_id'].unique()
            user_id_map = {uid: i for i, uid in enumerate(user_ids)}
            post_id_map = {pid: i for i, pid in enumerate(post_ids)}
            
            rows = [user_id_map[uid] for uid in df_likes['user_id']]
            cols = [post_id_map[pid] for pid in df_likes['post_id']]
            data = df_likes['like'].values
            user_item_matrix = csr_matrix((data, (rows, cols)), shape=(len(user_ids), len(post_ids)))
            
            model = implicit.als.AlternatingLeastSquares(factors=50, iterations=15)
            model.fit(user_item_matrix)
            return model, user_id_map, post_id_map, user_ids, post_ids
    except Exception as e:
        logging.error(f"Error building collaborative model: {e}")
        raise

def build_user_profile(user_id, df_likes, text_vectors, df_processed, n_components=100):
    """Tạo hồ sơ người dùng từ lượt thích với SVD"""
    profile_file = f'../scripts/user_profile_{user_id}.pkl'
    if redis_available:
        try:
            cached_profile = redis_client.get(f"user_profile:{user_id}")
            if cached_profile:
                return np.frombuffer(cached_profile, dtype=float)
        except redis.ConnectionError:
            logging.warning(f"Redis unavailable for user {user_id}, falling back to local storage.")

    if os.path.exists(profile_file):
        try:
            return joblib.load(profile_file)
        except Exception as e:
            logging.warning(f"Failed to load profile for user {user_id}: {e}")

    liked_posts = df_likes[df_likes['user_id'] == user_id]['post_id'].tolist()
    liked_indices = df_processed[df_processed['post_id'].isin(liked_posts)].index

    if len(liked_indices) == 0:
        return None

    liked_vectors = text_vectors[liked_indices].compute() if isinstance(text_vectors, da.Array) else text_vectors[liked_indices]
    
    # Động điều chỉnh n_components
    n_features = liked_vectors.shape[1]
    n_components = min(n_components, n_features)
    if n_components == 0:
        logging.warning(f"No valid features for user {user_id}, returning None.")
        return None

    svd = TruncatedSVD(n_components=n_components)
    reduced_vectors = svd.fit_transform(liked_vectors)
    user_profile = np.mean(reduced_vectors, axis=0)

    if redis_available:
        try:
            redis_client.setex(f"user_profile:{user_id}", 3600, user_profile.tobytes())
        except redis.ConnectionError:
            logging.warning(f"Failed to save profile to Redis for user {user_id}, saving locally.")
            os.makedirs('../scripts', exist_ok=True)
            joblib.dump(user_profile, profile_file)
    else:
        os.makedirs('../scripts', exist_ok=True)
        joblib.dump(user_profile, profile_file)

    return user_profile

def get_top_posts(df_processed, top_n=5):
    """Trả về top N bài viết có likesCount cao nhất"""
    return df_processed.nlargest(top_n, 'likesCount')['post_id'].tolist()

async def recommend_posts_for_user(user_id, df_likes, text_vectors, df_processed, knn, collab_model_info, top_n=5):
    """Đề xuất bài viết cho một người dùng"""
    model, user_id_map, post_id_map, user_ids, post_ids = collab_model_info
    user_profile = build_user_profile(user_id, df_likes, text_vectors, df_processed)
    
    if user_profile is None:
        return get_top_posts(df_processed, top_n)

    distances, indices = knn.kneighbors([user_profile])
    content_based_recs = df_processed.iloc[indices[0][:top_n]]['post_id'].tolist()

    if user_id in user_id_map:
        user_idx = user_id_map[user_id]
        collab_indices, scores = model.recommend(user_idx, None, N=top_n, filter_already_liked_items=True)
        collab_recs = [post_ids[idx] for idx in collab_indices]
    else:
        collab_recs = []

    liked_posts = set(df_likes[df_likes['user_id'] == user_id]['post_id'])
    combined_recs = list(set(content_based_recs + collab_recs) - liked_posts)
    return combined_recs[:top_n]

@app.post("/recommendations", response_model=List[str])
async def get_recommendations(request: RecommendationRequest):
    """API endpoint để lấy đề xuất bài viết"""
    try:
        df_processed, df_likes = load_data()
        vectorizer, text_vectors = load_or_build_vectors(df_processed)
        knn_model = build_knn_model(text_vectors)
        collab_model_info = build_collaborative_model(df_likes)
        
        recommendations = await recommend_posts_for_user(
            request.user_id, df_likes, text_vectors, df_processed, knn_model, collab_model_info, request.top_n
        )
        return recommendations
    except Exception as e:
        logging.error(f"Error generating recommendations: {e}")
        raise

async def update_recommendations_for_all_users(df_likes, text_vectors, df_processed, knn, collab_model_info, top_n=5):
    """Cập nhật đề xuất cho tất cả người dùng"""
    user_ids = df_likes['user_id'].unique()
    logging.info(f"Updating recommendations for {len(user_ids)} users")
    
    recommendations = {}
    tasks = [
        recommend_posts_for_user(user_id, df_likes, text_vectors, df_processed, knn, collab_model_info, top_n)
        for user_id in user_ids
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for user_id, result in zip(user_ids, results):
        if isinstance(result, Exception):
            logging.error(f"Error for user {user_id}: {result}")
            recommendations[user_id] = get_top_posts(df_processed, top_n)  # Fallback to top posts
            continue
        recommendations[user_id] = result
        if redis_available:
            try:
                redis_client.setex(f"recommendations:{user_id}", 3600, str(result))
            except redis.ConnectionError:
                logging.warning(f"Failed to save recommendations to Redis for user {user_id}.")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f'../scripts/recommendations_{timestamp}.pkl'
    os.makedirs('../scripts', exist_ok=True)
    joblib.dump(recommendations, output_file)
    logging.info(f"Recommendations saved to {output_file}")
    
    return recommendations

if __name__ == "__main__":
    try:
        df_processed, df_likes = load_data()
        vectorizer, text_vectors = load_or_build_vectors(df_processed)
        knn_model = build_knn_model(text_vectors)
        collab_model_info = build_collaborative_model(df_likes)
        asyncio.run(update_recommendations_for_all_users(df_likes, text_vectors, df_processed, knn_model, collab_model_info))
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        logging.error(f"Error in main execution: {e}")
        raise