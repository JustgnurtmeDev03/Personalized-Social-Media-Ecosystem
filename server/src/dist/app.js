"use strict";
exports.__esModule = true;
var express_1 = require("express");
var body_parser_1 = require("body-parser");
require("module-alias/register");
var db_1 = require("./config/db");
var cors_1 = require("cors");
var cookie_parser_1 = require("cookie-parser");
var authRoutes_1 = require("./routes/authRoutes");
var userRoutes_1 = require("./routes/userRoutes");
var threadRoutes_1 = require("./routes/threadRoutes");
var errorMiddleware_1 = require("./middlewares/errorMiddleware");
var AppError_1 = require("./utils/AppError");
var cloudinary_1 = require("./config/cloudinary");
var path_1 = require("path");
var app = express_1["default"]();
require("dotenv").config();
// Connect to MongoDB
db_1["default"]();
// Connect to Cloudinary
cloudinary_1.checkCloudinaryConnection();
app.use(cookie_parser_1["default"]());
app.use(cors_1["default"]({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express_1["default"].json());
app.use(body_parser_1["default"].json());
app.use(body_parser_1["default"].urlencoded({ extended: true }));
// Cấu hình EJS
app.set("view engine", "ejs");
app.set("views", path_1["default"].join(__dirname, "views"));
// Routes
app.use("/api/auth", authRoutes_1["default"]);
// app.use("/api/post", postRoutes);
app.use("/api/users", userRoutes_1["default"]);
app.use("/api/threads", threadRoutes_1["default"]);
// Xử lý route không tìm thấy
app.all("*", function (req, res, next) {
    next(new AppError_1.AppError("Cannot find " + req.originalUrl + " on this server", 404));
});
// Middleware xử lý lỗi
app.use(errorMiddleware_1.errorHandler);
exports["default"] = app;
