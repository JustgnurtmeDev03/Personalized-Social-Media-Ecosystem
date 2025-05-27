import { useState, useEffect } from "react";

export default function EditBioModal({ isOpen, onClose, onSave, initialBio }) {
  const MAX_BIO_LENGTH = 200;
  const [bio, setBio] = useState(() => {
    return sessionStorage.getItem("bioDraft") || initialBio || "";
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("bioDraft", bio);
  }, [bio]);

  useEffect(() => {
    if (!isOpen) {
      sessionStorage.removeItem("bioDraft");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setBio(initialBio || ""); // Reset bio khi mở lại
      setTimeout(() => setIsVisible(true), 10); // Kích hoạt animation
    } else {
      setIsVisible(false);
    }
  }, [isOpen, initialBio]);

  const handleInputChange = (e) => {
    let inputValue = e.target.value;

    // Ngăn nhập toàn khoảng trắng
    if (/^\s+$/.test(inputValue)) {
      return;
    }

    // Giới hạn ký tự
    if (inputValue.length > MAX_BIO_LENGTH) {
      return;
    }
    setBio(inputValue);
  };

  const handleSave = () => {
    const trimmedBio = bio.trim();
    onSave(trimmedBio);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`bio-overlay ${isVisible ? "active" : ""}`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b p-4">
          <button className="text-blue-500" onClick={onClose}>
            Hủy bỏ
          </button>
          <h2 className="text-lg font-semibold">Nhập tiểu sử</h2>
          <button className="text-blue-500" onClick={handleSave}>
            Hoàn thành
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            <div className="bio-input-container">
              <textarea
                className="bio-input"
                value={bio}
                onChange={handleInputChange}
                placeholder="Viết tiểu sử của bạn..."
              ></textarea>
            </div>
            <p className="text-gray-500 text-sm">
              Hồ sơ của bạn sẽ được để công khai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
