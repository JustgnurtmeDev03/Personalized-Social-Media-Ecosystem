"use strict";
exports.__esModule = true;
exports.errorHandler = void 0;
var AppError_1 = require("~/utils/AppError");
var logger_1 = require("~/utils/logger");
var config_1 = require("~/config");
exports.errorHandler = function (err, req, res, next) {
    if (res.headersSent) {
        logger_1["default"].warn("Headers already sent, skipping errorHandler");
        return next(err);
    }
    var statusCode = err instanceof AppError_1.AppError ? err.statusCode : 500;
    var isOperational = err instanceof AppError_1.AppError && err.isOperational;
    // Log lỗi theo mức độ chi tiết dựa trên môi trường
    if (config_1["default"].app.debug || !isOperational) {
        logger_1["default"].error("Error: " + err.message + " \nStack: " + err.stack);
    }
    else {
        logger_1["default"].error("Operational Error: " + err.message);
    }
    res.status(statusCode).json({
        status: isOperational ? "fail" : "error",
        message: isOperational ? err.message : "Something went wrong!"
    });
};
