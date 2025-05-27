import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import User, { IUser } from "~/models/User";
import { HttpError } from "~/utils/httpError";
import logger from "~/utils/logger";

export class UserService {
  static async getUserProfilebyID(
    _id: string
  ): Promise<{ user: Partial<IUser> }> {
    try {
      const user = await User.findById(_id)
        .select("name username avatar bio link created_at")

        .lean();
      if (!user) {
        throw new HttpError(
          HTTP_STATUS.NOT_FOUND,
          USERS_MESSAGES.USER_NOT_FOUND
        );
      }
      // Xóa các trường không mong muốn trước khi trả về
      const {
        password,
        emailVerificationToken,
        emailVerificationTokenExpires,
        roles,
        status,
        tokenVersion,
        cloudinaryPublicId,
        ...userWithoutSensitiveFields
      } = user;
      return { user: userWithoutSensitiveFields };
    } catch (error: any) {
      logger.error(`Get user profile service error: ${error.message}`, {
        error,
      });
      throw error instanceof HttpError
        ? error
        : new HttpError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "Internal server error"
          );
    }
  }
  static async getTotalUsers(): Promise<{
    current: number;
    previous: number;
  }> {
    try {
      const currentDate = new Date();
      const sevenDaysAgo = new Date(currentDate);
      sevenDaysAgo.setDate(currentDate.getDate() - 7);

      // Tổng số người dùng hiện tại
      const currentUsers = await User.countDocuments();

      // Tổng số người dùng 7 ngày trước (lấy số người dùng đã tạo trước 7 ngày)
      const previousUsers = await User.countDocuments({
        createdAt: { $lt: sevenDaysAgo },
      });
      return { current: currentUsers, previous: previousUsers };
    } catch (error: any) {
      logger.error(`Get total users service error: ${error.message}`, {
        error,
      });
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
}
