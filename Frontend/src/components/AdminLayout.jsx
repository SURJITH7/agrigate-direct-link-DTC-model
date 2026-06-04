import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "./Admin.css";

function AdminLayout() {
  return (
    <div className="d-flex min-vh-100 bg-light">
      <AdminSidebar />
      <main
        className="flex-grow-1"
        style={{ minWidth: 0, overflowX: "hidden" }}
      >
        <div className="p-4 p-lg-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
