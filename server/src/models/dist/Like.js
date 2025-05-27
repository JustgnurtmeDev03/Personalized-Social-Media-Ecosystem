"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var likeSchema = new mongoose_1.Schema({
    threadId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Thread", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    username: { type: String, ref: "User", required: true },
    createdAt: { type: Date, "default": Date.now }
});
var Like = mongoose_1["default"].model("Like", likeSchema);
exports["default"] = Like;
