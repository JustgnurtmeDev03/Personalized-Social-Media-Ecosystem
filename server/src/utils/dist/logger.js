"use strict";
exports.__esModule = true;
var winston_1 = require("winston");
var config_1 = require("~/config");
var logger = winston_1.createLogger({
    level: config_1.config.logger.level,
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.printf(function (_a) {
        var timestamp = _a.timestamp, level = _a.level, message = _a.message;
        return timestamp + " [" + level.toUpperCase() + "]: " + message;
    })),
    transports: [
        new winston_1.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston_1.transports.File({ filename: "logs/combined.log" }),
    ]
});
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston_1.transports.Console());
}
exports["default"] = logger;
