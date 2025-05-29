import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
} from "~/controllers/notificationController";
import authMiddleware from "~/middlewares/auth";

const router = express.Router();

router.get("/get-notify", authMiddleware, getNotifications);
router.put("/:notificationId/read", authMiddleware, markNotificationAsRead);

export default router;
