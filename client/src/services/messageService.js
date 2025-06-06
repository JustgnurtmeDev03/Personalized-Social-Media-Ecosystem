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
      formData.append("replyTo", replyToId);
      console.log("Sending replyTo:", replyToId);
    }

    console.log("Sending message with token:", accessToken);
    const res = await axios.post(`${API_URL}/sendMessage`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("API Response for sendMessage:", res.data);
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

    console.log("Fetching messages with token:", accessToken);
    const res = await axios.get(`${API_URL}/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("API Response for fetchMessages:", res.data);
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

    console.log("Marking messages as read with token:", accessToken);
    const res = await axios.put(
      `${API_URL}/${userId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log("API Response for markMessagesAsRead:", res.data);
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

export const addReaction = async (messageId, reaction, accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    if (!messageId || !reaction) {
      throw new Error("Missing required fields: messageId or reaction");
    }

    console.log("Adding reaction with token:", accessToken);
    const res = await axios.post(
      `${API_URL}/reaction`,
      { messageId, reaction },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("API Response for addReaction:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "Error adding reaction:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

export const fetchConversations = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    console.log("Fetching conversations with token:", accessToken);
    const res = await axios.get(`${API_URL}/conversations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("API Response for fetchConversations:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "Error fetching conversations:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

export const recallMessage = async (messageId, accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }
    if (!messageId) {
      throw new Error("Missing messageId");
    }

    console.log("Recalling message with token:", accessToken);
    const res = await axios.put(
      `${API_URL}/recall`,
      { messageId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("API Response for recallMessage:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "Error recalling message:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};
export default api;
