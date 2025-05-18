import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { USERS_MESSAGES } from "../constants/message";
import User from "~/models/User";
import { sendResetCodeEmail } from "~/services/emailService";
import { generateResetCode, verifyResetCode } from "../services/tokenService";

import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { HttpError } from "~/utils/httpError";
import HTTP_STATUS from "~/constants/httpStatus";
import logger from "~/utils/logger";
import asyncHandler from "~/middlewares/asyncHandler";
import { AuthenticatedRequest } from "~/middlewares/auth";

// Controller đăng ký
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        " Invalid input",
        errors.array()
      );
    }

    const { username, ...otherFields } = req.body;
    const generatedUsername = username || generateRandomUsername();
    const { user } = await authService.registerUser({
      ...otherFields,
      username: generatedUsername,
    });

    res.status(HTTP_STATUS.CREATED).send({
      message: USERS_MESSAGES.REGISTER_SUCCESS,
      user,
      info: "Please check your email to verify your account.",
    });
  } catch (error: any) {
    logger.error(`Register error: ${error.message}`, { error });
    const statusCode =
      error instanceof HttpError ? error.statusCode : HTTP_STATUS.BAD_REQUEST;
    if (error.message === "Invalid or expired verification token") {
      res.status(HTTP_STATUS.BAD_REQUEST).render("verify-error", {
        message:
          "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại email xác minh.",
      });
    } else {
      res.status(statusCode).send({
        error: error.message || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        details: error.details || null,
      });
    }
  }
};

// Controller đăng nhập
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Kiểm tra lỗi validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid email or password",
        errors.array()
      );
    }

    const { email, password } = req.body;

    const { tokens } = await authService.loginUser(email, password);

    res.cookie("refreshToken", tokens.refreshToken),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // Chống CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh token tồn tại trong 7 ngày
        path: "/",
      };
    res.status(HTTP_STATUS.OK).json({
      result: {
        message: USERS_MESSAGES.LOGIN_SUCCESS,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error: any) {
    logger.error(`Login error: ${error.message}`, { error });
    const statusCode =
      error instanceof HttpError
        ? error.statusCode
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json({
      error: error.message || "Internal server error",
      details: error.details || null,
    });
  }
};

// Controller đăng xuất
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }
    await authService.logoutUser(refreshToken);
    res.send({ message: USERS_MESSAGES.LOGOUT_SUCCESS });
  } catch (error: any) {
    res.status(401).send({ error: error.message });
  }
};

// Controller quên mật khẩu
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid input",
        errors.array()
      );
    }

    const { email } = req.body;

    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: USERS_MESSAGES.USER_NOT_FOUND });
    }

    // Tạo mã xác thực và gửi email
    const resetCode = generateResetCode(user.id.toString());
    await user.save();
    await sendResetCodeEmail(email, resetCode);

    return res
      .status(HTTP_STATUS.OK)
      .send({ message: "Password reset code sent to your email" });
  } catch (error: any) {
    logger.error(`Send reset password code error: ${error.message}`, { error });
    const statusCode =
      error instanceof HttpError
        ? error.statusCode
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).send({
      error: error.message || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details: error.details || null,
    });
  }
};

// Controller xác minh email

export const verifyEmail = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid input",
          errors.array()
        );
      }
      const { token } = req.query;
      await authService.verifyEmail(token as string);

      res.status(HTTP_STATUS.OK).render("emails/verify-success");
    } catch (error: any) {
      logger.error(`Verify email error: ${error.message}`, { error });
      const statusCode =
        error instanceof HttpError
          ? error.statusCode
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).send({
        errors: error.message || "Internal server error",
        details: error.details || null,
      });
    }
  }
);

// Controller xác thực mã code reset

export const VerifyResetCode = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { email, resetCode } = req.body;

    try {
      // Xác thực mã và lưu trạng thái xác thực
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("User not found");
      }
      const isValid = verifyResetCode(user.id, resetCode);
      if (!isValid) {
        res.status(400).send({ message: "Invalid or expired reset code" });
      }

      res.status(200).send({
        message: "Reset code verified, you can now reset your password",
      });
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }
);

// Controller reset password

export const resetPassword = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { email, resetCode, newPassword } = req.body;
    console.log("Reset code received in backend:", resetCode);
    try {
      // Tìm người dùng theo email
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).send({ message: "User not found" });
        return;
      }

      // Kiểm tra mã xác nhận và thời gian hết hạn
      const isValid = verifyResetCode(user.id, resetCode);
      if (!isValid) {
        res.status(400).send({ message: "Invalid or expired reset code" });
      }

      // Băm mật khẩu mới và cập nhật
      user.password = newPassword; // Đặt mật khẩu mới vào
      user.markModified("password"); // Đánh dấu trường password là đã thay đổi
      await user.save();

      res.status(200).send({ message: "PASSWORD UPDATED SUCCESSFULLY" });
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }
);

// Controller Auto Refresh AccessToken
export const refreshToken = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: "No refresh token provided" });
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as { id: string };

      const user = await User.findById(decoded.id);

      if (!user) {
        throw new Error("User not found");
      }

      const newAccessToken = jwt.sign(
        { id: user.id.toString() },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
      );
      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      res.status(403).json({ message: "Invalid refresh token" });
    }
  }
);

function generateRandomUsername(): string {
  const words = [
    "cool",
    "super",
    "great",
    "happy",
    "awesome",
    "smart",
    "bright",
    "shiny",
    "star",
    "moon",
    "sky",
    "quick",
    "fast",
    "sun",
    "fire",
    "wave",
    "cloud",
  ];

  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(Math.random() * 1000);

  // Tạo username có dạng: "cool123" với độ dài khoảng 15 ký tự
  return `@${randomWord}${randomNum}`;
}
