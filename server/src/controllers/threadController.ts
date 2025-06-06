import { NextFunction, Request, Response } from "express";
import Thread from "~/models/Thread";
import User, { IUser } from "~/models/User";
import { AuthenticatedRequest } from "../middlewares/auth";
import Hashtag from "~/models/Hashtag";
import asyncHandler from "~/middlewares/asyncHandler";
import { error } from "console";
import { AppError } from "~/utils/AppError";
import { v4 as uuidv4 } from "uuid";
import Like from "~/models/Like";
import cloudinary from "~/config/cloudinary";
import { CloudinaryUploadResponse } from "~/models/cloudinary";
import {
  ChartService,
  PostService,
  RecommendationService,
  ReportService,
  processPostContent,
} from "~/services/threadService";
import HTTP_STATUS from "~/constants/httpStatus";
import mongoose from "mongoose";
import { NotificationService } from "~/services/notificationService";
import Follow from "~/models/Follow";
import { HttpError } from "~/utils/httpError";
import { NotInterested } from "~/models/NotInterested";
import { Report } from "~/models/Report";
import { Notification } from "~/models/Notification";
import { UserService } from "~/services/userService";

const createThread = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { content, visibility = "public" } = req.body;
    const { textContent, hashtags } = processPostContent(content);
    const files = req.files as Express.Multer.File[];

    // Upload file lên Cloudinary
    const uploadedMedia = [];
    for (const file of files) {
      const isVideo = file.mimetype.startsWith("video/");
      const resourceType = isVideo ? "video" : "image";
      const folder = `Gens/Media/${resourceType}s`;

      const uploadResult = await new Promise<CloudinaryUploadResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: resourceType,
              folder: folder,
              public_id: `${uuidv4()}-${file}`,
              overwrite: true,
            },
            (error, result) => {
              if (error)
                reject(
                  new AppError("Failed to upload file to Cloudinary", 500)
                );
              else resolve(result as CloudinaryUploadResponse);
            }
          );
          uploadStream.end(file.buffer);
        }
      );

      uploadedMedia.push({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        type: resourceType,
      });
    }

    const images = uploadedMedia
      .filter((m) => m.type === "image")
      .map((m) => m.url);
    const videos = uploadedMedia
      .filter((m) => m.type === "video")
      .map((m) => m.url);

    if (!textContent && images.length === 0 && videos.length === 0) {
      throw new AppError(
        "At least one of content, images, or videos must be provided",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Tạo đối tượng Thread mới với visibility
    const newThread = {
      content: textContent,
      hashtags,
      images,
      videos,
      mediaUrl: uploadedMedia[0]?.url,
      mediaType: uploadedMedia[0]?.type,
      author: req.user,
      createdAt: new Date(),
      cloudinaryPublicIds: uploadedMedia.map((m) => m.publicId),
      visibility,
    };

    const post = await Thread.create(newThread);

    // Tạo thông báo cho những người theo dõi (nếu visibility là "public" hoặc "friends")
    if (visibility !== "only_me") {
      const followers = await Follow.find({ followeeId: req.user._id });
      const user = await User.findById(req.user._id).select("username");
      if (user) {
        for (const follower of followers) {
          await NotificationService.createNotification(
            follower.followerId.toString(),
            "new_post",
            `${user.username} đã đăng một bài viết mới`,
            req.user._id.toString(),
            post._id.toString()
          );
        }
      }
    }

    // Cập nhật hashtags
    for (const hashtag of hashtags) {
      let existingHashtag = await Hashtag.findOne({ name: hashtag });

      if (!existingHashtag) {
        existingHashtag = new Hashtag({ name: hashtag });
      }

      existingHashtag.usageCount += 1;
      if (!existingHashtag.threadsId.includes(post.id)) {
        existingHashtag.threadsId.push(post.id);
      }

      await existingHashtag.save();
    }

    res.status(201).json({
      message: "Thread created successfully",
      post,
    });
  }
);

const getThread = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      const posts = await Thread.find()
        .populate("author", "username _id avatar")
        .sort({ isPinned: -1, createdAt: -1 }); // Ưu tiên bài ghim, sau đó mới theo createdAt

      const likedPosts = await Like.find({ user: req.user.id }).distinct(
        "threadId"
      );
      const likedPostIds = likedPosts.map((id) => id.toString());

      const formattedPosts = posts.map((post) => ({
        ...post.toObject(),
        isLiked:
          likedPostIds.length > 0
            ? likedPostIds.includes(post._id.toString())
            : false,
      }));

      res.json({ posts: formattedPosts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching posts" });
    }
  }
);

