import express from "express";
import upload from "~/middlewares/uploadMiddleware";
import {
  createThread,
  deletePostAdmin,
  getLikedThreads,
  getPostById,
  getThread,
  getTotalPosts,
  getUserPosts,
  toggleLike,
  togglePinPost,
} from "~/controllers/threadController";
import authMiddleware from "~/middlewares/auth";
import {
  addReply,
  createComment,
  getComments,
  likeComment,
  unlikeComment,
} from "~/controllers/commentController";

const router = express.Router();

// User
router.post("/upload", upload.array("media", 10), authMiddleware, createThread);
router.get("/posts", authMiddleware, getThread);
router.post("/like", authMiddleware, toggleLike);
router.get("/posts/liked", authMiddleware, getLikedThreads);
router.get("/posts/:id", authMiddleware, getPostById);
router.get("/total-posts", authMiddleware, getTotalPosts);
router.post("/comments", authMiddleware, createComment);
router.post("/like-comment", authMiddleware, likeComment);
router.post("/unlike-comment", authMiddleware, unlikeComment);
router.post("/reply", authMiddleware, addReply);
router.get("/:id/comments", authMiddleware, getComments);
router.get("/:_id/posts", authMiddleware, getUserPosts);

// Admin
router.delete("/delete/:id", authMiddleware, deletePostAdmin);
router.post("/pin/:id", authMiddleware, togglePinPost);

export default router;
