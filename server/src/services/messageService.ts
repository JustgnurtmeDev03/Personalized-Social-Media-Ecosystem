import Message, { IMessage } from "../models/Message"; // Giả sử bạn đã có model Message
import { Types, HydratedDocument } from "mongoose";

type MessageDocument = HydratedDocument<IMessage>;

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
  ): Promise<MessageDocument[]> {
    console.log(
      "getMessages called with userId:",
      userId,
      "currentUserId:",
      currentUserId
    );
    if (!userId || !currentUserId) {
      throw new Error("Missing required fields: userId or currentUserId");
    }

    if (!Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId format:", userId);
      throw new Error("Invalid userId format");
    }

    if (!Types.ObjectId.isValid(currentUserId)) {
      console.error("Invalid currentUserId format:", currentUserId);
      throw new Error("Invalid currentUserId format");
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "username avatar name")
      .populate("recipient", "username avatar name")
      .populate("replyTo", "content sender");

    console.log("Messages found:", messages.length);
    return messages;
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

  // Lấy danh sách hội thoại
  static async getConversations(currentUserId: string): Promise<any[]> {
    try {
      if (!currentUserId) {
        throw new Error("Missing required field: currentUserId");
      }

      if (!Types.ObjectId.isValid(currentUserId)) {
        throw new Error("Invalid currentUserId format");
      }

      // Tìm tất cả tin nhắn liên quan đến người dùng hiện tại
      const messages = await Message.find({
        $or: [{ sender: currentUserId }, { recipient: currentUserId }],
      })
        .sort({ createdAt: -1 })
        .populate("sender", "name username avatar")
        .populate("recipient", "name username avatar");

      // Nhóm tin nhắn theo người nhận/gửi để tạo hội thoại
      const conversationMap = new Map<string, any>();

      for (const message of messages) {
        const otherUserId =
          message.sender._id.toString() === currentUserId
            ? message.recipient._id.toString()
            : message.sender._id.toString();
        const otherUser =
          message.sender._id.toString() === currentUserId
            ? message.recipient
            : message.sender;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            user: otherUser,
            lastMessage: message,
            messages: [message],
          });
        } else {
          const existing = conversationMap.get(otherUserId);
          existing.messages.push(message);
          if (
            new Date(message.createdAt) >
            new Date(existing.lastMessage.createdAt)
          ) {
            existing.lastMessage = message;
          }
        }
      }

      // Tính số tin nhắn chưa đọc và định dạng dữ liệu trả về
      const conversations = Array.from(conversationMap.values()).map((conv) => {
        const unreadCount = conv.messages.filter(
          (msg: any) =>
            msg.sender._id.toString() !== currentUserId && !msg.isRead
        ).length;

        return {
          user: {
            _id: conv.user._id,
            name: conv.user.name,
            username: conv.user.username,
            avatar: conv.user.avatar,
          },
          lastMessage: {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt,
          },
          unreadCount,
        };
      });

      // Sắp xếp hội thoại theo thời gian tin nhắn cuối cùng (mới nhất trước)
      conversations.sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
      );

      return conversations;
    } catch (error: any) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }
  }
}
