import { sendVerificationEmail } from "./emailService";
import { RefreshToken } from "./../models/RefreshToken";
import User from "../models/User";
import jwt from "jsonwebtoken";
import logger from "~/utils/logger";
import crypto from "crypto";

import { config } from "dotenv";
import { HttpError } from "~/utils/httpError";
import HTTP_STATUS from "~/constants/httpStatus";
config();

interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Đăng ký người dùng mới
export const registerUser = async (userData: any): Promise<{ user: any }> => {
  try {
    const user = new User({
      ...userData,
      status: "pending",
      emailVerified: false,
    });

    // Tạo token xác minh email và thời hạn (24 giờ)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await user.save();

    // Gửi Email xác minh
    await sendVerificationEmail(user.email, verificationToken);

    // Xóa trường không mong muốn hiển thị khỏi đối tượng người dùng trước khi trả về
    const {
      followers,
      following,
      posts,
      emailVerificationToken,
      emailVerificationTokenExpires,
      ...userWithoutFields
    } = user.toObject();
    return { user: userWithoutFields };
  } catch (error: any) {
    logger.error(`Register service error: ${error.message}`);
    throw error instanceof HttpError
      ? error
      : new HttpError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "Internal server error"
        );
  }
};

// Xác minh Email
export const verifyEmail = async (token: string): Promise<void> => {
  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid or expired verification token"
      );
    }
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);
  } catch (error: any) {
    logger.error(`Verify email service error: ${error.message}`);
    throw error instanceof HttpError
      ? error
      : new HttpError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "Internal server error"
        );
  }
};

// Đăng nhập người dùng
export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: any; tokens: IAuthTokens }> => {
  const user = await User.findByCredentials(email, password);
  const tokens = await user.generateAuthTokens();

  return { user, tokens };
};

// Đăng xuất người dùng

export const logoutUser = async (refreshToken: string): Promise<void> => {
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET as string
  ) as { id: string };
  console.log("Decoded token:", decoded);
  const user = await User.findOne({
    _id: decoded.id,
    RefreshToken: RefreshToken,
  });

  if (!user) {
    throw new Error("Invalid refresh token");
  }

  // Tăng tokenVersion để vô hiệu hóa tất cả các accessToken cũ
  await user.invalidateTokens();
};
