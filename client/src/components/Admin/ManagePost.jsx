import React, { useState, useEffect } from "react";
import Authentication from "./Authentication";
import api from "../../services/threadService";

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt"); // Mặc định sắp xếp theo createdAt
  const [sortOrder, setSortOrder] = useState("desc"); // Mặc định mới nhất

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const authToken = localStorage.getItem("accessToken");
        if (!authToken) throw new Error("Không có token để xác thực");

        const response = await api.get("/posts", {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const postsData = response.data.posts || [];
        setPosts(postsData);
      } catch (err) {
        setError("Không thể tải bài đăng: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const formatPostTime = (createdAt) => {
    try {
      const now = new Date("2025-05-28T16:55:00+07:00"); // Thời gian hiện tại: 04:55 PM
      const postTime = new Date(createdAt);
      const diffMs = now - postTime;

      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (minutes < 1) return "Vừa xong";
      if (minutes < 60) return `${minutes} phút trước`;
      if (hours < 24) return `${hours} giờ trước`;
      if (days < 7) return `${days} ngày trước`;

      return postTime.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    } catch {
      return "Không xác định";
    }
  };

  const handleSort = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(criteria);
      setSortOrder("asc");
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    let aValue = a[sortBy] || 0;
    let bValue = b[sortBy] || 0;

    if (sortBy === "createdAt") {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    }

    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  if (loading) return <p>Đang tải bài đăng...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white font-sans text-gray-700">
      <Authentication />
      <div className="max-w-[1200px] ml-5 px-6 py-4">
        <div className=" flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex space-x-6 text-sm font-medium">
            <button className="text-black font-bold border-b-2 border-black pb-1">
              Bài Đăng
              <span className="ml-1">({posts.length})</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 space-y-4 md:space-y-0">
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-1 border border-gray-300 rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-100"
              type="button"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                role="img"
                focusable="false"
                data-icon="filter"
                aria-hidden="true"
                fill="currentColor"
                will-change="auto"
                transform="rotate(0)"
              >
                <path d="M2.999 6a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2zm2 5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2zm2 5a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2z"></path>
              </svg>
              <span>Lượt xem</span>
            </button>
            <button
              className="flex items-center gap-1 border border-gray-300 rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-100"
              type="button"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                role="img"
                focusable="false"
                data-icon="filter"
                aria-hidden="true"
                fill="currentColor"
                will-change="auto"
                transform="rotate(0)"
              >
                <path d="M2.999 6a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2zm2 5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2zm2 5a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2z"></path>
              </svg>
              <span>Luợt thích</span>
            </button>
            <button
              className="flex items-center gap-1 border border-gray-300 rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-100"
              type="button"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                role="img"
                focusable="false"
                data-icon="filter"
                aria-hidden="true"
                fill="currentColor"
                will-change="auto"
                transform="rotate(0)"
              >
                <path d="M2.999 6a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2zm2 5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2zm2 5a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2z"></path>
              </svg>
              <span>Bình luận</span>
            </button>
            <button
              className="flex items-center gap-1 border border-gray-300 rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-100"
              type="button"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                role="img"
                focusable="false"
                data-icon="filter"
                aria-hidden="true"
                fill="currentColor"
                will-change="auto"
                transform="rotate(0)"
              >
                <path d="M2.999 6a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2zm2 5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2zm2 5a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2z"></path>
              </svg>
              <span>Quyền riêng tư</span>
            </button>
          </div>
          <div className="w-full md:w-72">
            <label className="sr-only" htmlFor="search">
              Tìm kiếm theo nội dung của bài đăng
            </label>
            <div className="relative text-gray-400 focus-within:text-gray-600">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <i className="fas fa-search"></i>
              </span>
              <input
                className="block w-full rounded-md border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-0"
                id="search"
                placeholder="Tìm kiếm theo nội dung"
                type="search"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto scrollbar-hide fixed-table-container">
          <table className="min-w-full border border-gray-100 rounded-md text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th
                  className="px-4 py-3 whitespace-nowrap font-normal"
                  scope="col"
                >
                  <button
                    className="flex items-center"
                    onClick={() => handleSort("createdAt")}
                  >
                    Các bài đăng (Ngày tạo)
                    <i className="fas fa-sort ml-1 text-xs"></i>
                  </button>
                </th>
                <th
                  className="px-4 py-3 whitespace-nowrap font-normal"
                  scope="col"
                >
                  Quyền riêng tư
                </th>
                <th
                  className="px-4 py-3 whitespace-nowrap font-normal"
                  scope="col"
                >
                  <button
                    className="flex items-center"
                    onClick={() => handleSort("userViews")}
                  >
                    Lượt xem
                    <i className="fas fa-sort ml-1 text-xs"></i>
                  </button>
                </th>
                <th
                  className="px-4 py-3 whitespace-nowrap font-normal"
                  scope="col"
                >
                  <button
                    className="flex items-center"
                    onClick={() => handleSort("likesCount")}
                  >
                    Lượt thích
                    <i className="fas fa-sort ml-1 text-xs"></i>
                  </button>
                </th>
                <th
                  className="px-4 py-3 whitespace-nowrap font-normal"
                  scope="col"
                >
                  <button
                    className="flex items-center"
                    onClick={() => handleSort("commentsCount")}
                  >
                    Bình luận
                    <i className="fas fa-sort ml-1 text-xs"></i>
                  </button>
                </th>
                <th
                  className="px-4 py-3 whitespace-nowrap font-normal"
                  scope="col"
                >
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedPosts.map((post) => (
                <tr key={post._id}>
                  <td className="px-4 py-4 whitespace-nowrap flex items-center gap-4">
                    <div className="relative w-16 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                      {post.images && post.images.length > 0 ? (
                        <img
                          alt={`Thumbnail of post ${post._id}`}
                          className="w-full h-full object-cover"
                          height="80"
                          src={post.images[0]}
                          width="64"
                        />
                      ) : post.videos && post.videos.length > 0 ? (
                        <>
                          <video
                            className="w-full h-full object-cover"
                            src={post.videos[0]}
                            controls={false}
                          />
                          <span className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-[10px] font-semibold px-1 rounded">
                            00:14
                          </span>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                          </svg>
                        </div>
                      )}
                      {post.privacy === "private" && (
                        <span
                          className="absolute top-1 left-1 bg-white rounded-full p-[2px]"
                          title="Private post"
                        >
                          <i className="fas fa-lock text-xs text-gray-600"></i>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col text-sm text-gray-500">
                      <span className="text-gray-500 max-w-[10rem] truncate">
                        {post.content || "Không có nội dung"}
                      </span>
                      <div className="mt-1 text-xs text-blue-500 max-w-[10rem] truncate">
                        {post.hashtags && post.hashtags.length > 0
                          ? post.hashtags
                              .map((tag, index) => `${tag} `)
                              .join(" ")
                          : "Không có hashtags"}
                      </div>
                      <time
                        className="mt-1 text-xs text-gray-400"
                        dateTime={post.createdAt}
                      >
                        {formatPostTime(post.createdAt)}
                      </time>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      className="inline-flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                      type="button"
                    >
                      {post.visibility === "public" ? (
                        <i className="fas fa-globe-americas text-xs"></i>
                      ) : post.visibility === "private" ? (
                        <i className="fas fa-lock text-xs"></i>
                      ) : (
                        <i className="fas fa-users text-xs"></i>
                      )}
                      <span className="font-bold">
                        {post.visibility === "public"
                          ? "Everyone"
                          : post.visibility === "private"
                          ? "Only me"
                          : "Friends"}
                      </span>
                      <i className="fas fa-caret-down text-xs"></i>
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-800">
                    {post.userViews || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-800">
                    {post.likesCount || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-800">
                    {post.commentsCount || 0}
                  </td>
                  <td className="px-4 py-4">
                    <div className="-pt-10 whitespace-nowrap flex items-center gap-3">
                      <button
                        aria-label="Edit post"
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button
                        aria-label="Open post"
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <i className="fas fa-external-link-alt"></i>
                      </button>
                      <button
                        aria-label="Comments"
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <i className="fas fa-comment-alt"></i>
                      </button>
                      <button
                        aria-label="More options"
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <i className="fas fa-ellipsis-h"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagePosts;
