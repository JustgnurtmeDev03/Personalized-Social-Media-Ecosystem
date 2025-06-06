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
exports.processPostContent = exports.ChartService = exports.ReportService = exports.RecommendationService = exports.PostService = void 0;
var mongoose_1 = require("mongoose");
var httpStatus_1 = require("~/constants/httpStatus");
var Follow_1 = require("~/models/Follow");
var Like_1 = require("~/models/Like");
var NotInterested_1 = require("~/models/NotInterested");
var Report_1 = require("~/models/Report");
var Thread_1 = require("~/models/Thread");
var User_1 = require("~/models/User");
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
            var follows, followeeIds_1, likedThreads, commentedThreads, likedThreadIds, commentedThreadIds, notInterestedPosts, notInterestedIds, excludePostIds, interactedThreadIds, interactedThreads_1, hashtagCounts_1, threads, timeDecay_1, scoredThreads, recommendedThreads, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
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
                        likedThreadIds = likedThreads.map(function (l) { return l.threadId.toString(); });
                        commentedThreadIds = commentedThreads.map(function (c) {
                            return c.threadId.toString();
                        });
                        return [4 /*yield*/, NotInterested_1.NotInterested.find({ userId: userId }).select("postId")];
                    case 4:
                        notInterestedPosts = _a.sent();
                        notInterestedIds = notInterestedPosts.map(function (ni) {
                            return ni.postId.toString();
                        });
                        excludePostIds = __spreadArrays(likedThreadIds, commentedThreadIds, notInterestedIds);
                        interactedThreadIds = __spreadArrays(likedThreadIds, commentedThreadIds);
                        return [4 /*yield*/, Thread_1["default"].find({
                                _id: { $in: interactedThreadIds }
                            })
                                .select("hashtags author")
                                .lean()];
                    case 5:
                        interactedThreads_1 = _a.sent();
                        hashtagCounts_1 = {};
                        interactedThreads_1.forEach(function (thread) {
                            var _a;
                            (_a = thread.hashtags) === null || _a === void 0 ? void 0 : _a.forEach(function (hashtag) {
                                hashtagCounts_1[hashtag] = (hashtagCounts_1[hashtag] || 0) + 1;
                            });
                        });
                        return [4 /*yield*/, Thread_1["default"].find({
                                visibility: "public",
                                author: { $ne: userId },
                                _id: { $nin: excludePostIds }
                            })
                                .sort({ createdAt: -1 }) // Mới nhất trước
                                .limit(1000)
                                .populate("author", "username _id avatar")
                                .lean()];
                    case 6:
                        threads = _a.sent();
                        timeDecay_1 = function (createdAt) {
                            var daysSincePost = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
                            return Math.max(0.5, 1 - daysSincePost / 7);
                        };
                        scoredThreads = threads.map(function (thread) {
                            var _a, _b;
                            var score = 0;
                            // Followee post
                            var authorId = typeof thread.author === "object" && "_id" in thread.author
                                ? thread.author._id.toString()
                                : (_a = thread.author) === null || _a === void 0 ? void 0 : _a.toString();
                            if (followeeIds_1.some(function (id) { return id.toString() === authorId; })) {
                                score += 10;
                            }
                            // Hashtag trùng
                            (_b = thread.hashtags) === null || _b === void 0 ? void 0 : _b.forEach(function (hashtag) {
                                if (hashtagCounts_1[hashtag]) {
                                    score += 7 * hashtagCounts_1[hashtag];
                                }
                            });
                            // Tác giả đã tương tác
                            var threadAuthorId = authorId;
                            var interactedAuthor = interactedThreads_1.some(function (t) { var _a; return ((_a = t.author) === null || _a === void 0 ? void 0 : _a.toString()) === threadAuthorId; });
                            if (interactedAuthor) {
                                score += 5;
                            }
                            // Lượt tương tác
                            score += (thread.likesCount + thread.commentsCount) * 0.5;
                            // Giảm điểm theo thời gian
                            score *= timeDecay_1(thread.createdAt);
                            return { thread: thread, score: score };
                        });
                        recommendedThreads = scoredThreads
                            .sort(function (a, b) { return b.score - a.score; })
                            .slice(0, limit)
                            .map(function (st) { return st.thread; });
                        return [2 /*return*/, recommendedThreads];
                    case 7:
                        error_6 = _a.sent();
                        console.error("Error in getRecommendedThreads:", error_6);
                        throw error_6;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return RecommendationService;
}());
exports.RecommendationService = RecommendationService;
var ReportService = /** @class */ (function () {
    function ReportService() {
    }
    ReportService.markNotInterested = function (userId, postId) {
        return __awaiter(this, void 0, void 0, function () {
            var post, existing, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        console.log("Checking postId for not interested:", postId);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(postId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid postId format");
                        }
                        return [4 /*yield*/, Thread_1["default"].findById(postId)];
                    case 1:
                        post = _a.sent();
                        if (!post) {
                            console.log("Post not found in database for postId:", postId); // Log để debug
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Post not found");
                        }
                        return [4 /*yield*/, NotInterested_1.NotInterested.findOne({ userId: userId, postId: postId })];
                    case 2:
                        existing = _a.sent();
                        if (existing) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Already marked as not interested");
                        }
                        return [4 /*yield*/, NotInterested_1.NotInterested.create({ userId: userId, postId: postId })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_7 = _a.sent();
                        console.error("Error in markNotInterested:", error_7);
                        throw error_7;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ReportService.reportPost = function (userId, postId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var post, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("Checking postId for report:", postId);
                        if (!mongoose_1["default"].Types.ObjectId.isValid(postId)) {
                            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, "Invalid postId format");
                        }
                        return [4 /*yield*/, Thread_1["default"].findById(postId)];
                    case 1:
                        post = _a.sent();
                        if (!post) {
                            console.log("Post not found in database for postId:", postId); // Log để debug
                            throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Post not found");
                        }
                        return [4 /*yield*/, Report_1.Report.create({ userId: userId, postId: postId, reason: reason })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        console.error("Error in reportPost:", error_8);
                        throw error_8;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ReportService.getTotalReportedPosts = function () {
        return __awaiter(this, void 0, Promise, function () {
            var currentDate, sevenDaysAgo, currentReportedPosts, previousReportedPosts, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        currentDate = new Date();
                        sevenDaysAgo = new Date(currentDate);
                        sevenDaysAgo.setDate(currentDate.getDate() - 7);
                        return [4 /*yield*/, Report_1.Report.countDocuments()];
                    case 1:
                        currentReportedPosts = _a.sent();
                        return [4 /*yield*/, Report_1.Report.countDocuments({
                                createdAt: { $lt: sevenDaysAgo }
                            })];
                    case 2:
                        previousReportedPosts = _a.sent();
                        return [2 /*return*/, {
                                current: currentReportedPosts,
                                previous: previousReportedPosts
                            }];
                    case 3:
                        error_9 = _a.sent();
                        logger_1["default"].error("Get total reported posts service error: " + error_9.message, {
                            error: error_9
                        });
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return ReportService;
}());
exports.ReportService = ReportService;
var ChartService = /** @class */ (function () {
    function ChartService() {
    }
    ChartService.getChartData = function (days) {
        if (days === void 0) { days = 30; }
        return __awaiter(this, void 0, Promise, function () {
            var currentDate, startDate, labels, i, date, formattedDate, postsData_1, usersData_1, reportedPostsData_1, posts, users, reportedPosts, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        currentDate = new Date();
                        startDate = new Date(currentDate);
                        startDate.setDate(currentDate.getDate() - days);
                        labels = [];
                        for (i = 0; i < days; i++) {
                            date = new Date(startDate);
                            date.setDate(startDate.getDate() + i);
                            formattedDate = date.getDate().toString().padStart(2, "0") + "/" + (date.getMonth() + 1)
                                .toString()
                                .padStart(2, "0") + "/" + date.getFullYear();
                            labels.push(formattedDate);
                        }
                        console.log("Labels generated:", labels);
                        console.log("Date range:", { startDate: startDate, currentDate: currentDate });
                        return [4 /*yield*/, Thread_1["default"].aggregate([
                                {
                                    $match: { createdAt: { $gte: startDate, $lte: currentDate } }
                                },
                                {
                                    $group: {
                                        _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
                                        count: { $sum: 1 }
                                    }
                                },
                            ])];
                    case 1:
                        postsData_1 = _a.sent();
                        return [4 /*yield*/, User_1["default"].aggregate([
                                {
                                    $match: { createdAt: { $gte: startDate, $lte: currentDate } }
                                },
                                {
                                    $group: {
                                        _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
                                        count: { $sum: 1 }
                                    }
                                },
                            ])];
                    case 2:
                        usersData_1 = _a.sent();
                        return [4 /*yield*/, Report_1.Report.aggregate([
                                {
                                    $match: { createdAt: { $gte: startDate, $lte: currentDate } }
                                },
                                {
                                    $group: {
                                        _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
                                        count: { $sum: 1 }
                                    }
                                },
                            ])];
                    case 3:
                        reportedPostsData_1 = _a.sent();
                        console.log("Posts data:", postsData_1);
                        console.log("Users data:", usersData_1);
                        console.log("Reported posts data:", reportedPostsData_1);
                        posts = labels.map(function (label) {
                            var found = postsData_1.find(function (item) { return item._id === label; });
                            return found ? found.count : 0;
                        });
                        users = labels.map(function (label) {
                            var found = usersData_1.find(function (item) { return item._id === label; });
                            return found ? found.count : 0;
                        });
                        reportedPosts = labels.map(function (label) {
                            var found = reportedPostsData_1.find(function (item) { return item._id === label; });
                            return found ? found.count : 0;
                        });
                        console.log("Final chart data:", { labels: labels, posts: posts, users: users, reportedPosts: reportedPosts });
                        return [2 /*return*/, { labels: labels, posts: posts, users: users, reportedPosts: reportedPosts }];
                    case 4:
                        error_10 = _a.sent();
                        logger_1["default"].error("Get chart data service error: " + error_10.message, { error: error_10 });
                        throw new httpError_1.HttpError(httpStatus_1["default"].INTERNAL_SERVER_ERROR, "Internal server error");
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return ChartService;
}());
exports.ChartService = ChartService;
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
