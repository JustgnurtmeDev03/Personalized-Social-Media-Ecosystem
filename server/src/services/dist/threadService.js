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
exports.processPostContent = exports.PostService = void 0;
var mongoose_1 = require("mongoose");
var httpStatus_1 = require("~/constants/httpStatus");
var Thread_1 = require("~/models/Thread");
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
                                .select("content hashtags images videos createdAt likesCount")
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
    return PostService;
}());
exports.PostService = PostService;
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
