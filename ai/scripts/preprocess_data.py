import pandas as pd
import re
from multiprocessing import Pool, cpu_count
import spacy
import numpy as np
from PIL import Image
import pycld2 as cld2  # Sử dụng CLD2 để phát hiện ngôn ngữ
import logging
import torch
from pyvi import ViTokenizer 
from torchvision import models, transforms
import sys
import os
import requests
from io import BytesIO
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
import joblib
from functools import partial
from typing import List, Tuple, Dict, Optional
from pathlib import Path
import time
import hashlib

# Thêm thư mục cha (ai) vào sys.path để import từ thư mục data
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from data.fetch_data import fetch_data  # Import từ thư mục data

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

# Đường dẫn để cache hình ảnh
CACHE_DIR = Path("cache/images")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Tải mô hình ResNet50 cho hình ảnh và hỗ trợ GPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
resnet = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1).to(device)
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

# Ánh xạ URL tới hash nội dung (để tránh tính lại hash)
url_to_hash_cache = {}


def compute_image_hash(image_data: bytes) -> str:
    """Tính MD5 hash của nội dung hình ảnh."""
    return hashlib.md5(image_data).hexdigest()


def clean_text(text: str) -> str:
    """"Làm sạch văn bản: Loại bỏ URL, ký tự đặc biệt"""
    if not isinstance(text, str):
        return ""
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip().lower()


def detect_language(text: str) -> str:
    """Phát hiện ngôn ngữ bằng CLD2 (Compact Language Detector 2)."""
    if not text or not isinstance(text, str):
        return 'unknown', 'Unknown'
    try: 
        # CDL2 trả về tuple: (is_reliable, text_bytes, details)
        # details chứa danh sách các ngôn ngữ được phát hiện (tên, mã, tỷ lệ)
        _, _, details = cld2.detect(text.replace('\n', ''))
        if details and len(details) > 0:
            lang_code = details[0][1] # Lấy mã ngôn ngữ (Ví dụ: 'en', 'vi')
            lang_name = details[0][0]  # Lấy tên ngôn ngữ (ví dụ: 'English', 'Vietnamese')
            return lang_code, lang_name
        return 'unknown', 'Unknown'
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


def preprocess_hashtags(hashtags: list) -> tuple:
    """Xử lý và phát hiện ngôn ngữ cho hashtags, trả về (chuỗi đã xử lý, mã ngôn ngữ, tên ngôn ngữ)."""
        
    if not hashtags or not isinstance(hashtags, list):
            return '', 'no_hashtags', 'Không có hashtags'

    hashtags_clean = ''
    lang_counts  = Counter()

    for tag in hashtags:
        if tag:
            tag_clean = clean_text(tag.lstrip('#'))
            lang, _ = detect_language(tag_clean)
            lang_counts[lang] += 1

     # Sử dụng ngôn ngữ phổ biến nhất, nếu không có thì dùng ngôn ngữ của content
    if lang_counts:
        lang_hashtags = lang_counts.most_common(1)[0][0]
        _, lang_hashtags_name = detect_language(' '.join(hashtags)) # Lấy lại tên ngôn ngữ
    else:
        lang_hashtags = 'unknown'
        lang_hashtags_name = 'Unknown'

    for tag in hashtags:
        if tag: 
            tag_clean = clean_text(tag.lstrip('#'))
            tag_processed = preprocess_text(tag_clean, lang_hashtags)
            hashtags_clean += tag_processed + ' '
    hashtags_clean = hashtags_clean.strip()

    return hashtags_clean, lang_hashtags, lang_hashtags_name


def download_image(url: str, retries: int = 3, timeout: int = 10) -> Tuple[Optional[Image.Image], Optional[str]]:
    """Tải hình ảnh từ URL, tính hash nội dung và lưu vào cache dựa trên hash."""
    # Kiểm tra xem URL đã được tải và hash trước đó chưa
    if url in url_to_hash_cache:
        content_hash = url_to_hash_cache[url]
        cache_path = CACHE_DIR / f"{content_hash}.jpg"
        if cache_path.exists():
            try:
                return Image.open(cache_path).convert('RGB'), content_hash
            except Exception as e:
                logging.warning(f"Hình ảnh cache {cache_path} bị lỗi, tải lại: {e}")
                cache_path.unlink()

    # Tải hình ảnh từ URL
    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            image_data = response.content
            content_hash = compute_image_hash(image_data)
            
            # Lưu hash vào cache ánh xạ
            url_to_hash_cache[url] = content_hash

            # Kiểm tra xem hình ảnh với hash này đã được lưu chưa
            cache_path = CACHE_DIR / f"{content_hash}.jpg"
            if cache_path.exists():
                try:
                    return Image.open(cache_path).convert('RGB'), content_hash
                except Exception as e:
                    logging.warning(f"Hình ảnh cache {cache_path} bị lỗi, tải lại: {e}")
                    cache_path.unlink()

            # Lưu hình ảnh vào cache
            img = Image.open(BytesIO(image_data)).convert('RGB')
            img.save(cache_path)
            return img, content_hash
        except Exception as e:
            logging.warning(f"Lỗi tải hình ảnh {url} (lần {attempt+1}/{retries}): {e}")
            time.sleep(2 ** attempt)  # Exponential backoff
    logging.error(f"Không thể tải hình ảnh từ URL {url} sau {retries} lần thử.")
    return None, None


