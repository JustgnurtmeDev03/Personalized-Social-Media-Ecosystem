import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const loginUser = async (email, password) => {
  try {
    const res = await axios.post(
      `${API_URL}/login`,
      { email, password },
      { withCredentials: true },
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

// Đăng ký người dùng
export const registerUser = async (userData) => {
  try {
    const res = await axios.post(`${API_URL}/register`, userData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const verifyResetCode = async (email, resetCode) => {
  try {
    await axios.post(
      `${API_URL}/verify-reset-code`,
      { email, resetCode },
      { headers: { "Content-Type": "application/json" } }
    );
    return true;
  } catch (err) {
    throw new Error("Invalid reset code. Please check and try again.");
  }
};

export const resetPassword = async (email, resetCode, newPassword) => {
  try {
    const res = await axios.post(
      `${API_URL}/reset-password`,
      { email, resetCode, newPassword },
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Password reset failed");
  }
};

export const checkEmailExists = async (email) => {
  try {
    const res = await axios.post(`${API_URL}/check-email`, { email });
    console.log("Check email response:", res.data);
    return res.data.exists;
  } catch (err) {
    console.error("Error checking email:", err);
    throw new Error(err.response?.data?.message || "Không thể kiểm tra email");
  }
};
