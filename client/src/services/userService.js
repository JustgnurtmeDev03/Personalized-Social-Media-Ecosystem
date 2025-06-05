import axios from "axios";

const API_URL = "http://localhost:5000/api/users";

export const fetchUserProfile = async (userId, options) => {
  try {
    const res = await axios.get(`${API_URL}/profile/${userId}`, options);

    // Kiểm tra dữ liệu trả về
    if (res.data && res.data.user) {
      return res.data.user;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error; // Để có thể xử lý lỗi ở nơi gọi hàm này
  }
};

export const fetchAllUsers = async (options = {}) => {
  try {
    const { method = "GET", url = "/get-users", data, headers } = options;
    const res = await axios({
      method,
      url: `${API_URL}${url}`,
      data,
      headers,
    });
    // Kiểm tra dữ liệu trả về
    if (!res.data || !Array.isArray(res.data.users)) {
      throw new Error(
        "Dữ liệu trả về không đúng định dạng: Expected 'users' array"
      );
    }
    return res.data;
  } catch (error) {
    console.error("Error in fetchAllUsers:", error);
    throw error;
  }
};

export const updateUserProfile = async (
  accessToken,
  bio,
  file,
  deleteAvatar
) => {
  try {
    if (!accessToken || typeof accessToken !== "string") {
      throw new Error("Invalid or missing access token");
    }

    const formData = new FormData();
    if (bio !== undefined && bio !== null) {
      formData.append("bio", bio);
    }
    if (file) {
      console.log("File to upload:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      if (!file.type.startsWith("image/")) {
        throw new Error("Selected file is not an image");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size must not exceed 5MB");
      }
      formData.append("avatar", file); // Key phải là "avatar" để khớp với cấu hình multer BE
    }
    if (deleteAvatar === "1") {
      formData.append("deleteAvatar", "1");
    }

    const res = await axios.put(`${API_URL}/update-profile`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.data.user;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.error || "Failed to update profile";
      throw new Error(`${message} (Status: ${error.response.status})`);
    } else if (error.request) {
      throw new Error("No response from server. Please check your network.");
    } else {
      throw new Error(`Error updating profile: ${error.message}`);
    }
  }
};

export const fetchTotalUsers = async (accessToken) => {
  try {
    const res = await axios.get(`${API_URL}/total-users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("fetchTotalUsers response:", res.data);
    if (res.data && res.data.totalUsers) {
      return res.data.totalUsers;
    } else {
      throw new Error("Invalid response format: " + JSON.stringify(res.data));
    }
  } catch (error) {
    console.error(
      "Lỗi khi lấy tổng số người dùng:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const fetchFollowers = async (userId, options) => {
  try {
    const res = await axios.get(`${API_URL}/${userId}/followers`, options);

    // Kiểm tra dữ liệu trả về
    if (res.data) {
      return res.data;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Error fetching follower:", error);
    throw error; // Để có thể xử lý lỗi ở nơi gọi hàm này
  }
};

export const fetchFollowing = async (userId, options) => {
  try {
    const res = await axios.get(`${API_URL}/${userId}/is-following`, options);

    // Kiểm tra dữ liệu trả về
    if (res.data) {
      return res.data;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Error fetching follower:", error);
    throw error; // Để có thể xử lý lỗi ở nơi gọi hàm này
  }
};

export const followUser = async (followerId, followeeId, options) => {
  try {
    const res = await axios.post(
      `${API_URL}/${followeeId}/follow`,
      {
        followerId,
      },
      options
    );
    return res.data;
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

export const unfollowUser = async (followerId, followeeId, options) => {
  try {
    const res = await axios.delete(
      `${API_URL}/${followeeId}/unfollow`,
      { followerId },
      options
    );
    return res.data;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};

export const removeFollower = async (followerId, followeeId, options) => {
  try {
    const res = await axios.delete(
      `${API_URL}/${followeeId}/remove-follower`,
      { followerId },
      options
    );
    return res.data;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};

export const fetchTopUsers = async (accessToken, limit = 10) => {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    console.log("Sending request to fetch top users with token:", accessToken);
    const res = await axios.get(`${API_URL}/top-interactors?limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("fetchTopUsers response:", res.data);
    if (res.data && res.data.topUsers) {
      return res.data;
    } else {
      throw new Error("Invalid response format: " + JSON.stringify(res.data));
    }
  } catch (error) {
    console.error(
      "Error fetching top users:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error === "Please authenticate") {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw error;
  }
};

export const createUser = async (userData, accessToken) => {
  try {
    const formData = new FormData();
    for (const key in userData) {
      formData.append(key, userData[key]);
    }
    const res = await fetchAllUsers({
      method: "POST",
      url: "/users",
      data: formData,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.user;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId, userData, accessToken) => {
  try {
    const formData = new FormData();
    for (const key in userData) {
      formData.append(key, userData[key]);
    }
    const res = await fetchAllUsers({
      method: "PUT",
      url: `/users/${userId}`,
      data: formData,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.user;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (userId, accessToken) => {
  try {
    await fetchAllUsers({
      method: "DELETE",
      url: `/users/${userId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    throw error;
  }
};
