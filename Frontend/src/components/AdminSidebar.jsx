import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";

function AdminSidebar() {
  return (
    <div
      className="bg-dark text-white shadow-lg d-flex flex-column flex-shrink-0"
      style={{
        width: "260px",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <div className="p-4 border-bottom border-secondary mb-4">
        <h4 className="mb-0 fw-bold d-flex align-items-center">
          <i className="bi bi-shield-lock-fill me-3 text-success fs-3"></i>
          <span className="fs-5">Admin Panel</span>
        </h4>
      </div>
      <Nav variant="pills" className="flex-column px-3 mb-auto gap-2">
        <Nav.Link
          as={NavLink}
          to="/admin/dashboard"
          className="nav-link text-white d-flex align-items-center py-2 px-3 rounded-3"
          end
        >
          <i className="bi bi-grid-1x2-fill me-3 fs-5"></i> Dashboard
        </Nav.Link>
        <Nav.Link
          as={NavLink}
          to="/admin/users"
          className="nav-link text-white d-flex align-items-center py-2 px-3 rounded-3"
        >
          <i className="bi bi-people-fill me-3 fs-5"></i> Users
        </Nav.Link>
        <Nav.Link
          as={NavLink}
          to="/admin/products"
          className="nav-link text-white d-flex align-items-center py-2 px-3 rounded-3"
        >
          <i className="bi bi-box-seam-fill me-3 fs-5"></i> Products
        </Nav.Link>
        <Nav.Link
          as={NavLink}
          to="/admin/commissions"
          className="nav-link text-white d-flex align-items-center py-2 px-3 rounded-3"
        >
          <i className="bi bi-percent me-3 fs-5"></i> Commissions
        </Nav.Link>
        <Nav.Link
          as={NavLink}
          to="/admin/register-admin"
          className="nav-link text-white d-flex align-items-center py-2 px-3 rounded-3"
        >
          <i className="bi bi-person-plus-fill me-3 fs-5"></i> Register Admin
        </Nav.Link>
        {/* Add more links for Analytics, Settings etc. here */}
      </Nav>
    </div>
  );
}

export default AdminSidebar;
