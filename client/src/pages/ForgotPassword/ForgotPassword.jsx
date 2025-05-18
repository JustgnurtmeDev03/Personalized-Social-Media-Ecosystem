import React, { useState } from "react";
import axios from "axios";
import "../../styles/authentication.css";

const ForgotPasswordModal = ({ isOpen, onClose, onNext }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resetCode] = useState("");

  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post(
        "http://localhost:5000/api/auth/request-password-reset",
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      onNext(email);
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng kiểm tra email và thử lại.");
    }
  };

  return (
    <div className="modal-overlay-fgp" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-button">
          <i className="fas fa-times"></i>
        </button>
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
        <h2 className="title-fg">Tìm tài khoản Gens của bạn</h2>
        <p style={{ textAlign: "center" }}>
          Nhập vào địa chỉ email liên kết với tài khoản của bạn để thay đổi mật
          khẩu.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email "
          />
          <button type="submit" className="submit-button">
            Tiếp theo
          </button>
        </form>
        {error && <p>{error}</p>}
      </div>
    </div>
  );
};
export default ForgotPasswordModal;
