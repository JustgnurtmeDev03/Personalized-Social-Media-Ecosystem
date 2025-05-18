import pandas as pd 
import requests
from PIL import Image 
from io import BytesIO
import re
import logging 
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Thiết lập logging để ghi lại quá trình xử lý 
logging.basicConfig(filename='../logs/preprocessing.log', level=logging.INFO)

def clean_text(text):
    """Làm sạch văn bản: Loại bỏ URL, ký tự đặc biệt, chuẩn hóa khoảng trắng. """
    if pd.isna(text):
        return ""
    text = str(text).lower() # Chuyển thành chữ thường 
    text = re.sub(r'http\S+|www\S+|https\S+', '' , text , flags=re.MULTILINE) # Xoá URL
    text = re.sub(r'[^\w\s]', '', text) # Xóa ký tự đặc biệt
    text = re.sub(r'\s+', ' ', text).strip() # Chuẩn hóa khoảng trắng
    return text if text else "empty_text"

def clean_vietnamese_text(text):
    if pd.isna(text):
        return ""
    text = str(text).lower()
    text = re.sub(r'[^\w\s]', '' , text)
    text = re.sub(r'\s+', '', text).strip()
    return text if text else "empty_text"


## XỬ LÝ JIGSAW
# Đọc dữ liệu Jigsaw 
try:
    logging.info("Bắt đầu xử lý train.csv (Jigsaw)...")
    jigsaw_df = pd.read_csv('../data/raw/train.csv')
except Exception as e:
    logging.error(f"Lỗi khi đọc train.csv: {str(e)}")
    raise

# Làm sạch cột comment_text 
jigsaw_df['text'] = jigsaw_df['comment_text'].apply(clean_text)

# Loại bỏ các hàng có văn bản rỗng sau khi làm sạch
jigsaw_df = jigsaw_df[jigsaw_df['text'] != "empty_text"]

# Chuẩn hóa nhãn 
labels = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']
jigsaw_df['label'] = jigsaw_df[labels].idxmax(axis=1) # Chọn nhãn có giá trị cao nhất
jigsaw_df['label'] = jigsaw_df['label'].apply(lambda x: x if jigsaw_df[labels].loc[jigsaw_df.index[jigsaw_df['label'] == x], x].iloc[0] == 1 else 'neutral')

# Chỉ giữ lại các cột cần thiết
jigsaw_df = jigsaw_df[['text', 'label']]

# Ghi log
logging.info(f"Xử lý train.csv hoàn tất. Số hàng: {len(jigsaw_df)}")



## XỬ LÝ NSFW 
def extract_text_from_image_url(url):
    """Trích xuất văn bản từ hình ảnh thông qua URL."""
    headers = {'User-Agent' : 'Mozilla/5.0'} # Giả lập trình duyệt để tránh bị chặn
    try: 
        response = requests.get(url, headers=headers, steam=True, timeout=5)
        response.raise_for_status() # Kiểm tra lỗi HTTP
        img = Image.open(BytesIO(response.content))
        text = pytesseract.image_to_string(img, lang='eng+vie') # Hỗ trợ cả tiếng Anh và tiếng Việt
        return clean_text(text) if text.strip() else "no_text_extracted"
    except Exception as e:
        logging.warning(f"Lỗi khi xử lý URL {url}: {str(e)}")
        return f"error: {str(e)}"
    
# Xử lý từng tệp txt và gán nhãn tương ứng
nsfw_data = []
for category in ['sexy', 'drawing', 'neutral', 'hentai', 'porn']:
    logging.info(f"Bắt đầu xử lý urls_{category}.txt...")
    try:
        with open(f'../data/raw/urls_{category}.txt', 'r', encoding='utf-8') as f:
            urls = [url.strip() for url in f.readlines() if url.strip()] # Loại bỏ dòng rỗng
    except Exception as e:
        logging.error(f"Lỗi khi đọc urls_{category}.txt: {str(e)}")
        raise
    
    # Trích xuất văn bản từ URL
    texts = [extract_text_from_image_url(url) for url in urls]
    category_df = pd.DataFrame({'text': texts, 'label': category})

    # Loại bỏ các hàng lỗi hoặc không có văn bản
    category_df = category_df[~category_df['text'].str.startswith('error:')]
    category_df = category_df[category_df['text'] != "no_text_extracted"]

    nsfw_data.append(category_df)
    logging.info(f"Xử lý urls_{category}.txt hoàn tất. Số hàng: {len(category_df)}")

# Kết hợp dữ liệu NSFW
nsfw_df = pd.concat(nsfw_data, ignore_index=True)


## XỬ LÝ VSMEC (VIETNAMESE SOCIAL MEDIA CORPUS)
vsmec_dfs = []
for split in ['train_nor_811', 'valid_nor_811', 'test_nor_811']:
    logging.info(f"Bắt đầu xử lý {split}.xlsx...")
    try: 
        df = pd.read_excel(f'../data/raw/{split.xlsx}')
        vsmec_dfs.append(df)
    except Exception as e:
        logging.error(f"Lỗi khi đọc {split}.xlsx: {str(e)}")
        raise
vsmec_df = pd.concat(vsmec_dfs, ignore_index= True)
vsmec_df['text'] = vsmec_df['text'].apply(clean_vietnamese_text)
vsmec_df = vsmec_df[vsmec_df['text'] != "empty_text"]
vsmec_df['label'] = vsmec_df['label'].str.lower().str.strip()
vsmec_df['label'] = vsmec_df['label'].replace({
    'enjoyment': 'positive',
    'anger' : 'negative',
    'disgust' : 'negative',
    'sadness': 'negative',
    'surprise': 'neutral',
    'fear': 'neutral',
    'other': 'neutral'
})

valid_labels = ['positive', 'negative', 'neutral']
vsmec_df = vsmec_df[vsmec_df['label'].isin(valid_labels)]
vsmec_df = vsmec_df[['text', 'label']]
logging.info(f"Xử lý VSMEC hoàn tất. số hàng: {len(vsmec_df)}")


## HỢP NHẤT DỮ LIỆU 
def standardize_labels(label):
    label = str(label).lower()
    if label in ['positive', 'neutral']:
        return label 
    elif label in ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult',
                'identity_hate', 'negative', 'disgust', 'anger', 'sadness']:
        return 'negative'
    elif label in ['sexy', 'drawings', 'hentai', 'porn']:
        return 'nsfw'
    else:
        return 'neutral'

jigsaw_df['label'] = jigsaw_df['label'].apply(standardize_labels)
nsfw_df['label'] = nsfw_df['label'].apply(standardize_labels)
vsmec_df['label'] = vsmec_df['label'].apply(standardize_labels)
combined_df = pd.concat([jigsaw_df, nsfw_df, vsmec_df], ignore_index=True)
combined_df = combined_df.drop_duplicates(subset=['text'], keep='first')
combined_df = combined_df.dropna()
combined_df.to_csv('../data/processed/combined_dataset.csv', index=False)
logging(f"Hợp nhất dữ liệu hoàn tất. Số hàng: {len(combined_df)}")


## KIỂM TRA DỮ LIỆU
labels_counts = combined_df['label'].value_counts()
logging.info("Phân bố nhãn sau khi hợp nhất:")
logging.into(labels_counts)
combined_df['text_length'] = combined_df['text'].str.len()
length_stats = combined_df['text_length'].describe()
logging.info("Thống kê độ dài văn bản:")
logging.info(length_stats)