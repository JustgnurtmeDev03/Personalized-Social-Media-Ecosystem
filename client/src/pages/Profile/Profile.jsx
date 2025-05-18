import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../../services/userService";
import "../../styles/Profile.css";
import Sidebar from "../../components/Sidebar/sidebar";
import EditProfileModal from "./EditProfile";
import { Loading } from "../../components/Loading/Loading";
import FollowersModal from "../../components/Followers/FollowersModal";
import { useModal } from "../../providers/ModalContext";
import Avatar, { getDefaultAvatar } from "../../assets/Avatar";
import PostModal from "../../components/Post/PostModal";
import { useAuth } from "../../providers/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { isProfileModalOpen, setIsProfileModalOpen } = useModal();
  const [isFollowersOpen, setFollowersIsOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [editSection, setEditSection] = useState(null); // NEW: Xác định phần nào được mở trong modal
  const { userId } = useParams();
  const { auth } = useAuth();
  const isOwnProfile = String(auth.userId) === String(userId);

  // ======================== LOGIC ===========================
  const {
    data: user,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["userProfile", auth.accessToken, userId],
    queryFn: async () => {
      if (!auth.accessToken || !userId)
        throw new Error("No access token or userId");

      const profile = await fetchUserProfile(userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setUserData(profile); // Gán dữ liệu user vào state mới
      console.log("Fetched Profile:", profile); // Log profile
      return profile;
    },
    enabled: !!auth.accessToken && !!userId,
  });
  if (isLoading || isFetching) return <Loading></Loading>;
  if (isError) return <div>Error loading user profile</div>;
  if (!user) {
    return <div>No user data available</div>;
  }

  const handleOpenModal = () => {
    setIsPostModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsPostModalOpen(false);
  };

  const handleEditProfileClick = () => {
    setEditSection(null);
    setIsProfileModalOpen(true);
  };

  const handleProfileCloseModal = () => {
    setIsProfileModalOpen(false);
  };

  // Khi bấm "Thêm Bio"/ "Thêm Avatar" - chức năng phụ "Thêm" tiểu sử ngoài chức năng chính "chỉnh sửa hồ sơ"
  const handleEditBioClick = () => {
    setEditSection("bio"); // Mở modal và focus vào bio
    setIsProfileModalOpen(true);
  };

  const handleEditAvatarClick = () => {
    setEditSection("avatar");
    setIsProfileModalOpen(true);
  };

  // Xác định trạng thái cập nhật
  const defaultAvatarUrl = getDefaultAvatar(userData._id);
  const isAvatarUpdated =
    userData.avatar &&
    userData.avatar.trim() !== "" &&
    userData.avatar !== defaultAvatarUrl;

  const isBioUpdated = userData.bio && userData.bio.trim() != "";

  // Tính số lượng phần chưa hoàn thành
  const incompleteCount = (!isBioUpdated ? 1 : 0) + (!isAvatarUpdated ? 1 : 0);

  // ======================== RENDER ===========================

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
                <div className="followers-user-avatar">
                  <img alt="" />
                  <img alt="" />
                </div>
                <div className="quantity-followers">
                  {userData.followers.length} người theo dõi
                </div>
              </div>
              <div className="joined-in">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <g>
                    <path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6zm0 6h2v-2H7v2zm0 4h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm4-4h2v-2h-2v2z"></path>
                  </g>
                </svg>
                <span>Đã tham gia 11/2023</span>
              </div>
            </div>
            <FollowersModal
              isOpen={isFollowersOpen}
              onClose={() => setFollowersIsOpen(false)}
              user={user}
              followers={userData.followers}
              following={userData.following}
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
              <div className="flex space-x-2">
                <button className="follow-button bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600">
                  Theo dõi
                </button>
                <button className="message-button bg-gray-200 text-black px-4 py-2 rounded-full hover:bg-gray-300">
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
            {/* Tách profile-options ra khỏi detail-profile */}
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
            {/* Chỉ hiển thị detail-profile khi isOwnProfile là true */}
            {isOwnProfile && (
              <div className="detail-profile">
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
                <PostModal
                  isOpen={isPostModalOpen}
                  onClose={handleCloseModal}
                />
                <div className="profile-info-detail">
                  {incompleteCount === 0 ? (
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
                            } `}
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
                          <div className="content-item">Thêm ảnh cho hồ sơ</div>
                          <div className="guess-item">
                            Giúp mọi người dễ dàng nhận ra bạn hơn.
                          </div>
                          <div
                            className={`btn-item ${
                              isAvatarUpdated ? "" : "unactive"
                            } `}
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
                        <div className="info-item"></div>
                        <div className="info-item"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Giao diện thay thế khi xem hồ sơ người khác */}
            {!isOwnProfile && (
              <div className="other-profile-content">
                <div className="flex justify-center py-6">
                  <button
                    className="px-6 py-3 border rounded-full text-black font-medium"
                    onClick={() => console.log("Load posts for", userId)}
                  >
                    Xem các bài viết của {userData.name}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
