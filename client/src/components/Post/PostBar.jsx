import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "../../styles/Post.css";
import api from "../../services/threadService";
import "font-awesome/css/font-awesome.min.css";
import io from "socket.io-client";
import Avatar from "../../assets/Avatar";
import { Loading } from "../Loading/Loading";
import {
  fetchUserProfile,
  fetchFollowing,
  followUser,
} from "../../services/userService";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useAuth } from "../../providers/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Component Modal để hiển thị ảnh/video toàn màn hình
const MediaModal = ({ isOpen, onClose, mediaUrl }) => {
  if (!isOpen) return null;

  const isVideo = mediaUrl.endsWith(".mp4");

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

const PostBar = ({ onClick }) => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [recommendedError, setRecommendedError] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [mediaDimensions, setMediaDimensions] = useState({});
  const [viewedPosts, setViewedPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const socket = useRef(null);

  console.log("Auth data:", auth);
  console.log(auth.userId);

  const fetchUserData = useCallback(async () => {
    try {
      if (!auth.accessToken || !auth.userId) {
        throw new Error("Không có token hoặc userId để xác thực");
      }
      const user = await fetchUserProfile(auth.userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setUserData({
        ...user,
        avatar: user.avatar || "",
      });
    } catch (error) {
      setUserError("Không thể tải thông tin người dùng. Vui lòng thử lại.");
      console.error("Error fetching user data:", error.message);
    } finally {
      setUserLoading(false);
    }
  }, [auth.accessToken, auth.userId]);

  const {
    data: currentUserFollowing = [],
    isLoading: isFollowingLoading,
    isError: isFollowingError,
  } = useQuery({
    queryKey: ["currentUserFollowing", auth.accessToken, auth.userId],
    queryFn: async () => {
      if (!auth.accessToken || !auth.userId) {
        throw new Error("No access token or userId");
      }
      const following = await fetchFollowing(auth.userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return following.map((u) => u._id);
    },
    enabled: !!auth.accessToken && !!auth.userId,
  });

  const fetchRecommendedPosts = useCallback(async () => {
    setRecommendedLoading(true);
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken || !auth.userId) {
        throw new Error("Không có token hoặc userId để xác thực");
      }

      const likedPostsResponse = await api.get("/posts/liked", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const likedPostsData = Array.isArray(likedPostsResponse.data)
        ? likedPostsResponse.data.filter(
            (post) => post && typeof post === "object" && post._id
          )
        : [];
      console.log("Liked Posts Data:", likedPostsData);

      const response = await api.get("/recommended", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log("Recommended API Response:", response.data);

      const recommendedPostsData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      if (!recommendedPostsData.length) {
        console.log("Không nhận được bài viết đề xuất từ API.");
        setRecommendedPosts([]);
        return;
      }

      const validPosts = recommendedPostsData.filter((post) => {
        if (!post || typeof post !== "object" || !post._id) {
          console.warn("Invalid post:", post);
          return false;
        }
        if (
          !post.author ||
          typeof post.author !== "object" ||
          !post.author._id
        ) {
          console.warn("Invalid author in post:", post);
          return false;
        }
        return true;
      });
      console.log("Valid Posts:", validPosts);

      if (!validPosts.length) {
        console.log("Không có bài viết hợp lệ sau khi lọc.");
        setRecommendedPosts([]);
        return;
      }

      const authorIds = [...new Set(validPosts.map((post) => post.author._id))];
      const authorMap = {};

      const postsWithMissingAvatar = validPosts.filter(
        (post) => !post.author.avatar || typeof post.author.avatar !== "string"
      );
      if (postsWithMissingAvatar.length > 0 && authorIds.length > 0) {
        const authorPromises = authorIds.map(async (id) => {
          try {
            const author = await fetchUserProfile(id, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!author || typeof author !== "object" || !author._id) {
              console.warn(`Invalid author data for ID ${id}:`, author);
              return null;
            }
            return author;
          } catch (error) {
            console.error(`Error fetching author ${id}:`, error.message);
            return null;
          }
        });
        const authors = await Promise.all(authorPromises);
        authors.forEach((author) => {
          if (author && author._id) {
            authorMap[author._id] = author;
          }
        });
        console.log("Author Map:", authorMap);
      }

      const formattedRecommendedPosts = validPosts.map((post) => {
        const authorFromMap = authorMap[post.author._id];
        const author =
          authorFromMap && authorFromMap.avatar ? authorFromMap : post.author;
        return {
          ...post,
          isLiked: likedPostsData.some(
            (likedPost) => likedPost._id === post._id
          ),
          author: {
            _id: author._id || "",
            username: author.username || "Anonymous",
            avatar: typeof author.avatar === "string" ? author.avatar : "",
          },
          createdAt: post.createdAt
            ? new Date(post.createdAt).toISOString()
            : new Date().toISOString(),
          images: Array.isArray(post.images) ? post.images : [],
          videos: Array.isArray(post.videos) ? post.videos : [],
        };
      });

      console.log("Formatted Recommended Posts:", formattedRecommendedPosts);
      setRecommendedPosts(formattedRecommendedPosts);
      setLikedPosts(likedPostsData.map((post) => post._id).filter(Boolean));
    } catch (error) {
      setRecommendedError(`Không thể tải bài viết đề xuất: ${error.message}`);
      console.error("Error fetching recommended posts:", error);
    } finally {
      setRecommendedLoading(false);
    }
  }, [auth.userId]);

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

  const handleToggleLike = useCallback(
    async (e, postId) => {
      e.stopPropagation();
      e.preventDefault();

      const isCurrentlyLiked = likedPosts.includes(postId);
      const optimisticIsLiked = !isCurrentlyLiked;
      const optimisticLikesCount = optimisticIsLiked
        ? (recommendedPosts.find((p) => p._id === postId)?.likesCount || 0) + 1
        : (recommendedPosts.find((p) => p._id === postId)?.likesCount || 0) - 1;

      setRecommendedPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                isLiked: optimisticIsLiked,
                likesCount: optimisticLikesCount,
              }
            : post
        )
      );
      setLikedPosts((prev) =>
        optimisticIsLiked
          ? [...prev, postId]
          : prev.filter((id) => id !== postId)
      );

      try {
        const authToken = localStorage.getItem("accessToken");
        const response = await api.post(
          "/like",
          {
            user_id: auth.userId,
            threadId: postId,
            isLiked: optimisticIsLiked,
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.status === 200) {
          const { isLiked, likesCount } = response.data;
          socket.current.emit("likePost", { postId, isLiked, likesCount });

          setRecommendedPosts((prev) =>
            prev.map((post) =>
              post._id === postId ? { ...post, isLiked, likesCount } : post
            )
          );
          setLikedPosts((prev) =>
            isLiked ? [...prev, postId] : prev.filter((id) => id !== postId)
          );
        } else {
          setRecommendedPosts((prev) =>
            prev.map((post) =>
              post._id === postId
                ? {
                    ...post,
                    isLiked: isCurrentlyLiked,
                    likesCount: post.likesCount,
                  }
                : post
            )
          );
          setLikedPosts((prev) =>
            isCurrentlyLiked
              ? [...prev, postId]
              : prev.filter((id) => id !== postId)
          );
          console.error("API trả về trạng thái không thành công");
        }
      } catch (error) {
        setRecommendedPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  isLiked: isCurrentlyLiked,
                  likesCount: post.likesCount,
                }
              : post
          )
        );
        setLikedPosts((prev) =>
          isCurrentlyLiked
            ? [...prev, postId]
            : prev.filter((id) => id !== postId)
        );
        console.error("Lỗi khi xử lý lượt thích:", error.message);
      }
    },
    [auth.userId, likedPosts, recommendedPosts]
  );

  const handleFollow = async (e, targetUserId) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await followUser(auth.userId, targetUserId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      queryClient.setQueryData(
        ["currentUserFollowing", auth.accessToken, auth.userId],
        (old) => [...old, targetUserId]
      );
    } catch (error) {
      console.error("Lỗi khi theo dõi:", error);
    }
  };

  useEffect(() => {
    socket.current = io("http://localhost:8000", { path: "/socket.io" });
    socket.current.on("connect", () => {
      socket.current.emit("getLikedPosts");
      console.log("Socket.IO connected");
    });
    socket.current.on("likePost", ({ postId, isLiked, likesCount }) => {
      setRecommendedPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, isLiked, likesCount } : post
        )
      );
      setLikedPosts((prev) =>
        isLiked ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        console.log("Socket.IO disconnected");
      }
    };
  }, []);

  useEffect(() => {
    if (auth.userId) {
      fetchUserData();
    } else {
      setUserError("Vui lòng đăng nhập để tiếp tục.");
      setUserLoading(false);
    }
  }, [auth.userId, fetchUserData]);

  useEffect(() => {
    if (userData) {
      fetchRecommendedPosts();
    }
  }, [userData, fetchRecommendedPosts]);

  const preventDefaultDrag = (e) => e.preventDefault();

  if (userLoading || isFollowingLoading) {
    return <Loading />;
  }

  if (userError || isFollowingError) {
    return (
      <p className="text-center text-red-500">
        {userError || "Lỗi khi tải dữ liệu theo dõi"}
      </p>
    );
  }

  if (!userData) {
    return <p className="text-center">Không tìm thấy thông tin người dùng.</p>;
  }

  return (
    <div className="bg-gray-100 p-4">
      <div className="post-container max-w-2xl mx-auto">
        <div className="post-bar flex items-center bg-white p-3 rounded-lg shadow mb-4">
          <Avatar
            _id={userData?._id || ""}
            avatarUrl={userData?.avatar || ""}
            size={40}
            className="w-6 h-6 rounded-full object-cover"
          />
          <input
            type="text"
            placeholder="Bắt đầu một bài viết..."
            className="post-input flex-1 mx-3 p-2 border rounded"
            readOnly
            onClick={onClick}
          />
          <button
            className="post-button-bar bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={onClick}
          >
            Đăng
          </button>
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-4">Dành cho bạn</h2>
          {recommendedError ? (
            <p className="text-center text-red-500">{recommendedError}</p>
          ) : recommendedLoading ? (
            <p className="text-center">Đang tải bài viết đề xuất...</p>
          ) : recommendedPosts.length > 0 ? (
            recommendedPosts.map((post) => (
              <div
                key={post._id}
                className="posts-content bg-white p-4 rounded-lg shadow mb-4"
              >
                <Link to={`/post/${post._id}`}>
                  <div className="flex items-center mb-4 relative">
                    <Avatar
                      _id={post.author._id}
                      avatarUrl={post.author.avatar}
                      size={40}
                    />
                    {auth.userId !== post.author._id &&
                      !currentUserFollowing.includes(post.author._id) && (
                        <button
                          className="follow-btn border-white absolute left-6 top-6 bg-black text-white text-center rounded-full w-4 h-4 flex items-center justify-center text-sm z-10"
                          onClick={(e) => handleFollow(e, post.author._id)}
                        >
                          <svg
                            aria-label="Follow"
                            role="img"
                            viewBox="0 0 10 9"
                          >
                            <title>Follow</title>
                            <path d="M4.99512 8.66895C4.64355 8.66895 4.35059 8.36621 4.35059 8.03418V5.12891H1.50391C1.17188 5.12891 0.864258 4.83594 0.864258 4.47949C0.864258 4.12793 1.17188 3.83008 1.50391 3.83008H4.35059V0.924805C4.35059 0.583008 4.64355 0.290039 4.99512 0.290039C5.35156 0.290039 5.64453 0.583008 5.64453 0.924805V3.83008H8.49121C8.83301 3.83008 9.13086 4.12793 9.13086 4.47949C9.13086 4.83594 8.83301 5.12891 8.49121 5.12891H5.64453V8.03418C5.64453 8.36621 5.35156 8.66895 4.99512 8.66895Z"></path>
                          </svg>
                        </button>
                      )}
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
                                class="x1b0d499 x1d69dk1"
                                alt="Bạn bè"
                                height="14"
                                width="14"
                                src="https://static.xx.fbcdn.net/rsrc.php/v4/yJ/r/zPcex_q0TM1.png"
                              />
                            )}
                            {post.visibility === "only_me" && (
                              <img
                                class="x1b0d499 x1d69dk1"
                                alt="Chỉ mình tôi"
                                height="14"
                                width="14"
                                src="https://static.xx.fbcdn.net/rsrc.php/v4/yc/r/57iQDgPFByS.png"
                              />
                            )}
                            <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-5 bottom-full mb-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                              {post.visibility === "public" && "Bất cứ ai"}
                              {post.visibility === "friends" && "Bạn bè"}
                              {post.visibility === "only_me" && "Chỉ mình tôi"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="post-content">{post.content}</p>
                    <p className="post-hashtags">
                      {post.hashtags.length > 0
                        ? post.hashtags.map((hashtag, index) => (
                            <span key={index} className="hashtag text-blue-500">
                              {hashtag}{" "}
                            </span>
                          ))
                        : ""}
                    </p>
                    <span className="text-gray-500"></span>
                  </div>
                </Link>
                {(post.images.length > 0 || post.videos.length > 0) && (
                  <Swiper
                    spaceBetween={8}
                    slidesPerView="auto"
                    freeMode={true}
                    className="mb-4"
                  >
                    {post.images.map((image, index) => (
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
                              mediaDimensions[`${post._id}-${index}`]?.width /
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
                    {post.videos.map((video, index) => (
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
                              mediaDimensions[`${post._id}-${index}`]?.width /
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
                    <button
                      className={`like-button ${
                        post.isLiked ? "liked text-red-500" : ""
                      }`}
                      onClick={(e) => handleToggleLike(e, post._id)}
                    >
                      <i className="fa fa-heart heart-icon"></i>
                      <span className="ml-1">{post.likesCount}</span>
                    </button>
                    <div className="flex items-center ml-4">
                      <i className="fas fa-comment"></i>
                      <span className="ml-1">{post.commentsCount}</span>
                    </div>
                    <div className="flex items-center ml-4">
                      <i className="fas fa-share"></i>
                      <span className="ml-1">0</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              Không có bài viết đề xuất nào.
            </p>
          )}
        </div>
      </div>
      <MediaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mediaUrl={selectedMedia}
      />
    </div>
  );
};

export default PostBar;
