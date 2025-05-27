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
exports.CommentService = void 0;
var mongoose_1 = require("mongoose");
var httpError_1 = require("../utils/httpError");
var httpStatus_1 = require("../constants/httpStatus");
var logger_1 = require("../utils/logger");
var comment_1 = require("~/models/comment");
var Thread_1 = require("~/models/Thread");
var commentLike_1 = require("~/models/commentLike");
var User_1 = require("~/models/User");
var CommentService = /** @class */ (function () {
    function CommentService() {
    }
    CommentService.getCommentsBythreadId = function (threadId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var comments, commentIds, likes_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        logger_1["default"].info("Fetching comments for post ID: " + threadId);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(threadId)) {
                            logger_1["default"].warn("Invalid post ID: " + threadId);
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid post ID");
                        }
                        return [4 /*yield*/, comment_1["default"].find({ threadId: threadId })
                                .populate("user", "username _id avatar")
                                .sort({ createdAt: -1 })
                                .lean()];
                    case 1:
                        comments = _a.sent();
                        commentIds = comments.map(function (c) { return c._id; });
                        return [4 /*yield*/, commentLike_1["default"].find({
                                commentId: { $in: commentIds }
                            }).lean()];
                    case 2:
                        likes_1 = _a.sent();
                        // Thêm thông tin likesCount và isLiked vào mỗi bình luận
                        return [2 /*return*/, comments.map(function (comment) {
                                var commentLikes = likes_1.filter(function (like) { return like.commentId.toString() === comment._id.toString(); });
                                return __assign(__assign({}, comment), { likesCount: commentLikes.length, isLiked: userId
                                        ? commentLikes.some(function (like) { return like.user.toString() === userId; })
                                        : false });
                            })];
                    case 3:
                        error_1 = _a.sent();
                        logger_1["default"].error("Get comments by post id error: " + error_1.message, {
                            error: error_1
                        });
                        throw error_1 instanceof httpError_1.HttpError
                            ? error_1
                            : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CommentService.createComment = function (threadId, userId, content) {
        return __awaiter(this, void 0, void 0, function () {
            var comment, thread, populatedComment, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(threadId) ||
                            !mongoose_1["default"].Types.ObjectId.isValid(userId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid post or user ID");
                        }
                        comment = new comment_1["default"]({ threadId: threadId, user: userId, content: content });
                        return [4 /*yield*/, comment.save()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, Thread_1["default"].findByIdAndUpdate(threadId, { $inc: { commentsCount: 1 } }, { "new": true })];
                    case 2:
                        thread = _a.sent();
                        if (!thread) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Thread not found");
                        }
                        return [4 /*yield*/, comment.populate("user", "username _id avatar")];
                    case 3:
                        populatedComment = _a.sent();
                        return [2 /*return*/, {
                                _id: populatedComment._id,
                                threadId: populatedComment.threadId,
                                user: populatedComment.user,
                                content: populatedComment.content,
                                createdAt: populatedComment.createdAt,
                                commentsCount: thread.commentsCount
                            }];
                    case 4:
                        error_2 = _a.sent();
                        logger_1["default"].error("Create comment error: " + error_2.message, { error: error_2 });
                        throw error_2 instanceof httpError_1.HttpError
                            ? error_2
                            : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CommentService.likeComment = function (userId, commentId) {
        return __awaiter(this, void 0, void 0, function () {
            var existingLike, user, newLike, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(commentId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid comment ID");
                        }
                        if (!mongoose_1["default"].Types.ObjectId.isValid(userId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid user ID");
                        }
                        return [4 /*yield*/, commentLike_1["default"].findOne({
                                user: userId,
                                commentId: commentId
                            })];
                    case 1:
                        existingLike = _a.sent();
                        if (existingLike) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "You have already liked this comment");
                        }
                        return [4 /*yield*/, User_1["default"].findById(userId).select("username")];
                    case 2:
                        user = _a.sent();
                        if (!user) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "User not found");
                        }
                        newLike = new commentLike_1["default"]({
                            user: userId,
                            commentId: commentId,
                            username: user.username
                        });
                        return [4 /*yield*/, newLike.save()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, { message: "Comment liked successfully" }];
                    case 4:
                        error_3 = _a.sent();
                        logger_1["default"].error("Like comment error: " + error_3.message, { error: error_3 });
                        throw error_3 instanceof httpError_1.HttpError
                            ? error_3
                            : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CommentService.unlikeComment = function (userId, commentId) {
        return __awaiter(this, void 0, void 0, function () {
            var like, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(commentId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid comment ID");
                        }
                        if (!mongoose_1["default"].Types.ObjectId.isValid(userId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid user ID");
                        }
                        return [4 /*yield*/, commentLike_1["default"].findOneAndDelete({
                                user: userId,
                                commentId: commentId
                            })];
                    case 1:
                        like = _a.sent();
                        if (!like) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "You have not liked this comment");
                        }
                        return [2 /*return*/, { message: "Comment unliked successfully" }];
                    case 2:
                        error_4 = _a.sent();
                        logger_1["default"].error("Unlike comment error: " + error_4.message, { error: error_4 });
                        throw error_4 instanceof httpError_1.HttpError
                            ? error_4
                            : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CommentService.addReply = function (threadId, userId, content, parentCommentId) {
        return __awaiter(this, void 0, void 0, function () {
            var parentComment, user, newComment, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(threadId) ||
                            !mongoose_1["default"].Types.ObjectId.isValid(parentCommentId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid thread or comment ID");
                        }
                        return [4 /*yield*/, comment_1["default"].findById(parentCommentId)];
                    case 1:
                        parentComment = _a.sent();
                        if (!parentComment) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Parent comment not found");
                        }
                        return [4 /*yield*/, User_1["default"].findById(userId).select("username avatar")];
                    case 2:
                        user = _a.sent();
                        if (!user) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "User not found");
                        }
                        newComment = new comment_1["default"]({
                            threadId: threadId,
                            user: userId,
                            content: content,
                            parentComment: parentCommentId
                        });
                        return [4 /*yield*/, newComment.save()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, Thread_1["default"].findByIdAndUpdate(threadId, { $inc: { commentsCount: 1 } })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, __assign(__assign({}, newComment.toObject()), { user: { _id: userId, username: user.username, avatar: user.avatar }, isLiked: false, likesCount: 0 })];
                    case 5:
                        error_5 = _a.sent();
                        logger_1["default"].error("Add reply error: " + error_5.message, { error: error_5 });
                        throw error_5 instanceof httpError_1.HttpError
                            ? error_5
                            : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return CommentService;
}());
exports.CommentService = CommentService;
