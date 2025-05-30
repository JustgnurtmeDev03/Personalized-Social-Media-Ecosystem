import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/sidebar";
import Feed from "../../components/Feed/feed";
import { Loading } from "../../components/Loading/Loading";
import "../../styles/Main.css";
import { useAuth } from "../../providers/AuthContext";
import { Navigate } from "react-router-dom";
import { fetchNotifications } from "../../services/notificationService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import images from "../../assets/loadImage";

const POLLING_INTERVAL = 30000;
const Home = () => {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const [notificationsError, setNotificationsError] = useState(null);

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
      return data || []; // Đảm bảo luôn trả về mảng, tránh null
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

  useEffect(() => {
    if (!auth.accessToken) return; // Ngăn gọi setTimeout nếu chưa đăng nhập
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [auth.accessToken]);

  if (!auth.accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <Loading />;
  }
  return (
    <div className="App">
      <body>
        <div className="main-content">
          <Sidebar unreadCount={unreadCount} />
          <div className="new-feeds">
            <Feed />
          </div>
        </div>
      </body>
    </div>
  );
};

export default Home;
