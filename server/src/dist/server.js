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
process.on("uncaughtException", function (err) {
    console.error("UNCAUGHT EXCEPTION! Shutting down...");
    console.error(err.name, err.message);
    process.exit(1);
});
process.on("unhandledRejection", function (err) {
    console.error("UNHANDLED REJECTION! Shuting down...");
    console.error(err.message);
    server.close(function () { return process.exit(1); });
});
