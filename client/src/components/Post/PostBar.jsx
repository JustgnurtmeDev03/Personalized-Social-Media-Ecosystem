import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import "../../styles/Post.css";
import api, { recommendationApi } from "../../services/threadService";
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
import debounce from "lodash/debounce";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PostBar = ({ onClick }) => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [postsError, setPostsError] = useState(null);
  const [postsLoading, setPostsLoading] = useState(true);

  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [recommendedError, setRecommendedError] = useState(null);

  const [mediaDimensions, setMediaDimensions] = useState({});
  const [viewedPosts, setViewedPosts] = useState([]);
  const socket = useRef(null);
  const isFetchingRef = useRef(false);
  const lastFetchTime = useRef(0);
  const errorCount = useRef(0);
  const lastErrorTime = useRef(0);

  // Log auth để kiểm tra
  console.log("Auth data:", auth);
  console.log(auth.userId);

  // Lấy thông tin người dùng
  const fetchUserData = useCallback(async () => {
    try {
      if (!auth.accessToken || !auth.userId) {
        throw new Error("Không có token hoặc userId để xác thực");
      }
      const user = await fetchUserProfile(auth.userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setUserData(user);
    } catch (error) {
      setUserError("Không thể tải thông tin người dùng. Vui lòng thử lại.");
      console.error("Error fetching user data:", error.message);
    } finally {
      setUserLoading(false);
    }
  }, [auth.accessToken, auth.userId]);

  // Fetch following list of current user
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

  // Lấy bài viết công khai
  const fetchPosts = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) {
        throw new Error("Không có token để xác thực");
      }

      const [postsResponse, likedPostsResponse] = await Promise.all([
        api.get("/posts", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        api.get("/posts/liked", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      const postsData = postsResponse.data.posts || [];
      const likedPostsData = likedPostsResponse.data || [];

      const formattedPosts = postsData.map((post) => ({
        ...post,
        isLiked: likedPostsData.some(
          (likedPost) => likedPost?._id === post._id
        ),
        author: post.author || {
          _id: "",
          username: "Không xác định",
          avatar: "",
        },
        createdAt: post.createdAt || new Date().toISOString(),
        images: Array.isArray(post.images) ? post.images : [],
        videos: Array.isArray(post.videos) ? post.videos : [],
      }));

      setPosts(formattedPosts);
      setLikedPosts(likedPostsData.map((post) => post._id));
      setViewedPosts((prev) => [
        ...new Set([...prev, ...postsData.map((post) => post._id)]),
      ]);
    } catch (error) {
      setPostsError("Không thể tải bài viết. Vui lòng thử lại.");
      console.error("Error fetching posts:", error.message);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Lấy bài viết đề xuất
  const fetchRecommendedPosts = useCallback(async () => {
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchTime.current < 300000) {
      console.log("Bỏ qua yêu cầu đề xuất: đang gọi hoặc cache còn mới.");
      return;
    }

    if (errorCount.current >= 3 && now - lastErrorTime.current < 60000) {
      console.log("Tạm dừng gọi API do lỗi liên tục.");
      setRecommendedError(
        "Hệ thống đang gặp sự cố. Vui lòng thử lại sau vài phút."
      );
      return;
    }

    isFetchingRef.current = true;
    setRecommendedLoading(true);
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken || !auth.userId) {
        throw new Error("Không có token hoặc userId để xác thực");
      }

      const response = await recommendationApi.post(
        "/recommendations",
        {
          user_id: auth.userId,
          top_n: 5,
          public_post_ids: posts.map((p) => p._id),
          viewed_post_ids: viewedPosts,
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const postIds = response.data || [];

      if (!postIds.length) {
        console.log("Không nhận được ID bài viết đề xuất.");
        setRecommendedPosts([]);
        errorCount.current = 0;
        return;
      }

      const postsResponse = await recommendationApi.post(
        "/posts/multiple",
        { post_ids: postIds },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const recommendedPostsData = postsResponse.data.posts || [];

      const likedPostsResponse = await api.get("/posts/liked", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const likedPostsData = likedPostsResponse.data || [];

      const formattedRecommendedPosts = recommendedPostsData.map((post) => {
        const author =
          typeof post.author === "object" && post.author ? post.author : {};
        return {
          ...post,
          isLiked: likedPostsData.some(
            (likedPost) => likedPost?._id === post._id
          ),
          author: {
            _id: author._id || "",
            username: author.username || "Không xác định",
            avatar: author.avatar || "",
          },
          createdAt: post.createdAt
            ? new Date(post.createdAt).toISOString()
            : new Date().toISOString(),
          images: Array.isArray(post.images) ? post.images : [],
          videos: Array.isArray(post.videos) ? post.videos : [],
        };
      });

      setRecommendedPosts(formattedRecommendedPosts);
      lastFetchTime.current = now;
      errorCount.current = 0;
      setTimeout(() => {
        setViewedPosts((prev) => [...new Set([...prev, ...postIds])]);
      }, 1000);
    } catch (error) {
      errorCount.current += 1;
      lastErrorTime.current = now;
      setRecommendedError(`Không thể tải bài viết đề xuất: ${error.message}`);
      console.error("Error fetching recommended posts:", error.message);
    } finally {
      setRecommendedLoading(false);
      isFetchingRef.current = false;
    }
  }, [auth.userId, posts, viewedPosts]);

  const debouncedFetchRecommendedPosts = useMemo(
    () => debounce(fetchRecommendedPosts, 3000),
    [fetchRecommendedPosts]
  );

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
    async (postId) => {
      try {
        const authToken = localStorage.getItem("accessToken");
        const isLiked = likedPosts.includes(postId);
        const response = await api.post(
          "/like",
          { user_id: auth.userId, threadId: postId, isLiked: !isLiked },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.status === 200) {
          const { isLiked, likesCount } = response.data;
          socket.current.emit("likePost", { postId, isLiked, likesCount });

          setPosts((prev) =>
            prev.map((post) =>
              post._id === postId ? { ...post, isLiked, likesCount } : post
            )
          );
          setRecommendedPosts((prev) =>
            prev.map((post) =>
              post._id === postId ? { ...post, isLiked, likesCount } : post
            )
          );
          setLikedPosts((prev) =>
            isLiked ? [...prev, postId] : prev.filter((id) => id !== postId)
          );
        }
      } catch (error) {
        console.error("Lỗi khi xử lý lượt thích:", error.message);
      }
    },
    [auth.userId, likedPosts]
  );

  useEffect(() => {
    socket.current = io("http://localhost:8000", { path: "/socket.io" });
    socket.current.on("connect", () => {
      socket.current.emit("getLikedPosts");
      console.log("Socket.IO connected");
    });
    socket.current.on("likePost", ({ postId, isLiked, likesCount }) => {
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, isLiked, likesCount } : post
        )
      );
      setRecommendedPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, isLiked, likesCount } : post
        )
      );
      setLikedPosts((prev) =>
        isLiked ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
    });
    socket.current.on("newRecommendations", (data) => {
      if (data.userId === auth.userId) {
        console.log("Nhận sự kiện newRecommendations, gọi lại đề xuất.");
        debouncedFetchRecommendedPosts();
      }
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        console.log("Socket.IO disconnected");
      }
    };
  }, [auth.userId, debouncedFetchRecommendedPosts]);

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
      fetchPosts();
    }
  }, [userData, fetchPosts]);

  useEffect(() => {
    if (userData && !postsLoading && posts.length > 0) {
      fetchRecommendedPosts();
    }
  }, [userData, postsLoading, posts.length, fetchRecommendedPosts]);

  const formattedRecommendedPosts = useMemo(() => {
    return recommendedPosts.map((post) => {
      const author =
        typeof post.author === "object" && post.author ? post.author : {};
      return {
        ...post,
        isLiked: likedPosts.includes(post._id),
        author: {
          _id: author._id || "",
          username: author.username || "Không xác định",
          avatar: author.avatar || "",
        },
        createdAt: post.createdAt || new Date().toISOString(),
        images: Array.isArray(post.images) ? post.images : [],
        videos: Array.isArray(post.videos) ? post.videos : [],
      };
    });
  }, [recommendedPosts, likedPosts]);

  const preventDefaultDrag = (e) => e.preventDefault();

  const handleFollow = async (targetUserId) => {
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

  if (userLoading || isFollowingLoading) {
    return <Loading />;
  }

  if (userError || isFollowingError) {
    return (
      <p className="text-center text-red-500">
        {userError || "Error loading follow data"}
      </p>
    );
  }

  if (!userData) {
    return <p className="text-center">Không tìm thấy thông tin người dùng.</p>;
  }

  return (
    <div className="bg-gray-100 p-4">
      <div className="post-container max-w-2xl mx-auto">
        {/* Thanh đăng bài */}
        <div className="post-bar flex items-center bg-white p-3 rounded-lg shadow mb-4">
          <Avatar _id={userData._id} avatarUrl={userData.avatar} size={50} />
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

        {/* Bài viết công khai */}
        {postsError ? (
          <p className="text-center text-red-500">{postsError}</p>
        ) : postsLoading ? (
          <p className="text-center">Đang tải bài viết...</p>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Link to={`/post/${post._id}`}>
              <div
                key={post._id}
                className="posts-content bg-white p-4 rounded-lg shadow mb-4"
              >
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
                        onClick={() => handleFollow(post.author._id)}
                      >
                        <svg aria-label="Follow" role="img" viewBox="0 0 10 9">
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
                    <div className="text-gray-500 text-sm">
                      {formatPostTime(post.createdAt)}
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
                          className="relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
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
                          className="relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
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
                <div className="flex items-center mt-4 text-gray-500">
                  <button
                    className={`like-button ${
                      post.isLiked ? "liked text-red-500" : ""
                    }`}
                    onClick={() => handleToggleLike(post._id)}
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
              </div>
            </Link>
          ))
        ) : (
          <p className="text-center text-gray-500">
            Không có bài viết nào để hiển thị.
          </p>
        )}

        {/* Bài viết đề xuất */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-4">Đề xuất cho bạn</h2>
          {recommendedError ? (
            <p className="text-center text-red-500">{recommendedError}</p>
          ) : recommendedLoading ? (
            <p className="text-center">Đang tải bài viết đề xuất...</p>
          ) : formattedRecommendedPosts.length > 0 ? (
            formattedRecommendedPosts.map((post) => (
              <div
                key={post._id}
                className="posts-content bg-white p-4 rounded-lg shadow mb-4"
              >
                <div className="flex items-center mb-4 relative">
                  <Avatar
                    _id={post.author._id || ""}
                    avatarUrl={post.author.avatar || ""}
                    size={40}
                  />
                  {auth.userId !== post.author._id &&
                    !currentUserFollowing.includes(post.author._id) && (
                      <button
                        className="follow-btn border-white absolute left-6 top-6 bg-black text-white text-center rounded-full w-4 h-4 flex items-center justify-center text-sm z-10"
                        onClick={() => handleFollow(post.author._id)}
                      >
                        <svg aria-label="Follow" role="img" viewBox="0 0 10 9">
                          <title>Follow</title>
                          <path d="M4.99512 8.66895C4.64355 8.66895 4.35059 8.36621 4.35059 8.03418V5.12891H1.50391C1.17188 5.12891 0.864258 4.83594 0.864258 4.47949C0.864258 4.12793 1.17188 3.83008 1.50391 3.83008H4.35059V0.924805C4.35059 0.583008 4.64355 0.290039 4.99512 0.290039C5.35156 0.290039 5.64453 0.583008 5.64453 0.924805V3.83008H8.49121C8.83301 3.83008 9.13086 4.12793 9.13086 4.47949C9.13086 4.83594 8.83301 5.12891 8.49121 5.12891H5.64453V8.03418C5.64453 8.36621 5.35156 8.66895 4.99512 8.66895Z"></path>
                        </svg>
                      </button>
                    )}
                  <div className="ml-3">
                    <Link
                      to={`/profile/${post.author._id || ""}`}
                      className="font-bold hover:underline"
                    >
                      {post.author.username || "Không xác định"}
                    </Link>
                    <div className="text-gray-500 text-sm">
                      {formatPostTime(post.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="post-content">
                    {post.content || "Không có nội dung"}
                  </p>
                  <p className="post-hashtags">
                    {post.hashtags.length > 0 ? (
                      post.hashtags.map((hashtag, index) => (
                        <span key={index} className="hashtag text-blue-500">
                          {hashtag}{" "}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Không có hashtag</span>
                    )}
                  </p>
                </div>
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
                          className="relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
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
                          className="relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
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
                <div className="flex items-center mt-4 text-gray-500">
                  <button
                    className={`like-button ${
                      post.isLiked ? "liked text-red-500" : ""
                    }`}
                    onClick={() => handleToggleLike(post._id)}
                  >
                    <i className="fa fa-heart heart-icon"></i>
                    <span className="ml-1">{post.likesCount || 0}</span>
                  </button>
                  <div className="flex items-center ml-4">
                    <i className="fas fa-comment"></i>
                    <span className="ml-1">{post.commentsCount || 0}</span>
                  </div>
                  <div className="flex items-center ml-4">
                    <i className="fas fa-share"></i>
                    <span className="ml-1">0</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              Không có bài viết đề xuất nào.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostBar;
