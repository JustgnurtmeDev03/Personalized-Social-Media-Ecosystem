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

export const updateUserProfile = async (accessToken, newBio, fileInput) => {
  try {
    const formData = new FormData();
    formData.append("bio", newBio);

    const fileInput = document.querySelector('input[type="file"]');
    const avatarFile = fileInput.files[0];
    if (avatarFile === "") {
      formData.append("avatar", ""); // đánh dấu xóa
    } else if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const res = await axios.put(`${API_URL}/update-profile`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.user;
  } catch (error) {
    console.error("Error updating profile", error);
    throw error;
  }
};

export const fetchTotalUsers = async (accessToken) => {
  try {
    const res = await axios.get(`${API_URL}/total-users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.totalUsers) {
      return res.totalUsers;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Error following user:", error);
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
