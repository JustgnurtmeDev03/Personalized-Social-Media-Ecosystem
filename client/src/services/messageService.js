import axios from "axios";

export const API_URL = "http://localhost:5000/api/messages";

const api = axios.create({
  baseURL: API_URL,
});

export const sendMessage = async (
  recipientId,
  type,
  content,
  accessToken,
  replyToId
) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    const formData = new FormData();
    formData.append("recipientId", recipientId);
    formData.append("type", type);
    if (type === "image") {
      formData.append("image", content);
    } else {
      formData.append("content", content);
    }
    if (replyToId) {
      formData.append("replyTo", replyToId); // Thêm replyTo vào formData
      console.log("Sending replyTo:", replyToId); // Debug
    }

    console.log("Sending message with token:", accessToken); // Debug
    const res = await axios.post(`${API_URL}/sendMessage`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("API Response for sendMessage:", res.data); // Debug
    return res.data;
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

export const fetchMessages = async (userId, accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    console.log("Fetching messages with token:", accessToken); // Debug
    const res = await axios.get(`${API_URL}/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("API Response for fetchMessages:", res.data); // Debug
    return Array.isArray(res.data) ? res.data : res.data.messages || [];
  } catch (error) {
    console.error(
      "Error fetching messages:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

export const markMessagesAsRead = async (userId, accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    console.log("Marking messages as read with token:", accessToken); // Debug
    const res = await axios.put(
      `${API_URL}/${userId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log("API Response for markMessagesAsRead:", res.data); // Debug
    return res.data;
  } catch (error) {
    console.error(
      "Error marking messages as read:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

export default api;
