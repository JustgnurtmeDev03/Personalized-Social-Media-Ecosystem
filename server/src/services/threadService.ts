import mongoose, { Types } from "mongoose";
import HTTP_STATUS from "~/constants/httpStatus";
import Follow from "~/models/Follow";
import Like from "~/models/Like";
import { NotInterested } from "~/models/NotInterested";
import { Report } from "~/models/Report";
import Thread from "~/models/Thread";
import User from "~/models/User";
import Comment from "~/models/comment";
import { HttpError } from "~/utils/httpError";
import logger from "~/utils/logger";

interface IPopulatedAuthor {
  _id: Types.ObjectId;
  username: string;
}

interface UpdatePostData {
  content?: string;
  hashtags?: string[];
  visibility?: string;
  lastEditedAt?: Date;
}

export class PostService {
  static async getUserPosts(_id: string): Promise<any[]> {
    try {
      const posts = await Thread.find({ author: _id })
        .select(
          "content hashtags images videos visibility createdAt likesCount commentsCount"
        )
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

  static async updatePost(
    postId: string,
    updateData: UpdatePostData
  ): Promise<any> {
    try {
      const post = await Thread.findById(postId);
      if (!post) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Post not found");
      }

      // Kiểm tra thời gian chỉnh sửa chỉ khi visibility là "public" hoặc "friends"
      const newVisibility = updateData.visibility || post.visibility; // Lấy visibility mới hoặc giữ nguyên
      if (newVisibility === "public" || newVisibility === "friends") {
        if (post.lastEditedAt) {
          const now = new Date();
          const diffInHours =
            (now.getTime() - post.lastEditedAt.getTime()) / (1000 * 3600);
          if (diffInHours < 72) {
            const remainingHours = Math.ceil(72 - diffInHours);
            throw new HttpError(
              HTTP_STATUS.BAD_REQUEST,
              `Bạn chỉ có thể chỉnh sửa lại bài đăng sau ${remainingHours} giờ.`
            );
          }
        }
        // Cập nhật lastEditedAt chỉ cho "public" hoặc "friends"
        updateData = { ...updateData, lastEditedAt: new Date() };
      } else if (newVisibility === "only_me") {
        // Không cập nhật lastEditedAt cho "only_me"
        updateData = { ...updateData, lastEditedAt: post.lastEditedAt }; // Giữ nguyên lastEditedAt
      }

      const updatedPost = await Thread.findByIdAndUpdate(postId, updateData, {
        new: true,
      });
      return updatedPost;
    } catch (error: any) {
      throw error instanceof HttpError
        ? error
        : new HttpError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "Internal server error"
          );
    }
  }
  static async deletePost(postId: string): Promise<void> {
    try {
      const deletedPost = await Thread.findByIdAndDelete(postId);
      if (!deletedPost) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Post not found");
      }
    } catch (error: any) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
}

export class RecommendationService {
  static async getRecommendedThreads(userId: string, limit: number = 10) {
    try {
      // Lấy danh sách followee
      const follows = await Follow.find({ followerId: userId });
      const followeeIds = follows.map((f) => f.followeeId);

      // Lấy danh sách các bài đã like và comment
      const likedThreads = await Like.find({ user: userId }).select("threadId");
      const commentedThreads = await Comment.find({ user: userId }).select(
        "threadId"
      );
      const likedThreadIds = likedThreads.map((l) => l.threadId.toString());
      const commentedThreadIds = commentedThreads.map((c) =>
        c.threadId.toString()
      );

      // Loại bỏ Not Interested
      const notInterestedPosts = await NotInterested.find({ userId }).select(
        "postId"
      );
      const notInterestedIds = notInterestedPosts.map((ni) =>
        ni.postId.toString()
      );

      // Danh sách bài cần loại bỏ (like, comment, not interested)
      const excludePostIds = [
        ...likedThreadIds,
        ...commentedThreadIds,
        ...notInterestedIds,
      ];

      // Lấy hashtags người dùng hay tương tác
      const interactedThreadIds = [...likedThreadIds, ...commentedThreadIds];
      const interactedThreads = await Thread.find({
        _id: { $in: interactedThreadIds },
      })
        .select("hashtags author")
        .lean();

      const hashtagCounts: Record<string, number> = {};
      interactedThreads.forEach((thread) => {
        thread.hashtags?.forEach((hashtag) => {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
        });
      });

      // Lấy danh sách bài public chưa từng like/comment/not interested
      const threads = await Thread.find({
        visibility: "public",
        author: { $ne: userId },
        _id: { $nin: excludePostIds },
      })
        .sort({ createdAt: -1 }) // Mới nhất trước
        .limit(1000)
        .populate("author", "username _id avatar")
        .lean();

      // Hàm giảm điểm theo thời gian
      const timeDecay = (createdAt: Date) => {
        const daysSincePost =
          (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0.5, 1 - daysSincePost / 7);
      };

      // Tính điểm từng bài
      const scoredThreads = threads.map((thread) => {
        let score = 0;

        // Followee post
        const authorId =
          typeof thread.author === "object" && "_id" in thread.author
            ? (thread.author as any)._id.toString()
            : thread.author?.toString();
        if (followeeIds.some((id) => id.toString() === authorId)) {
          score += 10;
        }

        // Hashtag trùng
        thread.hashtags?.forEach((hashtag) => {
          if (hashtagCounts[hashtag]) {
            score += 7 * hashtagCounts[hashtag];
          }
        });

        // Tác giả đã tương tác
        const threadAuthorId = authorId;
        const interactedAuthor = interactedThreads.some(
          (t) => t.author?.toString() === threadAuthorId
        );
        if (interactedAuthor) {
          score += 5;
        }

        // Lượt tương tác
        score += (thread.likesCount + thread.commentsCount) * 0.5;

        // Giảm điểm theo thời gian
        score *= timeDecay(thread.createdAt);

        return { thread, score };
      });

      // Sắp xếp điểm giảm dần, lấy top
      const recommendedThreads = scoredThreads
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((st) => st.thread);

      return recommendedThreads;
    } catch (error) {
      console.error("Error in getRecommendedThreads:", error);
      throw error;
    }
  }
}

