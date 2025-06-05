"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var MessageSchema = new mongoose_1.Schema({
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
            user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            reaction: { type: String }
        },
    ],
    isRead: { type: Boolean, "default": false },
    createdAt: { type: Date, "default": Date.now }
});
exports["default"] = mongoose_1["default"].model("Message", MessageSchema);
