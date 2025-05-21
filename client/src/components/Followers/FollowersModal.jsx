import React, { useEffect, useState } from "react";
import { fetchFollowers, fetchFollowing } from "../../services/userService";
import { useAuth } from "../../providers/AuthContext";

export default function FollowersModal({ isOpen, onClose, user }) {
  const { auth } = useAuth();
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [errorsFollowers, setErrorFollowers] = useState(null);
  const [activeTab, setActiveTab] = useState("followers");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    if (isOpen && user?._id) {
      const fetchData = async () => {
        try {
          if (!auth.accessToken || !auth.userId) {
            throw new Error("Không có token hoặc userId để xác thực");
          }
          const followers = await fetchFollowers(auth.userId, {
            // Sử dụng auth.userId thay vì userId từ useParams
            headers: { Authorization: `Bearer ${auth.accessToken}` },
          });
          const following = await fetchFollowing(auth.userId, {
            headers: { Authorization: `Bearer ${auth.accessToken}` },
          });
          setFollowersData(followers);
          setFollowingData(following);
        } catch (error) {
          setErrorFollowers("Lỗi khi lấy thông tin người dùng");
          console.error(error);
        } finally {
          setLoadingFollowers(false);
          setLoadingFollowing(false);
        }
      };
      fetchData();
    }
  }, [isOpen, user?._id, auth.accessToken, auth.userId]);

  useEffect(() => {
    if (!isOpen) {
      setFollowersData([]);

      setErrorFollowers(null);
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
                  {!follower.isMutual && (
                    <button className="bg-[#EFEFEF] text-black font-medium px-4 py-2 rounded-full">
                      Follow lại
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
                <button className="bg-black text-white font-medium px-4 py-2 rounded-full">
                  Hủy theo dõi
                </button>
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
