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
exports.logoutUser = exports.loginUser = exports.verifyEmail = exports.registerUser = void 0;
var emailService_1 = require("./emailService");
var RefreshToken_1 = require("./../models/RefreshToken");
var User_1 = require("../models/User");
var jsonwebtoken_1 = require("jsonwebtoken");
var logger_1 = require("~/utils/logger");
var crypto_1 = require("crypto");
var dotenv_1 = require("dotenv");
var httpError_1 = require("~/utils/httpError");
var httpStatus_1 = require("~/constants/httpStatus");
dotenv_1.config();
// Đăng ký người dùng mới
exports.registerUser = function (userData) { return __awaiter(void 0, void 0, Promise, function () {
    var user, verificationToken, _a, followers, following, posts, emailVerificationToken, emailVerificationTokenExpires, userWithoutFields, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                user = new User_1["default"](__assign(__assign({}, userData), { status: "pending", emailVerified: false }));
                verificationToken = crypto_1["default"].randomBytes(32).toString("hex");
                user.emailVerificationToken = verificationToken;
                user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
                return [4 /*yield*/, user.save()];
            case 1:
                _b.sent();
                // Gửi Email xác minh
                return [4 /*yield*/, emailService_1.sendVerificationEmail(user.email, verificationToken)];
            case 2:
                // Gửi Email xác minh
                _b.sent();
                _a = user.toObject(), followers = _a.followers, following = _a.following, posts = _a.posts, emailVerificationToken = _a.emailVerificationToken, emailVerificationTokenExpires = _a.emailVerificationTokenExpires, userWithoutFields = __rest(_a, ["followers", "following", "posts", "emailVerificationToken", "emailVerificationTokenExpires"]);
                return [2 /*return*/, { user: userWithoutFields }];
            case 3:
                error_1 = _b.sent();
                logger_1["default"].error("Register service error: " + error_1.message);
                throw error_1 instanceof httpError_1.HttpError
                    ? error_1
                    : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
            case 4: return [2 /*return*/];
        }
    });
}); };
// Xác minh Email
exports.verifyEmail = function (token) { return __awaiter(void 0, void 0, Promise, function () {
    var user, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, User_1["default"].findOne({
                        emailVerificationToken: token,
                        emailVerificationTokenExpires: { $gt: new Date() }
                    })];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid or expired verification token");
                }
                user.emailVerified = true;
                user.emailVerificationToken = undefined;
                user.emailVerificationTokenExpires = undefined;
                return [4 /*yield*/, user.save()];
            case 2:
                _a.sent();
                logger_1["default"].info("Email verified for user: " + user.email);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                logger_1["default"].error("Verify email service error: " + error_2.message);
                throw error_2 instanceof httpError_1.HttpError
                    ? error_2
                    : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
            case 4: return [2 /*return*/];
        }
    });
}); };
// Đăng nhập người dùng
exports.loginUser = function (email, password) { return __awaiter(void 0, void 0, Promise, function () {
    var user, tokens;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, User_1["default"].findByCredentials(email, password)];
            case 1:
                user = _a.sent();
                return [4 /*yield*/, user.generateAuthTokens()];
            case 2:
                tokens = _a.sent();
                return [2 /*return*/, { user: user, tokens: tokens }];
        }
    });
}); };
// Đăng xuất người dùng
exports.logoutUser = function (refreshToken) { return __awaiter(void 0, void 0, Promise, function () {
    var decoded, user;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                decoded = jsonwebtoken_1["default"].verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                console.log("Decoded token:", decoded);
                return [4 /*yield*/, User_1["default"].findOne({
                        _id: decoded.id,
                        RefreshToken: RefreshToken_1.RefreshToken
                    })];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new Error("Invalid refresh token");
                }
                // Tăng tokenVersion để vô hiệu hóa tất cả các accessToken cũ
                return [4 /*yield*/, user.invalidateTokens()];
            case 2:
                // Tăng tokenVersion để vô hiệu hóa tất cả các accessToken cũ
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
