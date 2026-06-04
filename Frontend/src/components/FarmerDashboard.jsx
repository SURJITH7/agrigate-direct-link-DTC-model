import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { useAuth } from "./AuthContext";
import { Link, useLocation } from "react-router-dom";
import socket from "../socket";

function timeSince(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
}

function FarmerDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    ordersReceived: 0,
    earnings: 0,
    pendingOrders: 0,
  });
  const [farmer, setFarmer] = useState({
    fullName: "",
    upi: "",
  });
  const [activities, setActivities] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const location = useLocation();
  const { user, privateFetch } = useAuth();

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await privateFetch(
        "http://localhost:5000/api/activity/stats"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching farmer stats:", error);
      setStats({
        totalProducts: 0,
        ordersReceived: 0,
        earnings: 0,
        pendingOrders: 0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const response = await privateFetch(
        "http://localhost:5000/api/activity/recent"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFarmer({
        fullName: user.fullName || "",
        upi: user.upi || "",
      });
    }

    fetchStats();
    fetchActivities();
  }, [location, user, privateFetch]);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!user || user.role !== "farmer") return;

    const handleOrderUpdate = (data) => {
      console.log("Order update received:", data);
      // Refresh activities when there's an order update
      if (data.type === 'new_order' && data.farmerId === user._id) {
        fetchActivities();
        fetchStats();
      }
    };

    socket.on('order_update', handleOrderUpdate);

    return () => {
      socket.off('order_update', handleOrderUpdate);
    };
  }, [user]);

  return (
    <div>
      <div className="page-header">
        <Container>
          <h1 className="mb-0">Welcome back, {farmer.fullName}! 👋</h1>
          <p className="mb-0 opacity-75">
            Here's what's happening with your farm today
          </p>
          <p className="mb-0 opacity-75">
            <strong>UPI ID:</strong> {farmer.upi || "Not set"}
          </p>
        </Container>
      </div>

      <Container>
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-4">
            <Card className="stats-card h-100">
              <Card.Body className="d-flex align-items-center p-4">
                <div className="stats-icon bg-primary bg-opacity-10 text-primary me-3">
                  <i className="bi bi-box-seam"></i>
                </div>
                <div>
                  <h6 className="mb-1 text-muted">Total Products</h6>
                  {loadingStats ? (
                    <Spinner animation="border" size="sm" variant="light" />
                  ) : (
                    <h4 className="fw-bold mb-0">{stats.totalProducts}</h4>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="stats-card success h-100">
              <Card.Body className="d-flex align-items-center p-4">
                <div className="stats-icon bg-success bg-opacity-10 text-success me-3">
                  <i className="bi bi-cart-check"></i>
                </div>
                <div>
                  <h6 className="mb-1 text-muted">Orders Received</h6>
                  {loadingStats ? (
                    <Spinner animation="border" size="sm" variant="light" />
                  ) : (
                    <h4 className="fw-bold mb-0">{stats.ordersReceived}</h4>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="stats-card warning h-100">
              <Card.Body className="d-flex align-items-center p-4">
                <div className="stats-icon bg-warning bg-opacity-10 text-warning me-3">
                  <i className="bi bi-currency-rupee"></i>
                </div>
                <div>
                  <h6 className="mb-1 text-muted">Total Earnings</h6>
                  {loadingStats ? (
                    <Spinner animation="border" size="sm" variant="light" />
                  ) : (
                    <h4 className="fw-bold mb-0">
                      ₹{stats.earnings.toLocaleString("en-IN")}
                    </h4>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="stats-card info h-100">
              <Card.Body className="d-flex align-items-center p-4">
                <div className="stats-icon bg-info bg-opacity-10 text-info me-3">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div>
                  <h6 className="mb-1 text-muted">Pending Orders</h6>
                  {loadingStats ? (
                    <Spinner animation="border" size="sm" variant="light" />
                  ) : (
                    <h4 className="fw-bold mb-0">{stats.pendingOrders}</h4>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <h5 className="card-title mb-3 d-flex align-items-center">
                  <i className="bi bi-box-seam me-2"></i> Product Management
                </h5>
                <p className="text-muted mb-4">
                  Add new products to your catalog or manage your existing
                  inventory
                </p>
                <div className="d-grid gap-2">
                  <Button
                    as={Link}
                    to="/farmer/add-product"
                    variant="primary"
                    size="lg"
                  >
                    Add New Product
                  </Button>
                  <Button
                    as={Link}
                    to="/farmer/my-products"
                    variant="outline-primary"
                    size="lg"
                  >
                    View My Products
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <h5 className="card-title mb-3 d-flex align-items-center">
                  <i className="bi bi-graph-up me-2"></i> Recent Activity
                </h5>
                {loadingActivities ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <p className="text-muted mt-2 mb-0">
                      Loading activities...
                    </p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-muted mb-0">No recent activity.</p>
                  </div>
                ) : (
                  <div className="mb-3">
                    {activities.map((activity) => (
                      <div
                        key={activity._id}
                        className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom"
                      >
                        <Link
                          to={activity.link}
                          className="text-decoration-none text-dark"
                        >
                          <i
                            className={`bi ${
                              activity.type === "new_order"
                                ? "bi-cart-plus-fill text-success"
                                : activity.type === "product_update"
                                ? "bi-tag-fill text-info"
                                : "bi-arrow-repeat text-primary"
                            } me-2`}
                          ></i>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: activity.message,
                            }}
                          ></span>
                        </Link>
                        <small className="text-muted ms-2 text-nowrap">
                          {timeSince(activity.date)}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  as={Link}
                  to="/farmer/orders"
                  variant="outline-success"
                  className="w-100 mt-auto"
                >
                  View All Orders
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default FarmerDashboard;
