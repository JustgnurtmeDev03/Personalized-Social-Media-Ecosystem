"use strict";
exports.__esModule = true;
exports.NotInterested = void 0;
var mongoose_1 = require("mongoose");
var notInterestedSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Thread", required: true },
    createdAt: { type: Date, "default": Date.now }
});
exports.NotInterested = mongoose_1.model("NotInterested", notInterestedSchema);
