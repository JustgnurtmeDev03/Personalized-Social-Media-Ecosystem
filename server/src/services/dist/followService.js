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
exports.FollowService = void 0;
var httpStatus_1 = require("~/constants/httpStatus");
var message_1 = require("~/constants/message");
var Follow_1 = require("~/models/Follow");
var User_1 = require("~/models/User");
var AppError_1 = require("~/utils/AppError");
var logger_1 = require("~/utils/logger");
var FollowService = /** @class */ (function () {
    function FollowService() {
    }
    FollowService.followUser = function (followerId, followeeId) {
        return __awaiter(this, void 0, Promise, function () {
            var existingFollow;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Follow_1["default"].findOne({ followerId: followerId, followeeId: followeeId })];
                    case 1:
                        existingFollow = _a.sent();
                        if (existingFollow) {
                            throw new AppError_1.AppError("Already following", httpStatus_1["default"].BAD_REQUEST);
                        }
                        return [4 /*yield*/, Follow_1["default"].create({ followerId: followerId, followeeId: followeeId })];
                    case 2:
                        _a.sent();
                        logger_1["default"].info("User " + followerId + " followed user " + followeeId);
                        return [2 /*return*/];
                }
            });
        });
    };
    FollowService.unfollowUser = function (followerId, followeeId) {
        return __awaiter(this, void 0, Promise, function () {
            var follow;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Follow_1["default"].findOne({ followerId: followerId, followeeId: followeeId })];
                    case 1:
                        follow = _a.sent();
                        if (!follow) {
                            throw new AppError_1.AppError("Not following", httpStatus_1["default"].BAD_REQUEST);
                        }
                        return [4 /*yield*/, follow.deleteOne()];
                    case 2:
                        _a.sent();
                        logger_1["default"].info("User " + followerId + " unfollowed user " + followeeId);
                        return [2 /*return*/];
                }
            });
        });
    };
    FollowService.getFollowers = function (_id) {
        return __awaiter(this, void 0, Promise, function () {
            var user, follows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, User_1["default"].findById(_id)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new AppError_1.AppError(message_1.USERS_MESSAGES.USER_NOT_FOUND, httpStatus_1["default"].BAD_REQUEST);
                        }
                        return [4 /*yield*/, Follow_1["default"].find({ followeeId: _id })
                                .populate("followerId", "username name avatar")
                                .lean()];
                    case 2:
                        follows = _a.sent();
                        if (!follows.length) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, follows.map(function (f) { return f.followerId; })];
                }
            });
        });
    };
    FollowService.getFollowing = function (_id) {
        return __awaiter(this, void 0, Promise, function () {
            var user, follows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, User_1["default"].findById(_id)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new AppError_1.AppError(message_1.USERS_MESSAGES.USER_NOT_FOUND, httpStatus_1["default"].BAD_REQUEST);
                        }
                        return [4 /*yield*/, Follow_1["default"].find({ followerId: _id })
                                .populate("followeeId", "username name avatar")
                                .lean()];
                    case 2:
                        follows = _a.sent();
                        if (!follows.length) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, follows.map(function (f) { return f.followeeId; })];
                }
            });
        });
    };
    return FollowService;
}());
exports.FollowService = FollowService;
