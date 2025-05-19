import mongoose, { Document, Schema } from "mongoose";

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId;
  followeeId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FollowSchema: Schema<IFollow> = new Schema(
  {
    followerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    followeeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Đảm bảo mỗi cặp followerId - followeeId là duy nhất
FollowSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });

const Follow = mongoose.model<IFollow>("Follow", FollowSchema);

export default Follow;
