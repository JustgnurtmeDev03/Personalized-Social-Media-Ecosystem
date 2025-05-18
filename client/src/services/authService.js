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
    if (res.status === 200) {
      alert("Password changed successfully");
    }
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Password reset failed");
  }
};
