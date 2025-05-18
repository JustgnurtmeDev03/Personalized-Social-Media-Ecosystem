import React, { useState } from "react";
import axios from "axios";
import { resetPassword } from "../../services/authService";

const ResetPassword = ({ email, resetCode, onClose }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage("Password and confirm password do not match");
      return;
    }

    try {
      await resetPassword(email, resetCode, newPassword);
      return true;
    } catch (error) {
      setErrorMessage("An error occurred while updating the password");
    }
  };

  return (
    <div className="modal-overlay-fgp">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="logo-sb-fg">
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
                  <stop offset="0%" style={{ stopColor: "#ffdde1" }} />{" "}
                  {/* Hồng nhạt */}
                  <stop offset="100%" style={{ stopColor: "#1da1f2" }} />{" "}
                  {/* Xanh Twitter */}
                </linearGradient>
                <linearGradient
                  id="gensGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" style={{ stopColor: "#ffdde1" }} />
                  <stop offset="100%" style={{ stopColor: "#6b48ff" }} />
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
        </div>
        <h2 className="title-fg">Enter New Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Mật khẩu mới"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Nhập lại mật khẩu mới"
          />
          <button type="submit" className="submit-button" onClick={onClose()}>
            Thiết lập lại mật khẩu
          </button>
        </form>
        {errorMessage && <p>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
