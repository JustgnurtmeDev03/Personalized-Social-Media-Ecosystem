import { Request, Response, NextFunction } from "express";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import asyncHandler from "~/middlewares/asyncHandler";
import { HttpError } from "~/utils/httpError";
import { validationResult } from "express-validator";
import { FollowService } from "~/services/followService";
import logger from "~/utils/logger";

interface AuthRequest extends Request {
  user?: { _id: string };
}

export const followUser = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        USERS_MESSAGES.VALIDATION_ERROR,
        errors.array()
      );
    }
    if (!req.user?._id) {
      throw new HttpError(
        HTTP_STATUS.UNAUTHORIZED,
        USERS_MESSAGES.UNAUTHORIZED
      );
    }

    const followerId = req.user._id.toString();
    const followeeId = req.params._id;

    if (followerId === followeeId) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        USERS_MESSAGES.CANNOT_FOLLOW_YOURSELF
      );
    }

    await FollowService.followUser(followerId, followeeId);

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: USERS_MESSAGES.FOLLOW_SUCCESS });
  }
);

export const unfollowUser = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
    } catch (error: any) {}
  }
);
