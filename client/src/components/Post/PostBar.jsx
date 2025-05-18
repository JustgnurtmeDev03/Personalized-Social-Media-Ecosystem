import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../../styles/Post.css";
import api from "../../services/threadService";
import "font-awesome/css/font-awesome.min.css";
import io from "socket.io-client";
import Avatar from "../../assets/Avatar";
import { fetchUserProfile } from "../../services/userService";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useAuth } from "../../providers/AuthContext";

const PostBar = ({ onClick }) => {
  // State cho thông tin người dùng
  const { auth } = useAuth();

  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // State cho danh sách bài viết
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [postsError, setPostsError] = useState(null);
  const [postsLoading, setPostsLoading] = useState(true);

  const socket = useRef(null);

  const [mediaDimensions, setMediaDimensions] = useState(
    posts.map(() => ({ width: null, height: null }))
  );

  // HÀM LẤY THÔNG TIN NGƯỜI DÙNG
  const fetchUserData = async () => {
    try {
      if (!auth.accessToken || !auth.userId) {
        throw new Error("Không có token hoặc userId để xác thực");
      }
      const user = await fetchUserProfile(auth.userId, {
        // Sử dụng auth.userId thay vì userId từ useParams
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setUserData(user);
    } catch (error) {
      setUserError("Lỗi khi lấy thông tin người dùng");
      console.error(error);
    } finally {
      setUserLoading(false);
    }
  };

  // Hàm lấy danh sách bài viết và bài viết đã thích
  const fetchPosts = async () => {
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) {
        throw new Error("Không có token để xác thực");
      }

      // Lấy danh sách bài viết
      const postsResponse = await api.get("/posts", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      const postsData = postsResponse.data.posts || [];

      // Lấy danh sách bài viết đã thích
      const likedPostsResponse = await api.get("/posts/liked", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      const likedPostsData = likedPostsResponse.data || [];

      // Kết hợp dữ liệu bài viết với trạng thái isLiked
      const formattedPosts = postsData.map((post) => ({
        ...post,
        isLiked: likedPostsData.some(
          (likedPost) => likedPost && likedPost._id === post._id
        ),
      }));

      setPosts(formattedPosts);
      setLikedPosts(likedPostsData);
    } catch (error) {
      setPostsError("Lỗi khi tải bài viết");
      console.error(error);
    } finally {
      setPostsLoading(false);
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

  // useEffect để lấy thông tin người dùng
  useEffect(() => {
    if (auth.userId) {
      fetchUserData();
    } else {
      setUserError("Không có userId để lấy thông tin người dùng");
      setUserLoading(false);
    }
  }, [auth.userId]);
  // useEffect để lấy danh sách bài viết (chỉ chạy khi đã có userData)
  useEffect(() => {
    if (userData) {
      fetchPosts();
    }
  }, [userData]);

  // useEffect cho socket.io để xử lý like realtime
  useEffect(() => {
    socket.current = io("http://localhost:3000");
    socket.current.on("connect", () => {
      socket.current.emit("getLikedPosts");
    });
    socket.current.on("likedPosts", (data) => {
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

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, []);

  // Ngăn chặn sự kiện mặc định trên video khi kéo
  const preventDefaultDrag = (e) => {
    e.preventDefault();
  };

  // HÀM ĐỊNH DẠNG THỜI GIAN BÀI VIẾT
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

  // Hàm xử lý like/unlike bài viết
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
      console.error("Bài viết không còn tồn tại hoặc đã bị xóa");
    }
  };

  // Xử lý giao diện khi đang tải hoặc có lỗi
  if (userError) {
    return <p>{userError}</p>;
  }

  if (userLoading) {
    return <p>Đang tải thông tin người dùng...</p>;
  }

  if (!userData) {
    return <p>Không tìm thấy thông tin người dùng.</p>;
  }

  // Giao diện chính
  return (
    <div className="bg-gray-100 p-4">
      <div className="post-container">
        {/* Thanh đăng bài */}
        <div className="post-bar">
          <Avatar _id={userData._id} avatarUrl={userData.avatar} size={50} />
          <input
            type="text"
            placeholder="Bắt đầu thread..."
            className="post-input"
            readOnly
            onClick={onClick}
          />
          <button className="post-button-bar" onClick={onClick}>
            Đăng
          </button>
        </div>

        {/* Hiển thị danh sách bài viết */}
        {postsError ? (
          <p>{postsError}</p>
        ) : postsLoading ? (
          <p>Đang tải bài viết...</p>
        ) : Array.isArray(posts) && posts.length > 0 ? (
          posts.map((post) => (
            <div className="posts-content max-w-l bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Avatar
                  _id={post.author?._id}
                  avatarUrl={post.author?.avatar}
                  size={40}
                />
                <div className="ml-3">
                  <Link
                    to={`/profile/${post.author?._id}`}
                    className="font-bold hover:underline"
                  >
                    {post.author?.username}
                  </Link>
                  <div className="text-gray-500 text-sm">
                    {formatPostTime(post.createdAt)}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <p className="post-content">{post.content}</p>
                <p className="post-hashtags">
                  {Array.isArray(post.hashtags) ? (
                    post.hashtags.map((hashtag, index) => (
                      <span key={index} className="hashtag">
                        {hashtag}{" "}
                      </span>
                    ))
                  ) : (
                    <span>Không có hashtag</span>
                  )}
                </p>
                <p className="text-lg post-translate">Dịch</p>
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
              <div className="flex items-center mt-4 text-gray-500">
                <button
                  className={`like-button ${post.isLiked ? "liked" : ""}`}
                  onClick={() => handleToggleLike(post._id)}
                >
                  <i className="fa fa-heart heart-icon"></i>
                  <span className="ml-1">{post.likesCount}</span>
                </button>
                <div className="flex items-center mr-4">
                  <i className="fas fa-comment"></i>
                  <span className="ml-1">0</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-share"></i>
                  <span className="ml-1">0</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>Không có bài viết nào để hiển thị.</p>
        )}
      </div>
    </div>
  );
};

export default PostBar;
