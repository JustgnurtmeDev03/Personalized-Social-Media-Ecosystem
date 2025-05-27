import mongoose from "mongoose";
import HTTP_STATUS from "~/constants/httpStatus";
import Thread from "~/models/Thread";
import { HttpError } from "~/utils/httpError";
import logger from "~/utils/logger";

export class PostService {
  static async getUserPosts(_id: string): Promise<any[]> {
    try {
      const posts = await Thread.find({ author: _id })
        .select("content hashtags images videos createdAt likesCount")
        .lean();

      console.log(`Found posts for userId ${_id}:`, posts); // Debug
      return posts;
    } catch (error: any) {
      logger.error(`Get user posts service error: ${error.message}`, {
        error,
      });
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  static async getTotalPosts(): Promise<{
    current: number;
    previous: number;
  }> {
    try {
      const currentDate = new Date();
      const sevenDaysAgo = new Date(currentDate);
      sevenDaysAgo.setDate(currentDate.getDate() - 7);

      // Tổng số bài đăng hiện tại
      const currentPosts = await Thread.countDocuments();

      // Tổng số bài đăng 7 ngày trước (lấy số bài đăng đã tạo trước 7 ngày)
      const previousPosts = await Thread.countDocuments({
        createdAt: { $lt: sevenDaysAgo },
      });

      return { current: currentPosts, previous: previousPosts };
    } catch (error: any) {
      logger.error(`Get toltal posts service error: ${error.message}`, {
        error,
      });
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
  static async getPostById(postId: string, userId?: string) {
    try {
      logger.info(`Fetching post with ID: ${postId}, userId: ${userId}`);
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        logger.warn(`Invalid post ID: ${postId}`);
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid post ID");
      }

      const thread = await Thread.findById(postId).populate(
        "author",
        "username _id avatar"
      );

      if (!thread) {
        logger.warn(`Post not found: ${postId}`);
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Post not found");
      }

      logger.info(
        `Post found: ${thread._id}, views: ${thread.userViews || 0}/${
          thread.guessViews || 0
        }`
      );
      try {
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
          thread.userViews = (thread.userViews || 0) + 1;
        } else {
          thread.guessViews = (thread.guessViews || 0) + 1;
        }
        await thread.save();
        logger.info(
          `Post views updated: ${thread.userViews}/${thread.guessViews}`
        );
      } catch (saveError: any) {
        logger.error(`Failed to save post views: ${saveError.message}`, {
          saveError,
        });
      }

      return thread;
    } catch (error: any) {
      logger.error(`Get post by id service error: ${error.message}`, { error });
      throw error instanceof HttpError
        ? error
        : new HttpError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "Internal server error"
          );
    }
  }
}

export const processPostContent = (content: string) => {
  const words = content.split(" ");

  const hashtags: string[] = [];
  const contentWords: string[] = [];

  words.forEach((word) => {
    if (word.startsWith("#") && word.length > 1) {
      hashtags.push(word);
    } else {
      contentWords.push(word);
    }
  });

  const textContent = contentWords.join(" ");

  return { textContent, hashtags };
};
