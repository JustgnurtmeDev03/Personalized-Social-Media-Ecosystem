import * as React from "react";
import axios from "axios";

const { useState, useEffect } = React;

const useAuthToken = () => {
  const [accessToken, setAccessToken] = useState(null);

  const getAccessToken = () => accessToken;

  const isTokenExpired = (token) => {
    if (!token || token.split(".").length < 3) return true;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(base64));
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("Lỗi khi decode token:", error);
      return true;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/refresh-token",
        {},
        { withCredentials: true }
      );
      const { accessToken: newAccessToken } = response.data;
      setAccessToken(newAccessToken);
      localStorage.setItem("accessToken", newAccessToken);
      return newAccessToken; // ✅ Trả về accessToken mới
    } catch (error) {
      console.error("Failed to refresh token", error);
      return null; // ✅ Trả về null nếu refresh không thành công
    }
  };

  const checkTokenExpiration = () => {
    const token = getAccessToken();
    if (token && isTokenExpired(token)) {
      refreshToken();
    }
  };

  const getValidAccessToken = async () => {
    let token = accessToken || localStorage.getItem("accessToken");
    if (!token || isTokenExpired(token)) {
      token = await refreshToken();
    }
    return token;
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setAccessToken(storedToken);
    }
    const intervalId = setInterval(checkTokenExpiration, 1 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return { accessToken, setAccessToken, getValidAccessToken };
};

export default useAuthToken;
