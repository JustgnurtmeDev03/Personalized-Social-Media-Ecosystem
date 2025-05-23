import express from "express";
import upload from "~/middlewares/uploadMiddleware";
import {
  createThread,
  getLikedThreads,
  getThread,
  getTotalPosts,
  toggleLike,
} from "~/controllers/threadController";
import authMiddleware from "~/middlewares/auth";

const router = express.Router();

router.post("/upload", upload.array("media", 10), authMiddleware, createThread);
router.get("/posts", authMiddleware, getThread);
router.post("/like", authMiddleware, toggleLike);
router.get("/posts/liked", authMiddleware, getLikedThreads);
router.get("/total-posts", authMiddleware, getTotalPosts);

export default router;
