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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.processPostContent = exports.RecommendationService = exports.PostService = void 0;
var mongoose_1 = require("mongoose");
var httpStatus_1 = require("~/constants/httpStatus");
var Follow_1 = require("~/models/Follow");
var Like_1 = require("~/models/Like");
var Thread_1 = require("~/models/Thread");
var comment_1 = require("~/models/comment");
var httpError_1 = require("~/utils/httpError");
var logger_1 = require("~/utils/logger");
var PostService = /** @class */ (function () {
    function PostService() {
    }
    PostService.getUserPosts = function (_id) {
        return __awaiter(this, void 0, Promise, function () {
            var posts, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Thread_1["default"].find({ author: _id })
                                .select("content hashtags images videos visibility createdAt likesCount commentsCount")
                                .lean()];
                    case 1:
                        posts = _a.sent();
                        console.log("Found posts for userId " + _id + ":", posts); // Debug
                        return [2 /*return*/, posts];
                    case 2:
                        error_1 = _a.sent();
                        logger_1["default"].error("Get user posts service error: " + error_1.message, {
                            error: error_1
                        });
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PostService.getTotalPosts = function () {
        return __awaiter(this, void 0, Promise, function () {
            var currentDate, sevenDaysAgo, currentPosts, previousPosts, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        currentDate = new Date();
                        sevenDaysAgo = new Date(currentDate);
                        sevenDaysAgo.setDate(currentDate.getDate() - 7);
                        return [4 /*yield*/, Thread_1["default"].countDocuments()];
                    case 1:
                        currentPosts = _a.sent();
                        return [4 /*yield*/, Thread_1["default"].countDocuments({
                                createdAt: { $lt: sevenDaysAgo }
                            })];
                    case 2:
                        previousPosts = _a.sent();
                        return [2 /*return*/, { current: currentPosts, previous: previousPosts }];
                    case 3:
                        error_2 = _a.sent();
                        logger_1["default"].error("Get toltal posts service error: " + error_2.message, {
                            error: error_2
                        });
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PostService.getPostById = function (postId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var thread, saveError_1, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        logger_1["default"].info("Fetching post with ID: " + postId + ", userId: " + userId);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(postId)) {
                            logger_1["default"].warn("Invalid post ID: " + postId);
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid post ID");
                        }
                        return [4 /*yield*/, Thread_1["default"].findById(postId).populate("author", "username _id avatar")];
                    case 1:
                        thread = _a.sent();
                        if (!thread) {
                            logger_1["default"].warn("Post not found: " + postId);
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Post not found");
                        }
                        logger_1["default"].info("Post found: " + thread._id + ", views: " + (thread.userViews || 0) + "/" + (thread.guessViews || 0));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        if (userId && mongoose_1["default"].Types.ObjectId.isValid(userId)) {
                            thread.userViews = (thread.userViews || 0) + 1;
                        }
                        else {
                            thread.guessViews = (thread.guessViews || 0) + 1;
                        }
                        return [4 /*yield*/, thread.save()];
                    case 3:
                        _a.sent();
                        logger_1["default"].info("Post views updated: " + thread.userViews + "/" + thread.guessViews);
                        return [3 /*break*/, 5];
                    case 4:
                        saveError_1 = _a.sent();
                        logger_1["default"].error("Failed to save post views: " + saveError_1.message, {
                            saveError: saveError_1
                        });
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, thread];
                    case 6:
                        error_3 = _a.sent();
                        logger_1["default"].error("Get post by id service error: " + error_3.message, { error: error_3 });
                        throw error_3 instanceof httpError_1.HttpError
                            ? error_3
                            : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    PostService.updatePost = function (postId, updateData) {
        return __awaiter(this, void 0, Promise, function () {
            var post, newVisibility, now, diffInHours, remainingHours, updatedPost, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Thread_1["default"].findById(postId)];
                    case 1:
                        post = _a.sent();
                        if (!post) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Post not found");
                        }
                        newVisibility = updateData.visibility || post.visibility;
                        if (newVisibility === "public" || newVisibility === "friends") {
                            if (post.lastEditedAt) {
                                now = new Date();
                                diffInHours = (now.getTime() - post.lastEditedAt.getTime()) / (1000 * 3600);
                                if (diffInHours < 72) {
                                    remainingHours = Math.ceil(72 - diffInHours);
                                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "B\u1EA1n ch\u1EC9 c\u00F3 th\u1EC3 ch\u1EC9nh s\u1EEDa l\u1EA1i b\u00E0i \u0111\u0103ng sau " + remainingHours + " gi\u1EDD.");
                                }
                            }
                            // Cập nhật lastEditedAt chỉ cho "public" hoặc "friends"
                            updateData = __assign(__assign({}, updateData), { lastEditedAt: new Date() });
                        }
                        else if (newVisibility === "only_me") {
                            // Không cập nhật lastEditedAt cho "only_me"
                            updateData = __assign(__assign({}, updateData), { lastEditedAt: post.lastEditedAt }); // Giữ nguyên lastEditedAt
                        }
                        return [4 /*yield*/, Thread_1["default"].findByIdAndUpdate(postId, updateData, {
                                "new": true
                            })];
                    case 2:
                        updatedPost = _a.sent();
                        return [2 /*return*/, updatedPost];
                    case 3:
                        error_4 = _a.sent();
                        throw error_4 instanceof httpError_1.HttpError
                            ? error_4
                            : new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PostService.deletePost = function (postId) {
        return __awaiter(this, void 0, Promise, function () {
            var deletedPost, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Thread_1["default"].findByIdAndDelete(postId)];
                    case 1:
                        deletedPost = _a.sent();
                        if (!deletedPost) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Post not found");
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PostService;
}());
exports.PostService = PostService;
var RecommendationService = /** @class */ (function () {
    function RecommendationService() {
    }
    RecommendationService.getRecommendedThreads = function (userId, limit) {
        if (limit === void 0) { limit = 10; }
        return __awaiter(this, void 0, void 0, function () {
            var follows, followeeIds_1, likedThreads, commentedThreads, interactedThreadIds, interactedThreads_1, hashtagCounts_1, allThreads, timeDecay_1, scoredThreads, recommendedThreads, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, Follow_1["default"].find({ followerId: userId })];
                    case 1:
                        follows = _a.sent();
                        followeeIds_1 = follows.map(function (f) { return f.followeeId; });
                        return [4 /*yield*/, Like_1["default"].find({ user: userId }).select("threadId")];
                    case 2:
                        likedThreads = _a.sent();
                        return [4 /*yield*/, comment_1["default"].find({ user: userId }).select("threadId")];
                    case 3:
                        commentedThreads = _a.sent();
                        interactedThreadIds = __spreadArrays(likedThreads.map(function (l) { return l.threadId; }), commentedThreads.map(function (c) { return c.threadId; }));
                        return [4 /*yield*/, Thread_1["default"].find({
                                _id: { $in: interactedThreadIds }
                            })
                                .select("hashtags author createdAt")
                                .populate("author", "username _id")];
                    case 4:
                        interactedThreads_1 = _a.sent();
                        hashtagCounts_1 = {};
                        interactedThreads_1.forEach(function (thread) {
                            var _a;
                            if (thread.author) {
                                (_a = thread.hashtags) === null || _a === void 0 ? void 0 : _a.forEach(function (hashtag) {
                                    hashtagCounts_1[hashtag] = (hashtagCounts_1[hashtag] || 0) + 1;
                                });
                            }
                        });
                        return [4 /*yield*/, Thread_1["default"].find({
                                visibility: "public",
                                author: { $ne: userId }
                            })
                                .sort({ createdAt: -1 }) // Bài mới nhất trước
                                .limit(1000) // Giới hạn để tối ưu
                                .populate("author", "username _id avatar")
                                .select("content hashtags videos images author createdAt likesCount commentsCount")];
                    case 5:
                        allThreads = _a.sent();
                        timeDecay_1 = function (createdAt) {
                            var daysSincePost = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
                            return Math.max(0, 1 - daysSincePost / 3); // Giảm trong 7 ngày
                        };
                        scoredThreads = allThreads
                            .filter(function (thread) { return thread.author !== null; })
                            .map(function (thread) {
                            var _a;
                            var score = 0;
                            // Điểm cho người dùng theo dõi
                            if (thread.author &&
                                followeeIds_1.some(function (id) { return id.toString() === thread.author._id.toString(); })) {
                                score += 10;
                            }
                            // Điểm cho hashtag
                            (_a = thread.hashtags) === null || _a === void 0 ? void 0 : _a.forEach(function (hashtag) {
                                if (hashtagCounts_1[hashtag]) {
                                    score += 5 * hashtagCounts_1[hashtag];
                                }
                            });
                            // Điểm cho tác giả đã tương tác
                            var authorInteracted = interactedThreads_1.some(function (t) {
                                return t.author &&
                                    thread.author &&
                                    t.author._id.toString() === thread.author._id.toString();
                            });
                            if (authorInteracted) {
                                score += 3;
                            }
                            // Thêm điểm dựa trên số lượng tương tác
                            var interactionScore = thread.likesCount + thread.commentsCount;
                            score += interactionScore * 0.5;
                            // Áp dụng giảm điểm theo thời gian
                            score *= timeDecay_1(thread.createdAt);
                            return { thread: thread, score: score };
                        });
                        // Sắp xếp và lấy top bài đăng
                        scoredThreads.sort(function (a, b) { return b.score - a.score; });
                        recommendedThreads = scoredThreads
                            .slice(0, limit)
                            .map(function (st) { return st.thread; });
                        return [2 /*return*/, recommendedThreads];
                    case 6:
                        error_6 = _a.sent();
                        console.error("Error in getRecommendedThreads:", error_6);
                        throw error_6;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return RecommendationService;
}());
exports.RecommendationService = RecommendationService;
exports.processPostContent = function (content) {
    var words = content.split(" ");
    var hashtags = [];
    var contentWords = [];
    words.forEach(function (word) {
        if (word.startsWith("#") && word.length > 1) {
            hashtags.push(word);
        }
        else {
            contentWords.push(word);
        }
    });
    var textContent = contentWords.join(" ");
    return { textContent: textContent, hashtags: hashtags };
};
