import { Request, Response, NextFunction } from "express";
import asyncHandler from "../middlewares/asyncHandler";
import { CommentService } from "~/services/commentService";
import logger from "../utils/logger";
import { AuthenticatedRequest } from "~/middlewares/auth";
import mongoose from "mongoose";
import { HttpError } from "~/utils/httpError";
import HTTP_STATUS from "~/constants/httpStatus";

export const getComments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const threadId = req.params.id;
      const userId = req.user?.id; // Lấy từ middleware xác thực
      logger.info(`Fetching comments for post ID: ${threadId}`);
      const comments = await CommentService.getCommentsBythreadId(
        threadId,
        userId
      );
      res.status(200).json(comments);
    } catch (error: any) {
      next(error);
    }
  }
);

export const createComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { threadId, content } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      logger.info(`Creating comment for post ID: ${threadId}`);
      const result = await CommentService.createComment(
        threadId,
        userId,
        content
      );
      res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

// CommentController.ts
export const likeComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { commentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpError(HTTP_STATUS.UNAUTHORIZED, "User not authenticated");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid user ID");
    }

    const result = await CommentService.likeComment(userId, commentId);
    res.status(200).json(result);
  }
);

export const unlikeComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { commentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpError(HTTP_STATUS.UNAUTHORIZED, "User not authenticated");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Invalid user ID");
    }

    const result = await CommentService.unlikeComment(userId, commentId);
    res.status(200).json(result);
  }
);

export const addReply = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { threadId, content, parentCommentId } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpError(HTTP_STATUS.UNAUTHORIZED, "User not authenticated");
    }
    const newComment = await CommentService.addReply(
      threadId,
      userId,
      content,
      parentCommentId
    );
    res.status(201).json(newComment);
  }
);
