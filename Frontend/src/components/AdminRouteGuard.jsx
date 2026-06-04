import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Simple admin route guard.
 * - If user is logged in and has role 'admin' => render nested routes via <Outlet />
 * - Otherwise redirect to the admin login page
 */
export default function AdminRouteGuard() {
  const { user } = useAuth();

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
