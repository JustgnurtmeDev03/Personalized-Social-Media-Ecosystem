"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var messageSchema = new mongoose_1.Schema({
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        "enum": ["text", "image", "gif", "sticker"],
        required: true
    },
    content: { type: String, required: true },
    replyTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "Message" },
    reactions: [
        {
            user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
            reaction: { type: String, required: true }
        },
    ],
    createdAt: { type: Date, "default": Date.now },
    isRead: { type: Boolean, "default": false }
});
var Message = mongoose_1.model("Message", messageSchema);
exports["default"] = Message;
