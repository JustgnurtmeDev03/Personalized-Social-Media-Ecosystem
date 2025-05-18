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
exports.getLikedThreads = exports.toggleLike = exports.createThread = exports.getThread = void 0;
var Thread_1 = require("~/models/Thread");
var User_1 = require("~/models/User");
var Hashtag_1 = require("~/models/Hashtag");
var asyncHandler_1 = require("~/middlewares/asyncHandler");
var console_1 = require("console");
var AppError_1 = require("~/utils/AppError");
var uuid_1 = require("uuid");
var Like_1 = require("~/models/Like");
var cloudinary_1 = require("~/config/cloudinary");
var threadService_1 = require("~/services/threadService");
var httpStatus_1 = require("~/constants/httpStatus");
var createThread = asyncHandler_1["default"](function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var content, _a, textContent, hashtags, files, uploadedMedia, _loop_1, _i, files_1, file, newThread, post, _b, hashtags_1, hashtag, existingHashtag;
    var _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                content = req.body.content;
                _a = threadService_1.processPostContent(content), textContent = _a.textContent, hashtags = _a.hashtags;
                files = req.files;
                // Kiểm tra file upload
                if (!files || files.length === 0) {
                    throw new AppError_1.AppError("No files uploaded", 400);
                }
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
                _e.label = 1;
            case 1:
                if (!(_i < files_1.length)) return [3 /*break*/, 4];
                file = files_1[_i];
                return [5 /*yield**/, _loop_1(file)];
            case 2:
                _e.sent();
                _e.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                newThread = {
                    content: textContent,
                    hashtags: hashtags,
                    images: uploadedMedia.filter(function (m) { return m.type === "image"; }).map(function (m) { return m.url; }),
                    videos: uploadedMedia.filter(function (m) { return m.type === "video"; }).map(function (m) { return m.url; }),
                    mediaUrl: (_c = uploadedMedia[0]) === null || _c === void 0 ? void 0 : _c.url,
                    mediaType: (_d = uploadedMedia[0]) === null || _d === void 0 ? void 0 : _d.type,
                    author: req.user,
                    createdAt: new Date(),
                    cloudinaryPublicIds: uploadedMedia.map(function (m) { return m.publicId; })
                };
                return [4 /*yield*/, Thread_1["default"].create(newThread)];
            case 5:
                post = _e.sent();
                _b = 0, hashtags_1 = hashtags;
                _e.label = 6;
            case 6:
                if (!(_b < hashtags_1.length)) return [3 /*break*/, 10];
                hashtag = hashtags_1[_b];
                return [4 /*yield*/, Hashtag_1["default"].findOne({ name: hashtag })];
            case 7:
                existingHashtag = _e.sent();
                if (!existingHashtag) {
                    existingHashtag = new Hashtag_1["default"]({ name: hashtag });
                }
                existingHashtag.usageCount += 1;
                if (!existingHashtag.threadsId.includes(post.id)) {
                    existingHashtag.threadsId.push(post.id);
                }
                return [4 /*yield*/, existingHashtag.save()];
            case 8:
                _e.sent();
                _e.label = 9;
            case 9:
                _b++;
                return [3 /*break*/, 6];
            case 10:
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
    var user, posts, likedPosts, likedPostIds_1, formattedPosts, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                return [4 /*yield*/, User_1["default"].findById(req.user.id)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, next(new AppError_1.AppError("User not found", 404))];
                }
                return [4 /*yield*/, Thread_1["default"].find()
                        .populate("author", "username _id avatar")
                        .sort({ createdAt: -1 })];
            case 2:
                posts = _b.sent();
                return [4 /*yield*/, Like_1["default"].find({ user: req.user.id }).distinct("threadId")];
            case 3:
                likedPosts = _b.sent();
                likedPostIds_1 = likedPosts.map(function (id) { return id.toString(); });
                formattedPosts = posts.map(function (post) { return (__assign(__assign({}, post.toObject()), { isLiked: likedPostIds_1.length > 0
                        ? likedPostIds_1.includes(post._id.toString())
                        : false })); });
                res.json({ posts: formattedPosts });
                return [3 /*break*/, 5];
            case 4:
                _a = _b.sent();
                console.error(console_1.error);
                res.status(500).json({ message: "Error fetching posts" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.getThread = getThread;
var toggleLike = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var threadId, userId, thread, user, username, existingLike, newLike, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
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
                return [3 /*break*/, 9];
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
                return [4 /*yield*/, thread.save()];
            case 8:
                _a.sent();
                res.status(200).json({
                    isLiked: true,
                    likesCount: thread.likesCount
                });
                _a.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
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
