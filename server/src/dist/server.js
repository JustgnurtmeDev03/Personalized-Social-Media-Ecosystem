"use strict";
exports.__esModule = true;
var app_1 = require("./app");
var http = require("http").createServer(app_1["default"]);
var io = require("./middlewares/socket")(http);
app_1["default"].set("io", io);
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
