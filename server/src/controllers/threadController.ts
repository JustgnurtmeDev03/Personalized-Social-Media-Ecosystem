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
import { processPostContent } from "~/services/threadService";
import HTTP_STATUS from "~/constants/httpStatus";

const createThread = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { content } = req.body;
    const { textContent, hashtags } = processPostContent(content);
    const files = req.files as Express.Multer.File[];
    // Kiểm tra file upload

    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", 400);
    }

    // Upload file lên Cloudinary
    const uploadedMedia = [];
    for (const file of files) {
      // Xác định loại file
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

    // Tạo đối tượng Thread mới
    const newThread = {
      content: textContent,
      hashtags,
      images: uploadedMedia.filter((m) => m.type === "image").map((m) => m.url),
      videos: uploadedMedia.filter((m) => m.type === "video").map((m) => m.url),
      mediaUrl: uploadedMedia[0]?.url,
      mediaType: uploadedMedia[0]?.type,
      author: req.user,
      createdAt: new Date(),
      cloudinaryPublicIds: uploadedMedia.map((m) => m.publicId), // Lưu public_id để quản lý file
    };

    // Lưu thread vào database
    const post = await Thread.create(newThread);

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
        .sort({ createdAt: -1 });
      // Lấy danh sách bài viết người dùng đã like
      const likedPosts = await Like.find({ user: req.user.id }).distinct(
        "threadId"
      );
      const likedPostIds = likedPosts.map((id) => id.toString());
      // Thêm trạng thái 'isLiked' cho mỗi bài viết
      const formattedPosts = posts.map((post) => ({
        ...post.toObject(),
        isLiked:
          likedPostIds.length > 0
            ? likedPostIds.includes(post._id.toString())
            : false, // Gắn trạng thái like cho bài viết
      }));

      res.json({ posts: formattedPosts });
    } catch {
      console.error(error);
      res.status(500).json({ message: "Error fetching posts" });
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

export { getThread, createThread, toggleLike, getLikedThreads };
