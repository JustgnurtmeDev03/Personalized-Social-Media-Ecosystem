import { Request, Response, NextFunction } from "express";
import User, { IUser } from "~/models/User";
import asyncHandler from "~/middlewares/asyncHandler";
import { AppError } from "~/utils/AppError";
import cloudinary from "~/config/cloudinary";
import { CloudinaryUploadResponse } from "~/models/cloudinary";
import { validationResult } from "express-validator";
import { HttpError } from "~/utils/httpError";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import { UserService } from "~/services/userService";
import logger from "~/utils/logger";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getProfile = asyncHandler(
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
      res.json({ user });
    } catch (error: any) {
      res.status(500).send({ error: "Server error" });
    }
  }
);

export const getProfileByID = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          USERS_MESSAGES.USER_NOT_FOUND,
          errors.array()
        );
      }
      const { _id } = req.params;
      const { user } = await UserService.getUserProfilebyID(_id);
      res.status(HTTP_STATUS.OK).send({
        message: USERS_MESSAGES.GET_ME_SUCCESS,
        user,
      });
    } catch (error: any) {
      logger.error(`Get user profile error: ${error.message}`, { error });
      const statusCode =
        error instanceof HttpError
          ? error.statusCode
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).send({
        error: error.message || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        details: error.details || null,
      });
    }
  }
);

export const updateUserProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { bio, link, deleteAvatar } = req.body;
    const file = req.file;
    console.log("Received file:", file); // Thêm dòng này để kiểm tra

    try {
      const user: IUser | null = await User.findById(req.user.id);
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      // Kiểm tra lại bio trước khi lưu
      if (bio !== undefined && bio.length > 200) {
        return next(new AppError("Bio cannot exceed 200 characters", 400));
      }
      if (bio !== undefined) user.bio = bio;
      if (link !== undefined) user.link = link;

      if (file) {
        // Kiểm tra file có là ảnh không
        const isImage = file.mimetype.startsWith("image/");
        if (!isImage) {
          return next(
            new AppError("Only image files are allowd for avatar", 400)
          );
        }

        const folder = "Gens/Media/avatars";
        const uploadResult = await new Promise<CloudinaryUploadResponse>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: "image",
                folder: folder,
                public_id: `${user._id}-avatar`,
                overwrite: true,
              },
              (error, result) => {
                if (error)
                  reject(
                    new AppError("Failed to upload avatar to Cloudinary", 500)
                  );
                else resolve(result as CloudinaryUploadResponse);
              }
            );
            uploadStream.end(file.buffer);
          }
        );

        // Cập nhật thông tin avatar mới
        user.avatar = uploadResult.secure_url;
        user.cloudinaryPublicId = uploadResult.public_id;
      } else if (deleteAvatar === "1") {
        if (user.cloudinaryPublicId) {
          await cloudinary.uploader.destroy(user.cloudinaryPublicId);
        }
        user.avatar = "";
        user.cloudinaryPublicId = "";
      }

      await user.save();
      res.status(200).json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return next(new AppError(error.message, 400));
      }
      res.status(500).json({ error: "Server error" });
    }
  }
);
