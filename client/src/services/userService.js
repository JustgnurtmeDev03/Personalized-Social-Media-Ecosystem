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
