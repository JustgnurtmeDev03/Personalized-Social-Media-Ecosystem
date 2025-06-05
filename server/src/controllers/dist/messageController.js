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
exports.addReaction = exports.markAsRead = exports.getMessages = exports.sendMessage = void 0;
var asyncHandler_1 = require("~/middlewares/asyncHandler");
var messageService_1 = require("../services/messageService");
var cloudinary_1 = require("../config/cloudinary");
// Gửi tin nhắn
exports.sendMessage = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var io, _a, recipientId, type, content, replyTo, senderId, messageContent, result, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                io = req.app.get("io");
                _a = req.body, recipientId = _a.recipientId, type = _a.type, content = _a.content, replyTo = _a.replyTo;
                senderId = req.user.id;
                if (!recipientId || !type) {
                    return [2 /*return*/, res.status(400).json({ message: "Missing required fields" })];
                }
                if (!(type === "image")) return [3 /*break*/, 2];
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({ message: "No image file provided" })];
                }
                return [4 /*yield*/, cloudinary_1["default"].uploader.upload(req.file.path)];
            case 1:
                result = _b.sent();
                messageContent = result.secure_url;
                return [3 /*break*/, 3];
            case 2:
                messageContent = content;
                if (!messageContent) {
                    return [2 /*return*/, res.status(400).json({ message: "Content is required" })];
                }
                _b.label = 3;
            case 3: return [4 /*yield*/, messageService_1.MessageService.sendMessage(senderId, recipientId, type, messageContent, replyTo)];
            case 4:
                message = _b.sent();
                // Không cần populate lại vì MessageService đã làm việc này
                io.to(recipientId).emit("newMessage", message);
                res.status(201).json(message);
                return [2 /*return*/];
        }
    });
}); });
// Lấy danh sách tin nhắn
exports.getMessages = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, currentUserId, messages;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.params.userId;
                currentUserId = req.user.id;
                return [4 /*yield*/, messageService_1.MessageService.getMessages(userId, currentUserId)];
            case 1:
                messages = _a.sent();
                res.json(messages);
                return [2 /*return*/];
        }
    });
}); });
// Đánh dấu tin nhắn là đã đọc
exports.markAsRead = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var senderId, recipientId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                senderId = req.params.userId;
                recipientId = req.user.id;
                return [4 /*yield*/, messageService_1.MessageService.markMessagesAsRead(senderId, recipientId)];
            case 1:
                _a.sent();
                res.json({ message: "Messages marked as read" });
                return [2 /*return*/];
        }
    });
}); });
// Thêm biểu cảm (reaction) cho tin nhắn
exports.addReaction = asyncHandler_1["default"](function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, messageId, reaction, userId, updatedMessage;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, messageId = _a.messageId, reaction = _a.reaction;
                userId = req.user.id;
                if (!messageId || !reaction) {
                    return [2 /*return*/, res.status(400).json({ message: "Missing required fields" })];
                }
                return [4 /*yield*/, messageService_1.MessageService.addReaction(messageId, userId, reaction)];
            case 1:
                updatedMessage = _b.sent();
                res.json(updatedMessage);
                return [2 /*return*/];
        }
    });
}); });
