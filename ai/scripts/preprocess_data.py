import pandas as pd
import re
from multiprocessing import Pool, cpu_count
import spacy
import numpy as np
from PIL import Image
import fasttext
import logging
import torch
from pyvi import ViTokenizer 
from torchvision import models, transforms
import sys
import os
import requests
from io import BytesIO

# Thêm thư mục cha (ai) vào sys.path để import từ thư mục data
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from data.fetch_data import fetch_data  # Import từ thư mục data

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

# Tải mô hình phát hiện ngôn ngữ fasttext
language_model = fasttext.load_model('../data/lid.176.bin')

# Tải mô hình ResNet cho hình ảnh
resnet = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
resnet.eval()
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(254),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# Tải mô hình spacy cho tiếng Anh 
nlp_en = spacy.load('en_core_web_sm')

# Danh sách stop words tiếng Việt (tùy chỉnh, có thể mở rộng)
stop_words_vi = set(["và", "của", "là", "ở", "có", "được", "trong", "cho", "này", "đó"])


def clean_text(text: str) -> str:
    """"Làm sạch văn bản: Loại bỏ URL, ký tự đặc biệt"""
    if not isinstance(text, str):
        return ""
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip().lower()

def detect_language(text: str) -> str:
    """Phát hiện ngôn ngữ bằng fasttext."""
    try: 
        # Đảm bảo đầu vào là chuỗi duy nhất và chuyển đổi kết quả bằng np.asarray
        text = text.replace('\n', ' ')
        predictions = language_model.predict(text)
        lang = np.asarray(predictions[0][0].split('__')[-1])
        return lang
    except Exception as e:
        logging.warning(f"Không thể phát hiện ngôn ngữ: {e}")
        return 'unknown'

def preprocess_vietnamese(text: str) -> str: 
    """Xử lý văn bản tiếng Việt: tách từ và loại stop words bằng pyvi (dựa trên VnCoreNLP)"""
    text = clean_text(text)
    tokens = ViTokenizer.tokenize(text).split()
    cleaned = [word for word in tokens if word.lower() not in stop_words_vi]
    return ' '.join(cleaned)

def preprocess_english(text: str) -> str: 
    """Xử lý văn bản tiếng Anh: lemmatization và loại stop words bằng spacy."""
    text = clean_text(text)
    doc = nlp_en(text)
    cleaned = [token.lemma_ for token in doc if not token.is_stop]
    return ' '.join(cleaned)

def preprocess_text(text: str, lang: str) -> str:
    """Xử lý văn bản dựa trên ngôn ngữ."""
    if lang == 'vi':
        return preprocess_vietnamese(text)
    if lang == 'en':
        return preprocess_english(text)
    else: 
        text = clean_text(text)
        return text # Xử lý cơ bản cho ngôn ngữ khác

def preprocess_hashtags(hashtags) -> str:
    """Chuẩn hóa hashtags thành chuỗi văn bản."""
    if not isinstance(hashtags, list):
        return ""
    cleaned = [clean_text(tag.lstrip('#')) for tag in hashtags if tag]
    return ' '.join(cleaned)

def download_image(url: str) -> Image.Image:
    try: 
        response = requests.get(url, timeout = 10)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert('RGB')
    except Exception as e:
        logging.error(f"Lỗi khi tải hình ảnh từ URL {url}: {e}")
        return None

def extract_image_features(image_url: str) -> np.ndarray:
    img = download_image(image_url)
    if img is None:
        return np.zeros(2048)
    try:    
        img_t = transform(img)
        with torch.no_grad():
            features = resnet(img_t.unsqueeze(0)).flatten().numpy()
        return features
    except Exception as e:
        logging.error(f"Lỗi khi trích xuất đạc trưng hình ảnh {image_url}: {e}")
        return np.zeros(2048) # Kích thước đầu ra của ResNet50

def extract_video_metadata(video_data) -> dict:
    """Xử lý cơ bản cho video: đếm số lượng và lưu metadata."""
    if isinstance(video_data, list):
        return {"num_videos": len(video_data), "video_paths": video_data}
    return {"num_videos": 0, "video_paths": []}

def preprocess_media (df: pd.DataFrame) -> pd.DataFrame:
    """Xử lý images và videos: trích xuất đặc trưng cho images, xử lý metadata cho videos"""
    df['image_features'] = df['images'].apply(lambda x: [extract_image_features(img) for img in x] if isinstance (x, list) else [])
    df['video_metadata'] = df['videos'].apply(extract_video_metadata)
    return df

def parallel_preprocess_text(row):
    """Hàm xử lý song song cho văn bản."""
    text = row['content']
    lang = detect_language(text)
    content_clean = preprocess_text(text, lang)
    hashtags_clean = preprocess_hashtags(row['hashtags'])
    combined_text = content_clean + ' ' + hashtags_clean
    return combined_text

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """Tiền xử lý toàn bộ dữ liệu đầu vào với tối ưu hóa."""
    logging.info("Bắt đầu tiền xử lý văn bản song song...")
    with Pool(cpu_count()) as pool :
        df['combined_text'] = pool.map(parallel_preprocess_text, [row for _, row in df.iterrows()])
    logging.info("Bắt đầu xử lý media...")
    df = preprocess_media(df)
    logging.info("Tiền xử lý hoàn tất!")
    return df

if __name__ == "__main__":
    # Lấy dữ liệu từ MongoDB thông qua fetch_data.py
    df = fetch_data()

    # Tiền xử lý dữ liệu
    df_processed = preprocess_data(df)

    # In kết quả mẫu
    print(df_processed[['post_id', 'combined_text', 'image_features', 'video_metadata']].head())