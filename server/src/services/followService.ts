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
      throw new AppError(USERS_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Tối ưu hóa truy vấn bằng cách sử dụng aggregate để giảm số lần gọi DB
    const followersData = await Follow.aggregate([
      { $match: { followeeId: user._id } },
      {
        $lookup: {
          from: "users",
          localField: "followerId",
          foreignField: "_id",
          as: "follower",
        },
      },
      { $unwind: "$follower" },
      {
        $project: {
          _id: "$follower._id",
          username: "$follower.username",
          name: "$follower.name",
          avatar: "$follower.avatar",
        },
      },
    ]);

    if (!followersData.length) {
      return [];
    }

    // Lấy danh sách following của user để kiểm tra mutual
    const following = await Follow.find({ followerId: _id })
      .select("followeeId")
      .lean();
    const followingIds = following.map((f) => f.followeeId.toString());

    // Thêm trường isMutual
    const followersWithMutual = followersData.map((follower) => ({
      ...follower,
      isMutual: followingIds.includes(follower._id.toString()),
    }));

    return followersWithMutual;
  }

  static async getFollowing(_id: string): Promise<IUser[]> {
    const user = await User.findById(_id);
    if (!user) {
      throw new AppError(USERS_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Tối ưu hóa truy vấn bằng aggregate
    const followingData = await Follow.aggregate([
      { $match: { followerId: user._id } },
      {
        $lookup: {
          from: "users",
          localField: "followeeId",
          foreignField: "_id",
          as: "followee",
        },
      },
      { $unwind: "$followee" },
      {
        $project: {
          _id: "$followee._id",
          username: "$followee.username",
          name: "$followee.name",
          avatar: "$followee.avatar",
        },
      },
    ]);

    if (!followingData.length) {
      return [];
    }

    return followingData;
  }
}
