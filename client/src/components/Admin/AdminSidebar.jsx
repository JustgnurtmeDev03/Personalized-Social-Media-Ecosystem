import React from "react";
import { useNavigate } from "react-router-dom";

const AdminSidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <div className="w-72 min-h-screen border-r border-gray-200 flex flex-col">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <img
            alt="TikTok logo icon with musical note in black and red colors"
            className="w-6 h-6"
            height="24"
            src="https://storage.googleapis.com/a1aa/image/79e461c8-252e-417f-fe79-b5ce340bdede.jpg"
            width="24"
          />
          <span className="font-bold text-xl text-black">TikTok</span>
          <span className="text-black text-xl font-normal">Studio</span>
        </div>

        <div className="px-6 py-6">
          <button
            className="w-full bg-[#fe2c55] text-white text-lg font-medium rounded-lg py-3 hover:bg-[#e0224a] transition-colors"
            type="button"
          >
            + Upload
          </button>
        </div>

        <nav className="flex-1 px-6">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 select-none">
              Manage
            </h3>
            <ul className="space-y-2 text-gray-700 text-base font-normal">
              <li>
                <a
                  className="flex items-center gap-3 rounded-md bg-gray-200 px-3 py-2 font-semibold text-black"
                  href="#"
                >
                  <i className="fas fa-home text-lg"></i>
                  Home
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="far fa-folder text-lg"></i>
                  Posts
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="far fa-chart-bar text-lg"></i>
                  Analytics
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="far fa-comment-alt text-lg"></i>
                  Comments
                </a>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 select-none">
              Tools
            </h3>
            <ul className="space-y-2 text-gray-700 text-base font-normal">
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="far fa-lightbulb text-lg"></i>
                  Inspirations
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="far fa-bookmark text-lg"></i>
                  Creator Academy
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="fas fa-music text-lg"></i>
                  Unlimited Sounds
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 select-none">
              Others
            </h3>
            <ul className="space-y-2 text-gray-700 text-base font-normal">
              <li>
                <a
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                  href="#"
                >
                  <i className="far fa-envelope text-lg"></i>
                  Feedback
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
