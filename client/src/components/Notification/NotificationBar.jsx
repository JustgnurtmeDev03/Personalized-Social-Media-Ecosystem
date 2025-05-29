import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "../../styles/Post.css";
import Avatar from "../../assets/Avatar";
import { Loading } from "../Loading/Loading";
import { useAuth } from "../../providers/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  markNotificationAsRead,
} from "../../services/notificationService";
import Sidebar from "../Sidebar/sidebar";

const POLLING_INTERVAL = 30000;

const NotificationBar = () => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState(null);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0); // Thêm state để đếm thông báo chưa đọc

  const formatNotificationTime = useCallback((createdAt) => {
    try {
      const now = new Date();
      const notificationTime = new Date(createdAt);
      const diffMs = now - notificationTime;

      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (minutes < 1) return "Vừa xong";
      if (minutes < 60) return `${minutes} phút trước`;
      if (hours < 24) return `${hours} giờ trước`;
      if (days < 7) return `${days} ngày trước`;

      const day = notificationTime.getDate().toString().padStart(2, "0");
      const month = (notificationTime.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const year = notificationTime.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "Không xác định";
    }
  }, []);

  const { isLoading, error } = useQuery({
    queryKey: ["notifications", auth.accessToken],
    queryFn: async () => {
      if (!auth.accessToken) {
        throw new Error("Không có token để xác thực");
      }
      const notifications = await fetchNotifications(auth.accessToken);
      setNotifications(notifications);
      setNotificationsLoading(false);
      // Cập nhật số lượng thông báo chưa đọc
      const unread = notifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
      return notifications;
    },
    enabled: !!auth.accessToken,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
    onError: () => {
      queryClient.invalidateQueries(["notifications", auth.accessToken]);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ notificationId }) =>
      markNotificationAsRead(notificationId, auth.accessToken),
    onSuccess: (updatedNotification) => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === updatedNotification._id ? updatedNotification : notif
        )
      );
      queryClient.setQueryData(["notifications", auth.accessToken], (old) =>
        old.map((notif) =>
          notif._id === updatedNotification._id ? updatedNotification : notif
        )
      );
      // Cập nhật lại số lượng thông báo chưa đọc
      const unread = notifications.filter((n) => !n.isRead).length - 1;
      setUnreadCount(unread >= 0 ? unread : 0);
    },
    onError: (error) => {
      console.error("Error marking notification as read:", error.message);
      setNotificationsError("Không thể đánh dấu thông báo là đã đọc.");
    },
  });

  const handleNotificationClick = useCallback(
    (notification) => {
      if (!notification._id || typeof notification._id !== "string") {
        console.error("Invalid notification ID:", notification._id);
        return;
      }
      if (!notification.isRead) {
        markAsReadMutation.mutate({ notificationId: notification._id });
      }
    },
    [markAsReadMutation]
  );

  useEffect(() => {
    return () => {};
  }, []);

  if (notificationsLoading || isLoading) {
    return <Loading />;
  }

  if (notificationsError || error) {
    return (
      <p className="text-center text-red-500">
        {notificationsError || "Lỗi khi tải thông báo"}
      </p>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <p className="text-center text-gray-500">
        Không có thông báo nào để hiển thị.
      </p>
    );
  }

  return (
    <div className="App">
      <body>
        <div className="main-content">
          <Sidebar unreadCount={unreadCount} />{" "}
          {/* Truyền unreadCount vào Sidebar */}
          <div className=" flex justify-center  min-h-screen w-full">
            <div className="bg-gray-100 p-4 w-[1000px]">
              <div className="text-center flex flex-col mb-2">
                <span className="font-semibold text-base leading-5">
                  Thông báo
                </span>
              </div>
              <div className="notification-container w-full px-5">
                {notifications.map((notification) => (
                  <Link
                    key={notification._id}
                    to={
                      notification.type === "new_post" ||
                      notification.type === "like" ||
                      notification.type === "comment" ||
                      notification.type === "reply"
                        ? `/post/${
                            typeof notification.relatedPost === "object"
                              ? notification.relatedPost._id
                              : notification.relatedPost
                          }`
                        : `/profile/${
                            typeof notification.relatedUser === "object"
                              ? notification.relatedUser._id
                              : notification.relatedUser
                          }`
                    }
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={`posts-content bg-white p-4 rounded-lg shadow mb-4 ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3 mb-2">
                        <Avatar
                          _id={notification.relatedUser?._id || ""}
                          avatarUrl={notification.relatedUser?.avatar || ""}
                          size={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Link
                              to={`/profile/${
                                notification.relatedUser?._id || ""
                              }`}
                              className="font-bold text-sm hover:underline"
                            >
                              {notification.relatedUser?.username ||
                                "Không xác định"}
                            </Link>
                            <span className="text-gray-500 text-xs">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <span className="text-blue-500 text-xs font-semibold">
                                Mới
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-6">
                            {notification.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-gray-500 text-sm mt-2">
                        <button className="hover:text-black">
                          <i className="far fa-heart"></i>
                          <span className="ml-1">0</span>
                        </button>
                        <button className="hover:text-black">
                          <i className="far fa-comment"></i>
                          <span className="ml-1">0</span>
                        </button>
                        <button className="hover:text-black">
                          <i className="fas fa-retweet"></i>
                          <span className="ml-1">0</span>
                        </button>
                        <button className="hover:text-black">
                          <i className="far fa-paper-plane"></i>
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </body>
    </div>
  );
};

export default NotificationBar;
