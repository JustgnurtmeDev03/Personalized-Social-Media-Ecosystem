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
exports.getFollowing = exports.getFollowers = exports.unfollowUser = exports.followUser = void 0;
var httpStatus_1 = require("~/constants/httpStatus");
var message_1 = require("~/constants/message");
var asyncHandler_1 = require("~/middlewares/asyncHandler");
var httpError_1 = require("~/utils/httpError");
var express_validator_1 = require("express-validator");
var followService_1 = require("~/services/followService");
exports.followUser = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var errors, followerId, followeeId;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                errors = express_validator_1.validationResult(req);
                if (!errors.isEmpty()) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, message_1.USERS_MESSAGES.VALIDATION_ERROR, errors.array());
                }
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].UNAUTHORIZED, message_1.USERS_MESSAGES.UNAUTHORIZED);
                }
                followerId = req.user._id.toString();
                followeeId = req.params._id;
                if (followerId === followeeId) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, message_1.USERS_MESSAGES.CANNOT_FOLLOW_YOURSELF);
                }
                return [4 /*yield*/, followService_1.FollowService.followUser(followerId, followeeId)];
            case 1:
                _b.sent();
                res
                    .status(httpStatus_1["default"].CREATED)
                    .json({ message: message_1.USERS_MESSAGES.FOLLOW_SUCCESS });
                return [2 /*return*/];
        }
    });
}); });
exports.unfollowUser = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var followerId, followeeId;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].UNAUTHORIZED, message_1.USERS_MESSAGES.UNAUTHORIZED);
                }
                followerId = req.user._id.toString();
                followeeId = req.params._id;
                if (followerId === followeeId) {
                    throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, message_1.USERS_MESSAGES.CANNOT_FOLLOW_YOURSELF);
                }
                return [4 /*yield*/, followService_1.FollowService.unfollowUser(followerId, followeeId)];
            case 1:
                _b.sent();
                res
                    .status(httpStatus_1["default"].OK)
                    .json({ message: message_1.USERS_MESSAGES.UNFOLLOW_SUCCESS });
                return [2 /*return*/];
        }
    });
}); });
exports.getFollowers = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var _id, followers;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _id = req.params._id;
                return [4 /*yield*/, followService_1.FollowService.getFollowers(_id)];
            case 1:
                followers = _a.sent();
                res.status(httpStatus_1["default"].OK).json(followers);
                return [2 /*return*/];
        }
    });
}); });
exports.getFollowing = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, Promise, function () {
    var _id, following;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _id = req.params._id;
                return [4 /*yield*/, followService_1.FollowService.getFollowing(_id)];
            case 1:
                following = _a.sent();
                res.status(httpStatus_1["default"].OK).json(following);
                return [2 /*return*/];
        }
    });
}); });
