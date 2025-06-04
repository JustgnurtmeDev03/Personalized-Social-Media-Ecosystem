import express from "express";
import upload from "~/middlewares/uploadMiddleware";
import {
  createNotification,
  createThread,
  deletePost,
  deletePostAdmin,
  deleteReportedPost,
  getLikedThreads,
  getPostById,
  getRecommendedThreads,
  getReports,
  getThread,
  getTotalPosts,
  getUserPosts,
  ignoreReport,
  markNotInterested,
  reportPost,
  toggleLike,
  togglePinPost,
  updatePost,
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
router.get("/recommended", authMiddleware, getRecommendedThreads);
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
router.put("/posts/:id", authMiddleware, updatePost);
router.delete("/posts/:id", authMiddleware, deletePost);
router.post("/not-interested", authMiddleware, markNotInterested);
router.post("/report", authMiddleware, reportPost);

// Admin
router.delete("/delete/:id", authMiddleware, deletePostAdmin);
router.post("/pin/:id", authMiddleware, togglePinPost);
router.get("/reports", authMiddleware, getReports);
router.post("/reports/:reportId/ignore", authMiddleware, ignoreReport);
router.delete("/delete-reported-post/:id", authMiddleware, deleteReportedPost);
router.post("/notifications", authMiddleware, createNotification);

export default router;
