"use strict";
exports.__esModule = true;
exports.Notification = void 0;
var mongoose_1 = require("mongoose");
var notificationSchema = new mongoose_1.Schema({
    recipient: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        "enum": ["follow", "like", "comment", "reply", "new_post"],
        required: true
    },
    content: { type: String, required: true },
    relatedUser: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    relatedPost: { type: mongoose_1.Schema.Types.ObjectId, ref: "Thread" },
    relatedComment: { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment" },
    isRead: { type: Boolean, "default": false },
    createdAt: { type: Date, "default": Date.now }
});
exports.Notification = mongoose_1.model("Notification", notificationSchema);
