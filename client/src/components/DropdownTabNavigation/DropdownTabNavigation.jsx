import React, { useState } from "react";
import "../../styles/DropdownTabNavigation.css";

// func component nhận vào một prop là onTabChange
const DropdownTabNavigation = ({ onTabChange }) => {
  // Khởi tạo state
  const [isOpen, setIsOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("Dành cho bạn");

  // Một mảng chứa các tab có thể chọn
  const tabs = ["Dành cho bạn", "Đang theo dõi", "Đã thích", "Đã lưu"];

  // Xử lý sự kiện khi click vào một tab
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setIsOpen(false);
    if (onTabChange) onTabChange(tab);
  };

  // Render giao diện
  return (
    <div className="dropdown-tab-navigation">
      <div className="dropdown-header">
        <span className="tab-label">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </span>
        <div className="arrow-icon" onClick={() => setIsOpen(!isOpen)}>
          <span className="arrow">
            <svg aria-label="More" role="img" viewBox="0 0 13 12">
              <title>More</title>
              <path
                d="m2.5 4.2 4 4 4-4"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
              ></path>
            </svg>
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="dropdown-content">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`dropdown-item ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              <div class="tab-dropdown">
                <span className="tab-item">
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
                {activeTab === tab && (
                  <span className="tick">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="size-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  </span>
                )}{" "}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownTabNavigation;
