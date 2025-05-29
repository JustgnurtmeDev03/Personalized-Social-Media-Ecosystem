import axios from "axios";

const API_URL = "http://localhost:5000/api/notifications";

export const fetchNotifications = async (accessToken) => {
  try {
    const res = await axios.get(`${API_URL}/get-notify`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Kiểm tra dữ liệu trả về
    if (res.data && Array.isArray(res.data.notifications)) {
      return res.data.notifications;
    } else {
      throw new Error(
        "Invalid response format: Expected 'notifications' array"
      );
    }
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId, accessToken) => {
  try {
    const res = await axios.put(
      `${API_URL}/${notificationId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return res.data.notification;
  } catch (error) {
    console.error("Error marking notification as read:", error.message);
    throw error;
  }
};
