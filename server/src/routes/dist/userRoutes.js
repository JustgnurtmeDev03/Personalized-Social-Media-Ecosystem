"use strict";
exports.__esModule = true;
var express_1 = require("express");
var userController_1 = require("~/controllers/userController");
var auth_1 = require("~/middlewares/auth");
var uploadMiddleware_1 = require("~/middlewares/uploadMiddleware");
var validation_1 = require("~/middlewares/validation");
var router = express_1["default"].Router();
// Route lấy thông tin người dùng hiện tại
router.get("/profile", auth_1["default"], userController_1.getProfile);
router.get("/profile/:_id", auth_1["default"], validation_1.validateObjectId("_id"), userController_1.getProfileByID);
router.put("/update-profile", uploadMiddleware_1["default"].single("avatar"), auth_1["default"], userController_1.updateUserProfile);
exports["default"] = router;
