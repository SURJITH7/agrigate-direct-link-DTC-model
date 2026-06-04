import { Navbar, Nav, Container, Button, Badge, Form } from "react-bootstrap";
import {
  FaShoppingCart,
  FaMapMarkerAlt,
  FaTachometerAlt,
  FaPlusCircle,
  FaBoxOpen,
  FaClipboardList,
  FaUserCircle,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useLanguage } from "../i18n/LanguageProvider";

function Navigation({ cart, location: liveLocation }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const isLoggedIn = !!user;

  if (
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/admin/login") || // Hide on admin login
    (location.pathname.startsWith("/admin") && user?.role !== "admin") // Hide on other admin routes if not admin
  ) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <Navbar bg="white" expand="lg" fixed="top" className="navbar">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-success">
            {t("brand")}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/login" className="ms-lg-2">
                <Button variant="outline-success">{t("login")}</Button>
              </Nav.Link>
              <Nav.Link as={Link} to="/register" className="ms-lg-2">
                <Button variant="success">{t("register")}</Button>
              </Nav.Link>
              {/* Language selector for guests */}
              <Form.Select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                size="sm"
                style={{ width: 120, marginLeft: 12 }}
              >
                <option value="en">EN</option>
                <option value="ta">தமிழ்</option>
              </Form.Select>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }

  if (user.role === "farmer") {
    return (
      <Navbar bg="white" expand="lg" fixed="top" className="navbar">
        <Container>
          <Navbar.Brand
            as={Link}
            to="/farmer/dashboard"
            className="fw-bold text-success"
          >
            {t("brand")}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto align-items-center gap-2">
              {liveLocation && liveLocation.name ? (
                <Navbar.Text className="me-2 d-flex align-items-center">
                  <FaMapMarkerAlt className="text-success me-1" />
                  {liveLocation.name}
                </Navbar.Text>
              ) : liveLocation && liveLocation.latitude ? (
                <Navbar.Text className="me-2 d-flex align-items-center">
                  <FaMapMarkerAlt className="text-success me-1" />
                  {`${liveLocation.latitude.toFixed(
                    4,
                  )}, ${liveLocation.longitude.toFixed(4)}`}
                </Navbar.Text>
              ) : null}
              <Button
                as={Link}
                to="/my-location"
                variant="outline-success"
                size="sm"
                className="me-2"
              >
                View on Map
              </Button>
            </Nav>
            <Nav className="ms-auto align-items-center">
              <Nav.Link
                as={Link}
                to="/farmer/dashboard"
                className={
                  location.pathname.startsWith("/farmer/dashboard")
                    ? "active"
                    : ""
                }
              >
                <FaTachometerAlt className="me-2" /> Dashboard
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/farmer/add-product"
                className={
                  location.pathname.startsWith("/farmer/add-product")
                    ? "active"
                    : ""
                }
              >
                <FaPlusCircle className="me-2" /> Add Product
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/farmer/my-products"
                className={
                  location.pathname.startsWith("/farmer/my-products")
                    ? "active"
                    : ""
                }
              >
                <FaBoxOpen className="me-2" /> My Products
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/farmer/orders"
                className={
                  location.pathname.startsWith("/farmer/orders") ? "active" : ""
                }
              >
                <FaClipboardList className="me-2" /> Orders
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/farmer/profile"
                className={
                  location.pathname.startsWith("/farmer/profile")
                    ? "active"
                    : ""
                }
              >
                <FaUserCircle className="me-2" /> Profile
              </Nav.Link>
              <Form.Select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                size="sm"
                style={{ width: 120, marginRight: 12 }}
              >
                <option value="en">EN</option>
                <option value="ta">தமிழ்</option>
              </Form.Select>
              <Nav.Link onClick={logout} className="ms-lg-2">
                <Button variant="outline-danger">{t("logout")}</Button>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }

  if (user.role === "consumer") {
    // Use cart.length for badge count (unique products)
    const cartItemsCount = cart ? cart.length : 0;
    return (
      <Navbar expand="lg" fixed="top" className="navbar" bg="white">
        <Container>
          <Navbar.Brand
            as={Link}
            to="/consumer/dashboard"
            className="fw-bold text-success"
          >
            {t("shoppingBrand")}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <div className="d-flex w-100 align-items-center justify-content-between">
              <Nav className="me-auto align-items-center gap-2">
                {/* ...existing code... */}
                <Nav.Link
                  as={Link}
                  to="/consumer/dashboard"
                  className={
                    location.pathname.startsWith("/consumer/dashboard")
                      ? "active fw-bold"
                      : ""
                  }
                >
                  {t("dashboard")}
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/products"
                  className={
                    location.pathname.startsWith("/products")
                      ? "active fw-bold"
                      : ""
                  }
                >
                  {t("freshProducts")}
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/consumer/orders"
                  className={
                    location.pathname.startsWith("/consumer/orders")
                      ? "active fw-bold"
                      : ""
                  }
                >
                  {t("myOrders")}
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/consumer/profile"
                  className={
                    location.pathname.startsWith("/consumer/profile")
                      ? "active fw-bold"
                      : ""
                  }
                >
                  {t("profile")}
                </Nav.Link>
                <Nav.Link as={Link} to="/my-location">
                  <FaMapMarkerAlt
                    style={{ color: "#198754" }}
                    title="My Location"
                  />
                </Nav.Link>
              </Nav>
              <div className="d-flex align-items-center gap-3">
                <Nav.Link
                  as={Link}
                  to="/cart"
                  className="position-relative d-flex align-items-center"
                  style={{ fontSize: "1.7rem", color: "#198754" }}
                  title="View Cart"
                >
                  <FaShoppingCart />
                  {cartItemsCount > 0 && (
                    <Badge
                      bg="danger"
                      className="cart-badge"
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-10px",
                        fontSize: "0.75rem",
                        minWidth: "18px",
                        height: "18px",
                        padding: "0 5px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {cartItemsCount}
                    </Badge>
                  )}
                </Nav.Link>
                <Form.Select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  size="sm"
                  style={{ width: 120, marginRight: 12 }}
                >
                  <option value="en">EN</option>
                  <option value="ta">தமிழ்</option>
                </Form.Select>
                <Nav.Link onClick={logout} className="ms-lg-2">
                  <Button variant="outline-danger">{t("logout")}</Button>
                </Nav.Link>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }

  if (user.role === "admin") {
    return (
      <Navbar bg="white" expand="lg" fixed="top" className="navbar shadow-sm">
        <Container fluid className="px-4">
          <Navbar.Brand
            as={Link}
            to="/admin/dashboard"
            className="fw-bold text-success"
          >
            {t("brand")} - Admin
          </Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            <Navbar.Text className="me-3">
              Signed in as: <span className="fw-bold">{user.fullName}</span>
            </Navbar.Text>
            <Nav.Link onClick={logout}>
              <Button variant="outline-danger">{t("logout")}</Button>
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    );
  }

  return null;
}

export default Navigation;
