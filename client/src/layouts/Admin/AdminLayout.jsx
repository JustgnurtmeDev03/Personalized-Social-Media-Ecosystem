import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminLayout.css";
import AdminDashBoard from "../../pages/Admin/Dashboard";
import ManagePosts from "../../components/Admin/ManagePost";
import ManageUsers from "../../components/Admin/ManageUser";
import ManageReports from "../../components/Admin/ManageReport";

const AdminLayout = () => {
  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-content">
        <Routes>
          <Route index element={<AdminDashBoard />} />
          <Route path="/Manage-posts" element={<ManagePosts />} />
          <Route path="/Manage-users" element={<ManageUsers />} />
          <Route path="/Manage-reports" element={<ManageReports />} />
          {/* Thêm các route con khác nếu cần */}
        </Routes>
      </div>
    </div>
  );
};

export default AdminLayout;
