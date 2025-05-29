import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserProfile,
  fetchFollowers,
  fetchFollowing,
  unfollowUser,
  followUser,
} from "../../services/userService";
import "../../styles/Profile.css";
import Sidebar from "../../components/Sidebar/sidebar";
import EditProfileModal from "./EditProfile";
import { Loading } from "../../components/Loading/Loading";
import FollowersModal from "../../components/Followers/FollowersModal";
import { useModal } from "../../providers/ModalContext";
import Avatar, { getDefaultAvatar } from "../../assets/Avatar";
import PostModal from "../../components/Post/PostModal";
import { useAuth } from "../../providers/AuthContext";
import { fetchUserPosts } from "../../services/threadService";
import PostItem from "../../components/Post/PostItem";
import { API_URL } from "../../services/threadService";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isProfileModalOpen, setIsProfileModalOpen } = useModal();
  const [isFollowersOpen, setFollowersIsOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const { userId } = useParams();
  const { auth } = useAuth();
  const isOwnProfile = String(auth.userId) === String(userId);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);
  const [posts, setPosts] = useState([]);

  // Kiểm tra access token
  useEffect(() => {
    if (!auth.accessToken) {
      console.warn("No access token found. Redirecting to login...");
      navigate("/login");
    }
  }, [auth.accessToken, navigate]);

  // FETCH USER PROFILE
  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
    isFetching: isUserFetching,
  } = useQuery({
    queryKey: ["userProfile", auth.accessToken, userId],
    queryFn: async () => {
      if (!auth.accessToken || !userId)
        throw new Error("No access token or userId");
      const profile = await fetchUserProfile(userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setUserData(profile);
      return profile;
    },
    enabled: !!auth.accessToken && !!userId,
  });

  // FETCH FOLLOWERS LIST
  const {
    data: followersData,
    isLoading: isFollowersLoading,
    isError: isFollowersError,
  } = useQuery({
    queryKey: ["followers", auth.accessToken, userId],
    queryFn: async () => {
      if (!auth.accessToken || !userId)
        throw new Error("No access token or userId");
      return await fetchFollowers(userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
    },
    enabled: !!auth.accessToken && !!userId,
  });

  // FETCH FOLLOWING LIST OF PROFILE USER
  const {
    data: profileFollowingData,
    isLoading: isProfileFollowingLoading,
    isError: isProfileFollowingError,
  } = useQuery({
    queryKey: ["profileFollowing", auth.accessToken, userId],
    queryFn: async () => {
      if (!auth.accessToken || !userId)
        throw new Error("No access token or userId");
      return await fetchFollowing(userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
    },
    enabled: !!auth.accessToken && !!userId,
  });

  // FETCH FOLLOWING LIST OF CURRENT USER
  const {
    data: currentUserFollowingData,
    isLoading: isCurrentUserFollowingLoading,
    isError: isCurrentUserFollowingError,
  } = useQuery({
    queryKey: ["currentUserFollowing", auth.accessToken, auth.userId],
    queryFn: async () => {
      if (!auth.accessToken || !auth.userId)
        throw new Error("No access token or userId");
      return await fetchFollowing(auth.userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
    },
    enabled: !!auth.accessToken && !!auth.userId,
  });

  // CHECK FOLLOW STATUS
  useEffect(() => {
    if (!isOwnProfile && currentUserFollowingData && userData) {
      const alreadyFollowed = currentUserFollowingData.some(
        (u) => u._id === userData._id
      );
      setIsFollowing(alreadyFollowed);
    }
  }, [currentUserFollowingData, userData, isOwnProfile]);

  // FETCH POSTS OF USER
  const {
    data: postsData,
    isLoading: isPostsLoading,
    isError: isPostsError,
    error: postsError,
  } = useQuery({
    queryKey: ["userPosts", auth.accessToken, userId],
    queryFn: async () => {
      if (!auth.accessToken || !userId)
        throw new Error("No access token or userId");
      const posts = await fetchUserPosts(userId, auth.accessToken);
      console.log("Raw posts data:", posts); // Debug dữ liệu từ API
      return posts;
    },
    enabled: !!auth.accessToken && !!userId,
  });

  // FETCH LIKED POSTS OF USER
  const {
    data: likedPosts,
    isLoading: isLikedLoading,
    isError: isLikedError,
  } = useQuery({
    queryKey: ["likedPosts", auth.accessToken],
    queryFn: async () => {
      if (!auth.accessToken) throw new Error("No access token");
      const response = await fetch(`${API_URL}/posts/liked`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch liked posts");
      return response.json();
    },
    enabled: !!auth.accessToken,
  });

  useEffect(() => {
    if (postsData && likedPosts) {
      // In dữ liệu gốc để kiểm tra
      console.log("Original postsData:", postsData);

      // Sắp xếp bài đăng từ mới nhất đến cũ nhất
      const sortedPosts = [...postsData].sort((a, b) => {
        try {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);

          // Kiểm tra xem ngày có hợp lệ không
          if (isNaN(dateA) || isNaN(dateB)) {
            console.warn("Invalid createdAt format:", { a, b });
            return 0; // Giữ nguyên thứ tự nếu có lỗi
          }

          // Sắp xếp giảm dần: mới nhất lên đầu
          return dateB - dateA;
        } catch (error) {
          console.warn("Error sorting posts:", error);
          return 0; // Giữ nguyên thứ tự nếu có lỗi
        }
      });

      // In dữ liệu đã sắp xếp để kiểm tra
      console.log("Sorted posts:", sortedPosts);

      // Kết hợp dữ liệu với thông tin likedPosts
      const enrichedPosts = sortedPosts.map((post) => ({
        ...post,
        isLiked: likedPosts.some((likedPost) => likedPost._id === post._id),
      }));

      // Cập nhật state
      setPosts(enrichedPosts);
    }
  }, [postsData, likedPosts]);

  // FUNC TOGGLE LIKE & UNLIKE
  const handleToggleLike = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ threadId: postId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { isLiked, likesCount } = await response.json();
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, isLiked, likesCount } : post
        )
      );
    } catch (err) {
      console.error("Error toggling like:", err.message);
    }
  };

  const handleToggleFollow = async () => {
    if (isFollowing) {
      setIsUnfollowModalOpen(true);
    } else {
      try {
        await followUser(auth.userId, userData._id, {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        setIsFollowing(true);
        queryClient.invalidateQueries([
          "currentUserFollowing",
          auth.accessToken,
          auth.userId,
        ]);
        queryClient.invalidateQueries(["followers", auth.accessToken, userId]);
      } catch (error) {
        console.error("Error following user:", error);
      }
    }
  };

  const handleConfirmUnfollow = async () => {
    try {
      await unfollowUser(auth.userId, userData._id, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setIsFollowing(false);
      setIsUnfollowModalOpen(false);
      queryClient.invalidateQueries([
        "currentUserFollowing",
        auth.accessToken,
        auth.userId,
      ]);
      queryClient.invalidateQueries(["followers", auth.accessToken, userId]);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  // Xử lý trạng thái loading và error
  if (
    isUserLoading ||
    isUserFetching ||
    isFollowersLoading ||
    isProfileFollowingLoading ||
    isCurrentUserFollowingLoading ||
    isPostsLoading
  ) {
    return <Loading />;
  }

  if (
    isUserError ||
    isFollowersError ||
    isProfileFollowingError ||
    isCurrentUserFollowingError
  ) {
    return <div>Error loading profile or follow data</div>;
  }

  if (isPostsError) {
    if (postsError.message === "Authentication failed. Please log in again.") {
      return (
        <div>
          <p>Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
        </div>
      );
    }
    return <div>Error loading posts: {postsError.message}</div>;
  }

  if (!user) {
    return <div>No user data available</div>;
  }

  const handleOpenModal = () => setIsPostModalOpen(true);
  const handleCloseModal = () => setIsPostModalOpen(false);
  const handleEditProfileClick = () => {
    setEditSection(null);
    setIsProfileModalOpen(true);
  };
  const handleProfileCloseModal = () => setIsProfileModalOpen(false);
  const handleEditBioClick = () => {
    setEditSection("bio");
    setIsProfileModalOpen(true);
  };
  const handleEditAvatarClick = () => {
    setEditSection("avatar");
    setIsProfileModalOpen(true);
  };

  const defaultAvatarUrl = getDefaultAvatar(userData._id);
  const isAvatarUpdated =
    userData.avatar &&
    userData.avatar.trim() !== "" &&
    userData.avatar !== defaultAvatarUrl;
  const isBioUpdated = userData.bio && userData.bio.trim() !== "";
  const incompleteCount = (!isBioUpdated ? 1 : 0) + (!isAvatarUpdated ? 1 : 0);

  const formatJoinedDate = (date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `Đã tham gia ${month}/${year}`;
  };

  const followers = followersData || [];
  const following = profileFollowingData || [];
  const followerAvatars = followers
    .slice(0, 2)
    .map((follower) => (
      <Avatar
        key={follower._id}
        _id={follower._id}
        avatarUrl={follower.avatar}
        size={24}
      />
    ));

  const UnfollowModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
        <div className="bg-white rounded-2xl w-full max-w-xs shadow-md">
          <div className="pt-6 pb-4 flex justify-center">
            <div className="profile-user-avatar">
              <Avatar
                _id={userData._id}
                avatarUrl={userData.avatar}
                size={80}
              />
            </div>
          </div>
          <div className="text-center px-6 pb-6 font-sans text-base font-semibold text-black">
            Bạn có chắc muốn hủy theo dõi {userData.name}?
          </div>
          <div className="border-t border-gray-300 flex">
            <button
              className="flex-1 py-3 text-center text-black font-normal text-base font-sans hover:bg-gray-100 rounded-bl-2xl"
              type="button"
              onClick={onClose}
            >
              Hủy bỏ
            </button>
            <button
              className="flex-1 py-3 text-center text-red-600 font-semibold text-base font-sans rounded-br-2xl hover:bg-red-50"
              type="button"
              onClick={onConfirm}
            >
              Hủy theo dõi
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-main">
      <Sidebar />
      <div className="profile-main-content">
        <h2 className="profile-title">Hồ sơ</h2>
        <div className="profile-container">
          <div className="profile-information">
            <div className="basic-info">
              <div className="profile-user-name">
                <div className="profile-user-usedname">{userData.name}</div>
                <div className="profile-user-tagname">{userData.username}</div>
              </div>
              <div className="profile-user-avatar">
                <Avatar
                  _id={userData._id}
                  avatarUrl={userData.avatar}
                  size={80}
                />
              </div>
            </div>
            <div className="profile-bio txt-added">
              {userData.bio ? (
                userData.bio
                  .split("\n")
                  .map((line, index) => <p key={index}>{line}</p>)
              ) : (
                <p className="empty"></p>
              )}
            </div>
            <div className="minimum-info">
              <div
                className="followers"
                onClick={() => setFollowersIsOpen(true)}
              >
                <div className="followers-user-avatar">{followerAvatars}</div>
                <div className="quantity-followers">
                  {followers.length} người theo dõi
                </div>
              </div>
              <div className="joined-in">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <g>
                    <path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6zm0 6h2v-2H7v2zm0 4h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm4-4h2v-2h-2v2z"></path>
                  </g>
                </svg>
                <span>{formatJoinedDate(userData.created_at)}</span>
              </div>
            </div>
            <FollowersModal
              isOpen={isFollowersOpen}
              onClose={() => setFollowersIsOpen(false)}
              user={user || {}}
              followers={followersData}
              following={profileFollowingData}
            />
            {isOwnProfile ? (
              <div>
                <button
                  className="edit-profile"
                  onClick={handleEditProfileClick}
                >
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            ) : (
              <div className="flex space-x-2 justify-center pt-5">
                <button
                  onClick={handleToggleFollow}
                  className={`w-[300px] follow-button px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
                    isFollowing
                      ? "bg-gray-300 text-black hover:bg-gray-400"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </button>
                <button className="w-[300px] message-button bg-gray-200 text-black px-4 py-2 rounded-full hover:bg-gray-300">
                  Nhắn tin
                </button>
              </div>
            )}
            <EditProfileModal
              isOpen={isProfileModalOpen}
              onClose={handleProfileCloseModal}
              userData={userData}
              setUserData={setUserData}
              editSection={editSection}
            />
            <UnfollowModal
              isOpen={isUnfollowModalOpen}
              onClose={() => setIsUnfollowModalOpen(false)}
              onConfirm={handleConfirmUnfollow}
            />
            <div className="profile-options">
              <div className="pro-options-item border-active">
                <div className="item-text">Chủ đề</div>
              </div>
              <div className="pro-options-item">
                <div className="item-text">Trả lời</div>
              </div>
              <div className="pro-options-item">
                <div className="item-text">Đăng lại</div>
              </div>
            </div>
            {isOwnProfile ? (
              <div className="detail-profile">
                {posts.length === 0 && (
                  <div className="flex items-center border-b pb-4 my-4">
                    <Avatar
                      className="cursor-pointer"
                      _id={userData._id}
                      avatarUrl={userData.avatar || ""}
                      size={40}
                    />
                    <div
                      className="flex-grow bg-transparent text-gray-500 focus:outline-none ml-2 w-20"
                      onClick={handleOpenModal}
                    >
                      <span>Có điều gì mới không?</span>
                    </div>
                    <button
                      className="ml-4 px-4 py-2 border rounded-full text-black"
                      onClick={handleOpenModal}
                    >
                      Đăng
                    </button>
                  </div>
                )}
                <PostModal
                  isOpen={isPostModalOpen}
                  onClose={handleCloseModal}
                />
                <div className="profile-info-detail">
                  {posts.length === 0 ? (
                    incompleteCount === 0 ? (
                      <div className="flex justify-center py-6">
                        <button
                          className="px-6 py-3 border rounded-full text-black font-medium"
                          onClick={handleOpenModal}
                        >
                          Hãy bắt đầu với một bài viết
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="finish-profile">
                          <span className="title-finish">
                            Hoàn thành hồ sơ của bạn
                          </span>
                          <span className="unfinished">
                            chỉ còn {incompleteCount}
                          </span>
                        </div>
                        <div className="info-profile">
                          <div className="info-item">
                            <div className="icon-item">
                              <svg aria-label="" role="img" viewBox="0 0 24 24">
                                <title></title>
                                <path
                                  d="M6.17225,22H2V17.82775L17.29142,2.53634a1.83117,1.83117,0,0,1,2.58967,0l1.58257,1.58257a1.83117,1.83117,0,0,1,0,2.58967Z"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.25"
                                ></path>
                                <line
                                  x1="15.01842"
                                  x2="19.19067"
                                  y1="4.80933"
                                  y2="8.98158"
                                ></line>
                              </svg>
                            </div>
                            <div className="content-item">Thêm bio</div>
                            <div className="guess-item">
                              Giới thiệu bản thân và cho mọi người biết sở thích
                              của bạn.
                            </div>
                            <div
                              className={`btn-item ${
                                isBioUpdated ? "" : "unactive"
                              }`}
                              onClick={
                                isBioUpdated ? undefined : handleEditBioClick
                              }
                            >
                              <button className="btn-text">
                                {userData.bio ? "Đã hoàn thành" : "Thêm"}
                              </button>
                            </div>
                          </div>
                          <div className="info-item">
                            <div className="icon-item">
                              <svg
                                aria-label=""
                                role="img"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.25"
                              >
                                <title></title>
                                <polyline points="21.648 5.352 9.002 17.998 2.358 11.358"></polyline>
                              </svg>
                            </div>
                            <div className="content-item">
                              Thêm ảnh cho hồ sơ
                            </div>
                            <div className="guess-item">
                              Giúp mọi người dễ dàng nhận ra bạn hơn.
                            </div>
                            <div
                              className={`btn-item ${
                                isAvatarUpdated ? "" : "unactive"
                              }`}
                              onClick={
                                isAvatarUpdated
                                  ? undefined
                                  : handleEditAvatarClick
                              }
                            >
                              <button
                                className="btn-text"
                                disabled={isAvatarUpdated}
                              >
                                {isAvatarUpdated ? "Đã hoàn thành" : "Thêm"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="posts-list w-full">
                      {posts.map((post) => (
                        <PostItem
                          key={post._id}
                          post={post}
                          userData={userData}
                          handleToggleLike={handleToggleLike}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="other-profile-content">
                {posts.length === 0 ? (
                  <div className="text-center text-gray-500 py-6">
                    Hiện chưa có bài viết nào
                  </div>
                ) : (
                  <div className="posts-list w-full">
                    {posts.map((post) => (
                      <PostItem
                        key={post._id}
                        post={post}
                        userData={userData}
                        handleToggleLike={handleToggleLike}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
