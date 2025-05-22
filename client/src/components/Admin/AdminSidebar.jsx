import React from "react";
import { useNavigate } from "react-router-dom";

const AdminSidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <div className="w-72 min-h-screen border-r border-gray-200 flex flex-col">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
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
          <span className="font-bold text-3xl text-black">Gens</span>
          <span className="text-black text-xl font-normal">Admin</span>
        </div>

        <div className="px-6 py-6">
          <button
            className="w-full bg-[#fe2c55] text-white text-lg text-center font-medium rounded-lg py-2 hover:bg-[#e0224a] transition-colors"
            type="button"
          >
            + Đăng tải
          </button>
        </div>

        <nav className="flex-1 px-6">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 select-none">
              Quản lý
            </h3>
            <ul className="space-y-2 text-gray-700 text-base font-normal">
              <li>
                <a
                  className="flex items-center gap-3 rounded-md bg-gray-200 px-3 py-2 font-semibold text-black"
                  href="#"
                >
                  <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    role="img"
                    focusable="false"
                    data-icon="house"
                    aria-hidden="true"
                    fill="var(--ui-text-1)"
                    will-change="auto"
                    transform="rotate(0)"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M14.066 3.225a3 3 0 0 0-4.132 0L1.97 10.79a1.5 1.5 0 0 0 .67 2.542l.359.09v6.22a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6.22l.36-.09a1.5 1.5 0 0 0 .669-2.542zm-2.755 1.45a1 1 0 0 1 1.378 0l7.302 6.938-.233.058a1 1 0 0 0-.758.971v7h-6v-5h-2v5H5v-7c0-.459-.313-.86-.758-.97l-.234-.06z"
                    ></path>
                  </svg>
                  Trang chủ
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    role="img"
                    focusable="false"
                    data-icon="folder"
                    aria-hidden="true"
                    fill="var(--ui-text-2)"
                    will-change="auto"
                    transform="rotate(0)"
                  >
                    <path d="M5.998 3a3 3 0 0 0-3 3v11a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V8a1 1 0 0 0-1-1h-5c-.755 0-.998-.245-1.594-1.438C12.501 3.755 11.744 3 9.998 3zm0 2h4c.755 0 .998.245 1.594 1.438.13.261.184.344.312.562H7.967a1 1 0 0 0 0 2h11.031v8a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1m4 8a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2z"></path>
                  </svg>
                  Bài đăng
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <svg
                    aria-label="Profile"
                    role="img"
                    viewBox="0 0 26 26"
                    className="fill-white "
                  >
                    <title>Profile</title>
                    <circle
                      cx="13"
                      cy="7.25"
                      r="4"
                      stroke="currentColor"
                      stroke-width="2.5"
                    ></circle>
                    <path
                      d="M6.26678 23.75H19.744C21.603 23.75 22.5 23.2186 22.5 22.0673C22.5 19.3712 18.8038 15.75 13 15.75C7.19625 15.75 3.5 19.3712 3.5 22.0673C3.5 23.2186 4.39704 23.75 6.26678 23.75Z"
                      stroke="currentColor"
                      stroke-width="2.5"
                    ></path>
                  </svg>
                  Người dùng
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    role="img"
                    focusable="false"
                    data-icon="comments"
                    aria-hidden="true"
                    fill="var(--ui-text-2)"
                    will-change="auto"
                    transform="rotate(0)"
                  >
                    <path d="M4 11c0-3.427 3.403-6.5 8-6.5s8 3.073 8 6.5c0 2.148-1.072 4.037-2.595 5.619-1.049 1.089-2.275 1.992-3.405 2.683V17.5h-2c-4.597 0-8-3.073-8-6.5m8-8.5C6.655 2.5 2 6.143 2 11s4.655 8.5 10 8.5V21a1 1 0 0 0 1.447.894c1.565-.782 3.67-2.093 5.398-3.888C20.572 16.213 22 13.852 22 11c0-4.857-4.656-8.5-10-8.5m-3 8.75a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0m4.25 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0m3 1.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5"></path>
                  </svg>
                  Bình luận
                </a>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 select-none">
              Tools
            </h3>
            <ul className="space-y-2 text-gray-700 text-base font-normal">
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="far fa-lightbulb text-lg"></i>
                  Inspirations
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="far fa-bookmark text-lg"></i>
                  Creator Academy
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="fas fa-music text-lg"></i>
                  Unlimited Sounds
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 select-none">
              Others
            </h3>
            <ul className="space-y-2 text-gray-700 text-base font-normal">
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="far fa-envelope text-lg"></i>
                  Phản hồi
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
