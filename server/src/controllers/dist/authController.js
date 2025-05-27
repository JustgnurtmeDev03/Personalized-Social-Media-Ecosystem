"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.refreshToken = exports.resetPassword = exports.VerifyResetCode = exports.verifyEmail = exports.requestPasswordReset = exports.logout = exports.login = exports.register = void 0;
var authService = require("../services/authService");
var message_1 = require("../constants/message");
var User_1 = require("~/models/User");
var emailService_1 = require("~/services/emailService");
var tokenService_1 = require("../services/tokenService");
var jsonwebtoken_1 = require("jsonwebtoken");
var express_validator_1 = require("express-validator");
var httpError_1 = require("~/utils/httpError");
var httpStatus_1 = require("~/constants/httpStatus");
var logger_1 = require("~/utils/logger");
var asyncHandler_1 = require("~/middlewares/asyncHandler");
// Controller đăng ký
exports.register = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var errors, _a, username, otherFields, generatedUsername, user, error_1, statusCode;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                errors = express_validator_1.validationResult(req);
                if (!errors.isEmpty()) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, " Invalid input", errors.array());
                }
                _a = req.body, username = _a.username, otherFields = __rest(_a, ["username"]);
                generatedUsername = username || generateRandomUsername();
                return [4 /*yield*/, authService.registerUser(__assign(__assign({}, otherFields), { username: generatedUsername }))];
            case 1:
                user = (_b.sent()).user;
                res.status(httpStatus_1["default"].CREATED).send({
                    message: message_1.USERS_MESSAGES.REGISTER_SUCCESS,
                    user: user,
                    info: "Please check your email to verify your account."
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                logger_1["default"].error("Register error: " + error_1.message, { error: error_1 });
                statusCode = error_1 instanceof httpError_1.HttpError ? error_1.statusCode : httpStatus_1["default"].BAD_REQUEST;
                if (error_1.message === "Invalid or expired verification token") {
                    res.status(httpStatus_1["default"].BAD_REQUEST).render("verify-error", {
                        message: "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại email xác minh."
                    });
                }
                else {
                    res.status(statusCode).send({
                        error: error_1.message || httpStatus_1["default"].INTERNAL_SERVER_ERROR,
                        details: error_1.details || null
                    });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Controller đăng nhập
exports.login = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var errors, _a, email, password, tokens, error_2, statusCode;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                errors = express_validator_1.validationResult(req);
                if (!errors.isEmpty()) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid email or password", errors.array());
                }
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, authService.loginUser(email, password)];
            case 1:
                tokens = (_b.sent()).tokens;
                res.cookie("refreshToken", tokens.refreshToken),
                    {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "strict",
                        maxAge: 7 * 24 * 60 * 60 * 1000,
                        path: "/"
                    };
                res.status(httpStatus_1["default"].OK).json({
                    result: {
                        message: message_1.USERS_MESSAGES.LOGIN_SUCCESS,
                        accessToken: tokens.accessToken
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                logger_1["default"].error("Login error: " + error_2.message, { error: error_2 });
                statusCode = error_2 instanceof httpError_1.HttpError
                    ? error_2.statusCode
                    : httpStatus_1["default"].INTERNAL_SERVER_ERROR;
                res.status(statusCode).json({
                    error: error_2.message || "Internal server error",
                    details: error_2.details || null
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Controller đăng xuất
exports.logout = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var refreshToken_1, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                refreshToken_1 = req.body.refreshToken;
                if (!refreshToken_1) {
                    throw new Error("Refresh token is required");
                }
                return [4 /*yield*/, authService.logoutUser(refreshToken_1)];
            case 1:
                _a.sent();
                res.send({ message: message_1.USERS_MESSAGES.LOGOUT_SUCCESS });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(401).send({ error: error_3.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Controller quên mật khẩu
exports.requestPasswordReset = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var errors, email, user, resetCode, error_4, statusCode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                errors = express_validator_1.validationResult(req);
                if (!errors.isEmpty()) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid input", errors.array());
                }
                email = req.body.email;
                return [4 /*yield*/, User_1["default"].findOne({ email: email })];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).send({ message: message_1.USERS_MESSAGES.USER_NOT_FOUND })];
                }
                resetCode = tokenService_1.generateResetCode(user.id.toString());
                return [4 /*yield*/, user.save()];
            case 2:
                _a.sent();
                return [4 /*yield*/, emailService_1.sendResetCodeEmail(email, resetCode)];
            case 3:
                _a.sent();
                return [2 /*return*/, res
                        .status(httpStatus_1["default"].OK)
                        .send({ message: "Password reset code sent to your email" })];
            case 4:
                error_4 = _a.sent();
                logger_1["default"].error("Send reset password code error: " + error_4.message, { error: error_4 });
                statusCode = error_4 instanceof httpError_1.HttpError
                    ? error_4.statusCode
                    : httpStatus_1["default"].INTERNAL_SERVER_ERROR;
                return [2 /*return*/, res.status(statusCode).send({
                        error: error_4.message || httpStatus_1["default"].INTERNAL_SERVER_ERROR,
                        details: error_4.details || null
                    })];
            case 5: return [2 /*return*/];
        }
    });
}); };
// Controller xác minh email
exports.verifyEmail = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var errors, token, error_5, statusCode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                errors = express_validator_1.validationResult(req);
                if (!errors.isEmpty()) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid input", errors.array());
                }
                token = req.query.token;
                return [4 /*yield*/, authService.verifyEmail(token)];
            case 1:
                _a.sent();
                res.status(httpStatus_1["default"].OK).render("emails/verify-success");
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                logger_1["default"].error("Verify email error: " + error_5.message, { error: error_5 });
                statusCode = error_5 instanceof httpError_1.HttpError
                    ? error_5.statusCode
                    : httpStatus_1["default"].INTERNAL_SERVER_ERROR;
                res.status(statusCode).send({
                    errors: error_5.message || "Internal server error",
                    details: error_5.details || null
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Controller xác thực mã code reset
exports.VerifyResetCode = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, email, resetCode, user, isValid, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, resetCode = _a.resetCode;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, User_1["default"].findOne({ email: email })];
            case 2:
                user = _b.sent();
                if (!user) {
                    throw new Error("User not found");
                }
                isValid = tokenService_1.verifyResetCode(user.id, resetCode);
                if (!isValid) {
                    res.status(400).send({ message: "Invalid or expired reset code" });
                }
                res.status(200).send({
                    message: "Reset code verified, you can now reset your password"
                });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                res.status(500).send({ error: error_6.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Controller reset password
exports.resetPassword = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, email, resetCode, newPassword, user, isValid, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, resetCode = _a.resetCode, newPassword = _a.newPassword;
                console.log("Reset code received in backend:", resetCode);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, User_1["default"].findOne({ email: email })];
            case 2:
                user = _b.sent();
                if (!user) {
                    res.status(404).send({ message: "User not found" });
                    return [2 /*return*/];
                }
                isValid = tokenService_1.verifyResetCode(user.id, resetCode);
                if (!isValid) {
                    res.status(400).send({ message: "Invalid or expired reset code" });
                }
                // Băm mật khẩu mới và cập nhật
                user.password = newPassword; // Đặt mật khẩu mới vào
                user.markModified("password"); // Đánh dấu trường password là đã thay đổi
                return [4 /*yield*/, user.save()];
            case 3:
                _b.sent();
                res.status(200).send({ message: "PASSWORD UPDATED SUCCESSFULLY" });
                return [3 /*break*/, 5];
            case 4:
                error_7 = _b.sent();
                res.status(500).send({ error: error_7.message });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Controller Auto Refresh AccessToken
exports.refreshToken = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var refreshToken, decoded, user, newAccessToken, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                refreshToken = req.cookies.refreshToken;
                if (!refreshToken) {
                    res.status(401).json({ message: "No refresh token provided" });
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                decoded = jsonwebtoken_1["default"].verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                return [4 /*yield*/, User_1["default"].findById(decoded.id)];
            case 2:
                user = _a.sent();
                if (!user) {
                    throw new Error("User not found");
                }
                newAccessToken = jsonwebtoken_1["default"].sign({ id: user.id.toString() }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
                res.status(200).json({ accessToken: newAccessToken });
                return [3 /*break*/, 4];
            case 3:
                error_8 = _a.sent();
                res.status(403).json({ message: "Invalid refresh token" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
function generateRandomUsername() {
    var words = [
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
    var randomWord = words[Math.floor(Math.random() * words.length)];
    var randomNum = Math.floor(Math.random() * 1000);
    // Tạo username có dạng: "cool123" với độ dài khoảng 15 ký tự
    return "@" + randomWord + randomNum;
}
