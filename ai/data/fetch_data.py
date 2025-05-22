"""
fetch_data.py

Tập tin này kết nối đến MongoDB và truy xuất dữ liệu bài viết từ collection "threads".
Các bài viết sẽ được chuyển đổi thành một pandas DataFrame với các trường:
    - post_id
    - content
    - tags
    - videos
    - images
    - metadata

Cấu hình kết nối có thể được điều chỉnh qua tham số.

"""
import logging;
from pymongo import MongoClient, errors
import pandas as pd 
from typing import  Optional
import yaml
from datetime import datetime

# Cấu hình logging để ghi lại thông tị và lỗi
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

# Load cấu hình từ config.yaml
with open('../config/config.yaml', 'r') as f:
    config = yaml.safe_load(f)
MONGO_URI = config['mongodb']['uri']
DATABASE = config['mongodb']['database']
POSTS_COLLECTION = config['mongodb']['posts_collection']
LIKES_COLLECTION = config['mongodb']['likes_collection']

# Kết nối với MongoDB
def fetch_data(
    mongo_uri: str = MONGO_URI,
    database: str = DATABASE,
    collection: str = POSTS_COLLECTION,
    visibility: str = 'public',
    skip: int = 0,
    limit: int = 1000,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
    ) -> pd.DataFrame: 
    
    try: 
        # Kết nối đến MongoDB với timeout để tránh treo
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Kiểm tra kết nối
        client.server_info() # Nếu không có kết nối, sẽ ném exception 
        db = client[database]
        posts_collection = db[collection]

        # Truy vấn với điều kiện visibility, phân trang và projection
        query = {'visibility': visibility}

        # Thêm điều kiện thời gian nếu được cung cấp
        if date_from or date_to:
            query['createdAt'] = {}
            if date_from:
                date_from_dt = datetime.strptime(date_from, '%Y-%m-%d')
                query['createdAt']['$gte'] = date_from_dt
            if date_to:
                date_to_dt = datetime.strptime(date_to, '%Y-%m-%d')
                query['createdAt']['$lte'] = date_to_dt

        # Projection để chỉ lấy các trường cần thiết
        projection = {
            '_id': 1,
            'content': 1,
            'hashtags': 1,
            'images': 1,
            'videos': 1,
            'author': 1,
            'createdAt': 1,
            'likesCount': 1,
            'commentsCount': 1,
        }

        # Lấy tất cả bài viết từ collection 'threads'
        posts = list(posts_collection.find(query, projection).skip(skip).limit(limit))
        logging.info(f"Đã lấy được {len(posts)} bài viết từ MongoDB (skip={skip}, limit={limit}).")

        if not posts:
            logging.warning("Không tìm thấy dữ liệu trong collection.")

        # Chuyển dữ liệu MongoDB thành DataFrame của pandas
        data = []
        for post in posts:
            data.append([
                post['_id'],
                post['content'],
                post['hashtags'], 
                post['images'], 
                post['videos'],
                post['author'],
                post['createdAt'],
                post['likesCount'],
                post['commentsCount'],
                ])

        # Đổi dữ liệu thành pandas DataFrame 
        df = pd.DataFrame(data, columns = ["post_id","content","hashtags","images","videos", "author", "createdAt",
            "likesCount", "commentsCount"])    

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

        # Truy vấn với điều kiện user_id (nếu có), phân trang
        query = {'user': user_id} if user_id else {}
        projection = {'user': 1, 'threadId': 1, 'createdAt': 1}
        likes = list(likes_collection.find(query, projection).skip(skip).limit(limit))
        logging.info(f"Đã lấy được {len(likes)} lượt thích từ MongoDB (skip={skip}, limit={limit}).")

        if not likes:
            logging.warning("Không tìm thấy dữ liệu trong collection.")

        # Chuyển dữ liệu thành DataFrame
        df = pd.DataFrame([
            [like['user'], like['threadId'], like['createdAt']]
            for like in likes
        ], columns=["user_id", "post_id", "createdAt"])
        return df

    except errors.ServerSelectionTimeoutError as err:
        logging.error(f"Không thể kết nối đến MongoDB: {err}")
        raise
    except Exception as e:
        logging.error(f"Đã xảy ra lỗi khi truy xuất dữ liệu: {e}")
        raise

# Kiểm tra hàm và in ra dữ liệu
if __name__ == "__main__":
    df_posts = fetch_data(
        visibility='public',
        skip=0,
        limit=5,
        date_from='2025-01-01', 
        date_to='2025-06-30'    
    )
    print("Dữ liệu bài viết:\n", df_posts.head())

    # Test lấy lượt thích
    df_likes = fetch_likes(skip=0, limit=5)
    print("Dữ liệu lượt thích:\n", df_likes.head())