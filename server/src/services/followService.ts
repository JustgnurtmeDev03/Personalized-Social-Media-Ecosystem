import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import Follow from "~/models/Follow";
import User, { IUser } from "~/models/User";
import { AppError } from "~/utils/AppError";
import logger from "~/utils/logger";

export class FollowService {
  static async followUser(
    followerId: string,
    followeeId: string
  ): Promise<void> {
    const existingFollow = await Follow.findOne({ followerId, followeeId });
    if (existingFollow) {
      throw new AppError("Already following", HTTP_STATUS.BAD_REQUEST);
    }

    await Follow.create({ followerId, followeeId });
    logger.info(`User ${followerId} followed user ${followeeId}`);
  }
  static async unfollowUser(
    followerId: string,
    followeeId: string
  ): Promise<void> {
    const follow = await Follow.findOne({ followerId, followeeId });
    if (!follow) {
      throw new AppError("Not following", HTTP_STATUS.BAD_REQUEST);
    }
    await follow.deleteOne();
    logger.info(`User ${followerId} unfollowed user ${followeeId}`);
  }

  static async getFollowers(_id: string): Promise<IUser[]> {
    const user = await User.findById(_id);
    if (!user) {
      throw new AppError(
        USERS_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const follows = await Follow.find({ followeeId: _id })
      .populate<{ followerId: IUser }>("followerId", "username name avatar")
      .lean();

    if (!follows.length) {
      return [];
    }

    return follows.map((f) => f.followerId);
  }

  static async getFollowing(_id: string): Promise<IUser[]> {
    const user = await User.findById(_id);
    if (!user) {
      throw new AppError(
        USERS_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const follows = await Follow.find({ followerId: _id })
      .populate<{ followeeId: IUser }>("followeeId", "username name avatar")
      .lean();

    if (!follows.length) {
      return [];
    }

    return follows.map((f) => f.followeeId);
  }
}
