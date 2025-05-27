"use strict";
exports.__esModule = true;
exports.verifyResetCode = exports.generateResetCode = void 0;
var crypto_1 = require("crypto");
var RESET_CODE_EXPIRATION = 15 * 60 * 1000; // 15 phút
var resetCodes = new Map();
// Tạo ra mã xác thực ngẫu nhiên
exports.generateResetCode = function (userId) {
    var code = crypto_1["default"].randomBytes(3).toString("hex").toUpperCase(); //Mã xác thực ngẫu nhiên
    resetCodes.set(userId, {
        userId: userId,
        code: code,
        expiresAt: Date.now() + RESET_CODE_EXPIRATION
    });
    return code;
};
// Xác thực mã xác thực người dùng nhập vào
exports.verifyResetCode = function (userId, code) {
    var data = resetCodes.get(userId);
    if (!data || data.expiresAt < Date.now() || data.code !== code) {
        return false;
    }
    return true;
};
