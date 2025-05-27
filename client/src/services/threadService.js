import axios from "axios";

export const API_URL = "http://localhost:5000/api/threads";
export const recommendationApi = axios.create({
  baseURL: "http://localhost:8000", // Không có tiền tố
});

const api = axios.create({
  baseURL: API_URL,
});

export const fetchUserPosts = async (userId, accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    console.log("Sending request with token:", accessToken); // Debug
    const res = await axios.get(`${API_URL}/${userId}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("API Response:", res.data); // Debug
    return Array.isArray(res.data) ? res.data : res.data.posts || [];
  } catch (error) {
    console.error(
      "Error fetching posts:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

export const fetchTotalPosts = async (accessToken) => {
  try {
    const res = await axios.get(`${API_URL}/total-posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("fetchTotalPosts response:", res.data); // Log dữ liệu trả về
    if (res.data && res.data.totalPosts) {
      return res.data.totalPosts;
    } else {
      throw new Error("Invalid response format: " + JSON.stringify(res.data));
    }
  } catch (error) {
    console.error(
      "Lỗi khi lấy tổng số bài đăng:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export default api;
