import { Request, Response, NextFunction } from "express";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import asyncHandler from "~/middlewares/asyncHandler";
import { HttpError } from "~/utils/httpError";
import { validationResult } from "express-validator";
import { FollowService } from "~/services/followService";

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

    await FollowService.unfollowUser(followerId, followeeId);
    res
      .status(HTTP_STATUS.OK)
      .json({ message: USERS_MESSAGES.UNFOLLOW_SUCCESS });
  }
);

export const getFollowers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { _id } = req.params;
    const followers = await FollowService.getFollowers(_id);
    res.status(HTTP_STATUS.OK).json(followers);
  }
);

export const getFollowing = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { _id } = req.params;
    const following = await FollowService.getFollowing(_id);
    res.status(HTTP_STATUS.OK).json(following);
  }
);
