"""
fetch_data.py

Tập tin này kết nối đến MongoDB và truy xuất dữ liệu bài viết từ collection "threads".
Các bài viết sẽ được chuyển đổi thành một pandas DataFrame với các trường:
    - post_id
    - content
    - hashtags
    - videos
    - images
    - author (dictionary chứa _id, username, avatar)
    - createdAt
    - likesCount
    - commentsCount

Cấu hình kết nối có thể được điều chỉnh qua tham số.
"""
import logging
from pymongo import MongoClient, errors
import pandas as pd
from typing import Optional
import yaml
from datetime import datetime
from bson.objectid import ObjectId

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

# Load cấu hình từ config.yaml
with open('../config/config.yaml', 'r') as f:
    config = yaml.safe_load(f)
MONGO_URI = config['mongodb']['uri']
DATABASE = config['mongodb']['database']
POSTS_COLLECTION = config['mongodb']['posts_collection']
LIKES_COLLECTION = config['mongodb']['likes_collection']

def fetch_data(
    mongo_uri: str = MONGO_URI,
    database: str = DATABASE,
    collection: str = POSTS_COLLECTION,
    visibility: str = 'public',
    skip: int = 0,
    limit: int = 1000,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    post_ids: Optional[list] = None
) -> pd.DataFrame:
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.server_info()
        db = client[database]
        posts_collection = db[collection]

        # Xây dựng query
        query = {'visibility': visibility}
        if post_ids:
            try:
                query['_id'] = {'$in': [ObjectId(pid) for pid in post_ids]}
            except Exception as e:
                logging.warning(f"Không thể chuyển post_ids thành ObjectId: {e}")
                query['_id'] = {'$in': post_ids}

        if date_from or date_to:
            query['createdAt'] = {}
            if date_from:
                date_from_dt = datetime.strptime(date_from, '%Y-%m-%d')
                query['createdAt']['$gte'] = date_from_dt
            if date_to:
                date_to_dt = datetime.strptime(date_to, '%Y-%m-%d')
                query['createdAt']['$lte'] = date_to_dt

        # Aggregation pipeline để populate author từ collection users
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "users",  # Collection users
                    "localField": "author",
                    "foreignField": "_id",
                    "as": "author_details"
                }
            },
            {
                "$unwind": {
                    "path": "$author_details",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "content": 1,
                    "hashtags": 1,
                    "images": 1,
                    "videos": 1,
                    "createdAt": 1,
                    "likesCount": 1,
                    "commentsCount": 1,
                    "author": {
                        "$cond": {
                            "if": {"$ne": ["$author_details", None]},
                            "then": {
                                "_id": "$author_details._id",
                                "username": "$author_details.username",
                                "avatar": "$author_details.avatar"
                            },
                            "else": {
                                "_id": "$author",
                                "username": "Không xác định",
                                "avatar": ""
                            }
                        }
                    }
                }
            },
            {"$skip": skip},
            {"$limit": limit}
        ]

        posts = list(posts_collection.aggregate(pipeline))
        logging.info(f"Đã lấy được {len(posts)} bài viết từ MongoDB (skip={skip}, limit={limit}).")

        if not posts:
            logging.warning("Không tìm thấy dữ liệu trong collection.")
            return pd.DataFrame(columns=["post_id", "content", "hashtags", "images", "videos", "author", "createdAt", "likesCount", "commentsCount"])

        data = []
        for post in posts:
            # Chuẩn hóa createdAt
            created_at = post.get('createdAt')
            if created_at:
                try:
                    created_at = pd.to_datetime(created_at, errors='coerce').isoformat()
                except Exception as e:
                    logging.warning(f"Invalid createdAt format for post {post['_id']}: {e}")
                    created_at = datetime.now().isoformat()
            else:
                created_at = datetime.now().isoformat()

            data.append([
                str(post.get('_id', '')),
                post.get('content', ''),
                post.get('hashtags', []),
                post.get('images', []),
                post.get('videos', []),
                post.get('author', {'_id': '', 'username': 'Không xác định', 'avatar': ''}),
                created_at,
                post.get('likesCount', 0),
                post.get('commentsCount', 0),
            ])

        df = pd.DataFrame(data, columns=["post_id", "content", "hashtags", "images", "videos", "author", "createdAt", "likesCount", "commentsCount"])
        return df
    except errors.ServerSelectionTimeoutError as err:
        logging.error(f"Không thể kết nối đến MongoDB: {err}")
        raise
    except Exception as e:
        logging.error(f"Đã xảy ra lỗi khi truy xuất dữ liệu: {e}")
        raise

def fetch_likes(
    mongo_uri: str = MONGO_URI,
    database: str = DATABASE,
    collection: str = LIKES_COLLECTION,
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 1000
) -> pd.DataFrame:
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.server_info()
        db = client[database]
        likes_collection = db[collection]

        query = {'user': user_id} if user_id else {}
        projection = {'user': 1, 'threadId': 1, 'createdAt': 1}
        likes = list(likes_collection.find(query, projection).skip(skip).limit(limit))
        logging.info(f"Đã lấy được {len(likes)} lượt thích từ MongoDB (skip={skip}, limit={limit}).")

        if not likes:
            logging.warning("Không tìm thấy dữ liệu trong collection.")
            return pd.DataFrame(columns=["user_id", "post_id", "createdAt"])

        df = pd.DataFrame([
            [like['user'], str(like['threadId']), like['createdAt']]
            for like in likes
        ], columns=["user_id", "post_id", "createdAt"])
        return df
    except errors.ServerSelectionTimeoutError as err:
        logging.error(f"Không thể kết nối đến MongoDB: {err}")
        raise
    except Exception as e:
        logging.error(f"Đã xảy ra lỗi khi truy xuất dữ liệu: {e}")
        raise

if __name__ == "__main__":
    df_posts = fetch_data(
        visibility='public',
        skip=0,
        limit=5,
        date_from='2025-01-01',
        date_to='2025-06-30'
    )
    print("Dữ liệu bài viết:\n", df_posts.head())

    df_likes = fetch_likes(skip=0, limit=5)
    print("Dữ liệu lượt thích:\n", df_likes.head())