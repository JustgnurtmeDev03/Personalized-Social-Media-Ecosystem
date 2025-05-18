"use strict";
exports.__esModule = true;
var development_1 = require("./development");
var production_1 = require("./production");
var env = process.env.NODE_ENV || "development";
var config = env === "production" ? production_1["default"] : development_1["default"];
exports["default"] = config;
