import React, { useEffect, useState } from "react";
import { fetchFollowers } from "../../services/userService";
import { useAuth } from "../../providers/AuthContext";

export default function FollowersModal({
  isOpen,
  onClose,
  user,
  followers = [],
  following = [],
}) {
  const { auth } = useAuth();
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [errorsFollowers, setErrorFollowers] = useState(null);
  const [activeTab, setActiveTab] = useState("followers");

  useEffect(() => {
    if (isOpen && user?._id) {
      const fetchFollowersData = async () => {
        try {
          if (!auth.accessToken || !auth.userId) {
            throw new Error("Không có token hoặc userId để xác thực");
          }
          const data = await fetchFollowers(auth.userId, {
            // Sử dụng auth.userId thay vì userId từ useParams
            headers: { Authorization: `Bearer ${auth.accessToken}` },
          });
          console.log(data);
          setFollowersData(data);
        } catch (error) {
          setErrorFollowers("Lỗi khi lấy thông tin người dùng");
          console.error(error);
        } finally {
          setLoadingFollowers(false);
        }
      };
      fetchFollowersData();
    }
  }, [isOpen, user?._id]);

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
          <div className="w-1/2 text-center py-4 pb-0">
            <span className="font-bold text-black">Followers</span>
            <span className="block text-black">{followersData.length}</span>
            <div className="border-b-2 border-black mt-2"></div>
          </div>
          <div className="w-1/2 text-center py-4">
            <span className="text-gray-400">Following</span>
            <span className="block text-gray-400">{followingData.length}</span>
          </div>
        </div>
        <div className="p-4">
          {followers.length > 0 ? (
            followers.map((follower) => (
              <div
                key={follower._id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center">
                  <img
                    alt="Profile picture of ..."
                    className="rounded-full w-10 h-10"
                    height="40"
                    src="https://storage.googleapis.com/a1aa/image/v5txCWijcefTO9yCyXvSuPlfcEL8Z0cNLX4hBJTfhKs.jpg"
                    width="40"
                  />
                  <div className="ml-4">
                    <div className="font-bold text-black">
                      {follower.username}
                    </div>
                    <div className="text-gray-500">{follower.name}</div>
                  </div>
                </div>
                <button className="bg-black text-white px-4 py-2 rounded-full">
                  Follow back
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              {user?.username} chưa có ai theo dõi
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
