"use strict";
exports.__esModule = true;
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var authController_1 = require("../controllers/authController");
var authController_2 = require("../controllers/authController");
var validation_1 = require("../middlewares/validation");
var router = express_1["default"].Router();
// Route đăng ký
router.post("/register", validation_1.validateRegister, authController_1.register);
// Route đăng nhập
router.post("/login", validation_1.validateLogin, authController_1.login);
// Route logout
router.post("/logout", validation_1.validateRefreshToken, authController_1.logout);
// Route yêu cầu mã xác thực gửi qua email
router.post("/request-password-reset", authController_2.requestPasswordReset);
// Route để xác thực mã và đặt lại mật khẩu
router.post("/verify-reset-code", authController_2.VerifyResetCode);
// Route để đặt lại mật khẩu sau khi mã xác thực đã được xác minh
router.post("/reset-password", authController_2.resetPassword);
// Route để xác thực địa chỉ Email
router.get("/verify-email", [
    express_validator_1.query("token").notEmpty().withMessage("Verification token is required"),
    authController_1.verifyEmail,
]);
// Route để refresh accessToken
router.post("/refresh-token", authController_1.refreshToken);
exports["default"] = router;
