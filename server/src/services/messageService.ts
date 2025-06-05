import Message from "../models/Message"; // Giả sử bạn đã có model Message
import { Types } from "mongoose";

export class MessageService {
  // Gửi tin nhắn
  static async sendMessage(
    senderId: string,
    recipientId: string,
    type: "text" | "image" | "gif" | "sticker",
    content: string,
    replyToId?: string
  ): Promise<any> {
    try {
      if (!senderId || !recipientId || !type || !content) {
        throw new Error(
          "Missing required fields: senderId, recipientId, type, or content"
        );
      }

      if (
        !Types.ObjectId.isValid(senderId) ||
        !Types.ObjectId.isValid(recipientId)
      ) {
        throw new Error("Invalid senderId or recipientId format");
      }

      let replyToMessage = null;
      if (replyToId) {
        if (!Types.ObjectId.isValid(replyToId)) {
          throw new Error("Invalid replyToId format");
        }
        replyToMessage = await Message.findById(replyToId);
        if (!replyToMessage) {
          throw new Error(`Reply message with ID ${replyToId} not found`);
        }
      }

      const message = new Message({
        sender: new Types.ObjectId(senderId),
        recipient: new Types.ObjectId(recipientId),
        type,
        content,
        replyTo: replyToId ? new Types.ObjectId(replyToId) : null,
        reactions: [],
      });

      await message.save();

      // Populate thông tin trước khi trả về
      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "username avatar")
        .populate("recipient", "username avatar")
        .populate("replyTo", "content sender");

      return populatedMessage;
    } catch (error: any) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Lấy lịch sử tin nhắn giữa hai người dùng
  static async getMessages(
    userId: string,
    currentUserId: string
  ): Promise<any[]> {
    try {
      if (!userId || !currentUserId) {
        throw new Error("Missing required fields: userId or currentUserId");
      }

      if (
        !Types.ObjectId.isValid(userId) ||
        !Types.ObjectId.isValid(currentUserId)
      ) {
        throw new Error("Invalid userId or currentUserId format");
      }

      const messages = await Message.find({
        $or: [
          { sender: currentUserId, recipient: userId },
          { sender: userId, recipient: currentUserId },
        ],
      })
        .sort({ createdAt: 1 })
        .populate("sender", "username avatar")
        .populate("recipient", "username avatar")
        .populate("replyTo", "content sender");

      return messages;
    } catch (error: any) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }

  // Đánh dấu tin nhắn là đã đọc
  static async markMessagesAsRead(
    senderId: string,
    recipientId: string
  ): Promise<void> {
    try {
      if (!senderId || !recipientId) {
        throw new Error("Missing required fields: senderId or recipientId");
      }

      if (
        !Types.ObjectId.isValid(senderId) ||
        !Types.ObjectId.isValid(recipientId)
      ) {
        throw new Error("Invalid senderId or recipientId format");
      }

      await Message.updateMany(
        { sender: senderId, recipient: recipientId, isRead: false },
        { $set: { isRead: true } }
      );
    } catch (error: any) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  // Thêm biểu cảm (reaction) cho tin nhắn
  static async addReaction(
    messageId: string,
    userId: string,
    reaction: string
  ): Promise<any> {
    try {
      if (!messageId || !userId || !reaction) {
        throw new Error(
          "Missing required fields: messageId, userId, or reaction"
        );
      }

      if (
        !Types.ObjectId.isValid(messageId) ||
        !Types.ObjectId.isValid(userId)
      ) {
        throw new Error("Invalid messageId or userId format");
      }

      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error(`Message with ID ${messageId} not found`);
      }

      // Kiểm tra xem user đã thả reaction này chưa
      const existingReaction = message.reactions.find(
        (r: any) => r.user.toString() === userId
      );

      if (existingReaction) {
        // Nếu đã có reaction, cập nhật reaction mới
        existingReaction.reaction = reaction;
      } else {
        // Nếu chưa có, thêm reaction mới
        message.reactions.push({ user: new Types.ObjectId(userId), reaction });
      }

      await message.save();

      // Populate thông tin sau khi cập nhật
      const updatedMessage = await Message.findById(messageId)
        .populate("sender", "username avatar")
        .populate("recipient", "username avatar")
        .populate("replyTo", "content sender");

      return updatedMessage;
    } catch (error: any) {
      throw new Error(`Failed to add reaction: ${error.message}`);
    }
  }
}
