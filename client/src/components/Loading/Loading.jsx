import React from "react";

export const Loading = () => {
  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      {/* Nền gradient động */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 animate-gradient-bg"></div>

      {/* Logo chính với hiệu ứng pulse và xoay nhẹ */}
      <div className="relative flex flex-col items-center z-10">
        <svg
          className="w-28 h-28"
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
        <div className="mt-4 flex space-x-2">
          {/* Hiệu ứng loading dots */}
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>

      {/* Phần footer với hiệu ứng mờ dần */}
      <div className="absolute bottom-10 flex flex-col items-center z-10 animate-fade-in">
        <p className="text-gray-600 text-lg font-medium">from</p>
        <div className="flex items-center">
          <img
            src="https://placehold.co/50x50"
            alt="Meta logo"
            className="w-8 h-8 transition-transform hover:scale-110"
          />
          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 ml-3">
            Gens
          </span>
        </div>
      </div>

      {/* Tailwind CSS và custom animations */}
      <style>
        {`
          /* Hiệu ứng gradient nền động */
          @keyframes gradient-bg {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient-bg {
            background-size: 200% 200%;
            animation: gradient-bg 8s ease infinite;
          }

          /* Hiệu ứng xoay chậm khi hover */
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }

          /* Hiệu ứng mờ dần khi xuất hiện */
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 1s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};
