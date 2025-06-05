import express from "express";
import {
  followUser,
  getFollowers,
  getFollowing,
  removeFollower,
  unfollowUser,
} from "~/controllers/followController";
import { createUser, updateUser } from "~/controllers/threadController";
import {
  getAllUsers,
  getProfile,
  getProfileByID,
  getTopUsers,
  getTotalUsers,
  updateUserProfile,
} from "~/controllers/userController";
import authMiddleware from "~/middlewares/auth";
import upload from "~/middlewares/uploadMiddleware";
import { validateObjectId } from "~/middlewares/validation";

const router = express.Router();

// USER

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
router.delete(
  "/:_id/remove-follower",
  authMiddleware,
  validateObjectId("_id"),
  removeFollower
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

// ADMIN
router.get("/get-users", authMiddleware, getAllUsers);
router.get("/total-users", authMiddleware, getTotalUsers);
router.get("/top-interactors", authMiddleware, getTopUsers);
router.post("/users", authMiddleware, upload.single("avatar"), createUser);
router.put(
  "/users/:userId",
  authMiddleware,
  upload.single("avatar"),
  updateUser
);

export default router;
