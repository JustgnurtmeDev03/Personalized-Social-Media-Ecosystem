"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var default_1 = require("./default");
var developmentConfig = __assign(__assign({}, default_1["default"]), { app: __assign(__assign({}, default_1["default"].app), { debug: true }), logger: __assign(__assign({}, default_1["default"].logger), { level: "debug" }) });
exports["default"] = developmentConfig;
