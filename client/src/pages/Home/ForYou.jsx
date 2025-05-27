import React, { useState } from "react";
import PostBar from "../../components/Post/PostBar";
import PostModal from "../../components/Post/PostModal";

import "../../styles/Post.css";

const ForYou = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="posts-container">
      <PostBar onClick={handleOpenModal} />
      <PostModal isOpen={isModalOpen} onClose={handleCloseModal} />
      {/* Nội dung khác của tab For You */}
    </div>
  );
};

export default ForYou;