def extract_image_features(image_url: str) -> np.ndarray:
    """Trích xuất đặc trưng hình ảnh bằng ResNet50."""
    result = download_image(image_url)
    img = result[0]  # Chỉ lấy đối tượng hình ảnh từ tuple
    if img is None:
        return np.zeros(2048)
    try:
        img_t = transform(img).to(device)
        with torch.no_grad():
            features = resnet(img_t.unsqueeze(0)).flatten().cpu().numpy()
        return features
    except Exception as e:
        logging.error(f"Lỗi trích xuất đặc trưng hình ảnh {image_url}: {e}")
        return np.zeros(2048)


def extract_video_metadata(video_data) -> dict:
    """Xử lý cơ bản cho video: đếm số lượng và lưu metadata."""
    if isinstance(video_data, list):
        return {"num_videos": len(video_data), "video_paths": video_data}
    return {"num_videos": 0, "video_paths": []}


def preprocess_media_chunk(image_urls: List[str], max_workers: int = 10) -> List[np.ndarray]:
    """Xử lý hình ảnh song song trong một chunk."""
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(extract_image_features, url): url for url in image_urls if url}
        features = []
        for future in as_completed(futures):
            url = futures[future]
            try:
                features.append(future.result())
            except Exception as e:
                logging.error(f"Lỗi xử lý hình ảnh {url}: {e}")
                features.append(np.zeros(2048))
        return features


def preprocess_media(df: pd.DataFrame, batch_size: int = 100, max_workers: int = 10) -> pd.DataFrame:
    """Xử lý images và videos với batch processing và song song hóa."""
    logging.info("Bắt đầu xử lý media...")
    all_image_features = []
    for start in range(0, len(df), batch_size):
        batch = df['images'].iloc[start:start + batch_size]
        batch_features = []
        for image_list in batch:
            if isinstance(image_list, list):
                features = preprocess_media_chunk(image_list, max_workers)
                batch_features.append(features)
            else:
                batch_features.append([])
        all_image_features.extend(batch_features)
    df['image_features'] = all_image_features
    df['video_metadata'] = df['videos'].apply(extract_video_metadata)
    logging.info("Xử lý media hoàn tất!")
    return df


def init_worker(nlp_en_global):
    """Khởi tạo worker với mô hình spacy được truyền vào."""
    global nlp_en
    nlp_en = nlp_en_global
    
    
def parallel_preprocess_text(row):
    """Hàm xử lý song song cho văn bản."""
    post_id = row['post_id']
    text = row['content'] if 'content' in row else ''
    hashtags = row['hashtags'] if 'hashtags' in row else []

    # Xử lý content
    if text:
        lang_content, lang_content_name = detect_language(text)
        content_clean = preprocess_text(text, lang_content)
    else:
        lang_content, lang_content_name = 'no_content', 'Không có content'
        content_clean = ''

    # Xử lý hashtags độc lập
    hashtags_clean, lang_hashtags, lang_hashtags_name = preprocess_hashtags(hashtags)
    
    # Log thông tin ngôn ngữ cho bài đăng
    logging.info(
        f"Bài đăng {post_id}: "
        f"Content='{text[:50] if text else 'Không có content'}...' "
        f"(Ngôn ngữ: {lang_content_name}), "
        f"Hashtags='{hashtags}' "
        f"(Ngôn ngữ: {lang_hashtags_name})"
    )

    # Kết hợp content và hashtags
    combined_text = content_clean + ' ' + hashtags_clean
    return combined_text.strip()

def preprocess_data(df: pd.DataFrame, batch_size: int = 1000) -> pd.DataFrame:
    """Tiền xử lý toàn bộ dữ liệu với tối ưu hóa."""
    logging.info("Bắt đầu tiền xử lý dữ liệu...")

    # Chia dữ liệu thành batch để xử lý văn bản
    all_combined_texts = []
    for start in range(0, len(df), batch_size):
        batch = df.iloc[start:start + batch_size]
        logging.info(f"Xử lý batch văn bản {start} đến {start + len(batch)}...")
        with Pool(cpu_count(), initializer=init_worker, initargs=(nlp_en,)) as pool:
            preprocess_func = partial(parallel_preprocess_text)
            combined_texts = pool.map(preprocess_func, [row for _, row in batch.iterrows()])
        all_combined_texts.extend(combined_texts)

    df['combined_text'] = all_combined_texts

    # Xử lý media
    df = preprocess_media(df, batch_size=batch_size)
    logging.info("Tiền xử lý hoàn tất!")
    return df

if __name__ == "__main__":
    # Lấy dữ liệu từ MongoDB thông qua fetch_data.py
    df = fetch_data()

    # Tiền xử lý dữ liệu
    df_processed = preprocess_data(df)

    # In kết quả mẫu
    joblib.dump(df_processed, 'processed_data.pkl')
    print(df_processed[['post_id', 'combined_text', 'image_features', 'video_metadata']].head())