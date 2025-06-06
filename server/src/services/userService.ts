import mongoose, { Types } from "mongoose";
import validator from "validator";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import Like from "~/models/Like";
import Thread from "~/models/Thread";
import User, { IUser } from "~/models/User";
import Comment from "~/models/comment";
import { HttpError } from "~/utils/httpError";
import logger from "~/utils/logger";
import cloudinary from "~/config/cloudinary";

interface UserWithUsername {
  _id: Types.ObjectId;
  username: string;
}

interface UserData {
  name: string;
  username: string;
  email: string;
  password: string;
  date_of_birth: Date;
  roles?: string[];
  status?: string;
  bio?: string;
  avatar?: string; // URL avatar nếu có
  cloudinaryPublicId?: string; // Public ID trên Cloudinary nếu có
  link?: string;
  emailVerified?: boolean;
}

export class UserService {
  static async createUser(userData: UserData): Promise<IUser> {
    try {
      const {
        name,
        username,
        email,
        password,
        date_of_birth,
        roles,
        status,
        bio,
        avatar,
        cloudinaryPublicId,
        link,
        emailVerified,
      } = userData;

      // Kiểm tra bắt buộc
      if (!name || !username || !email || !password || !date_of_birth) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Thiếu trường bắt buộc");
      }

      // Kiểm tra email/username duy nhất
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Email đã tồn tại");
      }
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Username đã tồn tại");
      }

      // Validate email và password
      if (!validator.isEmail(email)) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Email không hợp lệ");
      }
      if (password.length < 8) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Mật khẩu phải ≥ 8 ký tự");
      }

      // Tạo đối tượng mới
      const newUser = new User({
        name,
        username,
        email,
        password,
        date_of_birth,
        roles: Array.isArray(roles) ? roles : ["user"],
        status: status || "active",
        bio: bio || "",
        avatar: avatar || "",
        cloudinaryPublicId: cloudinaryPublicId || "",
        link: link || "",
        emailVerified: emailVerified === true,
      });

      await newUser.save();
      return newUser;
    } catch (error: any) {
      // Xử lý Mongoose ValidationError
      if (error instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(error.errors)
          .map((e: any) => e.message)
          .join(", ");
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, messages);
      }
      if (error instanceof HttpError) throw error;

      logger.error("Create user error: " + error.message, { error });
      throw new HttpError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Server error");
    }
  }

  static async updateUser(
    userId: string,
    updateData: Partial<UserData>
  ): Promise<IUser> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "ID không hợp lệ");
      }

      // Nếu update email hoặc username, kiểm tra không trùng
      if (updateData.email) {
        if (!validator.isEmail(updateData.email)) {
          throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Email không hợp lệ");
        }
        const exist = await User.findOne({
          email: updateData.email,
          _id: { $ne: userId },
        });
        if (exist) {
          throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Email đã tồn tại");
        }
      }
      if (updateData.username) {
        const exist = await User.findOne({
          username: updateData.username,
          _id: { $ne: userId },
        });
        if (exist) {
          throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Username đã tồn tại");
        }
      }

      // Nếu update password, kiểm tra độ dài
      if (updateData.password && updateData.password.length < 8) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "Mật khẩu phải ≥ 8 ký tự");
      }

      // Nếu updateData.date_of_birth có thể là string hoặc Date
      if (updateData.date_of_birth) {
        if (typeof updateData.date_of_birth === "string") {
          const dobParsed = new Date(updateData.date_of_birth);
          if (isNaN(dobParsed.getTime())) {
            throw new HttpError(
              HTTP_STATUS.BAD_REQUEST,
              "date_of_birth không hợp lệ"
            );
          }
          // Ép kiểu về Date
          (updateData as any).date_of_birth = dobParsed;
        } else if (!(updateData.date_of_birth instanceof Date)) {
          // Nếu không phải string và không phải Date, sai format
          throw new HttpError(
            HTTP_STATUS.BAD_REQUEST,
            "date_of_birth phải là chuỗi hoặc Date"
          );
        }
      }

      // Lấy user cũ để kiểm tra cloudinaryPublicId
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Người dùng không tồn tại");
      }

      // Nếu updateData.cloudinaryPublicId (tức Admin vừa upload avatar mới),
      // thì xóa avatar cũ trên Cloudinary (nếu có)
      if (
        updateData.cloudinaryPublicId &&
        existingUser.cloudinaryPublicId &&
        existingUser.cloudinaryPublicId !== updateData.cloudinaryPublicId
      ) {
        try {
          await cloudinary.uploader.destroy(existingUser.cloudinaryPublicId);
        } catch (destroyErr: any) {
          logger.error(
            `Không xóa được avatar cũ trên Cloudinary: ${destroyErr.message}`,
            { error: destroyErr }
          );
          // Không ném lỗi, vì không bắt buộc phải xóa thành công
        }
      }

      // Tiến hành cập nhật
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select(
        "_id name username email date_of_birth avatar bio link roles status created_at updated_at cloudinaryPublicId"
      );

      if (!updatedUser) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Người dùng không tồn tại");
      }
      return updatedUser;
    } catch (error: any) {
      // Xử lý ValidationError
      if (error instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(error.errors)
          .map((e: any) => e.message)
          .join(", ");
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, messages);
      }
      if (error instanceof HttpError) throw error;

      logger.error("Update user error: " + error.message, { error });
      throw new HttpError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Server error");
    }
  }

  // Xóa user (Admin)
  static async deleteUser(userId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new HttpError(HTTP_STATUS.BAD_REQUEST, "ID không hợp lệ");
      }
      const deleted = await User.findByIdAndDelete(userId);
      if (!deleted) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Người dùng không tồn tại");
      }
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      logger.error("Delete user error: " + error.message, { error });
      throw new HttpError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Server error");
    }
  }
  static async getAllUsers() {
    try {
      const users = await User.find({}).select(
        "_id avatar bio date_of_birth createdAt name username email roles status followers following link"
      );
      console.log("Raw users from MongoDB:", users);

      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          return {
            _id: user._id,
            date_of_birth: user.date_of_birth
              ? user.date_of_birth.toISOString()
              : null,
            avatar: user.avatar || "",
            bio: user.bio || "",
            link: user.link || "",
            createdAt: user.created_at,
            name: user.name || "",
            username: user.username || "",
            email: user.email || "",
            roles: user.roles || ["user"],
            status: user.status || "active",
          };
        })
      );

      console.log("Processed users:", usersWithStats);
      return usersWithStats;
    } catch (error: any) {
      logger.error(`Get all users service error: ${error.message}`, { error });
      throw new HttpError(500, "Không thể lấy danh sách người dùng");
    }
  }
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

  static async getTopUsers(limit: number = 10): Promise<
    Array<{
      _id: string;
      username: string;
      activityCount: number;
    }>
  > {
    try {
      // Tính tổng số bài đăng và bình luận
      console.log("Starting Thread and Comment aggregation");
      const userActivity = await Promise.all([
        Thread.aggregate([
          {
            $group: {
              _id: "$author", // Sửa từ userId thành author
              postCount: { $sum: 1 },
            },
          },
        ]).catch((err) => {
          console.error("Thread aggregation error:", err);
          return [];
        }),
        Comment.aggregate([
          {
            $group: {
              _id: "$user", // Sửa từ userId thành user
              commentCount: { $sum: 1 },
            },
          },
        ]).catch((err) => {
          console.error("Comment aggregation error:", err);
          return [];
        }),
      ]);

      console.log("User activity result:", userActivity);

      // Gộp dữ liệu hoạt động
      const activityMap = new Map<
        string,
        { postCount: number; commentCount: number }
      >();
      userActivity.forEach((activity, index) => {
        console.log(`Processing activity ${index}:`, activity);
        activity.forEach((item) => {
          if (!item._id) {
            console.warn("Invalid item in activity, skipping:", item);
            return;
          }
          const userId = item._id.toString();
          if (!activityMap.has(userId)) {
            activityMap.set(userId, { postCount: 0, commentCount: 0 });
          }
          const current = activityMap.get(userId)!;
          if (item.postCount) current.postCount += item.postCount;
          if (item.commentCount) current.commentCount += item.commentCount;
        });
      });

      // Kiểm tra nếu activityMap rỗng
      if (activityMap.size === 0) {
        console.log("No user activity found, returning empty topUsers");
        return [];
      }

      // Lấy thông tin người dùng
      const userIds = Array.from(activityMap.keys())
        .filter((id) => mongoose.Types.ObjectId.isValid(id)) // Lọc ObjectId hợp lệ
        .map((id) => new mongoose.Types.ObjectId(id));

      if (userIds.length === 0) {
        console.log("No valid user IDs found, returning empty topUsers");
        return [];
      }

      console.log("Fetching users with IDs:", userIds);
      const users = await User.find({ _id: { $in: userIds } }).select(
        "_id username"
      );

      console.log("Fetched users:", users);

      // Tạo danh sách top người dùng
      const topUsers = users
        .filter((user) => user.username !== undefined && user.username !== null)
        .map((user: IUser) => {
          const activity = activityMap.get(user._id.toString())!;
          const activityCount = activity.postCount + activity.commentCount;
          return {
            _id: user._id.toString(),
            username: user.username as string,
            activityCount,
          };
        })
        .sort((a, b) => b.activityCount - a.activityCount)
        .slice(0, limit);

      console.log("Returning topUsers:", topUsers);
      return topUsers;
    } catch (error: any) {
      logger.error(`Get top users service error: ${error.message}`, { error });
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
}
