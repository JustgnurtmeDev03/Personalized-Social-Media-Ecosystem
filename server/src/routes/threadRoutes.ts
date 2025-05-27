import express from "express";
import upload from "~/middlewares/uploadMiddleware";
import {
  createThread,
  getLikedThreads,
  getPostById,
  getThread,
  getTotalPosts,
  getUserPosts,
  toggleLike,
} from "~/controllers/threadController";
import authMiddleware from "~/middlewares/auth";
import { createComment, getComments } from "~/controllers/commentController";

const router = express.Router();

router.post("/upload", upload.array("media", 10), authMiddleware, createThread);
router.get("/posts", authMiddleware, getThread);
router.post("/like", authMiddleware, toggleLike);
router.post("/comments", authMiddleware, createComment);
router.get("/:id/comments", authMiddleware, getComments);
router.get("/posts/liked", authMiddleware, getLikedThreads);
router.get("/posts/:id", authMiddleware, getPostById);
router.get("/total-posts", authMiddleware, getTotalPosts);
router.get("/:_id/posts", authMiddleware, getUserPosts);

export default router;
