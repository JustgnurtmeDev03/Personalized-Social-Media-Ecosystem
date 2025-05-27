"use strict";
exports.__esModule = true;
// Comment.ts
var mongoose_1 = require("mongoose");
var commentSchema = new mongoose_1.Schema({
    threadId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Thread", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    content: {
        type: String,
        required: [true, "Comment content is required"],
        minlength: [1, "Content must be at least 1 character"],
        maxlength: [1000, "Content cannot exceed 1000 characters"]
    },
    parentComment: { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment", "default": null },
    createdAt: { type: Date, "default": Date.now }
});
var Comment = mongoose_1.model("Comment", commentSchema);
exports["default"] = Comment;
