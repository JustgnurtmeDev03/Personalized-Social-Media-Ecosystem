"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var dotenv_1 = require("dotenv");
var RefreshToken_1 = require("./RefreshToken");
dotenv_1.config();
// Định nghĩa các giá trị hợp lệ cho vai trò và trạng thái tài khoản
var ROLES = {
    TOPADMIN: "Top admin",
    ADMIN: "admin",
    USER: "user",
    MODERATOR: "Moderator"
};
var ACCOUNTS_STATUS = {
    PENDING: "pending",
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended"
};
// Định nghĩa schema cho token
var tokenSchema = new mongoose_1.Schema({
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        "default": Date.now
    }
});
// Định nghĩa schema cho người dùng
var userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    username: {
        type: String,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        validate: {
            validator: function (value) {
                // Kiểm tra username có bắt đầu bằng '@' và chỉ chứa ký tự hợp lệ
                return /^@[a-zA-Z0-9_]{2,29}$/.test(value);
            },
            message: function (props) {
                return "Username ph\u1EA3i b\u1EAFt \u0111\u1EA7u b\u1EB1ng '@' v\u00E0 ch\u1EC9 ch\u1EE9a ch\u1EEF c\u00E1i, s\u1ED1, g\u1EA1ch d\u01B0\u1EDBi, d\u00E0i t\u1EEB 3 \u0111\u1EBFn 30 k\u00FD t\u1EF1.";
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: function (value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email format");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true
    },
    date_of_birth: {
        type: Date,
        required: true
    },
    created_at: {
        type: Date,
        "default": Date.now
    },
    updated_at: {
        type: Date,
        "default": Date.now
    },
    avatar: {
        type: String,
        "default": ""
    },
    bio: {
        type: String,
        maxlength: 200
    },
    link: {
        type: String,
        validate: function (value) {
            if (value && !validator.isURL(value)) {
                throw new Error("Invalid URL");
            }
        }
    },
    followers: [
        {
            type: mongoose_1["default"].Schema.Types.ObjectId,
            ref: "User"
        },
    ],
    following: [
        {
            type: mongoose_1["default"].Schema.Types.ObjectId,
            ref: "User"
        },
    ],
    posts: [
        {
            type: mongoose_1["default"].Schema.Types.ObjectId,
            ref: "Post"
        },
    ],
    /*tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],*/
    tokenVersion: {
        type: Number,
        "default": 0
    },
    cloudinaryPublicId: { type: String, "default": "" },
    roles: {
        type: [String],
        required: true,
        "default": [ROLES.USER],
        "enum": Object.values(ROLES),
        validate: {
            validator: function (roles) { return roles.length > 0; },
            message: "User must have at least one role"
        }
    },
    status: {
        type: String,
        required: true,
        "default": ACCOUNTS_STATUS.PENDING,
        "enum": Object.values(ACCOUNTS_STATUS)
    },
    emailVerified: { type: Boolean, "default": false },
    emailVerificationToken: { type: String },
    emailVerificationTokenExpires: { type: Date }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
// Hash mật khẩu trước khi lưu người dùng
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function () {
        var user, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    user = this;
                    if (!user.isModified("password")) return [3 /*break*/, 2];
                    _a = user;
                    return [4 /*yield*/, bcryptjs_1["default"].hash(user.password, 10)];
                case 1:
                    _a.password = _b.sent();
                    _b.label = 2;
                case 2:
                    if (this.emailVerified && this.status === "pending") {
                        this.status = "active";
                    }
                    next();
                    return [2 /*return*/];
            }
        });
    });
});
// Tạo Access Token và Refresh Token xác thực cho người dùng
userSchema.methods.generateAuthTokens = function () {
    return __awaiter(this, void 0, Promise, function () {
        var user, accessToken, refreshToken, tokenDoc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = this;
                    accessToken = jsonwebtoken_1["default"].sign({ id: user._id.toString() }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
                    refreshToken = jsonwebtoken_1["default"].sign({
                        id: user._id.toString(),
                        tokenVersion: user.tokenVersion
                    }, process.env.JWT_REFRESH_SECRET, {
                        expiresIn: process.env.JWT_REFRESH_EXPIRATION
                    });
                    tokenDoc = new RefreshToken_1.RefreshToken({
                        userId: user.id,
                        refreshToken: refreshToken,
                        createdAt: new Date(),
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        tokenVersion: user.tokenVersion
                    });
                    return [4 /*yield*/, tokenDoc.save()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { accessToken: accessToken, refreshToken: refreshToken }];
            }
        });
    });
};
// Tăng phiên bản tokenVersion
userSchema.methods.invalidateTokens = function () {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    this.tokenVersion += 1;
                    return [4 /*yield*/, this.save()];
                case 1:
                    _a.sent();
                    // Xoá tất cả các refreshToken cũ từ collection RefreshToken
                    return [4 /*yield*/, RefreshToken_1.RefreshToken.deleteMany({ userId: this.id })];
                case 2:
                    // Xoá tất cả các refreshToken cũ từ collection RefreshToken
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
// Xác thực Refresh Token
// Tìm người dùng bằng thông tin đăng nhập
userSchema.statics.findByCredentials = function (email, password) { return __awaiter(void 0, void 0, Promise, function () {
    var user, isMatch;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, User.findOne({ email: email })];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new Error("Login is Unsuccessful");
                }
                return [4 /*yield*/, bcryptjs_1["default"].compare(password, user.password)];
            case 2:
                isMatch = _a.sent();
                if (!isMatch) {
                    throw new Error("Login is Unsuccessful");
                }
                return [2 /*return*/, user];
        }
    });
}); };
var User = mongoose_1["default"].model("User", userSchema);
exports["default"] = User;
