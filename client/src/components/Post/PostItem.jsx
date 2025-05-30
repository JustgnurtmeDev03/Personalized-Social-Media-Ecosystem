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
    <div className="posts-content max-w-l bg-white p-4 rounded-lg shadow-md mb-2">
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
          <div className="text-gray-500 text-sm flex items-center">
            {formatPostTime(post.createdAt)}{" "}
            <div className="text-gray-500 text-sm ml-2 ">
              <div className="relative group">
                {post.visibility === "public" && (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    fill="currentColor"
                    title="Đã chia sẻ với Công khai"
                  >
                    <title>Đã chia sẻ với Công khai</title>
                    <g fill-rule="evenodd" transform="translate(-448 -544)">
                      <g>
                        <path
                          d="M109.5 408.5c0 3.23-2.04 5.983-4.903 7.036l.07-.036c1.167-1 1.814-2.967 2-3.834.214-1 .303-1.3-.5-1.96-.31-.253-.677-.196-1.04-.476-.246-.19-.356-.59-.606-.73-.594-.337-1.107.11-1.954.223a2.666 2.666 0 0 1-1.15-.123c-.007 0-.007 0-.013-.004l-.083-.03c-.164-.082-.077-.206.006-.36h-.006c.086-.17.086-.376-.05-.529-.19-.214-.54-.214-.804-.224-.106-.003-.21 0-.313.004l-.003-.004c-.04 0-.084.004-.124.004h-.037c-.323.007-.666-.034-.893-.314-.263-.353-.29-.733.097-1.09.28-.26.863-.8 1.807-.22.603.37 1.166.667 1.666.5.33-.11.48-.303.094-.87a1.128 1.128 0 0 1-.214-.73c.067-.776.687-.84 1.164-1.2.466-.356.68-.943.546-1.457-.106-.413-.51-.873-1.28-1.01a7.49 7.49 0 0 1 6.524 7.434"
                          transform="translate(354 143.5)"
                        ></path>
                        <path
                          d="M104.107 415.696A7.498 7.498 0 0 1 94.5 408.5a7.48 7.48 0 0 1 3.407-6.283 5.474 5.474 0 0 0-1.653 2.334c-.753 2.217-.217 4.075 2.29 4.075.833 0 1.4.561 1.333 2.375-.013.403.52 1.78 2.45 1.89.7.04 1.184 1.053 1.33 1.74.06.29.127.65.257.97a.174.174 0 0 0 .193.096"
                          transform="translate(354 143.5)"
                        ></path>
                        <path
                          fill-rule="nonzero"
                          d="M110 408.5a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-1 0a7 7 0 1 0-14 0 7 7 0 0 0 14 0z"
                          transform="translate(354 143.5)"
                        ></path>
                      </g>
                    </g>
                  </svg>
                )}
                {post.visibility === "friends" && (
                  <img
                    class="x1b0d499 x1d69dk1"
                    alt="Bạn bè"
                    height="14"
                    width="14"
                    src="https://static.xx.fbcdn.net/rsrc.php/v4/yJ/r/zPcex_q0TM1.png"
                  />
                )}
                {post.visibility === "only_me" && (
                  <img
                    class="x1b0d499 x1d69dk1"
                    alt="Chỉ mình tôi"
                    height="14"
                    width="14"
                    src="https://static.xx.fbcdn.net/rsrc.php/v4/yc/r/57iQDgPFByS.png"
                  />
                )}
                {/* Tooltip hiển thị khi hover */}
                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-5 bottom-full mb-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  {post.visibility === "public" && "Bất cứ ai"}
                  {post.visibility === "friends" && "Bạn bè"}
                  {post.visibility === "only_me" && "Chỉ mình tôi"}
                </div>
              </div>
            </div>
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
