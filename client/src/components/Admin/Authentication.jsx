import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../providers/AuthContext";
import { fetchUserProfile } from "../../services/userService";
import Avatar from "../../assets/Avatar";

const Authentication = () => {
  const { auth, logout } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const fetchAdminData = async () => {
    console.log("fetchAdminData called");
    try {
      if (!auth.accessToken || !auth.userId) {
        throw new Error("Không có token hoặc userId để xác thực");
      }

      const user = await fetchUserProfile(auth.userId, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setAdminData(user);
    } catch (error) {
      setAdminError(`Lỗi khi lấy thông tin: ${error.message}`);
      console.error(
        "Error in fetchAdminData:",
        error.response?.data || error.message
      );
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (auth.userId && auth.accessToken) {
      fetchAdminData();
    } else {
      setAdminError(
        "Không có userId hoặc token để lấy thông tin người quản trị"
      );
      setAdminLoading(false);
    }
  }, [auth.userId, auth.accessToken]);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <div className="header w-full bg-[#fafafa] border-b border-gray-200 flex justify-end items-center pr-5 relative">
      <div ref={menuRef}>
        <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar
            _id={adminData?._id}
            avatarUrl={adminData?.avatar}
            size={50}
          />
        </div>
        {isMenuOpen && (
          <div className="absolute right-5 top-16 bg-white border border-gray-200 rounded-md shadow-lg z-10">
            <ul className="py-2 flex flex-row items-center px-3">
              <svg
                fill="currentColor"
                color="inherit"
                font-size="inherit"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
              >
                <path d="M18.76 8.82C18 10.32 18 12.28 18 16.2v5.3h11.4c.56 0 2.84 0 3.05.1a1 1 0 0 1 .44.45c.11.21.11.49.11 1.05v1.8c0 .56 0 .84-.1 1.05a1 1 0 0 1-.45.44c-.21.11-2.49.11-3.05.11H18v5.3c0 3.92 0 5.88.76 7.38a7 7 0 0 0 3.06 3.06c1.5.76 3.46.76 7.38.76h4.6c3.92 0 5.88 0 7.38-.76a7 7 0 0 0 3.06-3.06c.76-1.5.76-3.46.76-7.38V16.2c0-3.92 0-5.88-.76-7.38a7 7 0 0 0-3.06-3.06C39.68 5 37.72 5 33.8 5h-4.6c-3.92 0-5.88 0-7.38.76a7 7 0 0 0-3.06 3.06Z"></path>
                <path d="m2.66 25.6 8.87 8.86c.4.4.6.6.82.67a1 1 0 0 0 .62 0c.23-.08.42-.27.82-.67l.92-.92c.4-.4.6-.6.67-.82a1 1 0 0 0 0-.62c-.08-.23-.27-.43-.67-.82l-5.03-5.03h7.97c.56 0 .84 0 1.05-.1a1 1 0 0 0 .44-.45c.11-.21.11-.49.11-1.05v-1.3c0-.56 0-.84-.1-1.05a1 1 0 0 0-.45-.44c-.21-.11-.49-.11-1.05-.11H9.68l5.03-5.03c.4-.4.6-.6.67-.82a1 1 0 0 0 0-.62c-.08-.23-.27-.42-.67-.82l-.92-.92c-.4-.4-.6-.6-.82-.67a1 1 0 0 0-.62 0c-.23.08-.43.27-.82.67l-8.87 8.87c-.88.88-.88 2.3 0 3.18Z"></path>
              </svg>
              <li
                onClick={handleLogout}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                Đăng xuất
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Authentication;
