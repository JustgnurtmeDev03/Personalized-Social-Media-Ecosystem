"use strict";
exports.__esModule = true;
// messageRoutes.ts
var express_1 = require("express");
var messageController_1 = require("../controllers/messageController");
var multer_1 = require("multer"); // Để xử lý upload file
var auth_1 = require("~/middlewares/auth");
var router = express_1.Router();
var upload = multer_1["default"]({ dest: "uploads/messenger/" }); // Lưu tạm file upload
router.post("/sendMessage", upload.single("image"), auth_1["default"], messageController_1.sendMessage); // Gửi tin nhắn (có thể kèm ảnh)
router.get("/conversations", auth_1["default"], messageController_1.getConversations);
router.get("/:userId", auth_1["default"], messageController_1.getMessages);
router.put("/:userId/read", auth_1["default"], messageController_1.markAsRead);
router.post("/reaction", auth_1["default"], messageController_1.addReaction);
exports["default"] = router;
