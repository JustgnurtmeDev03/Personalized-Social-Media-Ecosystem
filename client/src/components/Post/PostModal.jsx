import React, { useEffect, useState, useRef } from "react";
import "../../styles/Post.css";
import imageCompression from "browser-image-compression";
import { Controller, useForm } from "react-hook-form";
import api from "../../services/threadService";
import Avatar from "../../assets/Avatar";
import { fetchUserProfile } from "../../services/userService";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useAuth } from "../../providers/AuthContext";

const PostModal = ({ isOpen, onClose }) => {
  const maxLength = 1000;
  const warningLimit = 10;
  const placeholderText = "Có điều gì mới?";

  const [isTransitioning, setIsTransitioning] = useState(false);
  const { auth } = useAuth();
  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      content: "",
      mediaType: "file",
      mediaFile: null,
      mediaUrl: "",
    },
  });

  const content = watch("content");
  const remainingChars =
    content !== undefined ? maxLength - content.length : maxLength;
  const textareaRef = useRef(null);

  const [previews, setPreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [imageSizes, setImageSizes] = useState([]);
  const [mediaDimensions, setMediaDimensions] = useState(
    previews.map(() => ({ width: null, height: null }))
  );
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);
  const mediaType = watch("mediaType");

  // ======================== LOGIC ===========================

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const onSubmit = async (data) => {
    const authToken = localStorage.getItem("accessToken");
    setUploading(true);
    setErrorMessage("");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("content", data.content);

      if (data.mediaType === "file" && data.file && data.file.length > 0) {
        for (let i = 0; i < data.file.length; i++) {
          let file = data.file[i];
          if (file.type.startsWith("image/")) {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            };
            try {
              const compressedFile = await imageCompression(file, options);
              // Tạo File object với tên gốc nếu không thư viện imageCompression sẽ trả về dưới dạng Blob/File
              const fileWithName = new File([compressedFile], file.name, {
                type: compressedFile.type,
                lastModified: compressedFile.lastModified,
              });
              formData.append("media", fileWithName);
            } catch (error) {
              console.error("Lỗi khi nén hình ảnh:", error);
              setErrorMessage("Nén hình ảnh thất bại");
              setUploading(false);
              return;
            }
          } else {
            formData.append("media", file);
          }
        }
      } else if (data.mediaType === "url" && data.mediaUrl) {
        const payload = {
          content: data.content,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaUrl.includes("image") ? "image" : "video",
        };

        const res = await api.post("/upload", payload, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        console.log("Đăng bài thành công:", res.data);
        reset();
        setPreviews([]);
        setImageSizes([]);
        setUploadProgress(0);
        return;
      }

      const res = await api.post("/upload", formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (ProgressEvent) => {
          const percentCompleted = Math.round(
            (ProgressEvent.loaded * 100) / ProgressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      console.log("Đăng bài thành công:", res.data);
      reset();
      setPreviews([]);
      setImageSizes([]);
      setUploadProgress(0);
    } catch (error) {
      console.error("Gặp lỗi xảy ra khi đăng bài:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/mpeg",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
      ];
      const newPreviews = [];
      const newSizes = [];

      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          setErrorMessage(
            `File ${file.name} không hợp lệ. Chỉ hỗ trợ ảnh (JPEG, PNG, GIF, WebP) và video (MP4, MPEG, WebM, MOV, AVI).`
          );
          return;
        }
        const url = URL.createObjectURL(file);
        newPreviews.push({ url, type: file.type });

        const img = new Image();
        img.src = url;
        img.onload = () => {
          const originalWidth = img.width;
          const originalHeight = img.height;
          const totalSize = originalWidth + originalHeight;

          let newWidth = originalWidth;
          let newHeight = originalHeight;

          if (totalSize > 6000) {
            newWidth = img.width / 9.5;
            newHeight = img.height / 9.5;
          } else if (totalSize < 2000) {
            newWidth = img.width / 2.5;
            newHeight = img.height / 2.5;
          }
        };
      }

      setPreviews(newPreviews);
      setValue("file", e.target.files);
    } else {
      setPreviews([]);
      setImageSizes([]);
    }
  };

  const handleMediaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Xử lý hiển thị bản xem trước ảnh/video hiển thị hướng của bức ảnh (ngang/dọc)
  const updateOrientation = (idx, width, height) => {
    setPreviews((prev) => {
      const clone = [...prev];
      clone[idx] = {
        ...clone[idx],
        orientation: width > height ? "landscape" : "portrait",
      };
      return clone;
    });
  };

  // Xử lý để hiển thị bản xem trước ảnh/video cùng kích thước và tỷ lệ
  const handleUpdateDimensions = (index, width, height) => {
    const newDimensions = [...mediaDimensions];
    newDimensions[index] = { width, height };
    setMediaDimensions(newDimensions);

    // Gọi updateOrientation để cập nhật orientation (landscape/portrait)
    updateOrientation(index, width, height);
  };

  const removePreview = (index) => {
    setPreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Đồng bộ mediaDimensions
      setMediaDimensions((prevDimensions) =>
        prevDimensions.filter((_, i) => i !== index)
      );
      return newPreviews;
    });
  };

  // Ngăn chặn sự kiện mặc định trên video khi kéo
  const preventDefaultDrag = (e) => {
    e.preventDefault();
  };

  // ======================== EFFECTS ===========================

  useEffect(() => {
    const getUserData = async () => {
      try {
        if (!auth.accessToken || !auth.userId) {
          throw new Error("Không có token hoặc userId để xác thực");
        }
        const user = await fetchUserProfile(auth.userId, {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        setUserData(user);
      } catch (error) {
        setUserError("Lỗi khi lấy thông tin người dùng");
        console.error(error);
      } finally {
        setUserLoading(false);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsTransitioning(true);
    } else {
      const timeout = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    autoResizeTextarea();
  }, [content]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  if (userLoading) {
    return <p>Đang tải thông tin người dùng...</p>;
  }

  if (userError) {
    return <p>{userError}</p>;
  }

  if (!userData) {
    return <p>Không tìm thấy thông tin người dùng.</p>;
  }

  // ======================== RENDER ===========================

  return (
    <div className={`modal-overlay ${isOpen ? "open" : ""}`} onClick={onClose}>
      <h2 className="modal-title">Chủ đề mới</h2>
      <form
        className={`modal-content-post ${
          previews.length > 0 ? "has-image" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full pb-2 px-4 border-b">
          <button className="text-black text-lg ">Hủy bỏ</button>
          <h2 className="text-lg font-semibold ">Bài viết mới</h2>
          <div className="flex items-center space-x-4">
            <svg
              className="icon-post"
              aria-label="Drafts"
              role="img"
              viewBox="0 0 24 24"
            >
              <title>Drafts</title>
              <rect
                height="15"
                rx="4.5"
                stroke="currentColor"
                stroke-width="2"
                width="15"
                x="7"
                y="7"
              ></rect>
              <path
                clip-rule="evenodd"
                d="M15.3833 4.50007C15.0018 4.15977 14.5475 3.9045 14.05 3.75672C13.7983 3.68195 13.432 3.6357 12.7078 3.68313C11.9633 3.73189 11.0102 3.86454 9.59538 4.06338C8.18054 4.26222 7.22784 4.39741 6.4987 4.55577C5.78946 4.7098 5.45011 4.85522 5.22879 4.99646C4.51904 5.44941 3.99637 6.14302 3.7566 6.95012C3.68183 7.2018 3.63558 7.56809 3.68301 8.29232C3.73177 9.03686 3.86442 9.98992 4.06326 11.4047C4.23845 12.6513 4.36423 13.5391 4.49997 14.2313V17.5001C4.49997 17.737 4.51175 17.9713 4.53475 18.2022C4.05772 17.8249 3.64282 17.3681 3.31041 16.8473C2.66675 15.8387 2.47208 14.4535 2.08272 11.6831C1.69337 8.91269 1.49869 7.52748 1.83941 6.38057C2.21619 5.11227 3.03754 4.02231 4.15285 3.31053C5.16142 2.66688 6.54662 2.4722 9.31703 2.08284C12.0874 1.69349 13.4726 1.49881 14.6196 1.83953C15.8878 2.21631 16.9778 3.03766 17.6896 4.15297C17.7623 4.26696 17.8294 4.38577 17.8916 4.51084C17.7619 4.50369 17.6314 4.50007 17.5 4.50007H15.3833Z"
                fill="currentColor"
                fill-rule="evenodd"
              ></path>
              <rect
                fill="currentColor"
                height="2"
                rx="1"
                width="9"
                x="10"
                y="12"
              ></rect>
              <rect
                fill="currentColor"
                height="2"
                rx="1"
                width="6"
                x="10"
                y="15"
              ></rect>
            </svg>
            <svg
              className="icon-post"
              aria-label="More"
              role="img"
              viewBox="0 0 24 24"
            >
              <title>More</title>
              <circle cx="12" cy="12" r="10"></circle>
              <path
                class="x9fz28n x1iq1zl9"
                d="M7.5 13.5C6.67157 13.5 6 12.8284 6 12C6 11.1716 6.67157 10.5 7.5 10.5C8.32843 10.5 9 11.1716 9 12C9 12.8284 8.32843 13.5 7.5 13.5Z"
              ></path>
              <path
                class="x9fz28n x1iq1zl9"
                d="M12 13.5C11.1716 13.5 10.5 12.8284 10.5 12C10.5 11.1716 11.1716 10.5 12 10.5C12.8284 10.5 13.5 11.1716 13.5 12C13.5 12.8284 12.8284 13.5 12 13.5Z"
              ></path>
              <path
                class="x9fz28n x1iq1zl9"
                d="M16.5 13.5C15.6716 13.5 15 12.8284 15 12C15 11.1716 15.6716 10.5 16.5 10.5C17.3284 10.5 18 11.1716 18 12C18 12.8284 17.3284 13.5 16.5 13.5Z"
              ></path>
            </svg>
          </div>
        </div>

        <div className="modal-content-sub-post">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-info-user">
                <Avatar
                  _id={userData._id}
                  avatarUrl={userData.avatar}
                  size={40}
                />
                <span className="username">{userData.username}</span>
              </div>

              <div className="modal-information">
                <div className="modal-input">
                  <Controller
                    name="content"
                    control={control}
                    rules={{
                      maxLength: {
                        value: maxLength,
                        message: "Nội dung vượt quá ký tự cho phép.",
                      },
                    }}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        ref={(e) => {
                          field.ref(e);
                          textareaRef.current = e;
                        }}
                        placeholder={placeholderText}
                        style={{
                          paddingLeft: "10px",
                          maxHeight: "45vh",
                          width: "100%",
                          whiteSpace: "pre-wrap",
                          overflowY: "auto",
                          outline: "none",
                          resize: "none",
                        }}
                      />
                    )}
                  />

                  {errors.content && (
                    <span style={{ color: "red" }}>
                      {errors.content.message}
                    </span>
                  )}
                </div>

                {mediaType === "file" && previews?.length > 0 && (
                  <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                    <Swiper
                      spaceBetween={8}
                      slidesPerView="auto"
                      freeMode={true}
                      style={{ display: "flex", alignItems: "flex-start" }}
                    >
                      {previews.map((preview, index) => (
                        <SwiperSlide
                          key={preview.url || index}
                          className="!w-auto !h-auto inline- cursor-grab"
                        >
                          <div
                            className="relative flex-shrink-0 w-48 md:w-56 rounded-lg overflow-hidden bg-gray-100"
                            style={{
                              width: "auto", // Chiều rộng tự điều chỉnh theo tỷ lệ
                              height: "100%", // Chiều cao sẽ bị giới hạn bởi maxHeight
                              aspectRatio:
                                mediaDimensions[index]?.width /
                                  mediaDimensions[index]?.height || "1/1", // Giữ tỷ lệ gốc
                              maxWidth: "650px",
                              maxHeight: "400px",
                            }}
                          >
                            {preview.type.startsWith("video/") ? (
                              <video
                                className="object-cover w-full h-full"
                                controls
                                autoPlay
                                loop
                                onLoadedMetadata={(e) =>
                                  handleUpdateDimensions(
                                    index,
                                    e.target.videoWidth,
                                    e.target.videoHeight
                                  )
                                }
                                onMouseDown={preventDefaultDrag} // Ngăn sự kiện kéo mặc định
                                onTouchStart={preventDefaultDrag} // Ngăn sự kiện kéo mặc định trên cảm ứng
                                style={{ pointerEvents: "auto" }}
                              >
                                <source src={preview.url} type={preview.type} />
                                Trình duyệt của bạn không hỗ trợ video.
                              </video>
                            ) : (
                              <img
                                src={preview.url}
                                alt={`Preview ${index}`}
                                className="object-cover w-full h-full"
                                loading="lazy"
                                onLoad={(e) =>
                                  handleUpdateDimensions(
                                    index,
                                    e.target.naturalWidth,
                                    e.target.naturalHeight
                                  )
                                }
                              />
                            )}
                            {/* nút xóa */}
                            <button
                              type="button"
                              onClick={() => removePreview(index)}
                              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                            >
                              ×
                            </button>
                            {/* label Alt */}
                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                              Alt
                            </div>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                )}
              </div>

              <div className="more-options">
                <div className="icons">
                  <div className="icon-item">
                    {mediaType === "file" && (
                      <div className="media-upload">
                        <input
                          {...register("mediaType", { required: true })}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          style={{ display: "none" }}
                          ref={fileInputRef}
                          onChange={(e) => {
                            handleFileChange(e);
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleMediaClick}
                          className="attach-button"
                        >
                          <svg
                            aria-label="Đính kèm phương tiện truyền thông"
                            role="img"
                            viewBox="0 0 24 24"
                          >
                            <title>Attach media</title>
                            <g>
                              <path
                                clip-rule="evenodd"
                                d="M2.00207 9.4959C1.65132 7.00019 1.47595 5.75234 1.82768 4.73084C2.13707 3.83231 2.72297 3.05479 3.50142 2.50971C4.38639 1.89005 5.63425 1.71467 8.12996 1.36392L10.7047 1.00207C13.2004 0.651325 14.4482 0.47595 15.4697 0.827679C16.3682 1.13707 17.1458 1.72297 17.6908 2.50142C17.9171 2.82454 18.0841 3.19605 18.2221 3.65901C17.7476 3.64611 17.2197 3.64192 16.6269 3.64055C16.5775 3.5411 16.5231 3.44881 16.4621 3.36178C16.0987 2.84282 15.5804 2.45222 14.9814 2.24596C14.3004 2.01147 13.4685 2.12839 11.8047 2.36222L7.44748 2.97458C5.78367 3.20841 4.95177 3.32533 4.36178 3.73844C3.84282 4.10182 3.45222 4.62017 3.24596 5.21919C3.01147 5.90019 3.12839 6.73209 3.36222 8.3959L3.97458 12.7531C4.15588 14.0431 4.26689 14.833 4.50015 15.3978C4.50083 16.3151 4.50509 17.0849 4.53201 17.7448C4.13891 17.4561 3.79293 17.1036 3.50971 16.6991C2.89005 15.8142 2.71467 14.5663 2.36392 12.0706L2.00207 9.4959Z"
                                fill="currentColor"
                                fill-rule="evenodd"
                              ></path>
                              <g>
                                <g clip-path="url(#:r80:)">
                                  <rect
                                    fill="none"
                                    height="15.5"
                                    rx="3.75"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    width="15.5"
                                    x="6.75"
                                    y="5.8894"
                                  ></rect>
                                  <path
                                    d="M6.6546 17.8894L8.59043 15.9536C9.1583 15.3857 10.0727 15.3658 10.6647 15.9085L12.5062 17.5966C12.9009 17.9584 13.5105 17.9451 13.8891 17.5665L17.8181 13.6376C18.4038 13.0518 19.3536 13.0518 19.9394 13.6375L22.0663 15.7644"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                  ></path>
                                  <circle
                                    cx="10.75"
                                    cy="9.8894"
                                    fill="currentColor"
                                    r="1.25"
                                  ></circle>
                                </g>
                              </g>
                            </g>
                            <defs>
                              <clipPath id=":r80:">
                                <rect
                                  fill="white"
                                  height="17"
                                  rx="4.5"
                                  width="17"
                                  x="6"
                                  y="5.1394"
                                ></rect>
                              </clipPath>
                            </defs>
                          </svg>
                        </button>
                        <Controller
                          name="mediaFile"
                          control={control}
                          render={({ field, fieldState }) =>
                            fieldState.error && (
                              <span style={{ color: "red", fontSize: "12px" }}>
                                {fieldState.error.message}
                              </span>
                            )
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="icon-item">
                    <svg
                      fill="none"
                      height="24"
                      title="123"
                      viewBox="0 0 24 24"
                      width="24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>GIF Picker Icon</title>
                      <g clip-path="url(#:r13:)">
                        <path
                          d="M20.6472 13.7545L21.2766 14.1623L20.6472 13.7545C20.4715 14.0256 20.2404 14.2752 19.647 14.9058L15.4667 19.3473C14.7767 20.0804 14.5029 20.3659 14.1962 20.5791C13.785 20.8649 13.3208 21.0655 12.8308 21.169C12.4654 21.2462 12.0698 21.25 11.0631 21.25C9.62515 21.25 8.58506 21.2496 7.76313 21.1923C6.94813 21.1356 6.40373 21.0256 5.95094 20.8336C4.69662 20.3019 3.69812 19.3034 3.16638 18.0491C2.97444 17.5963 2.86444 17.0519 2.80767 16.2369C2.75042 15.4149 2.75 14.3748 2.75 12.9369V11.6C2.75 9.90747 2.75058 8.68317 2.82925 7.72029C2.90721 6.76615 3.05809 6.13493 3.32222 5.61655C3.82555 4.6287 4.6287 3.82555 5.61655 3.32222C6.13493 3.05809 6.76615 2.90721 7.72029 2.82925C8.68317 2.75058 9.90747 2.75 11.6 2.75H13.1363C14.48 2.75 15.4519 2.75037 16.2211 2.80049C16.984 2.8502 17.4953 2.94657 17.9222 3.11455C19.2784 3.64817 20.3518 4.72155 20.8855 6.07779C21.0534 6.50473 21.1498 7.01596 21.1995 7.77888C21.2496 8.54813 21.25 9.52002 21.25 10.8637C21.25 11.7295 21.2472 12.0697 21.1893 12.3875C21.1006 12.8745 20.9163 13.3391 20.6472 13.7545Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                        ></path>
                        <path
                          d="M13 21V19.3784V19.3784C13 15.8557 15.8557 13.0001 19.3784 13.0002V13.0002H21"
                          stroke="currentColor"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                        ></path>
                        <path
                          d="M8.33957 11.406C6.68121 11.406 5.69995 10.432 5.69995 8.69756C5.69995 6.98488 6.68121 6 8.2925 6C9.33894 6 10.1283 6.44899 10.4361 6.99936C10.5121 7.14058 10.5411 7.26369 10.5411 7.39404C10.5411 7.77785 10.2731 8.04218 9.88207 8.04218C9.58153 8.04218 9.35342 7.92631 9.16513 7.67647C8.91891 7.34697 8.66907 7.20937 8.29974 7.20937C7.64798 7.20937 7.26417 7.74526 7.26417 8.67583C7.26417 9.62812 7.7023 10.1966 8.37578 10.1966C8.87546 10.1966 9.23031 9.91779 9.27376 9.49777L9.281 9.42535H8.98047C8.63648 9.42535 8.41199 9.24431 8.41199 8.91481C8.41199 8.58531 8.63286 8.40426 8.98047 8.40426H9.99069C10.4795 8.40426 10.7583 8.69393 10.7583 9.2081C10.7583 10.4501 9.89655 11.406 8.33957 11.406Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M12.5259 11.406C12.0371 11.406 11.7583 11.1163 11.7583 10.6021V6.80384C11.7583 6.28967 12.0371 6 12.5259 6C13.0147 6 13.2936 6.28967 13.2936 6.80384V10.6021C13.2936 11.1163 13.0147 11.406 12.5259 11.406Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M15.3112 11.3606C14.8224 11.3606 14.5436 11.0709 14.5436 10.5568V6.849C14.5436 6.33484 14.8224 6.04517 15.3112 6.04517H17.6105C18.0232 6.04517 18.2876 6.26604 18.2876 6.65709C18.2876 7.04815 18.016 7.26902 17.6105 7.26902H16.0788V8.26839H17.4548C17.8386 8.26839 18.0848 8.4784 18.0848 8.84411C18.0848 9.20981 17.8458 9.41983 17.4548 9.41983H16.0788V10.5568C16.0788 11.0709 15.8 11.3606 15.3112 11.3606Z"
                          fill="currentColor"
                        ></path>
                      </g>
                      <defs>
                        <clipPath id=":r13:">
                          <rect
                            fill="white"
                            height="20"
                            transform="translate(2 2)"
                            width="20"
                          ></rect>
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <div className="icon-item">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5"
                      />
                    </svg>
                  </div>
                  <div className="icon-item">
                    <svg aria-label="Add a poll" role="img" viewBox="0 0 24 24">
                      <title>Add a poll</title>
                      <rect
                        fill="currentColor"
                        height="1.5"
                        rx="0.75"
                        width="8"
                        x="4"
                        y="5.5"
                      ></rect>
                      <rect
                        fill="currentColor"
                        height="1.5"
                        rx="0.75"
                        width="16"
                        x="4"
                        y="11.25"
                      ></rect>
                      <rect
                        fill="currentColor"
                        height="1.5"
                        rx="0.75"
                        width="11"
                        x="4"
                        y="17"
                      ></rect>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="vertical-divider"></div>
          </div>
          <div className="avatar-small">
            <Avatar _id={userData._id} avatarUrl={userData.avatar} size={20} />
            <span>Thêm vào chủ đề</span>
          </div>
        </div>
        <div className="privacy-post">
          <span>Bất cứ ai cũng có thể trả lời và trích dẫn</span>

          <div>
            {remainingChars <= warningLimit && (
              <div style={{ color: "red" }}>{remainingChars} ký tự còn lại</div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="post-button"
              disabled={uploading}
            >
              {uploading ? `Đang tải (${uploadProgress}%)` : "Đăng"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostModal;
