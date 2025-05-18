"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var hashtagSchema = new mongoose_1.Schema({
    name: {
        type: String,
        unique: true,
        trim: true,
        maxlength: [20, "Hashtag cannot exceed 20 characters"]
    },
    threadsId: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Thread" }],
    users: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User"
        },
    ],
    createdAt: {
        type: Date,
        "default": Date.now
    }
});
var Hashtag = mongoose_1.model("Hashtag", hashtagSchema);
exports["default"] = Hashtag;
