import React, { useState } from "react";
import { resetPassword } from "../../services/authService";

const ResetPassword = ({ email, resetCode, isOpen, onClose, onCloseAll }) => {
  console.log("ResetPassword props:", {
    email,
    resetCode,
    isOpen,
    onClose,
    onCloseAll,
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu và xác nhận mật khẩu không khớp");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email, resetCode, newPassword);
      setSuccessMessage("Cập nhật mật khẩu thành công!");
      if (typeof onCloseAll === "function") {
        console.log("Calling onCloseAll");
        onCloseAll();
      } else {
        console.error("onCloseAll is not a function");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setErrorMessage("Đã xảy ra lỗi khi cập nhật mật khẩu. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    console.log("ResetPassword not rendered due to isOpen=false");
    return null;
  }

  return (
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="logo-sb-fg">
        <svg
          aria-label="Gens"
          fill="none"
          height="100%"
          role="img"
          viewBox="0 0 192 192"
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="gensGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" style={{ stopColor: "#ffdde1" }} />
              <stop offset="100%" style={{ stopColor: "#1da1f2" }} />
            </linearGradient>
          </defs>
          <path
            d="M50 70 Q 70 50 90 70 Q 110 90 90 110 Q 70 130 50 110 Q 30 90 50 70 M80 60 Q 100 40 120 60 Q 140 80 120 100 Q 100 120 80 100 Q 60 80 80 60"
            fill="url(#gensGradient)"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.9"
            transform="translate(-40,-60) scale(1.5)"
          />
          <text
            x="60"
            y="150"
            fontFamily="Arial, sans-serif"
            fontSize="50"
            fontWeight="bold"
            fill="#1da1f2"
          >
            Gens
          </text>
        </svg>
      </div>
      <h2 className="title-fg">Nhập Mật Khẩu Mới</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          placeholder="Mật khẩu mới"
          disabled={isSubmitting}
          className="w-full p-2.5 mb-4 border border-gray-300 rounded-lg text-sm focus:ring-primary-600 focus:border-primary-600"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Nhập lại mật khẩu mới"
          disabled={isSubmitting}
          className="w-full p-2.5 mb-4 border border-gray-300 rounded-lg text-sm focus:ring-primary-600 focus:border-primary-600"
        />
        <button
          type="submit"
          className={`w-full text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang xử lý..." : "Thiết lập lại mật khẩu"}
        </button>
      </form>
      {errorMessage && (
        <p className="text-red-600 text-sm text-center mt-4">{errorMessage}</p>
      )}
      {successMessage && (
        <p className="text-green-600 text-sm text-center mt-4">
          {successMessage}
        </p>
      )}
    </div>
  );
};

export default ResetPassword;
