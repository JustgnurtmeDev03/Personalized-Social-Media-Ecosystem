"use strict";
exports.__esModule = true;
var envalid_1 = require("envalid");
var env = envalid_1.cleanEnv(process.env, {
    JWT_ACCESS_SECRET: envalid_1.str(),
    JWT_REFRESH_SECRET: envalid_1.str(),
    JWT_ACCESS_EXPIRATION: envalid_1.str(),
    JWT_REFRESH_EXPIRATION: envalid_1.str(),
    DB_URI: envalid_1.str(),
    EMAIL_USER: envalid_1.str(),
    EMAIL_PASS: envalid_1.str(),
    NODE_ENV: envalid_1.str(),
    LOG_LEVEL: envalid_1.str(),
    APP_URL: envalid_1.str(),
    CLOUDINARY_CLOUD_NAME: envalid_1.str(),
    CLOUDINARY_API_KEY: envalid_1.str(),
    CLOUDINARY_API_SECRET: envalid_1.str()
});
exports["default"] = env;
