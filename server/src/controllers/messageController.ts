import { Response, NextFunction } from "express";
import asyncHandler from "~/middlewares/asyncHandler";
import { MessageService } from "../services/messageService";
import cloudinary from "../config/cloudinary";
import { AuthenticatedRequest } from "~/middlewares/auth";
import Message from "~/models/Message";

// Gửi tin nhắn
export const sendMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const io = req.app.get("io");
    const { recipientId, type, content, replyTo } = req.body;
    const senderId = (req as any).user.id;

    if (!recipientId || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let messageContent: string;
    if (type === "image") {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const result = await cloudinary.uploader.upload(req.file.path);
      messageContent = result.secure_url;
    } else {
      messageContent = content;
      if (!messageContent) {
        return res.status(400).json({ message: "Content is required" });
      }
    }

    const message = await MessageService.sendMessage(
      senderId,
      recipientId,
      type,
      messageContent,
      replyTo
    );

    // Không cần populate lại vì MessageService đã làm việc này
    io.to(recipientId).emit("newMessage", message);
    res.status(201).json(message);
  }
);

// Lấy danh sách tin nhắn
export const getMessages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    const currentUserId = (req as any).user.id;

    const messages = await MessageService.getMessages(userId, currentUserId);
    res.json(messages);
  }
);

// Đánh dấu tin nhắn là đã đọc
export const markAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const senderId = req.params.userId;
    const recipientId = (req as any).user.id;

    await MessageService.markMessagesAsRead(senderId, recipientId);
    res.json({ message: "Messages marked as read" });
  }
);

// Thêm biểu cảm (reaction) cho tin nhắn
export const addReaction = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { messageId, reaction } = req.body;
    const userId = (req as any).user.id;

    if (!messageId || !reaction) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const updatedMessage = await MessageService.addReaction(
      messageId,
      userId,
      reaction
    );

    res.json(updatedMessage);
  }
);

// Lấy danh sách hội thoại
export const getConversations = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const currentUserId = (req as any).user.id;

    const conversations = await MessageService.getConversations(currentUserId);
    res.json(conversations);
  }
);

export const recallMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const io = req.app.get("io");
    const { messageId } = req.body;
    const userId = (req as any).user.id; // id người yêu cầu thu hồi

    if (!messageId) {
      return res.status(400).json({ message: "Missing messageId" });
    }

    // 1. Tìm tin nhắn trong DB
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // 2. Chỉ cho phép sender thu hồi
    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to recall this message" });
    }

    // 3. Cập nhật lại content và đánh dấu đã thu hồi
    message.content = "Tin nhắn đã được thu hồi";
    message.recalled = true;
    await message.save();

    io.to(message.sender.toString()).emit("messageRecalled", { messageId });
    io.to(message.recipient.toString()).emit("messageRecalled", { messageId });

    return res.json({ message: "Message recalled successfully" });
  }
);
