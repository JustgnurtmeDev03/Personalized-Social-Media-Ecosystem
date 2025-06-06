import axios from "axios";

export const API_URL = "http://localhost:5000/api/threads";

const api = axios.create({
  baseURL: API_URL,
});

export const fetchPosts = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    console.log("Sending request to fetch all posts with token:", accessToken); // Debug
    const res = await axios.get(`${API_URL}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("API Response for fetchPosts:", res.data); // Debug
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

export const updatePost = async (postId, updatedPost, accessToken) => {
  try {
    const res = await api.put(`/posts/${postId}`, updatedPost, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (error) {
    console.error(
      "Error updating post:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const deletePost = async (postId, accessToken) => {
  try {
    const res = await api.delete(`/posts/${postId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (error) {
    console.error(
      "Error deleting post:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const markNotInterested = async (postId, accessToken) => {
  try {
    const res = await api.post(
      "/not-interested",
      { postId },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error(
      "Error marking post as not interested:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const reportPost = async (postId, reason, accessToken) => {
  try {
    const res = await api.post(
      "/report",
      { postId, reason },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error(
      "Error reporting post:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const fetchTotalReportedPosts = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    const res = await axios.get(`${API_URL}/total-reported-posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("fetchTotalReportedPosts response:", res.data); // Log dữ liệu trả về
    if (res.data && res.data.totalReportedPosts) {
      return res.data.totalReportedPosts;
    } else {
      throw new Error("Invalid response format: " + JSON.stringify(res.data));
    }
  } catch (error) {
    console.error(
      "Lỗi khi lấy tổng số bài viết bị báo cáo:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

export const fetchChartData = async (accessToken, days = 30) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    const res = await axios.get(`${API_URL}/chart-data?days=${days}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("fetchChartData response:", res.data); // Log dữ liệu trả về
    if (
      res.data &&
      res.data.labels &&
      res.data.posts &&
      res.data.users &&
      res.data.reportedPosts
    ) {
      return res.data;
    } else {
      throw new Error("Invalid response format: " + JSON.stringify(res.data));
    }
  } catch (error) {
    console.error(
      "Lỗi khi lấy dữ liệu biểu đồ:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

// Thêm hàm tìm kiếm người dùng
export const searchUsers = async (query, accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }
    if (!query || typeof query !== "string") {
      throw new Error("Search query is required");
    }

    console.log("Sending search users request with query:", query); // Debug
    const res = await axios.get(`${API_URL}/search/users`, {
      params: { q: query },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("API Response for searchUsers:", res.data); // Debug
    return res.data.users || [];
  } catch (error) {
    console.error(
      "Error searching users:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

// Thêm hàm tìm kiếm bài đăng
export const searchPosts = async (query, accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }
    if (!query || typeof query !== "string") {
      throw new Error("Search query is required");
    }

    console.log("Sending search posts request with query:", query); // Debug
    const res = await axios.get(`${API_URL}/search/posts`, {
      params: { q: query },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("API Response for searchPosts:", res.data); // Debug
    return res.data.posts || [];
  } catch (error) {
    console.error(
      "Error searching posts:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

export default api;