export class ReportService {
  static async markNotInterested(userId: string, postId: string) {
    try {
      console.log("Checking postId for not interested:", postId);
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid postId format");
      }

      const post = await Thread.findById(postId);
      if (!post) {
        console.log("Post not found in database for postId:", postId); // Log để debug
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Post not found");
      }

      const existing = await NotInterested.findOne({ userId, postId });
      if (existing) {
        throw new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Already marked as not interested"
        );
      }

      await NotInterested.create({ userId, postId });
    } catch (error) {
      console.error("Error in markNotInterested:", error);
      throw error;
    }
  }

  static async reportPost(userId: string, postId: string, reason: string) {
    try {
      console.log("Checking postId for report:", postId);
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid postId format");
      }

      const post = await Thread.findById(postId);
      if (!post) {
        console.log("Post not found in database for postId:", postId); // Log để debug
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Post not found");
      }

      await Report.create({ userId, postId, reason });
    } catch (error) {
      console.error("Error in reportPost:", error);
      throw error;
    }
  }

  static async getTotalReportedPosts(): Promise<{
    current: number;
    previous: number;
  }> {
    try {
      const currentDate = new Date();
      const sevenDaysAgo = new Date(currentDate);
      sevenDaysAgo.setDate(currentDate.getDate() - 7);

      const currentReportedPosts = await Report.countDocuments();
      const previousReportedPosts = await Report.countDocuments({
        createdAt: { $lt: sevenDaysAgo },
      });

      return {
        current: currentReportedPosts,
        previous: previousReportedPosts,
      };
    } catch (error: any) {
      logger.error(`Get total reported posts service error: ${error.message}`, {
        error,
      });
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
}

export class ChartService {
  static async getChartData(days: number = 30): Promise<{
    labels: string[];
    posts: number[];
    users: number[];
    reportedPosts: number[];
  }> {
    try {
      const currentDate = new Date();
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - days);

      // Tạo mảng labels (ngày) với định dạng %d/%m/%Y
      const labels = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;
        labels.push(formattedDate);
      }

      console.log("Labels generated:", labels);
      console.log("Date range:", { startDate, currentDate });

      // Lấy dữ liệu bài đăng
      const postsData = await Thread.aggregate([
        {
          $match: { createdAt: { $gte: startDate, $lte: currentDate } },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]);

      // Lấy dữ liệu người dùng
      const usersData = await User.aggregate([
        {
          $match: { createdAt: { $gte: startDate, $lte: currentDate } },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]);

      // Lấy dữ liệu bài viết bị báo cáo
      const reportedPostsData = await Report.aggregate([
        {
          $match: { createdAt: { $gte: startDate, $lte: currentDate } },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]);

      console.log("Posts data:", postsData);
      console.log("Users data:", usersData);
      console.log("Reported posts data:", reportedPostsData);

      // Tạo mảng dữ liệu cho biểu đồ
      const posts = labels.map((label) => {
        const found = postsData.find((item) => item._id === label);
        return found ? found.count : 0;
      });
      const users = labels.map((label) => {
        const found = usersData.find((item) => item._id === label);
        return found ? found.count : 0;
      });
      const reportedPosts = labels.map((label) => {
        const found = reportedPostsData.find((item) => item._id === label);
        return found ? found.count : 0;
      });

      console.log("Final chart data:", { labels, posts, users, reportedPosts });
      return { labels, posts, users, reportedPosts };
    } catch (error: any) {
      logger.error(`Get chart data service error: ${error.message}`, { error });
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
