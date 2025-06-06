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

interface UserWithUsername {
  _id: Types.ObjectId;
  username: string;
}

interface UserData {
  name: string;
  username: string;
  email: string;
  password: string;
  roles?: string[];
  status?: string;
  bio?: string;
  avatar?: string;
  date_of_birth?: string;
}

export class UserService {
  static async createUser(userData: UserData): Promise<IUser> {
    try {
      // Log dữ liệu nhận được
      console.log("UserService received userData:", userData);

      // Validate dữ liệu cơ bản
      if (!validator.isEmail(userData.email)) {
        throw new HttpError(400, "Email không hợp lệ");
      }
      if (userData.password && userData.password.length < 8) {
        throw new HttpError(400, "Mật khẩu phải dài ít nhất 8 ký tự");
      }

      // Đảm bảo các trường không bắt buộc có giá trị mặc định
      userData.avatar = userData.avatar || "";
      userData.bio = userData.bio || "";
      userData.roles = Array.isArray(userData.roles)
        ? userData.roles
        : ["user"];
      userData.status = userData.status || "active";

      const newUser = new User(userData);
      await newUser.save();
      return newUser;
    } catch (error: unknown) {
      const err = error as Error | mongoose.Error.ValidationError;

      // Kiểm tra ValidationError của Mongoose
      if (err instanceof mongoose.Error.ValidationError) {
        const messages = Object.keys(err.errors).map((field) => {
          const errorMessage = err.errors[field].message;
          return `${field}: ${errorMessage}`;
        });
        logger.error(`Create user validation error: ${messages.join(", ")}`, {
          error,
        });
        throw new HttpError(400, messages.join(", "));
      }

      // Xử lý các lỗi khác
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      logger.error(`Create user service error: ${message}`, { error });
      throw new HttpError(500, message || "Không thể tạo người dùng mới");
    }
  }
  static async updateUser(userId: string, updateData: any): Promise<any> {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true, // Trả về document đã cập nhật
        runValidators: true, // Chạy các validation trong schema
      });
      if (!user) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Người dùng không tồn tại");
      }
      return user;
    } catch (error: any) {
      logger.error(`Update user service error: ${error.message}`, { error });
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Không thể cập nhật người dùng"
      );
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
