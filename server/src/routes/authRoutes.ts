import express from "express";
import { query } from "express-validator";
import {
  register,
  verifyEmail,
  login,
  logout,
  refreshToken,
} from "../controllers/authController";
import {
  requestPasswordReset,
  VerifyResetCode,
  resetPassword,
} from "../controllers/authController";
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} from "../middlewares/validation";

const router = express.Router();

// Route đăng ký
router.post("/register", validateRegister, register);

// Route đăng nhập
router.post("/login", validateLogin, login);

// Route logout
router.post("/logout", validateRefreshToken, logout);

// Route yêu cầu mã xác thực gửi qua email
router.post("/request-password-reset", requestPasswordReset);

// Route để xác thực mã và đặt lại mật khẩu
router.post("/verify-reset-code", VerifyResetCode);

// Route để đặt lại mật khẩu sau khi mã xác thực đã được xác minh
router.post("/reset-password", resetPassword);

// Route để xác thực địa chỉ Email
router.get("/verify-email", [
  query("token").notEmpty().withMessage("Verification token is required"),
  verifyEmail,
]);

// Route để refresh accessToken
router.post("/refresh-token", refreshToken);

export default router;
