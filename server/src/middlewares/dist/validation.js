"use strict";
exports.__esModule = true;
exports.validateObjectId = exports.validateRefreshToken = exports.validateLogin = exports.validateRegister = void 0;
var express_validator_1 = require("express-validator");
var mongoose_1 = require("mongoose");
var httpStatus_1 = require("~/constants/httpStatus");
var message_1 = require("~/constants/message");
var httpError_1 = require("~/utils/httpError");
// Validator cho đăng ký
exports.validateRegister = [
    express_validator_1.check("name").notEmpty().withMessage("Name is required"),
];
express_validator_1.check("email").isEmail().withMessage("Email is invalid"),
    express_validator_1.check("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long"),
    function (req, res, next) {
        var errors = express_validator_1.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    };
// Validator cho đăng nhập
exports.validateLogin = [
    express_validator_1.check("email").isEmail().withMessage("Email is invalid"),
    express_validator_1.check("password").notEmpty().withMessage("password is required"),
    function (req, res, next) {
        var errors = express_validator_1.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
// Validator cho refresh token và logout
exports.validateRefreshToken = [
    express_validator_1.check("refreshToken").notEmpty().withMessage("Refresh Token is required"),
    function (req, res, next) {
        var errors = express_validator_1.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateObjectId = function (param) {
    return function (req, res, next) {
        var _id = req.params[param];
        if (!mongoose_1["default"].Types.ObjectId.isValid(_id)) {
            throw new httpError_1.HttpError(httpStatus_1["default"].BAD_REQUEST, message_1.USERS_MESSAGES.ID_IS_INVALID);
        }
        next();
    };
};
