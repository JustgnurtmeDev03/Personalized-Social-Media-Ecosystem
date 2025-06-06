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
exports.__esModule = true;
exports.updateUser = exports.createUser = exports.getTopUsers = exports.getTotalUsers = exports.updateUserProfile = exports.getProfileByID = exports.getProfile = exports.getAllUsers = void 0;
var User_1 = require("~/models/User");
var asyncHandler_1 = require("~/middlewares/asyncHandler");
var AppError_1 = require("~/utils/AppError");
var cloudinary_1 = require("~/config/cloudinary");
var express_validator_1 = require("express-validator");
var httpError_1 = require("~/utils/httpError");
var httpStatus_1 = require("~/constants/httpStatus");
var message_1 = require("~/constants/message");
var userService_1 = require("~/services/userService");
var logger_1 = require("~/utils/logger");
exports.getAllUsers = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var users, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, userService_1.UserService.getAllUsers()];
            case 1:
                users = _a.sent();
                res.status(httpStatus_1["default"].OK).json({
                    users: users
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res
                    .status(httpStatus_1["default"].INTERNAL_SERVER_ERROR)
                    .send({ error: "Không thể lấy danh sách người dùng" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.getProfile = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var user, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, User_1["default"].findById(req.user.id)];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, next(new AppError_1.AppError("User not found", 404))];
                }
                res.json({ user: user });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).send({ error: "Server error" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.getProfileByID = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var errors, _id, user, error_3, statusCode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                errors = express_validator_1.validationResult(req);
                if (!errors.isEmpty()) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, message_1.USERS_MESSAGES.USER_NOT_FOUND, errors.array());
                }
                _id = req.params._id;
                return [4 /*yield*/, userService_1.UserService.getUserProfilebyID(_id)];
            case 1:
                user = (_a.sent()).user;
                res.status(httpStatus_1["default"].OK).send({
                    message: message_1.USERS_MESSAGES.GET_ME_SUCCESS,
                    user: user
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                logger_1["default"].error("Get user profile error: " + error_3.message, { error: error_3 });
                statusCode = error_3 instanceof httpError_1.HttpError
                    ? error_3.statusCode
                    : httpStatus_1["default"].INTERNAL_SERVER_ERROR;
                res.status(statusCode).send({
                    error: error_3.message || httpStatus_1["default"].INTERNAL_SERVER_ERROR,
                    details: error_3.details || null
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.updateUserProfile = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, bio, link, deleteAvatar, file, user_1, isImage, folder_1, uploadResult, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, bio = _a.bio, link = _a.link, deleteAvatar = _a.deleteAvatar;
                file = req.file;
                console.log("Received file:", file); // Thêm dòng này để kiểm tra
                _b.label = 1;
            case 1:
                _b.trys.push([1, 9, , 10]);
                return [4 /*yield*/, User_1["default"].findById(req.user.id)];
            case 2:
                user_1 = _b.sent();
                if (!user_1) {
                    return [2 /*return*/, next(new AppError_1.AppError("User not found", 404))];
                }
                // Kiểm tra lại bio trước khi lưu
                if (bio !== undefined && bio.length > 200) {
                    return [2 /*return*/, next(new AppError_1.AppError("Bio cannot exceed 200 characters", 400))];
                }
                if (bio !== undefined)
                    user_1.bio = bio;
                if (link !== undefined)
                    user_1.link = link;
                if (!file) return [3 /*break*/, 4];
                isImage = file.mimetype.startsWith("image/");
                if (!isImage) {
                    return [2 /*return*/, next(new AppError_1.AppError("Only image files are allowd for avatar", 400))];
                }
                folder_1 = "Gens/Media/avatars";
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        var uploadStream = cloudinary_1["default"].uploader.upload_stream({
                            resource_type: "image",
                            folder: folder_1,
                            public_id: user_1._id + "-avatar",
                            overwrite: true
                        }, function (error, result) {
                            if (error)
                                reject(new AppError_1.AppError("Failed to upload avatar to Cloudinary", 500));
                            else
                                resolve(result);
                        });
                        uploadStream.end(file.buffer);
                    })];
            case 3:
                uploadResult = _b.sent();
                // Cập nhật thông tin avatar mới
                user_1.avatar = uploadResult.secure_url;
                user_1.cloudinaryPublicId = uploadResult.public_id;
                return [3 /*break*/, 7];
            case 4:
                if (!(deleteAvatar === "1")) return [3 /*break*/, 7];
                if (!user_1.cloudinaryPublicId) return [3 /*break*/, 6];
                return [4 /*yield*/, cloudinary_1["default"].uploader.destroy(user_1.cloudinaryPublicId)];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6:
                user_1.avatar = "";
                user_1.cloudinaryPublicId = "";
                _b.label = 7;
            case 7: return [4 /*yield*/, user_1.save()];
            case 8:
                _b.sent();
                res.status(200).json({
                    message: "Profile updated successfully",
                    user: user_1
                });
                return [3 /*break*/, 10];
            case 9:
                error_4 = _b.sent();
                if (error_4.name === "ValidationError") {
                    return [2 /*return*/, next(new AppError_1.AppError(error_4.message, 400))];
                }
                res.status(500).json({ error: "Server error" });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
exports.getTotalUsers = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var totalUsers, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, userService_1.UserService.getTotalUsers()];
            case 1:
                totalUsers = _a.sent();
                res.status(httpStatus_1["default"].OK).json({
                    totalUsers: totalUsers
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                res
                    .status(httpStatus_1["default"].INTERNAL_SERVER_ERROR)
                    .send({ error: "Failed to fetch totals" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.getTopUsers = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var limit, topUsers, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                limit = parseInt(req.query.limit) || 10;
                return [4 /*yield*/, userService_1.UserService.getTopUsers(limit)];
            case 1:
                topUsers = _a.sent();
                res.status(httpStatus_1["default"].OK).json({
                    topUsers: topUsers
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                res
                    .status(httpStatus_1["default"].INTERNAL_SERVER_ERROR)
                    .send({ error: "Failed to fetch top users" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.createUser = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var userData, newUser, error_7, err;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Log dữ liệu nhận được
                console.log("Received body:", req.body);
                console.log("Received file:", req.file);
                // Kiểm tra lỗi từ multer
                if (req.fileValidationError) {
                    throw new httpError_1.HttpError(400, req.fileValidationError);
                }
                userData = __assign(__assign({}, req.body), { roles: req.body.roles ? JSON.parse(req.body.roles) : ["user"], avatar: req.file ? "/uploads/" + req.file.filename : "" });
                // Kiểm tra dữ liệu bắt buộc và log chi tiết
                if (!userData.name ||
                    !userData.username ||
                    !userData.email ||
                    !userData.password) {
                    console.log("Missing fields:", {
                        name: userData.name,
                        username: userData.username,
                        email: userData.email,
                        password: userData.password
                    });
                    throw new httpError_1.HttpError(400, "Missing required fields: name, username, email, or password");
                }
                return [4 /*yield*/, userService_1.UserService.createUser(userData)];
            case 1:
                newUser = _a.sent();
                res.status(201).json({ user: newUser });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                err = error_7;
                console.error("Controller error:", err.message);
                res.status(err instanceof httpError_1.HttpError ? err.statusCode : 500).json({
                    error: err.message || "Không thể tạo người dùng mới"
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.updateUser = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var userId, updateData, updatedUser, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                updateData = req.body;
                if (req.file) {
                    updateData.avatar = "/uploads/" + req.file.filename; // Lưu URL công khai
                }
                return [4 /*yield*/, userService_1.UserService.updateUser(userId, updateData)];
            case 1:
                updatedUser = _a.sent();
                res.status(httpStatus_1["default"].OK).json({
                    user: updatedUser
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                res.status(error_8.status || httpStatus_1["default"].INTERNAL_SERVER_ERROR).json({
                    error: error_8.message || "Không thể cập nhật người dùng"
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
