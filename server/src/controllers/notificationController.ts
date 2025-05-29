import { Request, Response, NextFunction } from "express";
import HTTP_STATUS from "~/constants/httpStatus";
import asyncHandler from "~/middlewares/asyncHandler";
import { AuthenticatedRequest } from "~/middlewares/auth";
import { NotificationService } from "~/services/notificationService";

export const getNotifications = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notifications = await NotificationService.getUserNotifications(
        req.user._id
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ error: "Failed to fetch notifications" });
    }
  }
);

export const markNotificationAsRead = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const notification = await NotificationService.markAsRead(
        notificationId,
        req.user._id
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        notification,
      });
    } catch (error: any) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ error: "Failed to mark notification as read" });
    }
  }
);
