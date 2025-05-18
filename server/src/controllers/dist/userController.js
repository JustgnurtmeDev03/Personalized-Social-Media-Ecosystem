"use strict";
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
exports.updateUserProfile = exports.getProfileByID = exports.getProfile = void 0;
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
exports.getProfile = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var user, error_1;
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
                error_1 = _a.sent();
                res.status(500).send({ error: "Server error" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.getProfileByID = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var errors, _id, user, error_2, statusCode;
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
                error_2 = _a.sent();
                logger_1["default"].error("Get user profile error: " + error_2.message, { error: error_2 });
                statusCode = error_2 instanceof httpError_1.HttpError
                    ? error_2.statusCode
                    : httpStatus_1["default"].INTERNAL_SERVER_ERROR;
                res.status(statusCode).send({
                    error: error_2.message || httpStatus_1["default"].INTERNAL_SERVER_ERROR,
                    details: error_2.details || null
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.updateUserProfile = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, bio, link, deleteAvatar, file, user_1, isImage, folder_1, uploadResult, error_3;
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
                error_3 = _b.sent();
                if (error_3.name === "ValidationError") {
                    return [2 /*return*/, next(new AppError_1.AppError(error_3.message, 400))];
                }
                res.status(500).json({ error: "Server error" });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
