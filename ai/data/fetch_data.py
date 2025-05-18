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

# Cấu hình logging để ghi lại thông tị và lỗi
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

# Kết nối với MongoDB
def fetch_data(
    mongo_uri: str = 'mongodb+srv://trungthpthy:trungdeptrai123@threads.a8gao0g.mongodb.net/Threads?retryWrites=true&w=majority',
    database: str = 'Threads',
    collection: str = 'threads'
    ) -> pd.DataFrame: 
    
    try: 
        # Kết nối đến MongoDB với timeout để tránh treo
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Kiểm tra kết nối
        client.server_info() # Nếu không có kết nối, sẽ ném exception 
        db = client[database]
        posts_collection = db[collection]

        # Lấy tất cả bài viết từ collection 'threads'
        posts = list(posts_collection.find())
        logging.info(f"Đã lấy được {len(posts)} bài post từ MongoDB.")

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
                post['author']
                ])

        # Đổi dữ liệu thành pandas DataFrame 
        df = pd.DataFrame(data, columns = ["post_id","content","hashtags","images","videos", "author"])    

        return df 
    except errors.ServerSelectionTimeoutError as err:
        logging.error(f"Không thể kết nối đến MongoDB: {err}")
        raise
    except Exception as e:
        logging.error(f"Đã xảy ra lỗi khi truy xuất dữ liệu: {e}")
        raise

# Kiểm tra hàm và in ra dữ liệu
if __name__ == "__main__":
    df = fetch_data()
    print(df.head())