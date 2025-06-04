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

// SVG Avatar mặc định cho Admin
const AdminAvatar = () => (
  <svg
    aria-label="Gens"
    fill="none"
    height="100%"
    role="img"
    viewBox="0 0 192 192"
    width="100%"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "40px", height: "40px" }}
  >
    <defs>
      <linearGradient id="gensGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "rgb(255, 221, 225)" }} />
        <stop offset="100%" style={{ stopColor: "rgb(29, 161, 242)" }} />
      </linearGradient>
    </defs>
    <path
      d="M50 70 Q 70 50 90 70 Q 110 90 90 110 Q 70 130 50 110 Q 30 90 50 70 M80 60 Q 100 40 120 60 Q 140 80 120 100 Q 100 120 80 100 Q 60 80 80 60"
      fill="url(#gensGradient)"
      stroke="#ffffff"
      strokeWidth={2}
      opacity={0.9}
      transform="translate(-40,-60) scale(1.5)"
    />
    <text
      x="60"
      y="150"
      fontFamily="Arial, sans-serif"
      fontSize={50}
      fontWeight="bold"
      fill="#1da1f2"
    >
      Gens
    </text>
  </svg>
);

const NotificationBar = () => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [notificationsError, setNotificationsError] = useState(null);

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

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications", auth.accessToken],
    queryFn: async () => {
      if (!auth.accessToken) {
        throw new Error("Không có token để xác thực");
      }
      const data = await fetchNotifications(auth.accessToken);
      return data || [];
    },
    enabled: !!auth.accessToken,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
    onError: (err) => {
      setNotificationsError(err.message || "Lỗi khi tải thông báo");
      queryClient.invalidateQueries(["notifications", auth.accessToken]);
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const markAsReadMutation = useMutation({
    mutationFn: ({ notificationId }) =>
      markNotificationAsRead(notificationId, auth.accessToken),
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData(
        ["notifications", auth.accessToken],
        (old) =>
          old?.map((notif) =>
            notif._id === updatedNotification._id ? updatedNotification : notif
          ) || []
      );
    },
    onError: (error) => {
      console.error("Error marking notification as read:", error.message);
      setNotificationsError("Không thể đánh dấu thông báo là đã đọc.");
    },
  });

  const handleNotificationClick = useCallback(
    (notification) => {
      if (!notification?._id || typeof notification._id !== "string") {
        console.error("Invalid notification ID:", notification?._id);
        return;
      }
      if (!notification.isRead) {
        markAsReadMutation.mutate({ notificationId: notification._id });
      }
    },
    [markAsReadMutation]
  );

  if (isLoading) {
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
      <div className="main-content">
        <Sidebar unreadCount={unreadCount} />
        <div className="flex justify-center min-h-screen w-full">
          <div className="bg-gray-100 p-4 w-[1000px]">
            <div className="text-center flex flex-col mb-2">
              <span className="font-semibold text-base leading-5">
                Thông báo
              </span>
            </div>
            <div className="notification-container w-full px-5">
              {notifications.map((notification) => {
                let linkTo = "#";
                if (
                  notification.type === "new_post" &&
                  notification.relatedPost?._id
                ) {
                  linkTo = `/post/${notification.relatedPost._id}`;
                } else if (
                  notification.type === "comment" &&
                  notification.relatedPost?._id &&
                  notification.relatedComment
                ) {
                  linkTo = `/post/${notification.relatedPost._id}?commentId=${notification.relatedComment}`;
                } else if (
                  notification.type === "reply" &&
                  notification.relatedPost?._id &&
                  notification.relatedComment // Sử dụng relatedComment thay vì relatedReply
                ) {
                  linkTo = `/post/${notification.relatedPost._id}?replyId=${notification.relatedComment}`;
                } else if (
                  notification.type === "like" &&
                  notification.relatedPost?._id
                ) {
                  linkTo = `/post/${notification.relatedPost._id}`;
                } else if (
                  notification.type === "follow" &&
                  notification.relatedUser?._id
                ) {
                  linkTo = `/profile/${notification.relatedUser._id}`;
                } else if (
                  notification.type === "like_comment" &&
                  notification.relatedPost?._id &&
                  notification.relatedComment
                ) {
                  linkTo = `/post/${notification.relatedPost._id}?commentId=${notification.relatedComment}`;
                } else if (
                  notification.type === "like_reply" &&
                  notification.relatedPost?._id &&
                  notification.relatedComment // Sử dụng relatedComment thay vì relatedReply
                ) {
                  linkTo = `/post/${notification.relatedPost._id}?replyId=${notification.relatedComment}`;
                }

                // Kiểm tra dữ liệu liên quan trước khi render
                const isValidLink =
                  linkTo !== "#" &&
                  ((notification.relatedPost?._id &&
                    (notification.type === "new_post" ||
                      notification.type === "like" ||
                      (notification.type === "comment" &&
                        notification.relatedComment) ||
                      (notification.type === "reply" &&
                        notification.relatedComment) || // Sử dụng relatedComment thay vì relatedReply
                      (notification.type === "like_comment" &&
                        notification.relatedComment) ||
                      (notification.type === "like_reply" &&
                        notification.relatedComment))) || // Sử dụng relatedComment thay vì relatedReply
                    (notification.type === "follow" &&
                      notification.relatedUser?._id));

                // Sử dụng avatar và username mặc định cho thông báo từ admin (post_deleted)
                const isAdminNotification =
                  notification.type === "post_deleted";
                const displayUsername = isAdminNotification
                  ? "Gens"
                  : notification.relatedUser?.username || "Không xác định";
                const displayAvatar = isAdminNotification ? (
                  <AdminAvatar />
                ) : (
                  <Avatar
                    _id={notification.relatedUser?._id || ""}
                    avatarUrl={notification.relatedUser?.avatar || ""}
                    size={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                );

                return (
                  <Link
                    key={notification._id}
                    to={isValidLink ? linkTo : "#"}
                    onClick={() => handleNotificationClick(notification)}
                    className={!isValidLink ? "pointer-events-none" : ""}
                  >
                    <div
                      className={`posts-content bg-white p-4 rounded-lg shadow mb-4 ${
                        !notification.isRead ? "bg-blue-50" : ""
                      } ${
                        isAdminNotification ? "border-l-4 border-red-500" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3 mb-2">
                        {displayAvatar}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Link
                              to={
                                !isAdminNotification &&
                                notification.relatedUser?._id
                                  ? `/profile/${notification.relatedUser._id}`
                                  : "#"
                              }
                              className={`font-bold text-sm ${
                                !isAdminNotification &&
                                notification.relatedUser?._id
                                  ? "hover:underline"
                                  : "pointer-events-none"
                              }`}
                            >
                              {displayUsername}
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
                          {!isValidLink && !isAdminNotification && (
                            <p className="text-red-500 text-xs mt-1">
                              Dữ liệu liên quan không hợp lệ
                            </p>
                          )}
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
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBar;
