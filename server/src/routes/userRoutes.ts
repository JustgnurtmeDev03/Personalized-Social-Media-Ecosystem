import express from "express";
import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from "~/controllers/followController";
import {
  getProfile,
  getProfileByID,
  getTotalUsers,
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

router.get("/total-users", authMiddleware, getTotalUsers);

router.post(
  "/:_id/follow",
  authMiddleware,
  validateObjectId("_id"),
  followUser
);
router.delete(
  "/:_id/unfollow",
  authMiddleware,
  validateObjectId("_id"),
  unfollowUser
);
router.get(
  "/:_id/followers",
  authMiddleware,
  validateObjectId("_id"),
  getFollowers
);
router.get(
  "/:_id/is-following",
  authMiddleware,
  validateObjectId("_id"),
  getFollowing
);

export default router;
