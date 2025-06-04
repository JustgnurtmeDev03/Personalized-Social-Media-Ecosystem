import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["follow", "like", "comment", "reply", "new_post", "post_deleted"],
    required: true,
  },
  content: { type: String, required: true },
  relatedUser: { type: Schema.Types.ObjectId, ref: "User" },
  relatedPost: { type: Schema.Types.ObjectId, ref: "Thread" },
  relatedComment: { type: Schema.Types.ObjectId, ref: "Comment" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Notification = model("Notification", notificationSchema);
