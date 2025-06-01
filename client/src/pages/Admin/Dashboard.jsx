import React, { useState, useEffect } from "react";
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
import { useAuth } from "../../providers/AuthContext";
import { fetchUserProfile, fetchTotalUsers } from "../../services/userService";
import { fetchTotalPosts } from "../../services/threadService";
import Avatar from "../../assets/Avatar";
import { jwtDecode } from "jwt-decode";
import Authentication from "../../components/Admin/Authentication";

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
  const { auth } = useAuth();

  const [adminData, setAdminData] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [totalPosts, setTotalPosts] = useState({
    current: 0,
    previous: 0,
    percentage: 0,
  });
  const [totalUsers, setTotalUsers] = useState({
    current: 0,
    previous: 0,
    percentage: 0,
  });

  const fetchAdminData = async () => {
    console.log("fetchAdminData called");
    try {
      if (!auth.accessToken || !auth.userId) {
        throw new Error("Không có token hoặc userId để xác thực");
      }

      const decoded = jwtDecode(auth.accessToken);
      setRoles(decoded.roles || []);

      const user = await fetchUserProfile(auth.userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setAdminData(user);

      const postsResponse = await fetchTotalPosts(auth.accessToken);
      const usersResponse = await fetchTotalUsers(auth.accessToken);

      const postsData = postsResponse.totalPosts || postsResponse;
      const usersData = usersResponse.totalUsers || usersResponse;

      if (
        !postsData ||
        typeof postsData.current === "undefined" ||
        typeof postsData.previous === "undefined"
      ) {
        throw new Error(
          "Dữ liệu bài đăng không hợp lệ: " + JSON.stringify(postsResponse)
        );
      }
      if (
        !usersData ||
        typeof usersData.current === "undefined" ||
        typeof usersData.previous === "undefined"
      ) {
        throw new Error(
          "Dữ liệu người dùng không hợp lệ: " + JSON.stringify(usersResponse)
        );
      }

      const postsDiff = postsData.current - postsData.previous;
      const postsPercentage =
        postsData.previous !== 0 ? (postsDiff / postsData.previous) * 100 : 0;
      setTotalPosts({
        current: postsData.current,
        previous: postsData.previous,
        percentage: postsPercentage.toFixed(1),
      });

      const usersDiff = usersData.current - usersData.previous;
      const usersPercentage =
        usersData.previous !== 0 ? (usersDiff / usersData.previous) * 100 : 0;
      setTotalUsers({
        current: usersData.current,
        previous: usersData.previous,
        percentage: usersPercentage.toFixed(1),
      });
    } catch (error) {
      setAdminError(`Lỗi khi lấy thông tin: ${error.message}`);
      console.error(
        "Error in fetchAdminData:",
        error.response?.data || error.message
      );
    } finally {
      setAdminLoading(false);
    }
  };

  const adminRoles = ["Top Admin", "Admin", "Moderator"];
  const normalizeRole = (role) =>
    role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

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

  useEffect(() => {
    console.log("Auth State:", auth);
    console.log("UserId:", auth.userId, "AccessToken:", auth.accessToken);
    if (auth.userId && auth.accessToken) {
      fetchAdminData();
    } else {
      setAdminError(
        "Không có userId hoặc token để lấy thông tin người quản trị"
      );
      setAdminLoading(false);
    }
  }, [auth.userId, auth.accessToken]);

  console.log("Rendering AdminDashBoard with Total Posts:", totalPosts);

  return (
    <div className="bg-[#fafafa] min-h-screen w-full h-full">
      <Authentication />

      <div className="px-2 py-6 max-w-[1340px] mx-auto">
        <section className="bg-white w-full rounded-lg border border-gray-200 p-4 flex items-center gap-4 max-w-[1210px]">
          <Avatar
            _id={adminData?._id}
            avatarUrl={adminData?.avatar}
            size={50}
          />
          <div className="text-lg leading-tight">
            <p className="font-bold text-black flex items-center gap-1">
              {adminData?.username || "Đang tải..."}
            </p>
            <p className="text-sm text-gray-700">
              {roles.length > 0 ? (
                roles.length === 1 ? (
                  <span className="font-semibold px-2">{roles[0]}</span>
                ) : (
                  adminRoles
                    .filter((role) =>
                      roles.map(normalizeRole).includes(normalizeRole(role))
                    )
                    .map((role, index, filteredRoles) => (
                      <React.Fragment key={index}>
                        <span className="font-semibold px-2">{role}</span>
                        {index < filteredRoles.length - 1 && <span>·</span>}
                      </React.Fragment>
                    ))
                )
              ) : (
                <span className="font-semibold px-2">Không có vai trò</span>
              )}
            </p>
          </div>
        </section>

        <div className="mt-8 flex justify-between items-center max-w-[1200px]">
          <h2 className="font-semibold text-black text-base">Tổng quan ›</h2>
          <button
            aria-label="Select time range"
            className="text-xs text-black bg-white border border-gray-300 rounded px-3 py-1 flex items-center gap-1"
          >
            7 ngày trước
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
            <p className="text-blue-600 font-semibold text-lg mb-1">
              {totalPosts.current}
            </p>
            <p className="flex justify-center items-center gap-1 text-gray-400">
              {totalPosts.percentage >= 0 ? (
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
              ) : (
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
              )}
              {totalPosts.percentage >= 0
                ? `+${Math.abs(totalPosts.percentage)}%`
                : `${totalPosts.percentage}%`}
            </p>
          </div>

          <div className="border-r border-gray-200 p-4">
            <p className="font-semibold text-black text-lg mb-1">Người Dùng</p>
            <p className="text-blue-600 font-semibold text-lg mb-1">
              {totalUsers.current}
            </p>
            <p className="flex justify-center items-center gap-1 text-gray-400">
              {totalUsers.percentage >= 0 ? (
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
              ) : (
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
              )}
              {totalUsers.percentage >= 0
                ? `+${Math.abs(totalUsers.percentage)}%`
                : `${totalUsers.percentage}%`}
            </p>
          </div>

          <div className="border-r border-gray-200 p-4">
            <p className="font-semibold text-black text-lg mb-1">Bình Luận</p>
            <p className="text-blue-600 font-semibold text-lg mb-1">0</p>
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
            <p className="text-blue-600 font-semibold text-lg mb-1">0</p>
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

        <section
          aria-label="Biểu đồ đường thể hiện xu hướng hoạt động trong 7 ngày qua"
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
