import React from "react";

export default function FollowersModal({
  isOpen,
  onClose,
  user,
  followers,
  following,
}) {
  if (!isOpen) return null; // Không render nếu chưa mở

  return (
    <div class="profile-overlay " onClick={onClose}>
      <div
        class="bg-white rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex justify-between cursor-pointer">
          <div class="w-1/2 text-center py-4 pb-0">
            <span class="font-bold text-black">Followers</span>
            <span class="block text-black">{followers.length}</span>
            <div class="border-b-2 border-black mt-2"></div>
          </div>
          <div class="w-1/2 text-center py-4">
            <span class="text-gray-400">Following</span>
            <span class="block text-gray-400">{following.length}</span>
          </div>
        </div>
        <div class="p-4">
          {followers.length > 0 ? (
            followers.map((follower) => (
              <div
                key={follower._id}
                class="flex items-center justify-between py-2"
              >
                <div class="flex items-center">
                  <img
                    alt="Profile picture of ..."
                    class="rounded-full w-10 h-10"
                    height="40"
                    src="https://storage.googleapis.com/a1aa/image/v5txCWijcefTO9yCyXvSuPlfcEL8Z0cNLX4hBJTfhKs.jpg"
                    width="40"
                  />
                  <div class="ml-4">
                    <div class="font-bold text-black">{follower.username}</div>
                    <div class="text-gray-500">{follower.name}</div>
                  </div>
                </div>
                <button class="bg-black text-white px-4 py-2 rounded-full">
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
