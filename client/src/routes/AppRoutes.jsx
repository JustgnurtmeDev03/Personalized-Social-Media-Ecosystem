import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home/home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register.jsx";
import ProtectedRoute from "./ProtectedRoute";
import Search from "../pages/Search/Search";
import Activity from "../pages/Activity/Activity";
import Profile from "../pages/Profile/Profile";
import LoginLayout from "../layouts/LoginLayout";
import ForgotPassword from "../pages/ForgotPassword/ForgotPasswordMain";
import { ModalProvider } from "../providers/ModalContext";

const AUTO_LOGOUT_TIME = 60 * 60 * 1000; // 60 phút

const AppRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("accessToken")
  );
  // Kiểm tra token khi mở lại web
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      const isTokenExpired = (accessToken) => {
        try {
          const base64Url = accessToken.split(".")[1]; // Lấy phần payload
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/"); // Chuyển đổi Base64URL thành Base64
          const decoded = JSON.parse(atob(base64)); // Giải mã Base64
          const currentTime = Date.now() / 1000;
          return decoded.exp < currentTime;
        } catch (error) {
          console.error("Invalid token:", error);
          return true;
        }
      };

      if (isTokenExpired(accessToken)) {
        logout(); // Xóa token nếu hết hạn
      }
    }
  }, []);
  // Hàm đăng xuất

  const logout = () => {
    localStorage.removeItem("accessToken");
    setIsAuthenticated(null);
    window.location.href = "/login";
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem("accessToken"));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let logoutTimer;
    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(logout, AUTO_LOGOUT_TIME);
    };

    // Lắng nghe các sự kiện của người dùng để reset thời gian logout
    const events = ["mousemove", "keydown", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // Khởi động bộ đếm ngay từ đầu

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return (
    <ModalProvider>
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        {/* <Route path="/login" element={<Login />} /> */}

        <Route
          path="/home"
          element={
            <ProtectedRoute
              element={Home}
              isAuthenticated={!!isAuthenticated}
            />
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute
              element={Profile}
              isAuthenticated={!!isAuthenticated}
            />
          }
        />
        <Route path="/search" element={<Search />} />
        <Route path="/activity" element={<Activity />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/home" />
            ) : (
              <LoginLayout>
                <Login setIsAuthenticated={setIsAuthenticated} />
              </LoginLayout>
            )
          }
        />
        <Route path="/activity" element={<Activity />} />
        <Route
          path="/register"
          element={
            <LoginLayout>
              <Register />
            </LoginLayout>
          }
        />
        <Route
          path="/forget-password"
          element={
            <LoginLayout>
              <ForgotPassword />
            </LoginLayout>
          }
        />
      </Routes>
    </ModalProvider>
  );
};

export default AppRoutes;
