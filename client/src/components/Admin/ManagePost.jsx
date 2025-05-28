import React, { useState, useEffect, useRef } from "react";
import Authentication from "./Authentication";
import api from "../../services/threadService";

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(null); // State cho modal xác nhận xóa

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPostTime = (createdAt) => {
    try {
      const now = new Date("2025-05-28T20:07:00+07:00"); // Cập nhật thời gian hiện tại: 08:07 PM
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

  const handlePinPost = async (postId, isPinned) => {
    try {
      const authToken = localStorage.getItem("accessToken");
      const response = await api.post(
        `/pin/${postId}`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.message) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId ? { ...post, isPinned: !isPinned } : post
          )
        );
        setMenuOpen(null);
      }
    } catch (error) {
      console.error("Error pinning post:", error);
      alert("Không thể ghim/hủy ghim bài viết");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const authToken = localStorage.getItem("accessToken");
      const response = await api.delete(`/delete/${postId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.message) {
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postId)
        );
        setMenuOpen(null);
        setDeleteModalOpen(null); // Đóng modal sau khi xóa thành công
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Không thể xóa bài viết");
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1; // Đưa bài ghim lên đầu
    if (!a.isPinned && b.isPinned) return 1;

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
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
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
                            {post.videoDuration || "00:14"}
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
                      {post.isPinned && (
                        <span className="flex justify-center items-center absolute top-1 -right-0.5 bg-pink-500 text-white text-[10px] font-semibold px-1 rounded">
                          <svg
                            className="size-3 mr-1"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            role="img"
                            focusable="false"
                            data-icon="pin"
                            aria-hidden="true"
                            fill="currentColor"
                            will-change="auto"
                            transform="rotate(0)"
                          >
                            <path d="M14.998 2c-.266 0-.538.139-.73.322-1.549 1.483-2.023 2.723-1.457 4.421-1.32 1.013-2.155 1.261-3.804 1.261-2.255 0-3.727.272-4.728 1.273v.031a2.374 2.374 0 0 0 0 3.373l2.8 2.822-4.771 4.77c-.39.39-.42 1.044-.03 1.434.391.391 1.048.391 1.438 0l4.79-4.79 2.804 2.791a2.377 2.377 0 0 0 3.375 0h.031c1.002-1 1.282-2.284 1.282-4.716 0-1.546.317-2.637 1.278-3.785 1.848.542 2.924.023 4.44-1.493.188-.187.281-.453.281-.718 0-.352-.088-.89-.312-1.562a8 8 0 0 0-1.969-3.154 8 8 0 0 0-3.156-1.968C15.889 2.09 15.35 2 14.998 2m.387 2.055c1.062.197 2.132.9 2.894 1.662s1.41 1.694 1.679 2.916c-.954.916-1.538.988-2.493.486-.38-.201-.863-.13-1.168.174-1.82 1.82-2.3 3.471-2.3 5.7 0 1.94-.114 2.66-.718 3.31-.171.184-.406.156-.563 0l-7.031-7.027a.36.36 0 0 1-.025-.509c.357-.435 1.152-.773 3.338-.772 2.613.002 4.002-.671 5.718-2.28.305-.304.38-.77.188-1.155-.514-1.028-.434-1.57.48-2.505"></path>
                          </svg>
                          Đã ghim
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col text-sm text-gray-500">
                      <span className="text-gray-500 max-w-[10rem] truncate">
                        {post.content || "No description"}
                      </span>
                      <div className="mt-1 text-xs text-blue-500 max-w-[10rem] truncate">
                        {post.hashtags && post.hashtags.length > 0
                          ? post.hashtags.map((tag) => `${tag}`).join(" ")
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
                    <div className="relative whitespace-nowrap flex items-center gap-3">
                      <button
                        aria-label="Edit post"
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <svg
                          className="size-4"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          role="img"
                          focusable="false"
                          data-icon="pen"
                          aria-hidden="true"
                          fill="currentColor"
                          will-change="auto"
                          transform="rotate(0)"
                        >
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M2 21.047a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1"
                          ></path>
                          <path d="M16.996 2a1.02 1.02 0 0 0-.72.281l-3 3.002L3.268 15.288c-.139.14-.21.338-.25.532l-1 5.003a.974.974 0 0 0 1.156 1.157l5.003-1c.194-.04.392-.112.532-.25l10.005-10.007c.445-.444 2.447-2.446 3.003-3a1.02 1.02 0 0 0 .28-.72c0-1.637-.417-2.807-1.282-3.69C19.844 2.423 18.678 2 16.997 2m.394 2.02c.902.052 1.488.26 1.889.67.41.417.669.997.724 1.882-.547.547-1.35 1.337-2.006 1.994l-2.565-2.564c.658-.657 1.41-1.436 1.958-1.983m-3.395 3.42 2.563 2.564-7.567 7.567-2.564-2.564zm-9.006 9.005 2.564 2.564-.094.094c-.66.132-1.993.411-3.22.657l.656-3.22z"></path>
                        </svg>
                      </button>
                      <button
                        aria-label="Open post"
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <svg
                          className="size-4"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          role="img"
                          focusable="false"
                          data-icon="chart-rise"
                          aria-hidden="true"
                          fill="currentColor"
                          will-change="auto"
                          transform="rotate(0)"
                        >
                          <path d="M16 11.414V14h2V9.01A1.01 1.01 0 0 0 16.99 8H12v2h2.586l-1.854 1.854a.5.5 0 0 1-.353.146h-2.353a2.5 2.5 0 0 0-1.562.548l-2.089 1.671a1 1 0 0 0 1.25 1.562l2.089-1.671a.5.5 0 0 1 .312-.11h2.353a2.5 2.5 0 0 0 1.768-.732z"></path>
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M7.759 4h8.482c.805 0 1.47 0 2.01.044.563.046 1.08.145 1.565.392a4 4 0 0 1 1.748 1.748c.247.485.346 1.002.392 1.564C22 8.29 22 8.954 22 9.758v4.483c0 .805 0 1.47-.044 2.01-.046.563-.145 1.08-.392 1.565a4 4 0 0 1-1.748 1.748c-.485.247-1.002.346-1.564.392-.541.044-1.206.044-2.01.044H7.758c-.805 0-1.47 0-2.01-.044-.563-.046-1.08-.145-1.565-.392a4 4 0 0 1-1.748-1.748c-.247-.485-.346-1.002-.392-1.564C2 15.71 2 15.046 2 14.242V9.758c0-.805 0-1.47.044-2.01.046-.563.145-1.08.392-1.565a4 4 0 0 1 1.748-1.748c.485-.247 1.002-.346 1.564-.392C6.29 4 6.954 4 7.758 4M5.91 6.038c-.438.035-.663.1-.819.18a2 2 0 0 0-.874.874c-.08.156-.145.38-.18.819C4 8.361 4 8.943 4 9.8v4.4c0 .857 0 1.439.038 1.889.035.438.1.663.18.819a2 2 0 0 0 .874.874c.156.08.38.145.819.18C6.361 18 6.943 18 7.8 18h8.4c.857 0 1.439 0 1.889-.038.438-.035.663-.1.819-.18a2 2 0 0 0 .874-.874c.08-.156.145-.38.18-.819.037-.45.038-1.032.038-1.889V9.8c0-.857 0-1.439-.038-1.889-.035-.438-.1-.663-.18-.819a2 2 0 0 0-.874-.874c-.156-.08-.38-.145-.819-.18C17.639 6 17.057 6 16.2 6H7.8c-.857 0-1.439 0-1.889.038"
                          ></path>
                        </svg>
                      </button>
                      <button
                        aria-label="Comments"
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <svg
                          className="size-4"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          role="img"
                          focusable="false"
                          data-icon="comments"
                          aria-hidden="true"
                          fill="currentColor"
                          will-change="auto"
                          transform="rotate(0)"
                        >
                          <path d="M4 11c0-3.427 3.403-6.5 8-6.5s8 3.073 8 6.5c0 2.148-1.072 4.037-2.595 5.619-1.049 1.089-2.275 1.992-3.405 2.683V17.5h-2c-4.597 0-8-3.073-8-6.5m8-8.5C6.655 2.5 2 6.143 2 11s4.655 8.5 10 8.5V21a1 1 0 0 0 1.447.894c1.565-.782 3.67-2.093 5.398-3.888C20.572 16.213 22 13.852 22 11c0-4.857-4.656-8.5-10-8.5m-3 8.75a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0m4.25 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0m3 1.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5"></path>
                        </svg>
                      </button>
                      <button
                        aria-label="More options"
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        onClick={() =>
                          setMenuOpen(menuOpen === post._id ? null : post._id)
                        }
                      >
                        <i className="fas fa-ellipsis-h"></i>
                      </button>
                      {menuOpen === post._id && (
                        <div
                          ref={menuRef}
                          className="absolute right-12 top-10 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                        >
                          <button
                            className="flex items-center w-full text-left px-4 py-2 text-sm font-semibold text-green-600 hover:bg-gray-100"
                            onClick={() =>
                              handlePinPost(post._id, post.isPinned)
                            }
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M14.998 2c-.266 0-.538.139-.73.322-1.549 1.483-2.023 2.723-1.457 4.421-1.32 1.013-2.155 1.261-3.804 1.261-2.255 0-3.727.272-4.728 1.273v.031a2.374 2.374 0 0 0 0 3.373l2.8 2.822-4.771 4.77c-.39.39-.42 1.044-.03 1.434.391.391 1.048.391 1.438 0l4.79-4.79 2.804 2.791a2.377 2.377 0 0 0 3.375 0h.031c1.002-1 1.282-2.284 1.282-4.716 0-1.546.317-2.637 1.278-3.785 1.848.542 2.924.023 4.44-1.493.188-.187.281-.453.281-.718 0-.352-.088-.89-.312-1.562a8 8 0 0 0-1.969-3.154 8 8 0 0 0-3.156-1.968C15.889 2.09 15.35 2 14.998 2m.387 2.055c1.062.197 2.132.9 2.894 1.662s1.41 1.694 1.679 2.916c-.954.916-1.538.988-2.493.486-.38-.201-.863-.13-1.168.174-1.82 1.82-2.3 3.471-2.3 5.7 0 1.94-.114 2.66-.718 3.31-.171.184-.406.156-.563 0l-7.031-7.027a.36.36 0 0 1-.025-.509c.357-.435 1.152-.773 3.338-.772 2.613.002 4.002-.671 5.718-2.28.305-.304.38-.77.188-1.155-.514-1.028-.434-1.57.48-2.505" />
                            </svg>
                            {post.isPinned
                              ? "Hủy ghim bài viết"
                              : "Ghim bài viết lên đầu"}
                          </button>
                          <button
                            className="flex items-center w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-gray-100"
                            onClick={() => setDeleteModalOpen(post._id)}
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M7 4V2h10v2h5v2h-2v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6H2V4h5zM6 6v15h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z" />
                            </svg>
                            Xóa bài viết
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal xác nhận xóa */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Xác nhận xóa bài viết
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể
                khôi phục.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setDeleteModalOpen(null)}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  onClick={() => handleDeletePost(deleteModalOpen)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePosts;
