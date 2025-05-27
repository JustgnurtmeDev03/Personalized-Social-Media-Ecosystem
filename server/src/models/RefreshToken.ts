import mongoose, { Schema, Document } from "mongoose";

interface IRefreshToken extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
  tokenVersion: number;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  tokenVersion: {
    type: Number,
    required: true,
  },
});

export const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema
);
