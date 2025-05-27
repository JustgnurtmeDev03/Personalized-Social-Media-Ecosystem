"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var commentLikeSchema = new mongoose_1.Schema({
    commentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    username: { type: String, ref: "User", required: true },
    createdAt: { type: Date, "default": Date.now }
});
var CommentLike = mongoose_1["default"].model("CommentLike", commentLikeSchema);
exports["default"] = CommentLike;
