import CryptoJS from "crypto-js";

const SECRET_KEY = "BestSecureIns2025";

// 🛠️ Mã hóa & Giải mã dữ liệu
export const encrypt = (text) =>
  CryptoJS.AES.encrypt(text, SECRET_KEY).toString();

export const decrypt = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

// 🔒 Mã hóa tên key
const ENCRYPTED_KEY = CryptoJS.SHA256("SERCURED_KEY").toString();

// 🛠️ Hàm lưu accessToken vào localStorage (cả key & value đều mã hóa)
export const setEncryptedToken = (accessToken) => {
  const encryptedToken = encrypt(accessToken);
  localStorage.setItem(ENCRYPTED_KEY, encryptedToken);
};

// 🛠️ Hàm lấy accessToken từ localStorage
export const getEnCryptedToken = () => {
  const encryptedValue = localStorage.getItem(ENCRYPTED_KEY);
  return encryptedValue ? decrypt(encryptedValue) : null;
};

// 🗑️ Hàm xóa accessToken khỏi localStorage
export const removeEncryptedToken = () => {
  localStorage.removeItem(ENCRYPTED_KEY);
};
