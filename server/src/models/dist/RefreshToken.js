"use strict";
exports.__esModule = true;
exports.RefreshToken = void 0;
var mongoose_1 = require("mongoose");
var refreshTokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date
    },
    expiresAt: {
        type: Date,
        required: true
    },
    tokenVersion: {
        type: Number,
        required: true
    }
});
exports.RefreshToken = mongoose_1["default"].model("RefreshToken", refreshTokenSchema);
