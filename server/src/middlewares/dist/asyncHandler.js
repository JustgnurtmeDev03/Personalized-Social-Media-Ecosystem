"use strict";
exports.__esModule = true;
var asyncHandler = function (fn) {
    return function (req, res, next) {
        fn(req, res, next)["catch"](next);
    };
};
exports["default"] = asyncHandler;
