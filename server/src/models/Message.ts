import { Schema, Types, model } from "mongoose";

interface IMessage {
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  type: "text" | "image" | "gif" | "sticker";
  content: string;
  replyTo?: Types.ObjectId; // Trường mới để lưu tin nhắn gốc khi reply
  reactions: { user: Types.ObjectId; reaction: string }[]; // Trường mới để lưu reactions
  createdAt: Date;
  isRead: boolean;
}

const messageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["text", "image", "gif", "sticker"],
    required: true,
  },
  content: { type: String, required: true },
  replyTo: { type: Schema.Types.ObjectId, ref: "Message" }, // Liên kết đến tin nhắn gốc
  reactions: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      reaction: { type: String, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

const Message = model<IMessage>("Message", messageSchema);
export default Message;
