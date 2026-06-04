import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Simple farmer route guard.
 * - If user is logged in and has role 'farmer' => render nested routes via <Outlet />
 * - Otherwise redirect to the login page (or a specific unauthorized page)
 */
export default function FarmerRouteGuard() {
  const { user } = useAuth();

  if (!user || user.role !== "farmer") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