const getPostById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new AppError("Invalid post ID", HTTP_STATUS.BAD_REQUEST);
      }
      const userId = req.user?.id;
      const post = await PostService.getPostById(postId, userId);
      res.status(HTTP_STATUS.OK).json(post);
    } catch (error: any) {
      next(error);
    }
  }
);

const getRecommendedThreads = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user._id; // Lấy userId từ authMiddleware
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Gọi service để lấy danh sách bài viết đề xuất
      const recommendedThreads =
        await RecommendationService.getRecommendedThreads(userId.toString());

      // Trả về phản hồi thành công
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: recommendedThreads,
        message: "Recommended threads retrieved successfully",
      });
    } catch (error: any) {
      console.error("Error in getRecommendedThreads controller:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message || "Failed to fetch recommended threads",
      });
    }
  }
);

const toggleLike = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { threadId } = req.body;
      const userId = req.user.id;
      const thread = await Thread.findById(threadId);
      if (!thread) {
        res
          .status(404)
          .json({ message: "Thread no longer exists or has been deleted" });
        return;
      }

      const user = await User.findById(userId, "username");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Kiểm tra xem người dùng đã có username chưa
      let username = user.username;

      if (!username) {
        // Nếu chưa có username, tạo username ngẫu nhiên
        username = generateRandomUsername();
      }

      const existingLike = await Like.findOne({ threadId, user: userId });

      if (existingLike) {
        // Nếu đã like thì thực hiện unlike (xóa like)
        await Like.deleteOne({ _id: existingLike._id });
        if (thread.likesCount > 0) {
          thread.likesCount--;
        }
        await thread.save();
        res.status(200).json({
          isLiked: false,
          likesCount: thread.likesCount,
        });
      } else {
        const newLike = new Like({
          threadId,
          user: userId,
          username,
          createdAt: new Date(),
        });
        await newLike.save();
        thread.likesCount++;

        // Tạo thông báo cho tác giả bài viết
        if (thread.author.toString() !== userId) {
          await NotificationService.createNotification(
            thread.author.toString(),
            "like",
            `${username} đã thích bài viết của bạn`,
            userId,
            threadId
          );
        }

        await thread.save();
        res.status(200).json({
          isLiked: true,
          likesCount: thread.likesCount,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

const getLikedThreads = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user.id;
    const likedThreads = await Like.find({ user: userId }).populate("threadId");
    const likedThreadData = likedThreads.map((like) => like.threadId) || [];
    res.status(HTTP_STATUS.OK).json(likedThreadData);
  }
);

export const getTotalPosts = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const totalPosts = await PostService.getTotalPosts();

      res.status(HTTP_STATUS.OK).json({
        totalPosts,
      });
    } catch (error: any) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send({ error: "Failed to fetch totals" });
    }
  }
);

export const getUserPosts = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { _id } = req.params;
      const posts = await PostService.getUserPosts(_id);

      res.status(HTTP_STATUS.OK).json({
        posts,
      });
    } catch (error: any) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send({ error: "Failed to fetch user posts" });
    }
  }
);

export const updatePost = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { content, hashtags, visibility } = req.body;
      const userId = req.user?._id;

      const post = await Thread.findById(id);
      if (!post) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Post not found");
      }

      if (post.author.toString() !== userId.toString()) {
        throw new HttpError(
          HTTP_STATUS.FORBIDDEN,
          "You are not authorized to edit this post"
        );
      }

      const updatedPost = await PostService.updatePost(id, {
        content,
        hashtags,
        visibility,
      });
      res.status(HTTP_STATUS.OK).json(updatedPost);
    } catch (error: any) {
      console.error("Update Post Error:", error.message);
      res
        .status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send({ error: error.message || "Failed to update post" });
    }
  }
);

export const deletePost = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const post = await Thread.findById(id);
      if (!post) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Post not found");
      }
      console.log("Post Author:", post.author.toString());

      if (post.author.toString() !== userId.toString()) {
        throw new HttpError(
          HTTP_STATUS.FORBIDDEN,
          "You are not authorized to delete this post"
        );
      }

      await PostService.deletePost(id);
      res.status(HTTP_STATUS.OK).json({ message: "Post deleted successfully" });
    } catch (error: any) {
      console.error("Delete Post Error:", error.message);
      res
        .status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send({ error: error.message || "Failed to delete post" });
    }
  }
);

