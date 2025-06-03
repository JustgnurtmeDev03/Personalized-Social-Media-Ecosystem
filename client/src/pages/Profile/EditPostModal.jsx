import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "../../services/threadService";
import "../../styles/Post.css";

const EditPostModal = ({ isOpen, onClose, post, onUpdate }) => {
  const { register, handleSubmit, setValue, reset } = useForm({
    defaultValues: {
      content: "",
      hashtags: "",
      visibility: "public",
    },
  });

  const [visibility, setVisibility] = useState("public");
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Thêm state cho thông báo lỗi

  const calculateRows = (content) => {
    if (!content) return 4;
    const lineCount = content.split("\n").length;
    const charCount = content.length;
    if (charCount > 500 || lineCount > 8) return 8;
    if (charCount > 200 || lineCount > 4) return 6;
    return Math.max(4, lineCount);
  };

  useEffect(() => {
    if (isOpen && post) {
      reset({
        content: post.content || "",
        hashtags: post.hashtags?.join(", ") || "",
        visibility: post.visibility || "public",
      });
      setVisibility(post.visibility || "public");
      setErrorMessage(""); // Reset lỗi khi mở modal
    }
  }, [isOpen, post, reset]);

  const handleVisibilitySelect = (value) => {
    setVisibility(value);
    setValue("visibility", value);
    setIsVisibilityMenuOpen(false);
  };

  const toggleVisibilityMenu = () => {
    setIsVisibilityMenuOpen((prev) => !prev);
  };

  const onSubmit = async (data) => {
    try {
      const updatedPost = {
        content: data.content,
        hashtags: data.hashtags
          ? data.hashtags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        visibility: data.visibility,
      };
      const response = await api.put(`/posts/${post._id}`, updatedPost, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error(
        "Error updating post:",
        error.response?.data?.error || error.message
      );
      setErrorMessage(error.response?.data?.error || "Failed to update post");
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-content-post" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between w-full pb-2 px-4 border-b">
          <button className="text-black text-lg" onClick={onClose}>
            Hủy bỏ
          </button>
          <h2 className="text-lg font-semibold">Chỉnh sửa bài viết</h2>
          <button
            className="text-blue-500 text-lg"
            onClick={handleSubmit(onSubmit)}
          >
            Lưu
          </button>
        </div>
        <div className="modal-content-sub-post">
          {/* Hiển thị thông báo lỗi */}
          {errorMessage && (
            <div className="px-4 py-2 bg-red-100 text-red-600 rounded-md mb-2">
              {errorMessage}
            </div>
          )}
          {/* Hiển thị media */}
          {(post.images?.length > 0 || post.videos?.length > 0) && (
            <div className="media-preview px-4 py-3">
              <p className="text-sm font-semibold text-gray-600 mb-3">
                Media (không thể chỉnh sửa)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {post.images?.map((image, index) => (
                  <div
                    key={`image-${index}`}
                    className="relative overflow-hidden rounded-lg border border-gray-200"
                  >
                    <img
                      src={image}
                      alt="Post image"
                      className="w-full h-40 object-contain bg-gray-50"
                    />
                  </div>
                ))}
                {post.videos?.map((video, index) => (
                  <div
                    key={`video-${index}`}
                    className="relative overflow-hidden rounded-lg border border-gray-200"
                  >
                    <video
                      src={video}
                      controls
                      className="w-full h-40 object-contain bg-gray-50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <textarea
            {...register("content")}
            placeholder="Nội dung bài viết"
            className="w-full p-2 border-none outline-none resize-none"
            rows={calculateRows(post.content)}
            maxLength={5000}
          />
          <input
            {...register("hashtags")}
            placeholder="Hashtags (cách nhau bằng dấu phẩy)"
            className="w-full p-2 border-none outline-none mt-2"
          />
          <div className="privacy-post flex items-center justify-between px-4 py-2">
            <div className="privacy-options relative">
              <button
                type="button"
                onClick={toggleVisibilityMenu}
                className="flex items-center text-sm font-semibold px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                {visibility === "public" && "Bất cứ ai"}
                {visibility === "friends" && "Bạn bè"}
                {visibility === "only_me" && "Chỉ mình tôi"}
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isVisibilityMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-md z-10">
                  <ul className="divide-y divide-gray-200">
                    <li>
                      <button
                        type="button"
                        onClick={() => handleVisibilitySelect("public")}
                        className="w-full text-left font-semibold px-5 py-3 hover:bg-gray-100 rounded-t-lg"
                      >
                        Bất cứ ai
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => handleVisibilitySelect("friends")}
                        className="w-full text-left font-semibold px-5 py-3 hover:bg-gray-100"
                      >
                        Bạn bè
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => handleVisibilitySelect("only_me")}
                        className="w-full text-left font-semibold px-5 py-3 hover:bg-gray-100 rounded-b-lg"
                      >
                        Chỉ mình tôi
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
