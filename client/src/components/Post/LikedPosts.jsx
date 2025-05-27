// src/components/PostBar.jsx
import React, { useState, useEffect, useRef } from "react";
import "../../styles/Post.css";
import api from "../../services/threadService";
import { Loading } from "../Loading/Loading";
import "font-awesome/css/font-awesome.min.css";
import io from "socket.io-client";
import Avatar from "../../assets/Avatar";
import { fetchUserProfile } from "../../services/userService";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const LikedPosts = ({ onClick }) => {
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useRef(null);

  // State cho thông tin người dùng
  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [mediaDimensions, setMediaDimensions] = useState(
    posts.map(() => ({ width: null, height: null }))
  );

  // ======================== LOGIC ===========================

  // HÀM LẤY THÔNG TIN NGƯỜI DÙNG
  const fetchUserData = async () => {
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) {
        throw new Error("Không có token để xác thực");
      }
      const user = await fetchUserProfile(authToken);
      setUserData(user);
    } catch (error) {
      setUserError("Lỗi khi lấy thông tin người dùng");
      console.error(error);
    } finally {
      setUserLoading(false);
    }
  };

  // Xử lý thời gian đăng bài
  const formatPostTime = (createdAt) => {
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
  };

  const handleToggleLike = async (postId) => {
    try {
      const authToken = localStorage.getItem("accessToken");
      const response = await api.post(
        "/like",
        { threadId: postId },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // Cập nhật trạng thái like của bài viết
        const { isLiked, likesCount } = response.data;
        socket.current.emit("likePost", { postId, isLiked, likesCount });
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId ? { ...post, isLiked, likesCount } : post
          )
        );
        setLikedPosts((prevLikedPosts) =>
          isLiked
            ? [...prevLikedPosts, postId]
            : prevLikedPosts.filter((likedPostId) => likedPostId !== postId)
        );
      }
    } catch (err) {
      console.error("Thread no longer exists or has been deleted");
    }
  };

  // Xử lý hiển thị bản xem trước ảnh/video hiển thị hướng của bức ảnh (ngang/dọc)
  const updateOrientation = (idx, width, height) => {
    setPosts((prev) => {
      const clone = [...prev];
      clone[idx] = {
        ...clone[idx],
        orientation: width > height ? "landscape" : "portrait",
      };
      return clone;
    });
  };

  // Xử lý để hiển thị bản xem trước ảnh/video cùng kích thước và tỷ lệ
  const handleUpdateDimensions = (index, width, height) => {
    const newDimensions = [...mediaDimensions];
    newDimensions[index] = { width, height };
    setMediaDimensions(newDimensions);

    // Gọi updateOrientation để cập nhật orientation (landscape/portrait)
    updateOrientation(index, width, height);
  };

  // ======================== EFFECTS ===========================

  // useEffect để lấy thông tin người dùng
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const authToken = localStorage.getItem("accessToken");

        // Lấy danh sách các bài viết từ API chính
        const postsResponse = await api.get("/posts", {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        const likedPostsResponse = await api.get("/posts/liked", {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        // Lấy tất cả bài viết đã thích từ response
        const likedPostsData = likedPostsResponse.data || [];

        // Lọc các bài viết chính
        const postsData = postsResponse.data.posts || [];

        // Kiểm tra và kết hợp dữ liệu bài viết đã thích
        const formattedPosts = postsData.map((post) => ({
          ...post,
          isLiked: likedPostsData.some(
            (likedPost) => likedPost && likedPost._id === post._id // Kiểm tra nếu post._id có trong likedPostsData
          ),
        }));

        // Chỉ lưu các bài viết đã được thích
        setPosts(formattedPosts.filter((post) => post.isLiked));
        setLikedPosts(likedPostsData); // Lưu toàn bộ bài viết đã thích (hoặc nếu cần chỉ lưu thông tin cần thiết)
      } catch (error) {
        setError(
          "Bạn chưa yêu thích bất kỳ bài viết nào hoặc đã có lỗi xảy ra khi tải bài viết."
        );
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();

    socket.current = io("http://localhost:3000");

    // Xử lý sự kiện nhận
    socket.current.on("connect", () => {
      socket.current.emit("getLikedPosts");
    });
    socket.current.on("likedPosts", (data) => {
      console.log("Connected to server");
      const { postId, isLiked, likesCount } = data;
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, isLiked, likesCount } : post
        )
      );
      setLikedPosts((prevLikedPosts) =>
        isLiked
          ? [...prevLikedPosts, postId]
          : prevLikedPosts.filter((likedPostId) => likedPostId !== postId)
      );
    });
    if (socket.connected) {
      console.log("Socket is connected");
    }

    // Xóa kết nối WebSocket khi component unmount (tùy chọn)
    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, []);

  // Ngăn chặn sự kiện mặc định trên video khi kéo
  const preventDefaultDrag = (e) => {
    e.preventDefault();
  };

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <p>{error}</p>;
  }

  // ======================== RENDER ===========================

  return (
    <div class="bg-gray-100 p-4">
      <div className="post-container">
        {Array.isArray(posts) && posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              class="posts-content max-w-l bg-white p-4 rounded-lg shadow-md"
            >
              <div class="flex items-center mb-4">
                <Avatar
                  _id={post.author?._id}
                  avatarUrl={post.author?.avatar}
                  size={40}
                />
                <div class="ml-3">
                  <div class="font-bold">{post.author?.username}</div>
                  <div class="text-gray-500 text-sm">
                    {formatPostTime(post.createdAt)}
                  </div>
                </div>
              </div>
              <div class="mb-4">
                <p class="post-content">{post.content}</p>
                <p className="post-hashtags">
                  {Array.isArray(post.hashtags) ? (
                    post.hashtags.map((hashtag, index) => (
                      <span key={index} className="hashtag">
                        {hashtag}{" "}
                      </span>
                    ))
                  ) : (
                    <span>No hashtags available</span>
                  )}
                </p>
                <p class="text-lg post-translate">Translate</p>
              </div>
              <div className="grid">
                <Swiper
                  spaceBetween={8}
                  slidesPerView="auto"
                  freeMode={true}
                  style={{ display: "flex", alignItems: "flex-start" }}
                >
                  {post.images?.length > 0 && (
                    <div className="post-image">
                      {post.images.map((image, index) => (
                        <SwiperSlide
                          key={index}
                          className="!w-auto !h-auto incline- cursor-grab"
                        >
                          <div
                            className="relative flex-shrink-0 w-48 md:w-56 rounded-lg overflow-hidden bg-gray-100"
                            style={{
                              width: "auto", // Chiều rộng tự điều chỉnh theo tỷ lệ
                              height: "100%", // Chiều cao sẽ bị giới hạn bởi maxHeight
                              aspectRatio:
                                mediaDimensions[index]?.width /
                                  mediaDimensions[index]?.height || "1/1", // Giữ tỷ lệ gốc
                              maxWidth: "650px",
                              maxHeight: "400px",
                            }}
                          >
                            <img
                              key={index}
                              src={image}
                              alt={`Hình ảnh ${index + 1}`}
                              className="object-cover w-full h-full"
                              loading="lazy"
                              onLoad={(e) =>
                                handleUpdateDimensions(
                                  index,
                                  e.target.naturalWidth,
                                  e.target.naturalHeight
                                )
                              }
                            />
                          </div>
                        </SwiperSlide>
                      ))}
                    </div>
                  )}
                  {post.videos?.length > 0 &&
                    post.videos.every((video) => video.startsWith("http")) && (
                      <div className="post-videos">
                        {post.videos.map((video, index) => (
                          <SwiperSlide
                            key={index}
                            className="!w-auto !h-auto incline- cursor-grab"
                          >
                            <div
                              className="relative flex-shrink-0 w-48 md:w-56 rounded-lg overflow-hidden bg-gray-100"
                              style={{
                                width: "auto", // Chiều rộng tự điều chỉnh theo tỷ lệ
                                height: "100%", // Chiều cao sẽ bị giới hạn bởi maxHeight
                                aspectRatio:
                                  mediaDimensions[index]?.width /
                                    mediaDimensions[index]?.height || "1/1", // Giữ tỷ lệ gốc
                                maxWidth: "650px",
                                maxHeight: "400px",
                              }}
                            >
                              <video
                                key={index}
                                className="object-cover w-full h-full"
                                controls
                                autoPlay
                                loop
                                onLoadedMetadata={(e) =>
                                  handleUpdateDimensions(
                                    index,
                                    e.target.videoWidth,
                                    e.target.videoHeight
                                  )
                                }
                                onMouseDown={preventDefaultDrag} // Ngăn sự kiện kéo mặc định
                                onTouchStart={preventDefaultDrag} // Ngăn sự kiện kéo mặc định trên cảm ứng
                                style={{ pointerEvents: "auto" }}
                              >
                                <source src={video} type="video/mp4" />
                                Trình duyệt của bạn không hỗ trợ video.
                              </video>
                            </div>
                          </SwiperSlide>
                        ))}
                      </div>
                    )}
                </Swiper>
              </div>
              <div class="flex items-center mt-4 text-gray-500">
                <button
                  className={`like-button ${post.isLiked ? "liked" : ""}`}
                  onClick={() => handleToggleLike(post._id)}
                >
                  <i className="fa fa-heart heart-icon"></i>
                  <span class="ml-1">{post.likesCount}</span>
                </button>
                <div class="flex items-center mr-4">
                  <i class="fas fa-comment"></i>
                  <span class="ml-1">0</span>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-share"></i>
                  <span class="ml-1">0</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>Bạn chưa yêu thích bất kỳ bài viết nào.</p>
        )}
      </div>
    </div>
  );
};

export default LikedPosts;
