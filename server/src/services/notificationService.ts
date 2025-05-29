import { HttpError } from "~/utils/httpError";
import { Notification } from "../models/Notification";
import logger from "../utils/logger";
import HTTP_STATUS from "~/constants/httpStatus";

export class NotificationService {
  static async createNotification(
    recipientId: string,
    type: string,
    content: string,
    relatedUserId?: string,
    relatedPostId?: string,
    relatedCommentId?: string
  ): Promise<void> {
    try {
      const notification = new Notification({
        recipient: recipientId,
        type,
        content,
        relatedUser: relatedUserId,
        relatedPost: relatedPostId,
        relatedComment: relatedCommentId,
      });
      await notification.save();
    } catch (error: any) {
      logger.error(`Create notification error: ${error.message}`, { error });
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  static async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .populate("relatedUser", "username avatar")
        .populate("relatedPost", "content")
        .lean();
      return notifications;
    } catch (error: any) {
      logger.error(`Get notifications error: ${error.message}`, { error });
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<any> {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId,
      });
      if (!notification) {
        throw new HttpError(HTTP_STATUS.NOT_FOUND, "Notification not found");
      }
      notification.isRead = true;
      await notification.save();
      return notification;
    } catch (error: any) {
      logger.error(`Mark notification as read error: ${error.message}`, {
        error,
      });
      throw new HttpError(
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.message || "Internal server error"
      );
    }
  }
}
