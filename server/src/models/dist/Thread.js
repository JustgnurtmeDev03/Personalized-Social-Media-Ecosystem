"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var threadSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: [true, "thread content is required"],
        minlength: [1, "Content must be at least 1 character"],
        maxlength: [5000, "Content cannot exceed 5000 characters"]
    },
    hashtags: [String],
    images: [String],
    videos: [String],
    poll: {
        question: String,
        options: [
            {
                option: String,
                votes: { type: Number, "default": 0 }
            },
        ],
        expiresAt: Date
    },
    visibility: {
        type: String,
        "enum": ["public", "friends", "only_me"],
        "default": "public"
    },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        "default": Date.now
    },
    guessViews: {
        type: Number,
        "default": 0
    },
    userViews: {
        type: Number,
        "default": 0
    },
    likesCount: {
        type: Number,
        "default": 0
    },
    commentsCount: {
        type: Number,
        "default": 0
    },
    repostsCount: {
        type: Number,
        "default": 0
    },
    sharesCount: {
        type: Number,
        "default": 0
    },
    cloudinaryPublicIds: [{ type: String }]
});
var commentSchema = new mongoose_1.Schema({
    threadId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Thread", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, "default": Date.now }
});
var shareSchema = new mongoose_1.Schema({
    threadId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Thread", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, "default": Date.now }
});
var repostSchema = new mongoose_1.Schema({
    threadId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Thread", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, "default": Date.now }
});
var Thread = mongoose_1["default"].model("Thread", threadSchema);
var Comment = mongoose_1["default"].model("Comment", commentSchema);
var Share = mongoose_1["default"].model("Share", shareSchema);
var Repost = mongoose_1["default"].model("Repost", repostSchema);
exports["default"] = Thread;