export const markNotInterested = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { postId } = req.body;
    const userId = req.user._id;

    try {
      await ReportService.markNotInterested(userId, postId);
      res.status(HTTP_STATUS.OK).json({ message: "Marked as not interested" });
    } catch (error: any) {
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message || "Failed to mark as not interested",
      });
    }
  }
);

export const reportPost = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { postId, reason } = req.body;
    const userId = req.user._id;

    if (!postId) {
      throw new HttpError(HTTP_STATUS.BAD_REQUEST, "postId is required");
    }
    if (!reason) {
      throw new HttpError(HTTP_STATUS.BAD_REQUEST, "reason is required");
    }

    try {
      await ReportService.reportPost(userId, postId, reason);
      res.status(HTTP_STATUS.OK).json({ message: "Report submitted" });
    } catch (error: any) {
      console.error("Controller error in reportPost:", error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message || "Failed to submit report",
      });
    }
  }
);

export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  // Kiểm tra đầu vào
  if (!q || typeof q !== "string" || q.trim() === "") {
    throw new AppError("Từ khóa tìm kiếm là bắt buộc", HTTP_STATUS.BAD_REQUEST);
  }

  const searchQuery = q.trim().toLowerCase();

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: "i" } },
        { name: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .select("username name avatar bio followers")
      .limit(10);

    if (!users.length) {
      return res.status(200).json({
        message: "Không tìm thấy người dùng nào",
        users: [],
      });
    }

    res.status(200).json({
      message: "Danh sách người dùng tìm thấy",
      users,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm người dùng:", error);
    throw new AppError(
      "Đã xảy ra lỗi khi tìm kiếm người dùng",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
});

export const searchPosts = asyncHandler(async (req, res) => {
  const { q } = req.query;

  // Kiểm tra đầu vào
  if (!q || typeof q !== "string" || q.trim() === "") {
    throw new AppError("Từ khóa tìm kiếm là bắt buộc", HTTP_STATUS.BAD_REQUEST);
  }

  const searchQuery = q.trim().toLowerCase();

  try {
    // Tìm kiếm user dựa trên username hoặc name
    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: "i" } },
        { name: { $regex: searchQuery, $options: "i" } },
      ],
    }).select("_id");

    const userIds = users.map((user) => user._id);

    // Tìm kiếm bài đăng dựa trên content, hashtags, hoặc author
    const posts = await Thread.find({
      $or: [
        { content: { $regex: searchQuery, $options: "i" } },
        { hashtags: { $elemMatch: { $regex: searchQuery, $options: "i" } } },
        { author: { $in: userIds } }, // Tìm kiếm bài đăng của user có username hoặc name khớp
      ],
      visibility: "public", // Chỉ tìm kiếm bài public để bảo mật
    })
      .populate("author", "username avatar")
      .select(
        "content images videos createdAt likesCount commentsCount hashtags visibility"
      )
      .limit(10);

    if (!posts.length) {
      return res.status(200).json({
        message: "Không tìm thấy bài đăng nào",
        posts: [],
      });
    }

    res.status(200).json({
      message: "Danh sách bài đăng tìm thấy",
      posts,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm bài đăng:", error);
    throw new AppError(
      "Đã xảy ra lỗi khi tìm kiếm bài đăng",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
});

function generateRandomUsername(): string {
  const words = [
    "cool",
    "super",
    "great",
    "happy",
    "awesome",
    "smart",
    "bright",
    "shiny",
    "star",
    "moon",
    "sky",
    "quick",
    "fast",
    "sun",
    "fire",
    "wave",
    "cloud",
  ];

  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(Math.random() * 1000);

  // Tạo username có dạng: "cool123" với độ dài khoảng 15 ký tự
  return `@${randomWord}${randomNum}`;
}

// ADMIN FUNCTION

const deletePostAdmin = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const postId = req.params.id;
      const post = await Thread.findById(postId);

      if (!post) {
        return next(new AppError("Post not found", 404));
      }

      if (
        post.author.toString() !== req.user.id &&
        (!Array.isArray(req.user?.roles) || !req.user?.roles.includes("admin"))
      ) {
        return next(new AppError("Not authorized to delete this post", 403));
      }

      await Thread.deleteOne({ _id: postId });
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting post" });
    }
  }
);

