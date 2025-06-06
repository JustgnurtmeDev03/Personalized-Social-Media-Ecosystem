"use strict";
exports.__esModule = true;
var asyncHandler = function (fn) {
    return function (req, res, next) {
        // Bọc mọi logic trong Promise để bắt cả lỗi đồng bộ
        Promise.resolve(fn(req, res, next))["catch"](next);
    };
};
exports["default"] = asyncHandler;
