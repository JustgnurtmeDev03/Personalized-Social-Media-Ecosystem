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
        .select("name username avatar bio link followers following createdAt")
        .populate("followers", "username avatar")
        .populate("following", "username avatar")
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
}
