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
