import { Schema, model } from "mongoose";

const reportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  postId: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Report = model("Report", reportSchema);
