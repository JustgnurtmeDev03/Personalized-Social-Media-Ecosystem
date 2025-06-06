import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  type: "text" | "image" | "gif" | "sticker";
  content: string;
  replyTo?: mongoose.Types.ObjectId;
  reactions: { user: mongoose.Types.ObjectId; reaction: string }[];
  isRead: boolean;
  createdAt: Date;
  recalled: boolean; // ← đánh dấu tin nhắn đã bị thu hồi
}

const MessageSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["text", "image", "gif", "sticker"],
    required: true,
  },
  content: { type: String, required: true },
  replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
  reactions: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      reaction: { type: String },
    },
  ],
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  recalled: { type: Boolean, default: false },
});

export default mongoose.model<IMessage>("Message", MessageSchema);
