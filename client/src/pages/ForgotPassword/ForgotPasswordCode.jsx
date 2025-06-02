import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/authentication.css";

const ForgotPasswordCode = ({ email, isOpen, onNext, onClose }) => {
  console.log(
    "Rendering ForgotPasswordCode with email:",
    email,
    "isOpen:",
    isOpen
  );

  const [resetCode, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      console.log("Unmounting ForgotPasswordCode");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-reset-code",
        {
          email,
          resetCode,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("API Response:", response.data);
      onNext(resetCode);
    } catch (err) {
      console.error("Error in verify-reset-code:", err);
      setError("Mã xác nhận không hợp lệ. Vui lòng kiểm tra và thử lại.");
    }
  };

  if (!isOpen) {
    console.log("ForgotPasswordCode not rendered due to isOpen=false");
    return null;
  }

  return (
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
      <h2 className="title-fg">Nhập vào mã xác nhận</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={resetCode}
          onChange={(e) => setCode(e.target.value)}
          required
          placeholder="Nhập mã xác nhận"
          className="w-full p-2.5 mb-4 border border-gray-300 rounded-lg text-sm focus:ring-primary-600 focus:border-primary-600"
        />
        <button
          type="submit"
          className="w-full text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          Xác nhận
        </button>
        {error && (
          <p className="text-red-600 text-sm text-center mt-4">{error}</p>
        )}
      </form>
    </div>
  );
};

export default ForgotPasswordCode;
