// messageRoutes.ts
import { Router } from "express";
import {
  sendMessage,
  getMessages,
  markAsRead,
  addReaction,
} from "../controllers/messageController";
import multer from "multer"; // Để xử lý upload file
import authMiddleware from "~/middlewares/auth";

const router = Router();
const upload = multer({ dest: "uploads/messenger/" }); // Lưu tạm file upload

router.post(
  "/sendMessage",
  upload.single("image"),
  authMiddleware,
  sendMessage
); // Gửi tin nhắn (có thể kèm ảnh)
router.get("/:userId", authMiddleware, getMessages); // Lấy tin nhắn
router.put("/:userId/read", authMiddleware, markAsRead); // Đánh dấu đã đọc
router.post("/reaction", authMiddleware, addReaction);

export default router;
