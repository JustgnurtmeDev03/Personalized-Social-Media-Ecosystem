"use strict";
exports.__esModule = true;
exports.Report = void 0;
var mongoose_1 = require("mongoose");
var reportSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Thread", required: true },
    reason: { type: String, required: true },
    createdAt: { type: Date, "default": Date.now }
});
exports.Report = mongoose_1.model("Report", reportSchema);
