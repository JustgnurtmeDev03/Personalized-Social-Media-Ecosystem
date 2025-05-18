import express from "express";
import {
  getProfile,
  getProfileByID,
  updateUserProfile,
} from "~/controllers/userController";
import authMiddleware from "~/middlewares/auth";
import upload from "~/middlewares/uploadMiddleware";
import { validateObjectId } from "~/middlewares/validation";

const router = express.Router();

// Route lấy thông tin người dùng hiện tại
router.get("/profile", authMiddleware, getProfile);
router.get(
  "/profile/:_id",
  authMiddleware,
  validateObjectId("_id"),
  getProfileByID
);
router.put(
  "/update-profile",
  upload.single("avatar"),
  authMiddleware,
  updateUserProfile
);

export default router;
