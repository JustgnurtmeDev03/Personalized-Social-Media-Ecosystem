import React from "react";
import { useState, useEffect, useRef } from "react";
import "../../styles/Profile.css";
import EditBioModal from "../../components/EditProfile/EditBioModal/EditBioModal";
import { useModal } from "../../providers/ModalContext";
import {
  fetchUserProfile,
  updateUserProfile,
} from "../../services/userService";
import Avatar from "../../assets/Avatar";

const EditProfileModal = ({ userData, setUserData, editSection }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  const {
    accessToken,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isBioModalOpen,
    setIsBioModalOpen,
  } = useModal();

  const avatarMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  const [bio, setBio] = useState("");
  const [tempBio, setTempBio] = useState(userData.bio || "");
  const [tempAvatar, setTempAvatar] = useState(userData.avatar || "");
  const [selectedFile, setSelectedFile] = useState(null);

  // ======================== LOGIC ===========================

  // XỬ LÝ CLICK VÀO AVATAR
  const handleAvatarClick = (e) => {
    setIsAvatarMenuOpen(true);
  };

  // XỬ LÝ KHI BẤM "UPLOAD ẢNH"/"XÓA ẢNH/HỦY BỎ" VÀ XỬ LÝ THAY ĐỔI FILE INPUT
  const handleUploadClick = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setTempAvatar(previewUrl);
      setIsAvatarMenuOpen(false);
    }
  };
  const handleRemoveAvatar = () => {
    setTempAvatar("");
    setSelectedFile(null);
    setIsAvatarMenuOpen(false);
  };
  const handleCancelAvatarMenu = () => {
    setIsAvatarMenuOpen(false);
  };

  // XỬ LÝ LƯU THÔNG TIN ĐÃ THÊM / CHỈNH SỬA

  const handleSaveProfile = async () => {
    const isDelete = selectedFile === null && tempAvatar === "";
    const avatarToUpdate = selectedFile || (isDelete ? "" : null);
    
    try {
      const updatedUser = await updateUserProfile(
        accessToken,
        tempBio,
        avatarToUpdate
      );

      // Cập nhật UI ngay lập tức
      setBio(tempBio);

      setUserData((prev) => ({
        ...prev,
        bio: tempBio,
        avatar: updatedUser.avatar,
      }));

      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật tiểu sử:", error);
    }
  };

  // Xử lý phần mở "Thêm/chỉnh sửa BIO"

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (isBioModalOpen) {
        setIsBioModalOpen(false);
      } else {
        setIsProfileModalOpen(false);
        setTempAvatar(null);
      }
    }
  };

  // ======================== EFFECTS ===========================

  useEffect(() => {
    if (editSection === "bio") {
      setIsBioModalOpen(true);
    }
  }, [editSection, setIsBioModalOpen]);

  // XỬ LÝ KHI CLICK RA KHỎI AVATAR
  useEffect(() => {
    function handleClicksOutside(event) {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(event.target)
      ) {
        setIsAvatarMenuOpen(false);
        setTempAvatar(null);
      }
    }
    document.addEventListener("mousedown", handleClicksOutside);
    return () => {
      document.removeEventListener("mousedown", handleClicksOutside);
    };
  }, []);

  // Xử lý hộp thoại "thêm bio" ngoài phần "chỉnh sửa hồ sơ"
  useEffect(() => {
    if (editSection === "bio") {
      setIsBioModalOpen(true); // Mở luôn phần sửa bio
    }
  }, [editSection]);

  useEffect(() => {
    if (isProfileModalOpen) {
      setTimeout(() => setIsVisible(true), 10);
      fetchUserProfile(accessToken)
        .then((data) => {
          setBio(data.bio || ""); // Nếu chưa có bio thì để rỗng
          setTempBio(data.bio || "");
          setUserData(data); // Cập nhật dữ liệu mới từ API
        })
        .catch((error) => console.error("Lỗi khi tải hồ sơ:", error));
    } else {
      setIsVisible(false);
    }
  }, [isProfileModalOpen, accessToken]);

  if (!isProfileModalOpen) return null;

  // ======================== RENDER ===========================

  return (
    <div className={`profile-overlay ${"active"}`} onClick={handleOverlayClick}>
      <div className={`modal ${isVisible ? "open" : ""}`}>
        <div className="modal-section flex-modal">
          <div>
            <h2>Tên</h2>
            <h1>
              {userData.name} ({userData.username})
            </h1>
          </div>
          <div
            className="modal-header-pf"
            onClick={handleAvatarClick}
            ref={avatarMenuRef}
          >
            <Avatar
              _id={userData._id}
              avatarUrl={tempAvatar !== null ? tempAvatar : userData.avatar}
              size={80}
            />
          </div>
          {isAvatarMenuOpen && (
            <div className="avatar-menu" ref={avatarMenuRef}>
              <ul>
                <button onClick={handleUploadClick}>Tải ảnh lên</button>

                <button onClick={handleRemoveAvatar}>Xóa ảnh hiện tại</button>
                <button onClick={handleCancelAvatarMenu}>Hủy bỏ</button>
              </ul>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
        <hr />
        <div className="modal-section">
          <h3>Tiểu sử</h3>
          <div className="profile-bio" onClick={() => setIsBioModalOpen(true)}>
            {tempBio ? (
              tempBio
                .split("\n")
                .map((line, index) => <p key={index}>{line}</p>)
            ) : (
              <p className="empty">+ Viết tiểu sử</p>
            )}
          </div>
        </div>
        {isBioModalOpen && (
          <EditBioModal
            isOpen={isBioModalOpen}
            onClose={() => setIsBioModalOpen(false)}
            onSave={(newBio) => setTempBio(newBio)}
            initialBio={tempBio}
          />
        )}
        <hr />
        <div className="modal-section">
          <h3>Đường dẫn</h3>
          <p>+ Thêm đường dẫn</p>
        </div>
        <hr />
        <div className="toggle-switch">
          <div>
            <p>Private profile</p>
            <small>
              If you switch to private, you won't be able to reply to others
              unless they follow you.
            </small>
          </div>
          <label className="switch">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
        </div>
        <button className="done-button" onClick={handleSaveProfile}>
          Hoàn thành
        </button>
      </div>
    </div>
  );
};

export default EditProfileModal;
