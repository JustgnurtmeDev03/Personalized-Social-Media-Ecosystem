import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
import Sidebar from "../Sidebar/sidebar";
import {
  fetchNotifications,
  markNotificationAsRead,
} from "../../services/notificationService";

// Component cho form bình luận chính
const CommentForm = ({ userData, placeholder, value, onChange, onSubmit }) => {
  const handleChange = (e) => {
    console.log(
      "CommentForm input:",
      e.target.value,
      "isComposing:",
      e.nativeEvent.isComposing
    );
    if (!e.nativeEvent.isComposing) {
      onChange(e);
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-2">
      <Avatar
        _id={userData?._id || ""}
        avatarUrl={userData?.avatar || ""}
        size={40}
        className="w-10 h-10 rounded-full object-cover"
      />
      <input
        type="text"
        className="flex-1 bg-transparent text-sm placeholder-gray-500 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        autoCorrect="off"
        autoComplete="off"
      />
      <button
        onClick={onSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
      >
        Gửi
      </button>
    </div>
  );
};

// Component cho form trả lời
const ReplyForm = ({ userData, commentId, value, onChange, onSubmit }) => {
  const handleChange = (e) => {
    console.log(
      "ReplyForm input:",
      e.target.value,
      "isComposing:",
      e.nativeEvent.isComposing
    );
    if (!e.nativeEvent.isComposing) {
      onChange(e);
    }
  };

  return (
    <div className="flex items-center space-x-2 mt-2">
      <Avatar
        _id={userData?._id || ""}
        avatarUrl={userData?.avatar || ""}
        size={24}
        className="w-6 h-6 rounded-full object-cover"
      />
      <input
        type="text"
        className="flex-1 text-sm p-2 bg-gray-100 rounded-md focus:outline-none placeholder-gray-500"
        placeholder="Viết phản hồi..."
        value={value}
        onChange={handleChange}
        autoCorrect="off"
        autoComplete="off"
        autoFocus
      />
      <button
        onClick={(e) => onSubmit(e, commentId)}
        className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm"
      >
        Gửi
      </button>
    </div>
  );
};

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

const PostDetail = () => {
  const POLLING_INTERVAL = 30000;
  const { auth } = useAuth();
  const { id: postId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newReply, setNewReply] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [postError, setPostError] = useState(null);
  const [commentsError, setCommentsError] = useState(null);
  const [mediaDimensions, setMediaDimensions] = useState({});
  const [showMoreReplies, setShowMoreReplies] = useState({});
  const [hideReplies, setHideReplies] = useState({});
  const [notificationsError, setNotificationsError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const socket = React.useRef(null);

  // Lấy commentId hoặc replyId từ query params
  const commentId = searchParams.get("commentId");
  const replyId = searchParams.get("replyId");

  const findCommentById = (comments, id) => {
    const idStr = id?.toString();
    for (const comment of comments) {
      if (comment._id.toString() === idStr) return comment;
      if (comment.replies) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Tìm bình luận cha chứa phản hồi với replyId
  const findParentCommentOfReply = (comments, replyId) => {
    const idStr = replyId?.toString();
    for (const comment of comments) {
      if (comment.replies) {
        const foundReply = findCommentById(comment.replies, idStr);
        if (foundReply) return comment;
        const foundInNested = findParentCommentOfReply(comment.replies, idStr);
        if (foundInNested) return foundInNested;
      }
    }
    return null;
  };

  const { data: currentUserFollowing = [], isLoading: isFollowingLoading } =
    useQuery({
      queryKey: ["currentUserFollowing", auth.accessToken, auth.userId],
      queryFn: async () => {
        if (!auth.accessToken || !auth.userId)
          throw new Error("Không có token hoặc userId");
        const following = await fetchFollowing(auth.userId, {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        return following.map((u) => u._id);
      },
      enabled: !!auth.accessToken && !!auth.userId,
    });

  const fetchPost = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) throw new Error("Không có token xác thực");
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

      const canView =
        postData.visibility === "public" ||
        (postData.visibility === "only_me" &&
          postData.author?._id === auth.userId) ||
        (postData.visibility === "friends" &&
          currentUserFollowing.includes(postData.author?._id));

      if (!canView) {
        throw new Error("Bạn không có quyền xem bài viết này.");
      }

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
      setPostError(
        error.message || "Không thể tải bài viết. Vui lòng thử lại."
      );
    } finally {
      setPostLoading(false);
    }
  }, [postId, auth.userId, currentUserFollowing]);

  const fetchUserData = useCallback(async () => {
    try {
      if (!auth.accessToken || !auth.userId)
        throw new Error("Không có token hoặc userId");
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
    } finally {
      setUserLoading(false);
    }
  }, [auth.accessToken, auth.userId]);

  const fetchComments = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) throw new Error("Không có token xác thực");
      const response = await api.get(`/${postId}/comments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const commentsData = response.data || [];
      const commentMap = new Map(
        commentsData.map((c) => [
          c._id.toString(),
          c.user || { _id: "", username: "Không xác định" },
        ])
      );
      const buildCommentTree = (comments, parentId = null) =>
        comments
          .filter(
            (c) =>
              (c.parentComment ? c.parentComment.toString() : null) === parentId
          )
          .map((c) => ({
            ...c,
            user: c.user || { _id: "", username: "Không xác định", avatar: "" },
            createdAt: c.createdAt || new Date().toISOString(),
            isLiked: c.isLiked || false,
            likesCount: c.likesCount || 0,
            parentUser: c.parentComment
              ? commentMap.get(c.parentComment.toString())
              : null,
            replies: buildCommentTree(comments, c._id.toString()),
          }));
      setComments(buildCommentTree(commentsData));
    } catch (error) {
      setCommentsError("Không thể tải bình luận. Vui lòng thử lại.");
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications", auth.accessToken],
    queryFn: async () => {
      if (!auth.accessToken) {
        throw new Error("Không có token để xác thực");
      }
      const data = await fetchNotifications(auth.accessToken);
      return data || [];
    },
    enabled: !!auth.accessToken,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
    onError: (err) => {
      setNotificationsError(err.message || "Lỗi khi tải thông báo");
      queryClient.invalidateQueries(["notifications", auth.accessToken]);
    },
  });

  const handleAddComment = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newComment.trim() || !userData) return;
      try {
        const authToken = localStorage.getItem("accessToken");
        if (!authToken) throw new Error("Không có token xác thực");
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
            isLiked: false,
            likesCount: 0,
            replies: [],
            parentUser: null,
          },
          ...prev,
        ]);
        setNewComment("");
        setPost((prev) => ({
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1,
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
            isLiked: false,
            likesCount: 0,
          },
          commentsCount: (post.commentsCount || 0) + 1,
        });
      } catch (error) {
        alert("Không thể thêm bình luận. Vui lòng thử lại.");
      }
    },
    [postId, newComment, userData, post]
  );

  const handleAddReply = useCallback(
    async (e, parentCommentId) => {
      e.preventDefault();
      const replyContent = newReply[parentCommentId]?.trim();
      if (!replyContent || !userData) return;
      try {
        const authToken = localStorage.getItem("accessToken");
        if (!authToken) throw new Error("Không có token xác thực");
        const response = await api.post(
          "/reply",
          { threadId: postId, content: replyContent, parentCommentId },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const newCommentData = response.data || {};
        const parentComment = findCommentById(comments, parentCommentId);
        if (!parentComment) {
          console.error("Không tìm thấy bình luận cha");
          return;
        }
        const parentUser = parentComment.user || {
          _id: "",
          username: "Không xác định",
          avatar: "",
        };
        const updatedComments = (comments) => {
          const addReply = (commentList) =>
            commentList.map((c) =>
              c._id.toString() === parentCommentId.toString()
                ? {
                    ...c,
                    replies: [
                      {
                        _id: newCommentData._id || Date.now().toString(),
                        content: replyContent,
                        user: {
                          _id: userData._id,
                          username: userData.username,
                          avatar: userData.avatar,
                        },
                        createdAt:
                          newCommentData.createdAt || new Date().toISOString(),
                        isLiked: false,
                        likesCount: 0,
                        parentUser: parentUser,
                        replies: [],
                      },
                      ...c.replies,
                    ],
                  }
                : { ...c, replies: addReply(c.replies) }
            );
          return addReply(comments);
        };
        setComments((prev) => updatedComments(prev));
        setPost((prev) => ({
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1,
        }));
        setNewReply((prev) => ({ ...prev, [parentCommentId]: "" }));
        setReplyingTo(null);
        socket.current.emit("newComment", {
          postId,
          comment: {
            _id: newCommentData._id,
            content: replyContent,
            user: {
              _id: userData._id,
              username: userData.username,
              avatar: userData.avatar,
            },
            createdAt: newCommentData.createdAt || new Date().toISOString(),
            isLiked: false,
            likesCount: 0,
            parentUser: parentUser,
          },
          commentsCount: (post.commentsCount || 0) + 1,
        });
      } catch (error) {
        alert("Không thể thêm phản hồi. Vui lòng thử lại.");
      }
    },
    [postId, newReply, userData, post, comments]
  );

  const handleLikeComment = useCallback(
    async (commentId) => {
      try {
        const authToken = localStorage.getItem("accessToken");
        if (!authToken) throw new Error("Không có token xác thực");
        const findComment = (comments, id) => {
          for (const c of comments) {
            if (c._id === id) return c;
            const found = findComment(c.replies, id);
            if (found) return found;
          }
          return null;
        };
        const comment = findComment(comments, commentId);
        if (!comment) throw new Error("Không tìm thấy bình luận");
        const isLiked = comment.isLiked;
        const endpoint = isLiked ? "/unlike-comment" : "/like-comment";
        const response = await api.post(
          endpoint,
          { commentId },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (response.status === 200) {
          const updateCommentTree = (commentList) =>
            commentList.map((c) =>
              c._id === commentId
                ? {
                    ...c,
                    isLiked: !isLiked,
                    likesCount: isLiked ? c.likesCount - 1 : c.likesCount + 1,
                  }
                : { ...c, replies: updateCommentTree(c.replies) }
            );
          setComments((prev) => updateCommentTree(prev));
          socket.current.emit("likeComment", {
            commentId,
            isLiked: !isLiked,
            likesCount: isLiked
              ? comment.likesCount - 1
              : comment.likesCount + 1,
          });
        }
      } catch (error) {
        alert("Không thể thực hiện thao tác. Vui lòng thử lại.");
      }
    },
    [comments]
  );

  const handleToggleLike = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) throw new Error("Không có token xác thực");
      const isLiked = post?.isLiked;
      const response = await api.post(
        "/like",
        { userId: auth.userId, threadId: postId, isLiked: !isLiked },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (response.status === 200) {
        const { isLiked: newIsLiked, likesCount } = response.data;
        socket.current.emit("likePost", {
          postId,
          isLiked: newIsLiked,
          likesCount,
        });
        setPost((prev) => ({ ...prev, isLiked: newIsLiked, likesCount }));
      }
    } catch (error) {
      alert("Không thể thực hiện thao tác. Vui lòng thử lại.");
    }
  }, [postId, post, auth.userId]);

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
      alert("Không thể theo dõi. Vui lòng thử lại.");
    }
  };

  const formatPostTime = useCallback((createdAt) => {
    try {
      const now = new Date();
      const postTime = new Date(createdAt);
      const diffMs = now - postTime;
      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (minutes < 1) return "Vừa xong";
      if (minutes < 60) return `${minutes} phút trước`;
      if (hours < 24) return `${hours} giờ trước`;
      if (days < 7) return `${days} ngày trước`;
      const day = postTime.getDate().toString().padStart(2, "0");
      const month = (postTime.getMonth() + 1).toString().padStart(2, "0");
      const year = postTime.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "Không xác định";
    }
  }, []);

  const handleUpdateDimensions = useCallback((postId, index, width, height) => {
    setMediaDimensions((prev) => ({
      ...prev,
      [`${postId}-${index}`]: { width, height },
    }));
  }, []);

  const preventDefaultDrag = (e) => e.preventDefault();

  const handleShowMoreReplies = (commentId) => {
    setShowMoreReplies((prev) => ({
      ...prev,
      [commentId]: true,
    }));
  };

  const handleToggleReplies = (commentId) => {
    setHideReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Cuộn đến bình luận hoặc phản hồi khi có commentId hoặc replyId
  useEffect(() => {
    if (!commentsLoading && comments.length > 0 && (commentId || replyId)) {
      const targetId = commentId || replyId;

      // Nếu là replyId, tìm bình luận cha và bỏ ẩn các phản hồi
      if (replyId) {
        const parentComment = findParentCommentOfReply(comments, replyId);
        if (parentComment) {
          // Bỏ ẩn các phản hồi của bình luận cha
          setHideReplies((prev) => ({
            ...prev,
            [parentComment._id]: false,
          }));
          // Hiển thị đầy đủ các phản hồi (bỏ giới hạn "Xem thêm")
          setShowMoreReplies((prev) => ({
            ...prev,
            [parentComment._id]: true,
          }));
        }
      }

      // Cuộn đến phần tử
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        element.classList.add("highlight");
        setTimeout(() => element.classList.remove("highlight"), 2000);
      } else {
        console.warn(`Không tìm thấy phần tử với ID: ${targetId}`);
      }
    }
  }, [commentsLoading, comments, commentId, replyId]);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  useEffect(() => {
    socket.current = io("http://localhost:8000", { path: "/socket.io" });
    socket.current.on("connect", () => console.log("Socket.IO connected"));
    socket.current.on(
      "likePost",
      ({ postId: updatedPostId, isLiked, likesCount }) => {
        if (updatedPostId === postId)
          setPost((prev) => ({ ...prev, isLiked, likesCount }));
      }
    );
    socket.current.on(
      "newComment",
      ({ postId: updatedPostId, comment, commentsCount }) => {
        if (updatedPostId === postId) {
          setComments((prev) => [
            {
              ...comment,
              user: comment.user || {
                _id: "",
                username: "Không xác định",
                avatar: "",
              },
              createdAt: comment.createdAt || new Date().toISOString(),
              isLiked: false,
              likesCount: 0,
              replies: [],
              parentUser: comment.parentUser || null,
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
    socket.current.on("likeComment", ({ commentId, isLiked, likesCount }) => {
      const updateCommentTree = (commentList) =>
        commentList.map((c) =>
          c._id === commentId
            ? { ...c, isLiked, likesCount }
            : { ...c, replies: updateCommentTree(c.replies) }
        );
      setComments((prev) => updateCommentTree(prev));
    });
    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [postId, auth.userId]);

  useEffect(() => {
    if (auth.userId) fetchUserData();
    else {
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

  if (userLoading || postLoading || commentsLoading || isFollowingLoading)
    return <Loading />;
  if (userError || postError)
    return <p className="text-center text-red-500">{userError || postError}</p>;
  if (!post || !userData)
    return <p className="text-center">Không tìm thấy dữ liệu.</p>;

  const CommentComponent = ({ comment }) => {
    const flattenReplies = (replies) => {
      const result = [];
      const flatten = (replyList) => {
        replyList.forEach((reply) => {
          result.push(reply);
          if (reply.replies?.length > 0) {
            flatten(reply.replies);
          }
        });
      };
      flatten(replies);
      return result;
    };

    const allReplies = flattenReplies(comment.replies || []);
    const visibleReplies =
      allReplies.length >= 2 && !showMoreReplies[comment._id]
        ? allReplies.slice(0, 1)
        : allReplies;
    const hiddenRepliesCount =
      allReplies.length >= 2 && !showMoreReplies[comment._id]
        ? allReplies.length - 1
        : 0;

    const renderComment = (cmt, isReply = false) => (
      <article
        key={cmt._id}
        id={cmt._id} // Thêm id để cuộn đến
        className={`flex items-start space-x-3 px-4 py-3 ${
          isReply ? "ml-6" : ""
        } border-b border-gray-200`}
      >
        <div className="relative">
          <Avatar
            _id={cmt.user?._id || ""}
            avatarUrl={cmt.user?.avatar || ""}
            size={36}
            className="w-8 h-8 rounded-full object-cover"
          />
          {auth.userId !== cmt.user?._id &&
            !currentUserFollowing.includes(cmt.user?._id) && (
              <button
                className="follow-btn border-white absolute left-6 top-6 bg-black text-white text-center rounded-full w-4 h-4 flex items-center justify-center text-sm z-10"
                onClick={() => handleFollow(cmt.user._id)}
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
              to={`/profile/${cmt.user?._id || ""}`}
              className="font-semibold text-sm hover:underline"
            >
              {cmt.user?.username || "Không xác định"}
            </Link>
            {cmt.parentUser && (
              <span className="text-gray-500 text-sm">
                <i className="fa-solid fa-caret-right mr-2"></i>
                <Link
                  to={`/profile/${cmt.parentUser._id}`}
                  className="hover:underline"
                >
                  {cmt.parentUser.username}
                </Link>
              </span>
            )}
            <span className="text-gray-500 text-xs">
              {formatPostTime(cmt.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-6">{cmt.content}</p>
          <div className="flex items-center space-x-6 text-gray-600 text-sm mt-2">
            <button
              aria-label="Like"
              className={`hover:text-black ${
                cmt.isLiked ? "text-red-500" : ""
              }`}
              onClick={() => handleLikeComment(cmt._id)}
            >
              <i className={`fa ${cmt.isLiked ? "fas" : "far"} fa-heart`}></i>
              <span className="ml-1">{cmt.likesCount}</span>
            </button>
            <button
              aria-label="Comment"
              className={`hover:text-black ${
                replyingTo === cmt._id ? "text-blue-500" : ""
              }`}
              onClick={() => {
                if (replyingTo === cmt._id) {
                  setReplyingTo(null);
                  setNewReply((prev) => ({ ...prev, [cmt._id]: "" }));
                } else {
                  setReplyingTo(cmt._id);
                  setNewReply((prev) => ({
                    ...prev,
                    [cmt._id]: prev[cmt._id] || "",
                  }));
                }
              }}
            >
              <i className="far fa-comment"></i>
            </button>
            <button aria-label="Repost" className="hover:text-black">
              <i className="fas fa-retweet"></i>
            </button>
            <button aria-label="Share" className="hover:text-black">
              <i className="far fa-paper-plane"></i>
            </button>
          </div>
          {replyingTo === cmt._id && (
            <ReplyForm
              userData={userData}
              commentId={cmt._id}
              value={newReply[cmt._id] || ""}
              onChange={(e) =>
                setNewReply((prev) => ({
                  ...prev,
                  [cmt._id]: e.target.value,
                }))
              }
              onSubmit={handleAddReply}
            />
          )}
        </div>
      </article>
    );

    return (
      <>
        {renderComment(comment, false)}
        {allReplies.length > 0 && (
          <button
            className="text-blue-500 text-sm mt-2 hover:underline px-4"
            onClick={() => handleToggleReplies(comment._id)}
          >
            {hideReplies[comment._id] ? "Hiện phản hồi" : "Ẩn phản hồi"} (
            {allReplies.length})
          </button>
        )}
        {allReplies.length > 0 && !hideReplies[comment._id] && (
          <div className="mt-2">
            {visibleReplies.map((reply) => renderComment(reply, true))}
            {hiddenRepliesCount > 0 && (
              <button
                className="text-blue-500 text-sm mt-2 hover:underline ml-6"
                onClick={() => handleShowMoreReplies(comment._id)}
              >
                Xem thêm {hiddenRepliesCount} phản hồi
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-gray-100 p-4 min-h-screen flex">
      <Sidebar unreadCount={unreadCount} />
      <div className="post-container max-w-2xl mx-auto">
        <div className="text-center flex flex-col mb-2">
          <span className="font-semibold text-base leading-5">Bài viết</span>
          <span className="text-gray-400 text-xs leading-4 mt-0.5">
            {post?.userViews || 0} lượt xem
          </span>
        </div>
        <div className="overflow-y-auto max-h-screen">
          <div className="posts-content bg-white p-4 rounded-tl-3xl rounded-tr-3xl shadow">
            <div className="flex items-center mb-4 relative">
              <Avatar
                _id={post?.author?._id}
                avatarUrl={post?.author?.avatar}
                size={40}
                className="w-10 h-10 rounded-full object-cover"
              />
              {auth.userId !== post?.author?._id &&
                !currentUserFollowing.includes(post?.author?._id) && (
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
                  to={`/profile/${post?.author?._id}`}
                  className="font-bold hover:underline"
                >
                  {post?.author?.username}
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
                                d="M109.5 408.5c0 3.23-2.04 5.983-4.903 7.036l.07-.036c1.167-1 1.814-2.967 2-3.834.214-1 .303-1.3-.5-1.96-.31-.253-.677-.196-1.04-.476-.246-.19-.356-.59-.606-.73-.594-.337-1.107.11-1.954.223a2.666 2.666 0 0 1-1.15-.123c-.007 0-.007 0-.013-.004l-.083-.030c-.164-.082-.077-.206.006-.36h-.006c.086-.17.086-.376-.05-.529-.19-.214-.54-.214-.804-.224-.106-.003-.21 0-.313.004l-.003-.004c-.04 0-.084.004-.124.004h-.037c-.323.007-.666-.034-.893-.314-.263-.353-.29-.733.097-1.09.28-.26.863-.8 1.807-.22.603.37 1.166.667 1.666.5.33-.11.48-.303.094-.87a1.128 1.128 0 0 1-.214-.73c.067-.776.687-.84 1.164-1.2.466-.356.68-.943.546-1.457-.106-.413-.51-.873-1.28-1.01a7.49 7.49 0 0 1 6.524 7.434"
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
                          src="https://static.xx.fbcdn.net/rsrc.php/v3/yJ/r/zPcex_q0TM1.png"
                        />
                      )}
                      {post.visibility === "only_me" && (
                        <img
                          className="x1b0d499 x1d69dk1"
                          alt="Chỉ mình tôi"
                          height="14"
                          width="14"
                          src="https://static.xx.fbcdn.net/rsrc.php/v3/yc/r/57iQDgPFByS.png"
                        />
                      )}
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full mb-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
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
              <p className="post-content">
                {post?.content || "Không có nội dung"}
              </p>
              <p className="post-hashtags">
                {post?.hashtags?.length > 0
                  ? post.hashtags.map((hashtag, index) => (
                      <span key={index} className="hashtag text-blue-500">
                        {hashtag}{" "}
                      </span>
                    ))
                  : ""}
              </p>
              <span className="text-gray-500 text-sm">Dịch</span>
            </div>
            {(post?.images?.length > 0 || post?.videos?.length > 0) && (
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
                            mediaDimensions[`${post._id}-${index}`]?.height ||
                          "1/1",
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
                            mediaDimensions[`${post._id}-${index}`]?.height ||
                          "1/1",
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
            <div className="flex items-center mt-4 text-gray-500">
              <button
                className={`like-button ${post?.isLiked ? "liked" : ""}`}
                onClick={handleToggleLike}
              >
                <i
                  className={`fa fa-heart ${
                    post?.isLiked ? "fas" : "far"
                  } heart-icon`}
                ></i>
                <span className="ml-1">{post?.likesCount || 0}</span>
              </button>
              <div className="flex items-center ml-4">
                <i className="fas fa-comment"></i>
                <span className="ml-1">{post?.commentsCount || 0}</span>
              </div>
              <div className="flex items-center ml-4">
                <i className="fas fa-share"></i>
                <span className="ml-1">0</span>
              </div>
            </div>
          </div>
          <div className="comments bg-white p-4 shadow rounded-b-lg">
            <h2 className="text-lg font-bold mb-4">Bình luận</h2>
            {commentsError ? (
              <p className="text-center text-red-500">{commentsError}</p>
            ) : commentsLoading ? (
              <p className="text-center">Đang tải bình luận...</p>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <CommentComponent key={comment._id} comment={comment} />
              ))
            ) : (
              <p className="text-center text-gray-500">
                Chưa có bình luận nào.
              </p>
            )}
          </div>
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <CommentForm
              userData={userData}
              placeholder={`Bình luận đến ${
                post?.author?.username || "Không xác định"
              }`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onSubmit={handleAddComment}
            />
          </div>
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

export default PostDetail;
