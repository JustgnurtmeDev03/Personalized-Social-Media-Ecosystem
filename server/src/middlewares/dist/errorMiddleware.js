"use strict";
exports.__esModule = true;
exports.errorHandler = void 0;
var AppError_1 = require("~/utils/AppError");
var logger_1 = require("~/utils/logger");
var httpStatus_1 = require("~/constants/httpStatus");
var config_1 = require("~/config");
exports.errorHandler = function (err, req, res, next) {
    // 1. Kiểm tra headers đã được gửi chưa
    if (res.headersSent) {
        logger_1["default"].warn("Headers already sent, skipping errorHandler", {
            path: req.path,
            method: req.method
        });
        return next(err);
    }
    // 2. Xác định status code và thông tin lỗi
    var statusCode = err instanceof AppError_1.AppError
        ? err.statusCode
        : httpStatus_1["default"].INTERNAL_SERVER_ERROR;
    var isProduction = config_1.config.app.env === "production";
    var isOperational = err instanceof AppError_1.AppError && err.isOperational;
    // 3. Log lỗi chi tiết
    logger_1["default"].error({
        message: err.message,
        stack: err.stack,
        name: err.name,
        path: req.path,
        method: req.method,
        operational: isOperational
    });
    // 4. Format response cho production
    if (isProduction && !isOperational) {
        return res.status(statusCode).json({
            status: "error",
            message: "Something went wrong!"
        });
    }
    // 5. Format response chi tiết cho development
    res.status(statusCode).json({
        status: statusCode >= 500 ? "error" : "fail",
        message: err.message,
        code: statusCode,
        stack: isOperational ? undefined : err.stack,
        details: err instanceof AppError_1.AppError ? err.details : undefined
    });
};