const togglePinPost = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const postId = req.params.id;
      const post = await Thread.findById(postId);

      if (!post) {
        return next(new AppError("Post not found", 404));
      }

      if (post.author.toString() !== req.user?.id) {
        if (
          !Array.isArray(req.user?.roles) ||
          !req.user?.roles.includes("admin")
        ) {
          return next(new AppError("Not authorized to pin this post", 403));
        }
      }

      post.isPinned = !post.isPinned;
      await post.save();

      res.json({
        message: post.isPinned
          ? "Post pinned successfully"
          : "Post unpinned successfully",
        isPinned: post.isPinned,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error toggling pin status" });
    }
  }
);

export const getReports = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Kiểm tra xem người dùng có vai trò 'admin' trong mảng roles
    if (!req.user?.roles?.includes("admin")) {
      throw new HttpError(HTTP_STATUS.FORBIDDEN, "Access denied");
    }

    const reports = await Report.find()
      .populate({
        path: "postId",
        populate: {
          path: "author",
          select: "username avatar", // Chỉ lấy username và avatar
        },
      })
      .populate("userId");

    res.status(HTTP_STATUS.OK).json(reports);
  }
);

export const ignoreReport = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { reportId } = req.params;
    if (!req.user?.roles?.includes("admin")) {
      throw new HttpError(HTTP_STATUS.FORBIDDEN, "Access denied");
    }

    await Report.findByIdAndDelete(reportId);
    res.status(HTTP_STATUS.OK).json({ message: "Report ignored" });
  }
);

export const createNotification = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { recipient, type, content, relatedPost } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!recipient || !type || !content) {
      return next(
        new AppError(
          "Missing required fields: recipient, type, or content",
          400
        )
      );
    }

    // Kiểm tra recipient và relatedPost (nếu có) là ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(recipient)) {
      return next(new AppError("Invalid recipient ID", 400));
    }
    if (relatedPost && !mongoose.Types.ObjectId.isValid(relatedPost)) {
      return next(new AppError("Invalid relatedPost ID", 400));
    }

    try {
      const notification = new Notification({
        recipient,
        type,
        content,
        relatedPost,
      });
      await notification.save();
      res.status(HTTP_STATUS.CREATED).json(notification);
    } catch (error: any) {
      console.error("Error creating notification:", error);
      return next(
        new AppError(
          error.message || "Failed to create notification",
          error.statusCode || 500
        )
      );
    }
  }
);

export const deleteReportedPost = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const postId = req.params.id;

      // Kiểm tra postId hợp lệ
      if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        return next(new AppError("Invalid post ID", 400));
      }

      const post = await Thread.findById(postId);
      if (!post) {
        return next(new AppError("Post not found", 404));
      }

      // Kiểm tra quyền
      if (
        post.author.toString() !== req.user.id &&
        (!Array.isArray(req.user?.roles) || !req.user?.roles.includes("admin"))
      ) {
        return next(new AppError("Not authorized to delete this post", 403));
      }

      // Xóa tất cả báo cáo liên quan đến bài viết
      await Report.deleteMany({ postId: postId });

      // Xóa bài viết
      await Thread.deleteOne({ _id: postId });

      res.json({ message: "Post deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting post:", error);
      return next(
        new AppError(
          error.message || "Error deleting post",
          error.statusCode || 500
        )
      );
    }
  }
);

export const getTotalReportedPosts = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const totalReportedPosts = await ReportService.getTotalReportedPosts();
      res.status(HTTP_STATUS.OK).json({
        totalReportedPosts,
      });
    } catch (error: any) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send({ error: "Failed to fetch reported posts totals" });
    }
  }
);

// Lấy dữ liệu biểu đồ
export const getChartData = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const chartData = await ChartService.getChartData(days);
      res.status(HTTP_STATUS.OK).json(chartData);
    } catch (error: any) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send({ error: "Failed to fetch chart data" });
    }
  }
);

export {
  getThread,
  createThread,
  getRecommendedThreads,
  toggleLike,
  getLikedThreads,
  getPostById,
  deletePostAdmin,
  togglePinPost,
};
