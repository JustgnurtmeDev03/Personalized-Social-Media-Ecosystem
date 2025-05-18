"use strict";
exports.__esModule = true;
var dotenv_1 = require("dotenv");
var app_1 = require("./app");
dotenv_1["default"].config({
    path: ".env." + (process.env.NODE_ENV || "development")
});
var PORT = process.env.PORT || 5000;
var server = app_1["default"].listen(PORT, function () {
    console.log("Server running in " + process.env.NODE_ENV + " mode on port " + PORT);
});
console.log(process.env.NODE_ENV);
