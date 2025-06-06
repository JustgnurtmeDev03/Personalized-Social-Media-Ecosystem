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
exports.UserService = void 0;
var mongoose_1 = require("mongoose");
var httpStatus_1 = require("~/constants/httpStatus");
var message_1 = require("~/constants/message");
var Thread_1 = require("~/models/Thread");
var User_1 = require("~/models/User");
var comment_1 = require("~/models/comment");
var httpError_1 = require("~/utils/httpError");
var logger_1 = require("~/utils/logger");
var cloudinary_1 = require("~/config/cloudinary");
var UserService = /** @class */ (function () {
    function UserService() {
    }
    UserService.createUser = function (userData) {
        return __awaiter(this, void 0, Promise, function () {
            var name, username, email, password, date_of_birth, roles, status, bio, avatar, cloudinaryPublicId, link, emailVerified, existingEmail, existingUsername, newUser, error_1, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        name = userData.name, username = userData.username, email = userData.email, password = userData.password, date_of_birth = userData.date_of_birth, roles = userData.roles, status = userData.status, bio = userData.bio, avatar = userData.avatar, cloudinaryPublicId = userData.cloudinaryPublicId, link = userData.link, emailVerified = userData.emailVerified;
                        // Kiểm tra bắt buộc
                        if (!name || !username || !email || !password || !date_of_birth) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Thiếu trường bắt buộc");
                        }
                        return [4 /*yield*/, User_1["default"].findOne({ email: email })];
                    case 1:
                        existingEmail = _a.sent();
                        if (existingEmail) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Email đã tồn tại");
                        }
                        return [4 /*yield*/, User_1["default"].findOne({ username: username })];
                    case 2:
                        existingUsername = _a.sent();
                        if (existingUsername) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Username đã tồn tại");
                        }
                        // Validate email và password
                        if (!validator.isEmail(email)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Email không hợp lệ");
                        }
                        if (password.length < 8) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Mật khẩu phải ≥ 8 ký tự");
                        }
                        newUser = new User_1["default"]({
                            name: name,
                            username: username,
                            email: email,
                            password: password,
                            date_of_birth: date_of_birth,
                            roles: Array.isArray(roles) ? roles : ["user"],
                            status: status || "active",
                            bio: bio || "",
                            avatar: avatar || "",
                            cloudinaryPublicId: cloudinaryPublicId || "",
                            link: link || "",
                            emailVerified: emailVerified === true
                        });
                        return [4 /*yield*/, newUser.save()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, newUser];
                    case 4:
                        error_1 = _a.sent();
                        // Xử lý Mongoose ValidationError
                        if (error_1 instanceof mongoose_1["default"].Error.ValidationError) {
                            messages = Object.values(error_1.errors)
                                .map(function (e) { return e.message; })
                                .join(", ");
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, messages);
                        }
                        if (error_1 instanceof httpError_1.HttpError)
                            throw error_1;
                        logger_1["default"].error("Create user error: " + error_1.message, { error: error_1 });
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Server error");
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    UserService.updateUser = function (userId, updateData) {
        return __awaiter(this, void 0, Promise, function () {
            var exist, exist, dobParsed, existingUser, destroyErr_1, updatedUser, error_2, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 11, , 12]);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(userId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "ID không hợp lệ");
                        }
                        if (!updateData.email) return [3 /*break*/, 2];
                        if (!validator.isEmail(updateData.email)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Email không hợp lệ");
                        }
                        return [4 /*yield*/, User_1["default"].findOne({
                                email: updateData.email,
                                _id: { $ne: userId }
                            })];
                    case 1:
                        exist = _a.sent();
                        if (exist) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Email đã tồn tại");
                        }
                        _a.label = 2;
                    case 2:
                        if (!updateData.username) return [3 /*break*/, 4];
                        return [4 /*yield*/, User_1["default"].findOne({
                                username: updateData.username,
                                _id: { $ne: userId }
                            })];
                    case 3:
                        exist = _a.sent();
                        if (exist) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Username đã tồn tại");
                        }
                        _a.label = 4;
                    case 4:
                        // Nếu update password, kiểm tra độ dài
                        if (updateData.password && updateData.password.length < 8) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Mật khẩu phải ≥ 8 ký tự");
                        }
                        // Nếu updateData.date_of_birth có thể là string hoặc Date
                        if (updateData.date_of_birth) {
                            if (typeof updateData.date_of_birth === "string") {
                                dobParsed = new Date(updateData.date_of_birth);
                                if (isNaN(dobParsed.getTime())) {
                                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "date_of_birth không hợp lệ");
                                }
                                // Ép kiểu về Date
                                updateData.date_of_birth = dobParsed;
                            }
                            else if (!(updateData.date_of_birth instanceof Date)) {
                                // Nếu không phải string và không phải Date, sai format
                                throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "date_of_birth phải là chuỗi hoặc Date");
                            }
                        }
                        return [4 /*yield*/, User_1["default"].findById(userId)];
                    case 5:
                        existingUser = _a.sent();
                        if (!existingUser) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Người dùng không tồn tại");
                        }
                        if (!(updateData.cloudinaryPublicId &&
                            existingUser.cloudinaryPublicId &&
                            existingUser.cloudinaryPublicId !== updateData.cloudinaryPublicId)) return [3 /*break*/, 9];
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, cloudinary_1["default"].uploader.destroy(existingUser.cloudinaryPublicId)];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        destroyErr_1 = _a.sent();
                        logger_1["default"].error("Kh\u00F4ng x\u00F3a \u0111\u01B0\u1EE3c avatar c\u0169 tr\u00EAn Cloudinary: " + destroyErr_1.message, { error: destroyErr_1 });
                        return [3 /*break*/, 9];
                    case 9: return [4 /*yield*/, User_1["default"].findByIdAndUpdate(userId, updateData, {
                            "new": true,
                            runValidators: true
                        }).select("_id name username email date_of_birth avatar bio link roles status created_at updated_at cloudinaryPublicId")];
                    case 10:
                        updatedUser = _a.sent();
                        if (!updatedUser) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Người dùng không tồn tại");
                        }
                        return [2 /*return*/, updatedUser];
                    case 11:
                        error_2 = _a.sent();
                        // Xử lý ValidationError
                        if (error_2 instanceof mongoose_1["default"].Error.ValidationError) {
                            messages = Object.values(error_2.errors)
                                .map(function (e) { return e.message; })
                                .join(", ");
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, messages);
                        }
                        if (error_2 instanceof httpError_1.HttpError)
                            throw error_2;
                        logger_1["default"].error("Update user error: " + error_2.message, { error: error_2 });
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Server error");
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    // Xóa user (Admin)
    UserService.deleteUser = function (userId) {
        return __awaiter(this, void 0, Promise, function () {
            var deleted, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(userId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "ID không hợp lệ");
                        }
                        return [4 /*yield*/, User_1["default"].findByIdAndDelete(userId)];
                    case 1:
                        deleted = _a.sent();
                        if (!deleted) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Người dùng không tồn tại");
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        if (error_3 instanceof httpError_1.HttpError)
                            throw error_3;
                        logger_1["default"].error("Delete user error: " + error_3.message, { error: error_3 });
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Server error");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    UserService.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var users, usersWithStats, error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, User_1["default"].find({}).select("_id avatar bio date_of_birth createdAt name username email roles status followers following link")];
                    case 1:
                        users = _a.sent();
                        console.log("Raw users from MongoDB:", users);
                        return [4 /*yield*/, Promise.all(users.map(function (user) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {
                                            _id: user._id,
                                            date_of_birth: user.date_of_birth
                                                ? user.date_of_birth.toISOString()
                                                : null,
                                            avatar: user.avatar || "",
                                            bio: user.bio || "",
                                            link: user.link || "",
                                            createdAt: user.created_at,
                                            name: user.name || "",
                                            username: user.username || "",
                                            email: user.email || "",
                                            roles: user.roles || ["user"],
                                            status: user.status || "active"
                                        }];
                                });
                            }); }))];
                    case 2:
                        usersWithStats = _a.sent();
                        console.log("Processed users:", usersWithStats);
                        return [2 /*return*/, usersWithStats];
                    case 3:
                        error_4 = _a.sent();
                        logger_1["default"].error("Get all users service error: " + error_4.message, { error: error_4 });
                        throw new httpError_1.HttpError(500, "Không thể lấy danh sách người dùng");
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserService.getUserProfilebyID = function (_id) {
        return __awaiter(this, void 0, Promise, function () {
            var user, password, emailVerificationToken, emailVerificationTokenExpires, roles, status, tokenVersion, cloudinaryPublicId, userWithoutSensitiveFields, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, User_1["default"].findById(_id)
                                .select("name username avatar bio link created_at")
                                .lean()];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, message_1.USERS_MESSAGES.USER_NOT_FOUND);
                        }
                        password = user.password, emailVerificationToken = user.emailVerificationToken, emailVerificationTokenExpires = user.emailVerificationTokenExpires, roles = user.roles, status = user.status, tokenVersion = user.tokenVersion, cloudinaryPublicId = user.cloudinaryPublicId, userWithoutSensitiveFields = __rest(user, ["password", "emailVerificationToken", "emailVerificationTokenExpires", "roles", "status", "tokenVersion", "cloudinaryPublicId"]);
                        return [2 /*return*/, { user: userWithoutSensitiveFields }];
                    case 2:
                        error_5 = _a.sent();
                        logger_1["default"].error("Get user profile service error: " + error_5.message, {
                            error: error_5
                        });
                        throw error_5 instanceof httpError_1.HttpError
                            ? error_5
                            : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    UserService.getTotalUsers = function () {
        return __awaiter(this, void 0, Promise, function () {
            var currentDate, sevenDaysAgo, currentUsers, previousUsers, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        currentDate = new Date();
                        sevenDaysAgo = new Date(currentDate);
                        sevenDaysAgo.setDate(currentDate.getDate() - 7);
                        return [4 /*yield*/, User_1["default"].countDocuments()];
                    case 1:
                        currentUsers = _a.sent();
                        return [4 /*yield*/, User_1["default"].countDocuments({
                                createdAt: { $lt: sevenDaysAgo }
                            })];
                    case 2:
                        previousUsers = _a.sent();
                        return [2 /*return*/, { current: currentUsers, previous: previousUsers }];
                    case 3:
                        error_6 = _a.sent();
                        logger_1["default"].error("Get total users service error: " + error_6.message, {
                            error: error_6
                        });
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserService.getTopUsers = function (limit) {
        if (limit === void 0) { limit = 10; }
        return __awaiter(this, void 0, Promise, function () {
            var userActivity, activityMap_1, userIds, users, topUsers, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Tính tổng số bài đăng và bình luận
                        console.log("Starting Thread and Comment aggregation");
                        return [4 /*yield*/, Promise.all([
                                Thread_1["default"].aggregate([
                                    {
                                        $group: {
                                            _id: "$author",
                                            postCount: { $sum: 1 }
                                        }
                                    },
                                ])["catch"](function (err) {
                                    console.error("Thread aggregation error:", err);
                                    return [];
                                }),
                                comment_1["default"].aggregate([
                                    {
                                        $group: {
                                            _id: "$user",
                                            commentCount: { $sum: 1 }
                                        }
                                    },
                                ])["catch"](function (err) {
                                    console.error("Comment aggregation error:", err);
                                    return [];
                                }),
                            ])];
                    case 1:
                        userActivity = _a.sent();
                        console.log("User activity result:", userActivity);
                        activityMap_1 = new Map();
                        userActivity.forEach(function (activity, index) {
                            console.log("Processing activity " + index + ":", activity);
                            activity.forEach(function (item) {
                                if (!item._id) {
                                    console.warn("Invalid item in activity, skipping:", item);
                                    return;
                                }
                                var userId = item._id.toString();
                                if (!activityMap_1.has(userId)) {
                                    activityMap_1.set(userId, { postCount: 0, commentCount: 0 });
                                }
                                var current = activityMap_1.get(userId);
                                if (item.postCount)
                                    current.postCount += item.postCount;
                                if (item.commentCount)
                                    current.commentCount += item.commentCount;
                            });
                        });
                        // Kiểm tra nếu activityMap rỗng
                        if (activityMap_1.size === 0) {
                            console.log("No user activity found, returning empty topUsers");
                            return [2 /*return*/, []];
                        }
                        userIds = Array.from(activityMap_1.keys())
                            .filter(function (id) { return mongoose_1["default"].Types.ObjectId.isValid(id); }) // Lọc ObjectId hợp lệ
                            .map(function (id) { return new mongoose_1["default"].Types.ObjectId(id); });
                        if (userIds.length === 0) {
                            console.log("No valid user IDs found, returning empty topUsers");
                            return [2 /*return*/, []];
                        }
                        console.log("Fetching users with IDs:", userIds);
                        return [4 /*yield*/, User_1["default"].find({ _id: { $in: userIds } }).select("_id username")];
                    case 2:
                        users = _a.sent();
                        console.log("Fetched users:", users);
                        topUsers = users
                            .filter(function (user) { return user.username !== undefined && user.username !== null; })
                            .map(function (user) {
                            var activity = activityMap_1.get(user._id.toString());
                            var activityCount = activity.postCount + activity.commentCount;
                            return {
                                _id: user._id.toString(),
                                username: user.username,
                                activityCount: activityCount
                            };
                        })
                            .sort(function (a, b) { return b.activityCount - a.activityCount; })
                            .slice(0, limit);
                        console.log("Returning topUsers:", topUsers);
                        return [2 /*return*/, topUsers];
                    case 3:
                        error_7 = _a.sent();
                        logger_1["default"].error("Get top users service error: " + error_7.message, { error: error_7 });
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return UserService;
}());
exports.UserService = UserService;
