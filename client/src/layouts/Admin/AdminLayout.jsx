import React from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminLayout.css";
import AdminDashBoard from "../../pages/Admin/Dashboard";

const AdminLayout = () => {
  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-content">
        <AdminDashBoard />
      </div>
    </div>
  );
};

export default AdminLayout;
