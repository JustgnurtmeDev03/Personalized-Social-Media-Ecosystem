import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Đăng ký các thành phần cần thiết của Chart.js
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

const AdminDashBoard = () => {
  // Dữ liệu cho biểu đồ
  const chartData = {
    labels: [
      "May 14",
      "May 15",
      "May 16",
      "May 17",
      "May 18",
      "May 19",
      "May 20",
    ],
    datasets: [
      {
        label: "Hoạt động (bài đăng, bình luận)",
        data: [120, 140, 100, 120, 80, 60, 50],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Số lượng" },
      },
      x: {
        title: { display: true, text: "Ngày" },
      },
    },
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: true, text: "Xu hướng hoạt động" },
    },
  };

  return (
    <div className="bg-[#fafafa] min-h-screen w-full h-full">
      {/* Header */}
      <div className="header w-full bg-[#fafafa] border-b border-gray-200 flex justify-end items-center pr-5">
        <img
          alt="User avatar"
          className="w-8 h-8 rounded-full"
          height="32"
          src="https://storage.googleapis.com/a1aa/image/2edf31e8-a62b-4d12-71fd-d2cf6866d5aa.jpg"
          width="32"
        />
      </div>

      <div className="px-2 py-6 max-w-[1340px] mx-auto">
        <section className="bg-white w-full rounded-lg border border-gray-200 p-4 flex items-center gap-4 max-w-[1210px]">
          <img
            alt="User avatar with brown hair and glasses, wearing a dark shirt"
            className="w-12 h-12 rounded-full"
            height="48"
            src="https://storage.googleapis.com/a1aa/image/2edf31e8-a62b-4d12-71fd-d2cf6866d5aa.jpg"
            width="48"
          />
          <div className="text-lg leading-tight">
            <p className="font-bold text-black flex items-center gap-1">
              tkavinn03
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold pr-2">Top Admin</span>
              <span>·</span>
              <span className="font-semibold px-2">Admin</span>
              <span>·</span>
              <span className="font-semibold px-2">Moderator</span>
            </p>
          </div>
        </section>

        {/* Overview Section */}
        <div className="mt-8 flex justify-between items-center max-w-[1200px]">
          <h2 className="font-semibold text-black text-base">Tổng quan ›</h2>
          <button
            aria-label="Select time range"
            className="text-xs text-black bg-white border border-gray-300 rounded px-3 py-1 flex items-center gap-1"
          >
            Last 7 days
            <svg
              aria-hidden="true"
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 9l-7 7-7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </button>
        </div>

        <section className="mt-2 bg-white border border-gray-200 rounded-lg max-w-[1200px] grid grid-cols-4 text-center text-xs text-gray-700">
          <div className="border-r border-gray-200 p-4">
            <p className="font-semibold text-black text-lg mb-1">Bài Đăng</p>
            <p className="text-blue-600 font-semibold text-lg mb-1">296</p>
            <p className="flex justify-center items-center gap-1 text-gray-400">
              <svg
                aria-hidden="true"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 13l-5 5m0 0l-5-5m5 5V6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              -60 (-16.9%)
            </p>
          </div>
          <div className="border-r border-gray-200 p-4">
            <p className="font-semibold text-black text-lg mb-1">Người Dùng</p>
            <p className="text-blue-600 font-semibold text-lg mb-1">1,245</p>
            <p className="flex justify-center items-center gap-1 text-gray-400">
              <svg
                aria-hidden="true"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 15l7-7 7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              +15 (+1.2%)
            </p>
          </div>
          <div className="border-r border-gray-200 p-4">
            <p className="font-semibold text-black text-lg mb-1">Bình Luận</p>
            <p className="text-blue-600 font-semibold text-lg mb-1">854</p>
            <p className="flex justify-center items-center gap-1 text-gray-400">
              <svg
                aria-hidden="true"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 13l-5 5m0 0l-5-5m5 5V6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              -20 (-2.3%)
            </p>
          </div>
          <div className="p-4">
            <p className="font-semibold text-black text-lg mb-1">Cảnh Báo</p>
            <p className="text-blue-600 font-semibold text-lg mb-1">12</p>
            <p className="flex justify-center items-center gap-1 text-gray-400">
              <svg
                aria-hidden="true"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 15l7-7 7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              +3 (+33.3%)
            </p>
          </div>
        </section>

        {/* Line Chart Section with Chart.js */}
        <section
          aria-label="Line chart showing activity trends over the last 7 days"
          className="mt-4 bg-white border border-gray-200 rounded-lg max-w-[1200px] p-4"
        >
          <div style={{ height: "300px" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashBoard;
