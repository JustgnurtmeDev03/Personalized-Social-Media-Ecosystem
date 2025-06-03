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
exports.togglePinPost = exports.deletePostAdmin = exports.getPostById = exports.getLikedThreads = exports.toggleLike = exports.getRecommendedThreads = exports.createThread = exports.getThread = exports.deletePost = exports.updatePost = exports.getUserPosts = exports.getTotalPosts = void 0;
var Thread_1 = require("~/models/Thread");
var User_1 = require("~/models/User");
var Hashtag_1 = require("~/models/Hashtag");
var asyncHandler_1 = require("~/middlewares/asyncHandler");
var AppError_1 = require("~/utils/AppError");
var uuid_1 = require("uuid");
var Like_1 = require("~/models/Like");
var cloudinary_1 = require("~/config/cloudinary");
var threadService_1 = require("~/services/threadService");
var httpStatus_1 = require("~/constants/httpStatus");
var mongoose_1 = require("mongoose");
var notificationService_1 = require("~/services/notificationService");
var Follow_1 = require("~/models/Follow");
var httpError_1 = require("~/utils/httpError");
var createThread = asyncHandler_1["default"](function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, content, _b, visibility, _c, textContent, hashtags, files, uploadedMedia, _loop_1, _i, files_1, file, images, videos, newThread, post, followers, user, _d, followers_1, follower, _e, hashtags_1, hashtag, existingHashtag;
    var _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _a = req.body, content = _a.content, _b = _a.visibility, visibility = _b === void 0 ? "public" : _b;
                _c = threadService_1.processPostContent(content), textContent = _c.textContent, hashtags = _c.hashtags;
                files = req.files;
                uploadedMedia = [];
                _loop_1 = function (file) {
                    var isVideo, resourceType, folder, uploadResult;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                isVideo = file.mimetype.startsWith("video/");
                                resourceType = isVideo ? "video" : "image";
                                folder = "Gens/Media/" + resourceType + "s";
                                return [4 /*yield*/, new Promise(function (resolve, reject) {
                                        var uploadStream = cloudinary_1["default"].uploader.upload_stream({
                                            resource_type: resourceType,
                                            folder: folder,
                                            public_id: uuid_1.v4() + "-" + file,
                                            overwrite: true
                                        }, function (error, result) {
                                            if (error)
                                                reject(new AppError_1.AppError("Failed to upload file to Cloudinary", 500));
                                            else
                                                resolve(result);
                                        });
                                        uploadStream.end(file.buffer);
                                    })];
                            case 1:
                                uploadResult = _a.sent();
                                uploadedMedia.push({
                                    url: uploadResult.secure_url,
                                    publicId: uploadResult.public_id,
                                    type: resourceType
                                });
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, files_1 = files;
                _h.label = 1;
            case 1:
                if (!(_i < files_1.length)) return [3 /*break*/, 4];
                file = files_1[_i];
                return [5 /*yield**/, _loop_1(file)];
            case 2:
                _h.sent();
                _h.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                images = uploadedMedia
                    .filter(function (m) { return m.type === "image"; })
                    .map(function (m) { return m.url; });
                videos = uploadedMedia
                    .filter(function (m) { return m.type === "video"; })
                    .map(function (m) { return m.url; });
                if (!textContent && images.length === 0 && videos.length === 0) {
                    throw new AppError_1.AppError("At least one of content, images, or videos must be provided", httpStatus_1["default"].BAD_REQUEST);
                }
                newThread = {
                    content: textContent,
                    hashtags: hashtags,
                    images: images,
                    videos: videos,
                    mediaUrl: (_f = uploadedMedia[0]) === null || _f === void 0 ? void 0 : _f.url,
                    mediaType: (_g = uploadedMedia[0]) === null || _g === void 0 ? void 0 : _g.type,
                    author: req.user,
                    createdAt: new Date(),
                    cloudinaryPublicIds: uploadedMedia.map(function (m) { return m.publicId; }),
                    visibility: visibility
                };
                return [4 /*yield*/, Thread_1["default"].create(newThread)];
            case 5:
                post = _h.sent();
                if (!(visibility !== "only_me")) return [3 /*break*/, 11];
                return [4 /*yield*/, Follow_1["default"].find({ followeeId: req.user._id })];
            case 6:
                followers = _h.sent();
                return [4 /*yield*/, User_1["default"].findById(req.user._id).select("username")];
            case 7:
                user = _h.sent();
                if (!user) return [3 /*break*/, 11];
                _d = 0, followers_1 = followers;
                _h.label = 8;
            case 8:
                if (!(_d < followers_1.length)) return [3 /*break*/, 11];
                follower = followers_1[_d];
                return [4 /*yield*/, notificationService_1.NotificationService.createNotification(follower.followerId.toString(), "new_post", user.username + " \u0111\u00E3 \u0111\u0103ng m\u1ED9t b\u00E0i vi\u1EBFt m\u1EDBi", req.user._id.toString(), post._id.toString())];
            case 9:
                _h.sent();
                _h.label = 10;
            case 10:
                _d++;
                return [3 /*break*/, 8];
            case 11:
                _e = 0, hashtags_1 = hashtags;
                _h.label = 12;
            case 12:
                if (!(_e < hashtags_1.length)) return [3 /*break*/, 16];
                hashtag = hashtags_1[_e];
                return [4 /*yield*/, Hashtag_1["default"].findOne({ name: hashtag })];
            case 13:
                existingHashtag = _h.sent();
                if (!existingHashtag) {
                    existingHashtag = new Hashtag_1["default"]({ name: hashtag });
                }
                existingHashtag.usageCount += 1;
                if (!existingHashtag.threadsId.includes(post.id)) {
                    existingHashtag.threadsId.push(post.id);
                }
                return [4 /*yield*/, existingHashtag.save()];
            case 14:
                _h.sent();
                _h.label = 15;
            case 15:
                _e++;
                return [3 /*break*/, 12];
            case 16:
                res.status(201).json({
                    message: "Thread created successfully",
                    post: post
                });
                return [2 /*return*/];
        }
    });
}); });
exports.createThread = createThread;
var getThread = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var user, posts, likedPosts, likedPostIds_1, formattedPosts, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, User_1["default"].findById(req.user.id)];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, next(new AppError_1.AppError("User not found", 404))];
                }
                return [4 /*yield*/, Thread_1["default"].find()
                        .populate("author", "username _id avatar")
                        .sort({ isPinned: -1, createdAt: -1 })];
            case 2:
                posts = _a.sent();
                return [4 /*yield*/, Like_1["default"].find({ user: req.user.id }).distinct("threadId")];
            case 3:
                likedPosts = _a.sent();
                likedPostIds_1 = likedPosts.map(function (id) { return id.toString(); });
                formattedPosts = posts.map(function (post) { return (__assign(__assign({}, post.toObject()), { isLiked: likedPostIds_1.length > 0
                        ? likedPostIds_1.includes(post._id.toString())
                        : false })); });
                res.json({ posts: formattedPosts });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error(error_1);
                res.status(500).json({ message: "Error fetching posts" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.getThread = getThread;
var getPostById = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var postId, userId, post, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                postId = req.params.id;
                if (!mongoose_1["default"].Types.ObjectId.isValid(postId)) {
                    throw new AppError_1.AppError("Invalid post ID", httpStatus_1["default"].BAD_REQUEST);
                }
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, threadService_1.PostService.getPostById(postId, userId)];
            case 1:
                post = _b.sent();
                res.status(httpStatus_1["default"].OK).json(post);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.getPostById = getPostById;
var getRecommendedThreads = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var userId, recommendedThreads, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user._id;
                if (!userId) {
                    throw new Error("User not authenticated");
                }
                return [4 /*yield*/, threadService_1.RecommendationService.getRecommendedThreads(userId.toString())];
            case 1:
                recommendedThreads = _a.sent();
                // Trả về phản hồi thành công
                res.status(httpStatus_1["default"].OK).json({
                    success: true,
                    data: recommendedThreads,
                    message: "Recommended threads retrieved successfully"
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error("Error in getRecommendedThreads controller:", error_3);
                res.status(httpStatus_1["default"].INTERNAL_SERVER_ERROR).json({
                    success: false,
                    error: error_3.message || "Failed to fetch recommended threads"
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.getRecommendedThreads = getRecommendedThreads;
var toggleLike = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var threadId, userId, thread, user, username, existingLike, newLike, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 12, , 13]);
                threadId = req.body.threadId;
                userId = req.user.id;
                return [4 /*yield*/, Thread_1["default"].findById(threadId)];
            case 1:
                thread = _a.sent();
                if (!thread) {
                    res
                        .status(404)
                        .json({ message: "Thread no longer exists or has been deleted" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, User_1["default"].findById(userId, "username")];
            case 2:
                user = _a.sent();
                if (!user) {
                    res.status(404).json({ message: "User not found" });
                    return [2 /*return*/];
                }
                username = user.username;
                if (!username) {
                    // Nếu chưa có username, tạo username ngẫu nhiên
                    username = generateRandomUsername();
                }
                return [4 /*yield*/, Like_1["default"].findOne({ threadId: threadId, user: userId })];
            case 3:
                existingLike = _a.sent();
                if (!existingLike) return [3 /*break*/, 6];
                // Nếu đã like thì thực hiện unlike (xóa like)
                return [4 /*yield*/, Like_1["default"].deleteOne({ _id: existingLike._id })];
            case 4:
                // Nếu đã like thì thực hiện unlike (xóa like)
                _a.sent();
                if (thread.likesCount > 0) {
                    thread.likesCount--;
                }
                return [4 /*yield*/, thread.save()];
            case 5:
                _a.sent();
                res.status(200).json({
                    isLiked: false,
                    likesCount: thread.likesCount
                });
                return [3 /*break*/, 11];
            case 6:
                newLike = new Like_1["default"]({
                    threadId: threadId,
                    user: userId,
                    username: username,
                    createdAt: new Date()
                });
                return [4 /*yield*/, newLike.save()];
            case 7:
                _a.sent();
                thread.likesCount++;
                if (!(thread.author.toString() !== userId)) return [3 /*break*/, 9];
                return [4 /*yield*/, notificationService_1.NotificationService.createNotification(thread.author.toString(), "like", username + " \u0111\u00E3 th\u00EDch b\u00E0i vi\u1EBFt c\u1EE7a b\u1EA1n", userId, threadId)];
            case 8:
                _a.sent();
                _a.label = 9;
            case 9: return [4 /*yield*/, thread.save()];
            case 10:
                _a.sent();
                res.status(200).json({
                    isLiked: true,
                    likesCount: thread.likesCount
                });
                _a.label = 11;
            case 11: return [3 /*break*/, 13];
            case 12:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/];
        }
    });
}); });
exports.toggleLike = toggleLike;
var getLikedThreads = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var userId, likedThreads, likedThreadData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.user.id;
                return [4 /*yield*/, Like_1["default"].find({ user: userId }).populate("threadId")];
            case 1:
                likedThreads = _a.sent();
                likedThreadData = likedThreads.map(function (like) { return like.threadId; }) || [];
                res.status(httpStatus_1["default"].OK).json(likedThreadData);
                return [2 /*return*/];
        }
    });
}); });
exports.getLikedThreads = getLikedThreads;
exports.getTotalPosts = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var totalPosts, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, threadService_1.PostService.getTotalPosts()];
            case 1:
                totalPosts = _a.sent();
                res.status(httpStatus_1["default"].OK).json({
                    totalPosts: totalPosts
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
exports.getUserPosts = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var _id, posts, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                _id = req.params._id;
                return [4 /*yield*/, threadService_1.PostService.getUserPosts(_id)];
            case 1:
                posts = _a.sent();
                res.status(httpStatus_1["default"].OK).json({
                    posts: posts
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                res
                    .status(httpStatus_1["default"].INTERNAL_SERVER_ERROR)
                    .send({ error: "Failed to fetch user posts" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.updatePost = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var id, _a, content, hashtags, visibility, userId, post, updatedPost, error_7;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                id = req.params.id;
                _a = req.body, content = _a.content, hashtags = _a.hashtags, visibility = _a.visibility;
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
                return [4 /*yield*/, Thread_1["default"].findById(id)];
            case 1:
                post = _c.sent();
                if (!post) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Post not found");
                }
                if (post.author.toString() !== userId.toString()) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].FORBIDDEN, "You are not authorized to edit this post");
                }
                return [4 /*yield*/, threadService_1.PostService.updatePost(id, {
                        content: content,
                        hashtags: hashtags,
                        visibility: visibility
                    })];
            case 2:
                updatedPost = _c.sent();
                res.status(httpStatus_1["default"].OK).json(updatedPost);
                return [3 /*break*/, 4];
            case 3:
                error_7 = _c.sent();
                console.error("Update Post Error:", error_7.message);
                res
                    .status(error_7.statusCode || httpStatus_1["default"].INTERNAL_SERVER_ERROR)
                    .send({ error: error_7.message || "Failed to update post" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.deletePost = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var id, userId, post, error_8;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                return [4 /*yield*/, Thread_1["default"].findById(id)];
            case 1:
                post = _b.sent();
                if (!post) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].NOT_FOUND, "Post not found");
                }
                console.log("Post Author:", post.author.toString());
                if (post.author.toString() !== userId.toString()) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].FORBIDDEN, "You are not authorized to delete this post");
                }
                return [4 /*yield*/, threadService_1.PostService.deletePost(id)];
            case 2:
                _b.sent();
                res.status(httpStatus_1["default"].OK).json({ message: "Post deleted successfully" });
                return [3 /*break*/, 4];
            case 3:
                error_8 = _b.sent();
                console.error("Delete Post Error:", error_8.message);
                res
                    .status(error_8.statusCode || httpStatus_1["default"].INTERNAL_SERVER_ERROR)
                    .send({ error: error_8.message || "Failed to delete post" });
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
// ADMIN FUNCTION
var deletePostAdmin = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var postId, post, error_9;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                postId = req.params.id;
                return [4 /*yield*/, Thread_1["default"].findById(postId)];
            case 1:
                post = _c.sent();
                if (!post) {
                    return [2 /*return*/, next(new AppError_1.AppError("Post not found", 404))];
                }
                if (post.author.toString() !== req.user.id &&
                    (!Array.isArray((_a = req.user) === null || _a === void 0 ? void 0 : _a.roles) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.roles.includes("admin")))) {
                    return [2 /*return*/, next(new AppError_1.AppError("Not authorized to delete this post", 403))];
                }
                return [4 /*yield*/, Thread_1["default"].deleteOne({ _id: postId })];
            case 2:
                _c.sent();
                res.json({ message: "Post deleted successfully" });
                return [3 /*break*/, 4];
            case 3:
                error_9 = _c.sent();
                console.error(error_9);
                res.status(500).json({ message: "Error deleting post" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.deletePostAdmin = deletePostAdmin;
var togglePinPost = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var postId, post, error_10;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                postId = req.params.id;
                return [4 /*yield*/, Thread_1["default"].findById(postId)];
            case 1:
                post = _d.sent();
                if (!post) {
                    return [2 /*return*/, next(new AppError_1.AppError("Post not found", 404))];
                }
                if (post.author.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    if (!Array.isArray((_b = req.user) === null || _b === void 0 ? void 0 : _b.roles) ||
                        !((_c = req.user) === null || _c === void 0 ? void 0 : _c.roles.includes("admin"))) {
                        return [2 /*return*/, next(new AppError_1.AppError("Not authorized to pin this post", 403))];
                    }
                }
                post.isPinned = !post.isPinned;
                return [4 /*yield*/, post.save()];
            case 2:
                _d.sent();
                res.json({
                    message: post.isPinned
                        ? "Post pinned successfully"
                        : "Post unpinned successfully",
                    isPinned: post.isPinned
                });
                return [3 /*break*/, 4];
            case 3:
                error_10 = _d.sent();
                console.error(error_10);
                res.status(500).json({ message: "Error toggling pin status" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.togglePinPost = togglePinPost;
