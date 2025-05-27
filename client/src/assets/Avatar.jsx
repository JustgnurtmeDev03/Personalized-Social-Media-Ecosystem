import React from "react";
import PropTypes from "prop-types";

// Hàm để tạo avatar mặc định
export const getDefaultAvatar = (_id) => {
  return `https://robohash.org/${_id}.png?size=200x200&set=set1`;
};

export default function Avatar({ _id, avatarUrl, size = 80 }) {
  // Kiểm tra avatarUrl và sử dụng avatar mặc định nếu không có avatarUrl
  const finalAvatar =
    avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : getDefaultAvatar(_id);

  return (
    <div
      className="profile-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #f0f0f0, #dcdcdc)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <img
        src={finalAvatar}
        alt="User Avatar"
        className="avatar-image"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          objectFit: "cover",
          zIndex: "9",
        }}
      />
    </div>
  );
}

// Kiểm tra kiểu dữ liệu của props
Avatar.propTypes = {
  _id: PropTypes.string.isRequired,
  avatarUrl: PropTypes.string, // avatarUrl có thể không có
  size: PropTypes.number, // Kích thước mặc định là 80
};
