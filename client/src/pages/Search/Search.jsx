import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../providers/AuthContext";
import { searchUsers, searchPosts } from "../../services/threadService";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/SearchPage.css";
import "font-awesome/css/font-awesome.min.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import api from "../../services/threadService";
import Sidebar from "../../components/Sidebar/sidebar";

// Component Modal để hiển thị ảnh/video toàn màn hình
const MediaModal = ({ isOpen, onClose, mediaUrl }) => {
  if (!isOpen) return null;

  const isVideo = mediaUrl?.endsWith(".mp4");

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            className="max-w-full max-h-screen object-contain"
            controls
            autoPlay
            loop
          >
            <source src={mediaUrl} type="video/mp4" />
            Trình duyệt không hỗ trợ video.
          </video>
        ) : (
          <img
            src={mediaUrl}
            alt="Media"
            className="max-w-full max-h-screen object-contain"
          />
        )}
      </div>
    </div>
  );
};

// Component Avatar đơn giản (giả lập từ PostBar)
const Avatar = ({ avatarUrl, size = 40 }) => {
  return (
    <img
      src={avatarUrl || "/default-avatar.png"}
      alt="Avatar"
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
      onError={(e) => {
        e.target.src = "/default-avatar.png";
      }}
    />
  );
};

const SearchPage = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [searchType, setSearchType] = useState("users");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaDimensions, setMediaDimensions] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (searchType === "users") {
        const userResults = await searchUsers(query, auth.accessToken);
        setUsers(userResults);
        setPosts([]);
      } else if (searchType === "posts") {
        const postResults = await searchPosts(query, auth.accessToken);
        setPosts(postResults);
        setUsers([]);
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error.message);
      setError(
        error.message === "Authentication failed. Please log in again."
          ? "Vui lòng đăng nhập lại!"
          : "Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau."
      );
      if (error.message === "Authentication failed. Please log in again.") {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDimensions = useCallback((postId, index, width, height) => {
    setMediaDimensions((prev) => ({
      ...prev,
      [`${postId}-${index}`]: { width, height },
    }));
  }, []);

  const formatPostTime = useCallback((createdAt) => {
    try {
      const now = new Date();
      const postTime = new Date(createdAt);
      const diffMs = now - postTime;

      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

      if (minutes < 1) return "Vừa xong";
      if (minutes < 60) return `${minutes} phút`;
      if (hours < 24) return `${hours} giờ`;
      if (days < 7) return `${days} ngày`;

      const day = postTime.getDate().toString().padStart(2, "0");
      const month = (postTime.getMonth() + 1).toString().padStart(2, "0");
      const year = postTime.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "Không xác định";
    }
  }, []);

  const openMenu = (e, postId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!postId) {
      console.error("postId is undefined or null in openMenu");
      return;
    }
    setMenuPosition({ x: e.clientX - 150, y: e.clientY + 10 });
    setSelectedPostId(postId);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setSelectedPostId(null);
  };

  const handleNotInterested = async (postId) => {
    if (!postId) {
      console.error("postId is undefined or null in handleNotInterested");
      return;
    }
    try {
      await api.post(
        "/not-interested",
        { postId },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      setPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (error) {
      console.error("Error marking post as not interested:", error);
    } finally {
      closeMenu();
    }
  };

  const handleReport = (e, postId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!postId) {
      console.error("postId is undefined or null in handleReport");
      return;
    }
    setSelectedPostId(postId);
    setIsReportModalOpen(true);
    setMenuOpen(false);
  };

  const submitReport = async () => {
    if (!selectedPostId || !reportReason) {
      console.error("Missing selectedPostId or reportReason in submitReport");
      return;
    }
    try {
      await api.post(
        "/report",
        { postId: selectedPostId, reason: reportReason },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      alert("Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét bài viết này.");
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setIsReportModalOpen(false);
      setReportReason("");
      setSelectedPostId(null);
    }
  };

  const preventDefaultDrag = (e) => e.preventDefault();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest(".menu-container")) {
        closeMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex ">
      <Sidebar />
      <div className=" bg-gray-100 p-4 w-full w-max-[1200px] ">
        <div className="search-container max-w-2xl mx-auto">
          <div className="search-header bg-white p-3 rounded-lg shadow mb-4">
            <h1 className="text-lg font-bold mb-2">Tìm kiếm</h1>
            <div className="search-bar flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm người dùng hoặc bài đăng"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 p-2 border rounded mr-2"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? "Đang tìm..." : "🔍"}
              </button>
              <span className="filter-icon ml-2 text-gray-500">⚙️</span>
            </div>

            {error && (
              <p className="error-message text-red-500 mt-2">{error}</p>
            )}

            <div className="search-tabs flex mt-4">
              <button
                className={`flex-1 py-2 ${
                  searchType === "users"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                } rounded-l-lg hover:bg-blue-600 disabled:bg-gray-400`}
                onClick={() => setSearchType("users")}
                disabled={loading}
              >
                Người dùng
              </button>
              <button
                className={`flex-1 py-2 ${
                  searchType === "posts"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                } rounded-r-lg hover:bg-blue-600 disabled:bg-gray-400`}
                onClick={() => setSearchType("posts")}
                disabled={loading}
              >
                Bài đăng
              </button>
            </div>
          </div>

          <div className="search-results mt-6">
            {loading ? (
              <p className="text-center text-gray-500">Đang tải kết quả...</p>
            ) : searchType === "users" ? (
              <div className="follow-suggestions">
                <h2 className="text-lg font-bold mb-4">Kết quả người dùng</h2>
                {users.length === 0 ? (
                  <p className="text-center text-gray-500">
                    Không tìm thấy người dùng nào.
                  </p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user._id}
                      className="user-item bg-white p-4 rounded-lg shadow mb-4"
                    >
                      <div className="flex items-center mb-4">
                        <Avatar avatarUrl={user.avatar} size={40} />
                        <div className="ml-3">
                          <Link
                            to={`/profile/${user._id}`}
                            className="font-bold hover:underline"
                          >
                            {user.username}
                          </Link>
                          <p className="text-gray-500 text-sm">
                            {user.bio || "Chưa có mô tả"}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {user.followers?.length || 0} người theo dõi
                          </p>
                        </div>
                        <div className="ml-auto">
                          <button
                            onClick={() => navigate(`/profile/${user._id}`)}
                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                          >
                            Xem hồ sơ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="post-results">
                <h2 className="text-lg font-bold mb-4">Kết quả bài đăng</h2>
                {posts.length === 0 ? (
                  <p className="text-center text-gray-500">
                    Không tìm thấy bài đăng nào.
                  </p>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post._id}
                      className="post-item bg-white p-4 rounded-lg shadow mb-4"
                    >
                      <Link to={`/post/${post._id}`}>
                        <div className="flex items-center mb-4 relative">
                          <Avatar avatarUrl={post.author.avatar} size={40} />
                          <div className="ml-3">
                            <Link
                              to={`/profile/${post.author._id}`}
                              className="font-bold hover:underline"
                            >
                              {post.author.username}
                            </Link>
                            <div className="text-gray-500 text-sm flex items-center">
                              {formatPostTime(post.createdAt)}{" "}
                              <div className="text-gray-500 text-sm ml-2">
                                <div className="relative group">
                                  {post.visibility === "public" && (
                                    <svg
                                      className="w-4 h-4"
                                      viewBox="0 0 16 16"
                                      width="12"
                                      height="12"
                                      fill="currentColor"
                                      title="Đã chia sẻ với Công khai"
                                    >
                                      <title>Đã chia sẻ với Công khai</title>
                                      <g
                                        fill-rule="evenodd"
                                        transform="translate(-448 -544)"
                                      >
                                        <g>
                                          <path
                                            d="M109.5 408.5c0 3.23-2.04 5.983-4.903 7.036l.07-.036c1.167-1 1.814-2.967 2-3.834.214-1 .303-1.3-.5-1.96-.31-.253-.677-.196-1.04-.476-.246-.19-.356-.59-.606-.73-.594-.337-1.107.11-1.954.223a2.666 2.666 0 0 1-1.15-.123c-.007 0-.007 0-.013-.004l-.083-.30c-.164-.082-.077-.206.006-.36h-.006c.086-.17.086-.376-.05-.529-.19-.214-.54-.214-.804-.224-.106-.003-.21 0-.313.004l-.003-.004c-.04 0-.084.004-.124.004h-.037c-.323.007-.666-.034-.893-.314-.263-.353-.29-.733.097-1.09.28-.26.863-.8 1.807-.22.603.37 1.166.667 1.666.5.33-.11.48-.303.094-.87a1.128 1.128 0 0 1-.214-.73c.067-.776.687-.84 1.164-1.2.466-.356.68-.943.546-1.457-.106-.413-.51-.873-1.28-1.01a7.49 7.49 0 0 1 6.524 7.434"
                                            transform="translate(354 143.5)"
                                          ></path>
                                          <path
                                            d="M104.107 415.696A7.498 7.498 0 0 1 94.5 408.5a7.48 7.48 0 0 1 3.407-6.283 5.474 5.474 0 0 0-1.653 2.334c-.753 2.217-.217 4.075 2.29 4.075.833 0 1.4.561 1.333 2.375-.013.403.52 1.78 2.45 1.89.7.04 1.184 1.053 1.33 1.74.06.29.127.65.257.97a.174.174 0 0 0 .193.096"
                                            transform="translate(354 143.5)"
                                          ></path>
                                          <path
                                            fill-rule="nonzero"
                                            d="M110 408.5a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-1 0a7 7 0 1 0-14 0 7 7 0 0 0 14 0z"
                                            transform="translate(354 143.5)"
                                          ></path>
                                        </g>
                                      </g>
                                    </svg>
                                  )}
                                  {post.visibility === "friends" && (
                                    <img
                                      className="x1b0d499 x1d69dk1"
                                      alt="Bạn bè"
                                      height="14"
                                      width="14"
                                      src="https://static.xx.fbcdn.net/rsrc.php/v4/yJ/r/zPcex_q0TM1.png"
                                    />
                                  )}
                                  {post.visibility === "only_me" && (
                                    <img
                                      className="x1b0d499 x1d69dk1"
                                      alt="Chỉ mình tôi"
                                      height="14"
                                      width="14"
                                      src="https://static.xx.fbcdn.net/rsrc.php/v4/yc/r/57iQDgPFByS.png"
                                    />
                                  )}
                                  <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-5 bottom-full mb-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                    {post.visibility === "public" &&
                                      "Bất cứ ai"}
                                    {post.visibility === "friends" && "Bạn bè"}
                                    {post.visibility === "only_me" &&
                                      "Chỉ mình tôi"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={(e) => openMenu(e, post._id)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="post-content">{post.content}</p>
                          <p className="post-hashtags">
                            {post.hashtags?.length > 0
                              ? post.hashtags.map((hashtag, index) => (
                                  <span
                                    key={index}
                                    className="hashtag text-blue-500"
                                  >
                                    {hashtag}{" "}
                                  </span>
                                ))
                              : ""}
                          </p>
                        </div>
                      </Link>
                      {(post.images?.length > 0 || post.videos?.length > 0) && (
                        <Swiper
                          spaceBetween={8}
                          slidesPerView="auto"
                          freeMode={true}
                          className="mb-4"
                        >
                          {post.images?.map((image, index) => (
                            <SwiperSlide
                              key={`image-${post._id}-${index}`}
                              className="!w-auto !h-auto"
                            >
                              <div
                                className="relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                                style={{
                                  width: "auto",
                                  height: "100%",
                                  aspectRatio:
                                    mediaDimensions[`${post._id}-${index}`]
                                      ?.width /
                                      mediaDimensions[`${post._id}-${index}`]
                                        ?.height || "1/1",
                                  maxWidth: "580px",
                                  maxHeight: "400px",
                                }}
                                onClick={() => {
                                  setSelectedMedia(image);
                                  setIsModalOpen(true);
                                }}
                              >
                                <img
                                  src={image}
                                  alt={`Hình ảnh ${index + 1}`}
                                  className="object-cover w-full h-full"
                                  loading="lazy"
                                  onLoad={(e) =>
                                    handleUpdateDimensions(
                                      post._id,
                                      index,
                                      e.target.naturalWidth,
                                      e.target.naturalHeight
                                    )
                                  }
                                />
                              </div>
                            </SwiperSlide>
                          ))}
                          {post.videos?.map((video, index) => (
                            <SwiperSlide
                              key={`video-${post._id}-${index}`}
                              className="!w-auto !h-auto"
                            >
                              <div
                                className="relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                                style={{
                                  width: "auto",
                                  height: "100%",
                                  aspectRatio:
                                    mediaDimensions[`${post._id}-${index}`]
                                      ?.width /
                                      mediaDimensions[`${post._id}-${index}`]
                                        ?.height || "1/1",
                                  maxWidth: "580px",
                                  maxHeight: "400px",
                                }}
                                onClick={() => {
                                  setSelectedMedia(video);
                                  setIsModalOpen(true);
                                }}
                              >
                                <video
                                  className="object-cover w-full h-full"
                                  controls
                                  autoPlay={false}
                                  loop
                                  onLoadedMetadata={(e) =>
                                    handleUpdateDimensions(
                                      post._id,
                                      index,
                                      e.target.videoWidth,
                                      e.target.videoHeight
                                    )
                                  }
                                  onMouseDown={preventDefaultDrag}
                                  onTouchStart={preventDefaultDrag}
                                >
                                  <source src={video} type="video/mp4" />
                                  Trình duyệt không hỗ trợ video.
                                </video>
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      )}
                      <Link to={`/post/${post._id}`}>
                        <div className="flex items-center mt-4 text-gray-500">
                          <div className="flex items-center">
                            <i className="fa fa-heart heart-icon"></i>
                            <span className="ml-1">{post.likesCount || 0}</span>
                          </div>
                          <div className="flex items-center ml-4">
                            <i className="fas fa-comment"></i>
                            <span className="ml-1">
                              {post.commentsCount || 0}
                            </span>
                          </div>
                          <div className="flex items-center ml-4">
                            <i className="fas fa-share"></i>
                            <span className="ml-1">0</span>
                          </div>
                        </div>
                      </Link>
                      {menuOpen && selectedPostId === post._id && (
                        <div
                          className="menu-container absolute bg-white shadow-lg rounded p-2 z-10"
                          style={{ top: menuPosition.y, left: menuPosition.x }}
                        >
                          <button
                            onClick={() => handleNotInterested(post._id)}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.29-9.29c.39.39.39 1.02 0 1.41l-2.83 2.83c-.39.39-1.02.39-1.41 0l-2.83-2.83c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L12 12.59l2.88-2.88c.39-.39 1.02-.39 1.41 0z" />
                            </svg>
                            Không hứng thú
                          </button>
                          <button
                            onClick={(e) => handleReport(e, post._id)}
                            className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 flex items-center"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                            </svg>
                            Báo cáo
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <MediaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mediaUrl={selectedMedia}
        />

        {isReportModalOpen && selectedPostId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Báo cáo bài viết</h2>
                <button
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setReportReason("");
                    setSelectedPostId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Báo cáo của bạn là ẩn danh. Nếu ai đó đang gặp nguy hiểm, hãy
                liên hệ với dịch vụ khẩn cấp tại địa phương - đừng chờ đợi.
              </p>
              <h3 className="font-semibold mb-2">
                Tại sao bạn báo cáo bài viết này?
              </h3>
              <div className="space-y-2">
                {[
                  { value: "dislike", label: "Tôi không thích bài viết này" },
                  {
                    value: "bullying",
                    label: "Bắt nạt hoặc liên hệ không mong muốn",
                  },
                  {
                    value: "self_harm",
                    label: "Tự tử, tự làm hại hoặc rối loạn ăn uống",
                  },
                  {
                    value: "violence",
                    label: "Bạo lực, thù địch hoặc khai thác",
                  },
                  {
                    value: "restricted_items",
                    label: "Bán hoặc quảng bá các mặt hàng bị hạn chế",
                  },
                  {
                    value: "nudity",
                    label: "Ảnh khỏa thân hoặc hoạt động tình dục",
                  },
                  { value: "scam", label: "Lừa đảo, gian lận hoặc thư rác" },
                  { value: "false_info", label: "Thông tin sai lệch" },
                  { value: "intellectual_property", label: "Tài sản trí tuệ" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={option.value}
                      checked={reportReason === option.value}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="mr-2 mb-0"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setReportReason("");
                    setSelectedPostId(null);
                  }}
                  className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={submitReport}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  disabled={!reportReason || !selectedPostId}
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
