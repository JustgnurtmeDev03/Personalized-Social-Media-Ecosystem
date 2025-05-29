import mongoose from "mongoose";
import { HttpError } from "../utils/httpError";
import HTTP_STATUS from "../constants/httpStatus";
import logger from "../utils/logger";
import Comment from "~/models/comment";
import Thread from "~/models/Thread";
import CommentLike from "~/models/commentLike";
import User from "~/models/User";
import { NotificationService } from "./notificationService";

export class CommentService {
  static async getCommentsBythreadId(threadId: string, userId?: string) {
    try {
      logger.info(`Fetching comments for post ID: ${threadId}`);
      if (!mongoose.Types.ObjectId.isValid(threadId)) {
        logger.warn(`Invalid post ID: ${threadId}`);
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid post ID");
      }

      const comments = await Comment.find({ threadId })
        .populate("user", "username _id avatar")
        .sort({ createdAt: -1 })
        .lean();

      // Lấy danh sách lượt thích cho các bình luận
      const commentIds = comments.map((c) => c._id);
      const likes = await CommentLike.find({
        commentId: { $in: commentIds },
      }).lean();

      // Thêm thông tin likesCount và isLiked vào mỗi bình luận
      return comments.map((comment) => {
        const commentLikes = likes.filter(
          (like) => like.commentId.toString() === comment._id.toString()
        );
        return {
          ...comment,
          likesCount: commentLikes.length,
          isLiked: userId
            ? commentLikes.some((like) => like.user.toString() === userId)
            : false,
        };
      });
    } catch (error: any) {
      logger.error(`Get comments by post id error: ${error.message}`, {
        error,
      });
      throw error instanceof HttpError
        ? error
        : new HttpError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "Internal server error"
          );
    }
  }

  static async createComment(
    threadId: string,
    userId: string,
    content: string
  ) {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(threadId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid post or user ID");
      }

      // Tạo bình luận mới
      const comment = new Comment({ threadId, user: userId, content });
      await comment.save();

      // Tăng commentsCount trong Thread
      const thread = await Thread.findByIdAndUpdate(
        threadId,
        { $inc: { commentsCount: 1 } },
        { new: true }
      );

      if (!thread) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Thread not found");
      }

      // Tạo thông báo cho tác giả bài viết
      const user = await User.findById(userId).select("username");
      if (user && thread.author.toString() !== userId) {
        await NotificationService.createNotification(
          thread.author.toString(),
          "comment",
          `${user.username} đã bình luận bài viết của bạn`,
          userId,
          threadId,
          comment._id.toString()
        );
      }

      // Populate user
      const populatedComment = await comment.populate(
        "user",
        "username _id avatar"
      );

      return {
        _id: populatedComment._id,
        threadId: populatedComment.threadId,
        user: populatedComment.user,
        content: populatedComment.content,
        createdAt: populatedComment.createdAt,
        commentsCount: thread.commentsCount,
      };
    } catch (error: any) {
      logger.error(`Create comment error: ${error.message}`, { error });
      throw error instanceof HttpError
        ? error
        : new HttpError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "Internal server error"
          );
    }
  }

  static async likeComment(userId: string, commentId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid comment ID");
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid user ID");
      }

      const existingLike = await CommentLike.findOne({
        user: userId,
        commentId,
      });
      if (existingLike) {
        throw new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          "You have already liked this comment"
        );
      }

      const user = await User.findById(userId).select("username");
      if (!user) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "User not found");
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Comment not found");
      }

      const newLike = new CommentLike({
        user: userId,
        commentId,
        username: user.username,
      });
      await newLike.save();

      // Tạo thông báo cho tác giả bình luận
      if (comment.user.toString() !== userId) {
        await NotificationService.createNotification(
          comment.user.toString(),
          "like",
          `${user.username} đã thích bình luận của bạn`,
          userId,
          comment.threadId.toString(),
          commentId
        );
      }

      return { message: "Comment liked successfully" };
    } catch (error: any) {
      logger.error(`Like comment error: ${error.message}`, { error });
      throw error instanceof HttpError
        ? error
        : new HttpError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "Internal server error"
          );
    }
  }

  static async unlikeComment(userId: string, commentId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid comment ID");
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid user ID");
      }

      const like = await CommentLike.findOneAndDelete({
        user: userId,
        commentId,
      });
      if (!like) {
        throw new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          "You have not liked this comment"
        );
      }
      return { message: "Comment unliked successfully" };
    } catch (error: any) {
      logger.error(`Unlike comment error: ${error.message}`, { error });
      throw error instanceof HttpError
        ? error
        : new HttpError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "Internal server error"
          );
    }
  }

  static async addReply(
    threadId: string,
    userId: string,
    content: string,
    parentCommentId: string
  ) {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(threadId) ||
        !mongoose.Types.ObjectId.isValid(parentCommentId)
      ) {
        throw new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid thread or comment ID"
        );
      }
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Parent comment not found");
      }
      const user = await User.findById(userId).select("username avatar");
      if (!user) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "User not found");
      }
      const newComment = new Comment({
        threadId,
        user: userId,
        content,
        parentComment: parentCommentId,
      });
      await newComment.save();
      await Thread.findByIdAndUpdate(threadId, { $inc: { commentsCount: 1 } });

      // Tạo thông báo cho tác giả bình luận gốc
      if (parentComment.user.toString() !== userId) {
        await NotificationService.createNotification(
          parentComment.user.toString(),
          "reply",
          `${user.username} đã phản hồi bình luận của bạn`,
          userId,
          threadId,
          newComment._id.toString()
        );
      }

      return {
        ...newComment.toObject(),
        user: { _id: userId, username: user.username, avatar: user.avatar },
        isLiked: false,
        likesCount: 0,
      };
    } catch (error: any) {
      logger.error(`Add reply error: ${error.message}`, { error });
      throw error instanceof HttpError
        ? error
        : new HttpError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "Internal server error"
          );
    }
  }
}
