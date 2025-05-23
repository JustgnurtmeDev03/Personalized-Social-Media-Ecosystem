import React, { useEffect, useState, useCallback } from "react";
import {
  fetchFollowers,
  fetchFollowing,
  followUser,
  unfollowUser,
} from "../../services/userService";
import { useAuth } from "../../providers/AuthContext";

export default function FollowersModal({ isOpen, onClose, user }) {
  const { auth } = useAuth();
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("followers");

  const isOwnProfile = auth.userId === user._id;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Hàm fetch dữ liệu chung
  const fetchData = useCallback(async () => {
    if (!auth.accessToken || !auth.userId || !isOpen || !user?._id) return;

    setLoadingFollowers(true);
    setLoadingFollowing(true);
    try {
      const [followers, following] = await Promise.all([
        fetchFollowers(user._id, {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }),
        fetchFollowing(user._id, {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }),
      ]);
      setFollowersData(followers);
      setFollowingData(following);
    } catch (error) {
      setError("Lỗi khi lấy thông tin người dùng");
      console.error(error);
    } finally {
      setLoadingFollowers(false);
      setLoadingFollowing(false);
    }
  }, [auth.accessToken, auth.userId, isOpen, user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFollow = async (targetUserId) => {
    try {
      await followUser(auth.userId, targetUserId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      await fetchData(); // Làm mới dữ liệu
    } catch (error) {
      console.error("Lỗi khi theo dõi:", error);
      setError("Không thể theo dõi người dùng");
    }
  };

  const handleDeleteFollower = async (followerId) => {
    // Lưu lại danh sách follower hiện tại để khôi phục nếu API thất bại
    const previousFollowers = followersData;

    // Cập nhật giao diện ngay lập tức bằng cách lọc bỏ follower vừa xóa
    setFollowersData((prev) => prev.filter((f) => f._id !== followerId));

    try {
      // Giả định có API `removeFollower` để xóa người theo dõi bạn
      await removeFollower(followerId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
    } catch (error) {
      // Nếu lỗi, khôi phục danh sách cũ và hiển thị thông báo
      console.error("Lỗi khi xóa follower:", error);
      setError("Không thể xóa người theo dõi");
      setFollowersData(previousFollowers);
    }
  };

  const handleUnfollow = async (followeeId) => {
    try {
      await unfollowUser(auth.userId, followeeId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      await fetchData();
    } catch (error) {
      console.error("Lỗi khi hủy theo dõi:", error);
      setError("Không thể hủy theo dõi");
    }
  };

  const isFollowingUser = (targetUserId) => {
    return followingData.some((u) => u._id === targetUserId);
  };

  useEffect(() => {
    if (!isOpen) {
      setFollowersData([]);
      setError(null);
    }
  }, [isOpen]);

  return (
    <div
      className={`profile-overlay-follower ${isOpen ? "effect" : ""}`}
      onClick={onClose}
    >
      <div
        className="bg-white absolute top-40 rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex justify-between cursor-pointer">
          <div
            className={`w-1/2 text-center py-4 pb-0 ${
              activeTab === "followers" ? "border-b-2 border-black" : ""
            }`}
            onClick={() => handleTabChange("followers")}
          >
            <span
              className={`font-bold ${
                activeTab === "followers" ? "text-black" : "text-gray-400"
              } `}
            >
              Follower
            </span>
            <span
              className={`block ${
                activeTab === "followers" ? "text-black" : "text-gray-400"
              }`}
            >
              {followersData.length}
            </span>
          </div>
          <div
            className={`w-1/2 text-center py-4 pb-0 ${
              activeTab === "following" ? "border-b-2 border-black" : ""
            }`}
            onClick={() => handleTabChange("following")}
          >
            <span
              className={`font-bold ${
                activeTab === "following" ? "text-black" : "text-gray-400"
              }`}
            >
              Đã follow
            </span>
            <span
              className={`block ${
                activeTab === "following" ? "text-black" : "text-gray-400"
              }`}
            >
              {followingData.length}
            </span>
          </div>
        </div>
        <div className="p-4">
          {activeTab === "followers" ? (
            loadingFollowers ? (
              <p className="text-center text-gray-500">Đang tải...</p>
            ) : followersData.length > 0 ? (
              followersData.map((follower) => (
                <div
                  key={follower._id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center">
                    <img
                      alt="Profile picture"
                      className="rounded-full w-10 h-10"
                      src={
                        follower.avatar ||
                        "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg"
                      }
                    />
                    <div className="ml-4">
                      <div className="font-bold text-black">
                        {follower.username}
                      </div>
                      <div className="text-gray-500">{follower.name}</div>
                    </div>
                  </div>
                  {isOwnProfile ? (
                    isFollowingUser(follower._id) ? (
                      <button
                        className="bg-[#EFEFEF] text-black font-medium px-4 py-2 rounded-full"
                        onClick={() => handleDeleteFollower(follower._id)}
                      >
                        Xóa
                      </button>
                    ) : (
                      <button
                        className="bg-[#EFEFEF] text-black font-medium px-4 py-2 rounded-full"
                        onClick={() => handleFollow(follower._id)}
                      >
                        Follow lại
                      </button>
                    )
                  ) : follower._id === auth.userId ? (
                    ""
                  ) : isFollowingUser(follower._id) ? (
                    <button
                      className="bg-black text-white font-medium px-4 py-2 rounded-full"
                      onClick={() => handleUnfollow(follower._id)}
                    >
                      Hủy theo dõi
                    </button>
                  ) : (
                    <button
                      className="bg-[#EFEFEF] text-black font-medium px-4 py-2 rounded-full"
                      onClick={() => handleFollow(follower._id)}
                    >
                      Follow
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                {user?.username} chưa có ai theo dõi
              </p>
            )
          ) : loadingFollowing ? (
            <p className="text-center text-gray-500">Đang tải...</p>
          ) : followingData.length > 0 ? (
            followingData.map((following) => (
              <div
                key={following._id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center">
                  <img
                    alt="Profile picture"
                    className="rounded-full w-10 h-10"
                    src={
                      following.avatar ||
                      "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg"
                    }
                  />
                  <div className="ml-4">
                    <div className="font-bold text-black">
                      {following.username}
                    </div>
                    <div className="text-gray-500">{following.name}</div>
                  </div>
                </div>
                {isOwnProfile ? (
                  <button
                    className="bg-black text-white font-medium px-4 py-2 rounded-full"
                    onClick={() => handleUnfollow(following._id)}
                  >
                    Hủy theo dõi
                  </button>
                ) : following._id === auth.userId ? (
                  ""
                ) : isFollowingUser(following._id) ? (
                  <button
                    className="bg-black text-white font-medium px-4 py-2 rounded-full"
                    onClick={() => handleUnfollow(following._id)}
                  >
                    Hủy theo dõi
                  </button>
                ) : (
                  <button
                    className="bg-[#EFEFEF] text-black font-medium px-4 py-2 rounded-full"
                    onClick={() => handleFollow(following._id)}
                  >
                    Follow
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              {user?.username} chưa theo dõi ai
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
