import crypto from "crypto";

const RESET_CODE_EXPIRATION = 15 * 60 * 1000; // 15 phút

interface ResetCodeData {
  userId: string;
  code: string;
  expiresAt: number;
}

const resetCodes: Map<string, ResetCodeData> = new Map();

// Tạo ra mã xác thực ngẫu nhiên

export const generateResetCode = (userId: string): string => {
  const code = crypto.randomBytes(3).toString("hex").toUpperCase(); //Mã xác thực ngẫu nhiên
  resetCodes.set(userId, {
    userId,
    code,
    expiresAt: Date.now() + RESET_CODE_EXPIRATION,
  });
  return code;
};

// Xác thực mã xác thực người dùng nhập vào

export const verifyResetCode = (userId: string, code: string): boolean => {
  const data = resetCodes.get(userId);
  if (!data || data.expiresAt < Date.now() || data.code !== code) {
    return false;
  }
  return true;
};
