"use strict";
exports.__esModule = true;
var express_1 = require("express");
var notificationController_1 = require("~/controllers/notificationController");
var auth_1 = require("~/middlewares/auth");
var router = express_1["default"].Router();
router.get("/get-notify", auth_1["default"], notificationController_1.getNotifications);
router.put("/:notificationId/read", auth_1["default"], notificationController_1.markNotificationAsRead);
exports["default"] = router;
