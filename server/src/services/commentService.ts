import mongoose from "mongoose";
import { HttpError } from "../utils/httpError";
import HTTP_STATUS from "../constants/httpStatus";
import logger from "../utils/logger";
import Comment from "~/models/comment";
import Thread from "~/models/Thread";

export class CommentService {
  static async getCommentsBythreadId(threadId: string) {
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
      return comments;
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
}
