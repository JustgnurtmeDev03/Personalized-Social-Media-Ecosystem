import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

// const ProtectedRoute = ({ element: Component, requiredRoles }) => {
//   const isAuthenticated = !!localStorage.getItem("accessToken"); // ✅ Kiểm tra token trực tiếp

//   return isAuthenticated ? <Component /> : <Navigate to="/login" replace />;
// };

const ProtectedRoute = ({ element: Component, requiredRoles }) => {
  const { auth } = useAuth();

  const isAuthenticated = !!auth.accessToken;
  const roles = auth?.roles || [];
  const hasRequiredRoles = requiredRoles
    ? requiredRoles.some((role) => Array.isArray(roles) && roles.includes(role))
    : true;

  return isAuthenticated && hasRequiredRoles ? (
    <Component />
  ) : (
    <Navigate to="/login" replace />
  );
};
export default ProtectedRoute;
