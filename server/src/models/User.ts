import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { config } from "dotenv";
import { RefreshToken } from "./RefreshToken";
config();

// Định nghĩa giao diện cho token

interface IToken {
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
}

// Định nghĩa các giá trị hợp lệ cho vai trò và trạng thái tài khoản
const ROLES = {
  TOPADMIN: "Top admin",
  ADMIN: "admin",
  USER: "user",
  MODERATOR: "Moderator",
} as const;

const ACCOUNTS_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];
type AccountStatus = (typeof ACCOUNTS_STATUS)[keyof typeof ACCOUNTS_STATUS];

// Định nghĩa giao diện cho người dùng

export interface IUser extends Document {
  name: string;
  username?: string;
  email: string;
  password: string;
  date_of_birth?: Date;
  avatar?: string;
  bio?: string;
  link?: string;
  created_at?: Date;
  updated_at?: Date;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  posts: mongoose.Types.ObjectId[];
  tokenVersion: number;
  cloudinaryPublicId: string;
  roles: Role[];
  status: AccountStatus;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
  generateAuthTokens(): Promise<{ accessToken: string; refreshToken: string }>;
  invalidateTokens(): Promise<void>;
}

interface IUserModel extends Model<IUser> {
  findByCredentials(email: string, password: string): Promise<IUser>;
}

// Định nghĩa schema cho token

const tokenSchema: Schema<IToken> = new Schema({
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Định nghĩa schema cho người dùng
const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    username: {
      type: String,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      validate: {
        validator: function (value: string) {
          // Kiểm tra username có bắt đầu bằng '@' và chỉ chứa ký tự hợp lệ
          return /^@[a-zA-Z0-9_]{2,29}$/.test(value);
        },
        message: (props) =>
          `Username phải bắt đầu bằng '@' và chỉ chứa chữ cái, số, gạch dưới, dài từ 3 đến 30 ký tự.`,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email format");
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      trim: true,
    },
    date_of_birth: {
      type: Date,
      required: true, // Bắt buộc phải có giá trị cho trường này
    },
    created_at: {
      type: Date,
      default: Date.now, // Gán mặc định là thời gian hiện tại khi tạo mới tài liệu
    },
    updated_at: {
      type: Date,
      default: Date.now, // Gán mặc định là thời gian hiện tại khi tạo mới tài liệu
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 200,
    },
    link: {
      type: String,
      validate(value: string) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid URL");
        }
      },
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    /*tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],*/
    tokenVersion: {
      type: Number,
      default: 0,
    },
    cloudinaryPublicId: { type: String, default: "" },
    roles: {
      type: [String],
      required: true,
      default: [ROLES.USER],
      enum: Object.values(ROLES),
      validate: {
        validator: (roles: string[]) => roles.length > 0,
        message: "User must have at least one role",
      },
    },
    status: {
      type: String,
      required: true,
      default: ACCOUNTS_STATUS.PENDING,
      enum: Object.values(ACCOUNTS_STATUS),
    },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationTokenExpires: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Hash mật khẩu trước khi lưu người dùng
userSchema.pre<IUser>("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  if (this.emailVerified && this.status === "pending") {
    this.status = "active";
  }
  next();
});

// Tạo Access Token và Refresh Token xác thực cho người dùng

userSchema.methods.generateAuthTokens = async function (): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const user = this;
  // Tạo Access Token
  const accessToken = jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
  );

  // Tạo Refresh Token
  const refreshToken = jwt.sign(
    {
      id: user._id.toString(),
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION,
    }
  );

  //Lưu Refresh Token vào collection riêng biệt
  const tokenDoc = new RefreshToken({
    userId: user.id,
    refreshToken,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
    tokenVersion: user.tokenVersion,
  });

  await tokenDoc.save();

  return { accessToken, refreshToken };
};

// Tăng phiên bản tokenVersion

userSchema.methods.invalidateTokens = async function (): Promise<void> {
  this.tokenVersion += 1;
  await this.save();

  // Xoá tất cả các refreshToken cũ từ collection RefreshToken
  await RefreshToken.deleteMany({ userId: this.id });
};

// Xác thực Refresh Token

// Tìm người dùng bằng thông tin đăng nhập

userSchema.statics.findByCredentials = async (
  email: string,
  password: string
): Promise<IUser> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Login is Unsuccessful");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Login is Unsuccessful");
  }

  return user;
};

const User = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
