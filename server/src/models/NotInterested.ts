import { Schema, model } from "mongoose";

const notInterestedSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  postId: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const NotInterested = model("NotInterested", notInterestedSchema);
