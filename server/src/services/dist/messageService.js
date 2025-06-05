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
exports.MessageService = void 0;
var Message_1 = require("../models/Message"); // Giả sử bạn đã có model Message
var mongoose_1 = require("mongoose");
var MessageService = /** @class */ (function () {
    function MessageService() {
    }
    // Gửi tin nhắn
    MessageService.sendMessage = function (senderId, recipientId, type, content, replyToId) {
        return __awaiter(this, void 0, Promise, function () {
            var replyToMessage, message, populatedMessage, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        if (!senderId || !recipientId || !type || !content) {
                            throw new Error("Missing required fields: senderId, recipientId, type, or content");
                        }
                        if (!mongoose_1.Types.ObjectId.isValid(senderId) ||
                            !mongoose_1.Types.ObjectId.isValid(recipientId)) {
                            throw new Error("Invalid senderId or recipientId format");
                        }
                        replyToMessage = null;
                        if (!replyToId) return [3 /*break*/, 2];
                        if (!mongoose_1.Types.ObjectId.isValid(replyToId)) {
                            throw new Error("Invalid replyToId format");
                        }
                        return [4 /*yield*/, Message_1["default"].findById(replyToId)];
                    case 1:
                        replyToMessage = _a.sent();
                        if (!replyToMessage) {
                            throw new Error("Reply message with ID " + replyToId + " not found");
                        }
                        _a.label = 2;
                    case 2:
                        message = new Message_1["default"]({
                            sender: new mongoose_1.Types.ObjectId(senderId),
                            recipient: new mongoose_1.Types.ObjectId(recipientId),
                            type: type,
                            content: content,
                            replyTo: replyToId ? new mongoose_1.Types.ObjectId(replyToId) : null,
                            reactions: []
                        });
                        return [4 /*yield*/, message.save()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, Message_1["default"].findById(message._id)
                                .populate("sender", "username avatar")
                                .populate("recipient", "username avatar")
                                .populate("replyTo", "content sender")];
                    case 4:
                        populatedMessage = _a.sent();
                        return [2 /*return*/, populatedMessage];
                    case 5:
                        error_1 = _a.sent();
                        throw new Error("Failed to send message: " + error_1.message);
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Lấy lịch sử tin nhắn giữa hai người dùng
    MessageService.getMessages = function (userId, currentUserId) {
        return __awaiter(this, void 0, Promise, function () {
            var messages, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!userId || !currentUserId) {
                            throw new Error("Missing required fields: userId or currentUserId");
                        }
                        if (!mongoose_1.Types.ObjectId.isValid(userId) ||
                            !mongoose_1.Types.ObjectId.isValid(currentUserId)) {
                            throw new Error("Invalid userId or currentUserId format");
                        }
                        return [4 /*yield*/, Message_1["default"].find({
                                $or: [
                                    { sender: currentUserId, recipient: userId },
                                    { sender: userId, recipient: currentUserId },
                                ]
                            })
                                .sort({ createdAt: 1 })
                                .populate("sender", "username avatar")
                                .populate("recipient", "username avatar")
                                .populate("replyTo", "content sender")];
                    case 1:
                        messages = _a.sent();
                        return [2 /*return*/, messages];
                    case 2:
                        error_2 = _a.sent();
                        throw new Error("Failed to fetch messages: " + error_2.message);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Đánh dấu tin nhắn là đã đọc
    MessageService.markMessagesAsRead = function (senderId, recipientId) {
        return __awaiter(this, void 0, Promise, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!senderId || !recipientId) {
                            throw new Error("Missing required fields: senderId or recipientId");
                        }
                        if (!mongoose_1.Types.ObjectId.isValid(senderId) ||
                            !mongoose_1.Types.ObjectId.isValid(recipientId)) {
                            throw new Error("Invalid senderId or recipientId format");
                        }
                        return [4 /*yield*/, Message_1["default"].updateMany({ sender: senderId, recipient: recipientId, isRead: false }, { $set: { isRead: true } })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        throw new Error("Failed to mark messages as read: " + error_3.message);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Thêm biểu cảm (reaction) cho tin nhắn
    MessageService.addReaction = function (messageId, userId, reaction) {
        return __awaiter(this, void 0, Promise, function () {
            var message, existingReaction, updatedMessage, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!messageId || !userId || !reaction) {
                            throw new Error("Missing required fields: messageId, userId, or reaction");
                        }
                        if (!mongoose_1.Types.ObjectId.isValid(messageId) ||
                            !mongoose_1.Types.ObjectId.isValid(userId)) {
                            throw new Error("Invalid messageId or userId format");
                        }
                        return [4 /*yield*/, Message_1["default"].findById(messageId)];
                    case 1:
                        message = _a.sent();
                        if (!message) {
                            throw new Error("Message with ID " + messageId + " not found");
                        }
                        existingReaction = message.reactions.find(function (r) { return r.user.toString() === userId; });
                        if (existingReaction) {
                            // Nếu đã có reaction, cập nhật reaction mới
                            existingReaction.reaction = reaction;
                        }
                        else {
                            // Nếu chưa có, thêm reaction mới
                            message.reactions.push({ user: new mongoose_1.Types.ObjectId(userId), reaction: reaction });
                        }
                        return [4 /*yield*/, message.save()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, Message_1["default"].findById(messageId)
                                .populate("sender", "username avatar")
                                .populate("recipient", "username avatar")
                                .populate("replyTo", "content sender")];
                    case 3:
                        updatedMessage = _a.sent();
                        return [2 /*return*/, updatedMessage];
                    case 4:
                        error_4 = _a.sent();
                        throw new Error("Failed to add reaction: " + error_4.message);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return MessageService;
}());
exports.MessageService = MessageService;
