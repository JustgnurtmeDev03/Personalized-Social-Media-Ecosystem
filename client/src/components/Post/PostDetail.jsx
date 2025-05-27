import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import "../../styles/Post.css";
import api from "../../services/threadService";
import "font-awesome/css/font-awesome.min.css";
import io from "socket.io-client";
import Avatar from "../../assets/Avatar";
import { Loading } from "../Loading/Loading";
import { useAuth } from "../../providers/AuthContext";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import {
  fetchUserProfile,
  fetchFollowing,
  followUser,
} from "../../services/userService";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PostDetail = () => {
  const { auth } = useAuth();
  const { id: postId } = useParams();
  const queryClient = useQueryClient();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [postError, setPostError] = useState(null);
  const [commentsError, setCommentsError] = useState(null);
  const [mediaDimensions, setMediaDimensions] = useState({});
  const socket = useRef(null);

  // Lấy danh sách người đang theo dõi
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

  // Lấy chi tiết bài viết và trạng thái like
  const fetchPost = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) {
        throw new Error("Không có token để xác thực");
      }

      const [postResponse, likedPostsResponse] = await Promise.all([
        api.get(`/posts/${postId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        api.get("/posts/liked", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      const postData = postResponse.data || {};
      const likedPostsData = likedPostsResponse.data || [];
      console.log("Post data:", postData);
      console.log("Liked posts:", likedPostsData);

      setPost({
        ...postData,
        isLiked: likedPostsData.some(
          (likedPost) => likedPost?._id === postData._id
        ),
        author: postData.author || {
          _id: "",
          username: "Không xác định",
          avatar: "",
        },
        createdAt: postData.createdAt || new Date().toISOString(),
        images: Array.isArray(postData.images) ? postData.images : [],
        videos: Array.isArray(postData.videos) ? postData.videos : [],
        hashtags: Array.isArray(postData.hashtags) ? postData.hashtags : [],
      });
    } catch (error) {
      setPostError("Không thể tải bài viết. Vui lòng thử lại.");
      console.error("Error fetching post:", error.message);
    } finally {
      setPostLoading(false);
    }
  }, [postId]);

  // Lấy thông tin người dùng
  const fetchUserData = useCallback(async () => {
    try {
      if (!auth.accessToken || !auth.userId) {
        throw new Error("Không có token hoặc userId để xác thực");
      }
      const user = await fetchUserProfile(auth.userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setUserData({
        _id: user._id || auth.userId,
        username: user.username || "Không xác định",
        avatar: user.avatar || "",
      });
    } catch (error) {
      setUserError("Không thể tải thông tin người dùng. Vui lòng thử lại.");
      console.error("Error fetching user data:", error.message);
    } finally {
      setUserLoading(false);
    }
  }, [auth.accessToken, auth.userId]);

  // Lấy danh sách bình luận
  const fetchComments = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) {
        throw new Error("Không có token để xác thực");
      }

      const response = await api.get(`/${postId}/comments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const commentsData = response.data || [];
      setComments(
        commentsData.map((comment) => ({
          ...comment,
          user: comment.user || {
            _id: "",
            username: "Không xác định",
            avatar: "",
          },
          createdAt: comment.createdAt || new Date().toISOString(),
        }))
      );
    } catch (error) {
      setCommentsError("Không thể tải bình luận. Vui lòng thử lại.");
      console.error("Error fetching comments:", error.message);
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  // Thêm bình luận mới
  const handleAddComment = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newComment.trim() || !userData) return;

      try {
        const authToken = localStorage.getItem("accessToken");
        if (!authToken) {
          throw new Error("Không có token để xác thực");
        }

        const response = await api.post(
          "/comments",
          { threadId: postId, content: newComment },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        const newCommentData = response.data || {};
        setComments((prev) => [
          {
            _id: newCommentData._id || Date.now().toString(),
            content: newComment,
            user: {
              _id: userData._id,
              username: userData.username,
              avatar: userData.avatar,
            },
            createdAt: newCommentData.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
        setNewComment("");
        setPost((prev) => ({
          ...prev,
          commentsCount: newCommentData.commentsCount || prev.commentsCount,
        }));
        socket.current.emit("newComment", {
          postId,
          comment: {
            _id: newCommentData._id,
            content: newComment,
            user: {
              _id: userData._id,
              username: userData.username,
              avatar: userData.avatar,
            },
            createdAt: newCommentData.createdAt || new Date().toISOString(),
          },
          commentsCount: newCommentData.commentsCount,
        });
      } catch (error) {
        console.error("Lỗi khi thêm bình luận:", error.message);
      }
    },
    [postId, newComment, userData]
  );

  // Xử lý lượt thích
  const handleToggleLike = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) {
        throw new Error("Không có token để xác thực");
      }
      const isLiked = post.isLiked;
      const response = await api.post(
        "/like",
        { userId: auth.userId, threadId: postId, isLiked: !isLiked },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200) {
        const { isLiked: newIsLiked, likesCount } = response.data;
        console.log("Like response:", { isLiked: newIsLiked, likesCount });
        socket.current.emit("likePost", {
          postId,
          isLiked: newIsLiked,
          likesCount,
        });
        setPost((prev) => ({ ...prev, isLiked: newIsLiked, likesCount }));
      }
    } catch (error) {
      console.error("Lỗi khi xử lý lượt thích:", error.message);
    }
  }, [postId, post, auth.userId]);

  // Xử lý theo dõi
  const handleFollow = async (targetUserId) => {
    try {
      await followUser(auth.userId, targetUserId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      queryClient.setQueryData(
        ["currentUserFollowing", auth.accessToken, auth.userId],
        (old) => [...(old || []), targetUserId]
      );
    } catch (error) {
      console.error("Lỗi khi theo dõi:", error.message);
    }
  };

  // Format thời gian
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

  // Cập nhật kích thước media
  const handleUpdateDimensions = useCallback((postId, index, width, height) => {
    setMediaDimensions((prev) => ({
      ...prev,
      [`${postId}-${index}`]: { width, height },
    }));
  }, []);

  // Ngăn kéo media
  const preventDefaultDrag = (e) => e.preventDefault();

  // Khởi tạo Socket.IO
  useEffect(() => {
    socket.current = io("http://localhost:8000", { path: "/socket.io" });
    socket.current.on("connect", () => {
      console.log("Socket.IO connected");
    });
    socket.current.on(
      "likePost",
      ({ postId: updatedPostId, isLiked, likesCount }) => {
        if (updatedPostId === postId) {
          setPost((prev) => ({ ...prev, isLiked, likesCount }));
        }
      }
    );
    socket.current.on(
      "newComment",
      ({ postId: updatedPostId, comment, commentsCount }) => {
        if (updatedPostId === postId && comment.user._id !== auth.userId) {
          setComments((prev) => [
            {
              ...comment,
              user: comment.user || {
                _id: "",
                username: "Không xác định",
                avatar: "",
              },
              createdAt: comment.createdAt || new Date().toISOString(),
            },
            ...prev,
          ]);
          setPost((prev) => ({
            ...prev,
            commentsCount: commentsCount || prev.commentsCount,
          }));
        }
      }
    );

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        console.log("Socket.IO disconnected");
      }
    };
  }, [postId, auth.userId]);

  useEffect(() => {
    if (auth.userId) {
      fetchUserData();
    } else {
      setUserError("Vui lòng đăng nhập để tiếp tục.");
      setUserLoading(false);
    }
  }, [auth.userId, fetchUserData]);

  useEffect(() => {
    if (auth.userId) {
      fetchPost();
      fetchComments();
    } else {
      setPostError("Vui lòng đăng nhập để xem bài viết.");
      setPostLoading(false);
      setCommentsLoading(false);
    }
  }, [auth.userId, fetchPost, fetchComments]);

  if (userLoading || postLoading || commentsLoading || isFollowingLoading) {
    return <Loading />;
  }

  if (userError || postError || isFollowingError) {
    return (
      <p className="text-center text-red-500">
        {userError || postError || "Error loading follow data"}
      </p>
    );
  }

  if (!post || !userData) {
    return <p className="text-center">Không tìm thấy dữ liệu.</p>;
  }

  return (
    <div className="bg-gray-100 p-4 min-h-screen">
      <div className="text-center flex flex-col mb-2">
        <span className="font-semibold text-base leading-5">Gens</span>
        <span className="text-gray-400 text-xs leading-4 mt-0.5">
          {post.userViews} lượt xem
        </span>
      </div>
      <div className="post-container max-w-2xl mx-auto">
        <div className="posts-content bg-white p-4 rounded-tl-3xl rounded-tr-3xl shadow">
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
            <p className="post-content">
              {post.content || "Không có nội dung"}
            </p>
            <p className="post-hashtags">
              {post.hashtags.length > 0
                ? post.hashtags.map((hashtag, index) => (
                    <span key={index} className="hashtag text-blue-500">
                      {hashtag}{" "}
                    </span>
                  ))
                : ""}
            </p>
            <span className="text-gray-500">Dịch</span>
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
                          mediaDimensions[`${post._id}-${index}`]?.height ||
                        "1/1",
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
                          mediaDimensions[`${post._id}-${index}`]?.height ||
                        "1/1",
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
              className={`like-button ${post.isLiked ? "liked" : ""}`}
              onClick={handleToggleLike}
            >
              <i
                className={`fa fa-heart ${
                  post.isLiked ? "fas" : "far"
                } heart-icon`}
              ></i>
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
        <div className="comments bg-white p-4 shadow">
          <h2 className="text-lg font-bold mb-4">Bình luận</h2>
          {commentsError ? (
            <p className="text-center text-red-500">{commentsError}</p>
          ) : commentsLoading ? (
            <p className="text-center">Đang tải bình luận...</p>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <article
                key={comment._id}
                className="flex items-start space-x-3 px-6 py-4 border-b border-gray-200"
              >
                <div className="relative">
                  <Avatar
                    _id={comment.user._id || ""}
                    avatarUrl={comment.user.avatar || ""}
                    size={36}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  {auth.userId !== comment.user._id &&
                    !currentUserFollowing.includes(comment.user._id) && (
                      <button
                        className="follow-btn border-white absolute left-5 top-5 bg-black text-white text-center rounded-full w-4 h-4 flex items-center justify-center text-sm z-10"
                        onClick={() => handleFollow(comment.user._id)}
                      >
                        <svg aria-label="Follow" role="img" viewBox="0 0 10 9">
                          <title>Follow</title>
                          <path d="M4.99512 8.66895C4.64355 8.66895 4.35059 8.36621 4.35059 8.03418V5.12891H1.50391C1.17188 5.12891 0.864258 4.83594 0.864258 4.47949C0.864258 4.12793 1.17188 3.83008 1.50391 3.83008H4.35059V0.924805C4.35059 0.583008 4.64355 0.290039 4.99512 0.290039C5.35156 0.290039 5.64453 0.583008 5.64453 0.924805V3.83008H8.49121C8.83301 3.83008 9.13086 4.12793 9.13086 4.47949C9.13086 4.83594 8.83301 5.12891 8.49121 5.12891H5.64453V8.03418C5.64453 8.36621 5.35156 8.66895 4.99512 8.66895Z"></path>
                        </svg>
                      </button>
                    )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Link
                      to={`/profile/${comment.user._id || ""}`}
                      className="font-semibold text-sm leading-5 hover:underline"
                    >
                      {comment.user.username || "Không xác định"}
                    </Link>
                    <span className="text-gray-500 text-xs leading-4">
                      {formatPostTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-6">{comment.content}</p>
                  <div className="flex items-center space-x-6 text-gray-600 text-sm mt-2">
                    <button
                      aria-label="Like"
                      className="hover:text-black"
                      onClick={() => console.log("Like comment", comment._id)}
                    >
                      <i className="far fa-heart"></i>
                    </button>
                    <button
                      aria-label="Comment"
                      className="hover:text-black"
                      onClick={() =>
                        console.log("Reply to comment", comment._id)
                      }
                    >
                      <i className="far fa-comment"></i>
                    </button>
                    <button
                      aria-label="Repost"
                      className="hover:text-black"
                      onClick={() => console.log("Repost comment", comment._id)}
                    >
                      <i className="fas fa-retweet"></i>
                    </button>
                    <button
                      aria-label="Share"
                      className="hover:text-black"
                      onClick={() => console.log("Share comment", comment._id)}
                    >
                      <i className="far fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-center text-gray-500">Chưa có bình luận nào.</p>
          )}
        </div>
        <div className="bg-white p-2 rounded-lg shadow mb-4">
          <form
            onSubmit={handleAddComment}
            className="flex items-center space-x-3 px-6 bg-gray-100 rounded-full"
          >
            <Avatar
              _id={userData._id || ""}
              avatarUrl={userData.avatar || ""}
              size={40}
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
            <input
              className="flex-1 bg-transparent text-gray-500 placeholder-gray-400 mt-5 text-sm focus:outline-none"
              placeholder={`Bình luận đến ${
                post?.author?.username || "Không xác định"
              }`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              type="text"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Gửi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
