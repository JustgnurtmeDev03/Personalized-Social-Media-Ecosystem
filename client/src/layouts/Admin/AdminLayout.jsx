import React from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../styles/Admin/AdminLayout.css";

const AdminLayout = () => {
  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Admin Dashboard Placeholder</h1>
      </div>
    </div>
  );
};

export default AdminLayout;
