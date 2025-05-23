import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "font-awesome/css/font-awesome.min.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import Avatar from "../../assets/Avatar";

const PostItem = ({ post, userData, handleToggleLike }) => {
  const [mediaDimensions, setMediaDimensions] = useState(
    Array(post.images?.length || 0).fill({ width: null, height: null })
  );

  // Hàm định dạng thời gian bài viết
  const formatPostTime = (createdAt) => {
    const now = new Date();
    const postTime = new Date(createdAt);
    const diffMs = now - postTime;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút`;
    if (hours < 24) return `${hours} giờ`;
    if (days < 7) return `${days} ngày`;

    const day = postTime.getDate().toString().padStart(2, "0");
    const month = (postTime.getMonth() + 1).toString().padStart(2, "0");
    const year = postTime.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Xử lý hiển thị bản xem trước ảnh/video hiển thị hướng của bức ảnh (ngang/dọc)
  const updateOrientation = (idx, width, height) => {
    setMediaDimensions((prev) => {
      const clone = [...prev];
      clone[idx] = {
        width,
        height,
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
    updateOrientation(index, width, height);
  };

  // Ngăn chặn sự kiện mặc định trên video khi kéo
  const preventDefaultDrag = (e) => {
    e.preventDefault();
  };

  return (
    <div className="posts-content max-w-l bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <Avatar
          _id={post.author?._id || userData?._id}
          avatarUrl={post.author?.avatar || userData?.avatar}
          size={40}
        />
        <div className="ml-3">
          <Link
            to={`/profile/${post.author?._id || userData?._id}`}
            className="font-bold hover:underline"
          >
            {post.author?.username || userData?.username}
          </Link>
          <div className="text-gray-500 text-sm">
            {formatPostTime(post.createdAt)}
          </div>
        </div>
      </div>
      <div className="mb-4">
        <p className="post-content">{post.content}</p>
        <p className="post-hashtags">
          {Array.isArray(post.hashtags) ? (
            post.hashtags.map((hashtag, index) => (
              <span key={index} className="hashtag">
                {hashtag}{" "}
              </span>
            ))
          ) : (
            <span>Không có hashtag</span>
          )}
        </p>
        <p className="text-lg post-translate">Dịch</p>
      </div>
      <div className="grid">
        <Swiper
          spaceBetween={8}
          slidesPerView="auto"
          freeMode={true}
          style={{ display: "flex", alignItems: "flex-start" }}
        >
          {post.images?.length > 0 && (
            <div className="post-image">
              {post.images.map((image, index) => (
                <SwiperSlide
                  key={index}
                  className="!w-auto !h-auto incline- cursor-grab"
                >
                  <div
                    className="relative flex-shrink-0 w-48 md:w-56 rounded-lg overflow-hidden bg-gray-100"
                    style={{
                      width: "auto",
                      height: "100%",
                      aspectRatio:
                        mediaDimensions[index]?.width /
                          mediaDimensions[index]?.height || "1/1",
                      maxWidth: "580px",
                      maxHeight: "400px",
                    }}
                  >
                    <img
                      key={index}
                      src={image}
                      alt={`Hình ảnh ${index + 1}`}
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
                  </div>
                </SwiperSlide>
              ))}
            </div>
          )}
          {post.videos?.length > 0 &&
            post.videos.every((video) => video.startsWith("http")) && (
              <div className="post-videos">
                {post.videos.map((video, index) => (
                  <SwiperSlide
                    key={index}
                    className="!w-auto !h-auto incline- cursor-grab"
                  >
                    <div
                      className="relative flex-shrink-0 w-48 md:w-56 rounded-lg overflow-hidden bg-gray-100"
                      style={{
                        width: "auto",
                        height: "100%",
                        aspectRatio:
                          mediaDimensions[index]?.width /
                            mediaDimensions[index]?.height || "1/1",
                        maxWidth: "650px",
                        maxHeight: "400px",
                      }}
                    >
                      <video
                        key={index}
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
                        onMouseDown={preventDefaultDrag}
                        onTouchStart={preventDefaultDrag}
                        style={{ pointerEvents: "auto" }}
                      >
                        <source src={video} type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                    </div>
                  </SwiperSlide>
                ))}
              </div>
            )}
        </Swiper>
      </div>
      <div className="flex items-center mt-4 text-gray-500">
        <button
          className={`like-button ${post.isLiked ? "liked" : ""}`}
          onClick={() => handleToggleLike(post._id)}
        >
          <i className="fa fa-heart heart-icon"></i>
          <span className="ml-1">{post.likesCount || 0}</span>
        </button>
        <div className="flex items-center mr-4">
          <i className="fas fa-comment"></i>
          <span className="ml-1">{post.commentsCount || 0}</span>
        </div>
        <div className="flex items-center">
          <i className="fas fa-share"></i>
          <span className="ml-1">{post.sharesCount || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default PostItem;
