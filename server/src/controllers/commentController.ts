import { Request, Response, NextFunction } from "express";
import asyncHandler from "../middlewares/asyncHandler";
import { CommentService } from "~/services/commentService";
import logger from "../utils/logger";
import { AuthenticatedRequest } from "~/middlewares/auth";

export const getComments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threadId = req.params.id;
      logger.info(`Fetching comments for post ID: ${threadId}`);
      const comments = await CommentService.getCommentsBythreadId(threadId);
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
