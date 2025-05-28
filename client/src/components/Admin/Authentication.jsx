import React, { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthContext";
import { fetchUserProfile } from "../../services/userService";
import Avatar from "../../assets/Avatar";

const Authentication = () => {
  const { auth } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

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

  return (
    <div className="header w-full bg-[#fafafa] border-b border-gray-200 flex justify-end items-center pr-5">
      <Avatar _id={adminData?._id} avatarUrl={adminData?.avatar} size={50} />
    </div>
  );
};

export default Authentication;
