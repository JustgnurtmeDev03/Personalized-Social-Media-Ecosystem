"use strict";
exports.__esModule = true;
var defaultConfig = {
    app: {
        port: process.env.PORT || 5000
    },
    database: {
        uri: process.env.DATABASE_URI
    },
    logger: {
        level: process.env.LOG_LEVEL || "info"
    }
};
exports["default"] = defaultConfig;
