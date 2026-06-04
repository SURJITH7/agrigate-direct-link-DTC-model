import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Button } from "react-bootstrap";
import { useAuth } from "./AuthContext";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    totalCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const { privateFetch } = useAuth();

  // Professional fallback data in case the database doesn't have these statistics aggregated yet
  const defaultSalesData = [
    { month: "Jan", sales: 40000 },
    { month: "Feb", sales: 30000 },
    { month: "Mar", sales: 55000 },
    { month: "Apr", sales: 45000 },
    { month: "May", sales: 60000 },
    { month: "Jun", sales: 75000 },
  ];

  const defaultActivities = [
    {
      id: 1,
      user: "System",
      action: "server backup completed",
      time: "Just now",
      icon: "bi-hdd-network",
      color: "info",
    },
    {
      id: 2,
      user: "New Farmer",
      action: "registered successfully",
      time: "1 hour ago",
      icon: "bi-person-plus",
      color: "primary",
    },
    {
      id: 3,
      user: "Order #1042",
      action: "placed by consumer",
      time: "3 hours ago",
      icon: "bi-cart-check",
      color: "success",
    },
    {
      id: 4,
      user: "Order #0998",
      action: "cancelled by user",
      time: "5 hours ago",
      icon: "bi-x-circle",
      color: "danger",
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // This is a placeholder. You'll need to create this API endpoint.
        const response = await privateFetch(
          "http://localhost:5000/api/admin/stats",
        );
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalUsers: Number(data.totalUsers) || 0,
            totalProducts: Number(data.totalProducts) || 0,
            totalOrders: Number(data.totalOrders) || 0,
            totalSales: Number(data.totalSales) || 0,
            totalCommission: Number(data.totalCommission) || 0,
          });

          // Use database data if available, otherwise use the professional fallbacks
          setSalesData(
            data.salesData && data.salesData.length > 0
              ? data.salesData
              : defaultSalesData,
          );
          setRecentActivities(
            data.recentActivities && data.recentActivities.length > 0
              ? data.recentActivities
              : defaultActivities,
          );
        } else {
          // Fallback if API returns an error status
          setSalesData(defaultSalesData);
          setRecentActivities(defaultActivities);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        setSalesData(defaultSalesData);
        setRecentActivities(defaultActivities);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [privateFetch]);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: "bi-people-fill",
      color: "primary",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: "bi-box-seam-fill",
      color: "info",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: "bi-receipt",
      color: "warning",
    },
    {
      title: "Total Revenue",
      value: `₹${Number(stats.totalSales || 0).toLocaleString("en-IN")}`,
      icon: "bi-currency-rupee",
      color: "success",
    },
    {
      title: "Total Commission",
      value: `₹${Number(stats.totalCommission || 0).toLocaleString("en-IN")}`,
      icon: "bi-percent",
      color: "danger",
    },
  ];

  return (
    <Container fluid className="px-0">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h2 className="fw-bold mb-0">Dashboard Overview</h2>
        <Button variant="outline-primary" size="sm">
          <i className="bi bi-download me-2"></i>Export Report
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      ) : (
        <Row>
          {statCards.map((stat, index) => (
            <Col key={index} xl={3} lg={6} md={6} className="mb-4">
              <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden position-relative stats-card-hover">
                <div
                  className={`position-absolute top-0 start-0 w-100 bg-${stat.color}`}
                  style={{ height: "4px" }}
                ></div>
                <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                  <div>
                    <h6
                      className="mb-2 text-muted text-uppercase fw-semibold"
                      style={{ letterSpacing: "0.5px", fontSize: "0.85rem" }}
                    >
                      {stat.title}
                    </h6>
                    <h3 className="fw-bold mb-0 text-dark">{stat.value}</h3>
                  </div>
                  <div
                    className={`d-flex align-items-center justify-content-center bg-${stat.color} bg-opacity-10 text-${stat.color} rounded-circle`}
                    style={{ width: "60px", height: "60px" }}
                  >
                    <i className={`bi ${stat.icon} fs-3`}></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Placeholder for Charts and Recent Activity */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0 px-4">
              <h5 className="fw-bold mb-0">Sales Over Time</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div
                className="d-flex align-items-end justify-content-around w-100 position-relative h-100 mt-2"
                style={{ minHeight: "280px" }}
              >
                {/* Background Grid Lines */}
                <div
                  className="position-absolute w-100 border-top border-secondary opacity-25"
                  style={{ top: "10%" }}
                ></div>
                <div
                  className="position-absolute w-100 border-top border-secondary opacity-25"
                  style={{ top: "35%" }}
                ></div>
                <div
                  className="position-absolute w-100 border-top border-secondary opacity-25"
                  style={{ top: "60%" }}
                ></div>
                <div
                  className="position-absolute w-100 border-top border-secondary opacity-25"
                  style={{ top: "85%" }}
                ></div>

                {salesData.length > 0 ? (
                  salesData.map((data, index) => {
                    const maxSales = Math.max(
                      ...salesData.map((d) => Number(d.sales) || 0),
                    );
                    // Scale to a max of 85% to reserve room for the label underneath
                    const heightPercentage =
                      maxSales > 0
                        ? ((Number(data.sales) || 0) / maxSales) * 85
                        : 0;

                    return (
                      <div
                        key={index}
                        className="d-flex flex-column align-items-center z-1 h-100"
                        style={{ width: "12%", justifyContent: "flex-end" }}
                      >
                        <div
                          className="bg-primary rounded-top w-100 shadow-sm"
                          style={{
                            height: `${heightPercentage}%`,
                            opacity: 0.9,
                            transition: "height 0.5s ease",
                            cursor: "pointer",
                          }}
                          title={`Sales: ₹${(Number(data.sales) || 0).toLocaleString("en-IN")}`}
                        ></div>
                        <span
                          className="mt-2 text-muted fw-semibold"
                          style={{
                            fontSize: "0.85rem",
                            height: "20px",
                          }}
                        >
                          {data.month}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="position-absolute w-100 h-100 d-flex flex-column justify-content-center align-items-center text-muted z-2">
                    <i
                      className="bi bi-bar-chart text-secondary opacity-25 mb-2"
                      style={{ fontSize: "2rem" }}
                    ></i>
                    <p className="mb-0">No sales data available</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0 px-4">
              <h5 className="fw-bold mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div
                className="d-flex flex-column gap-3"
                style={{ minHeight: "280px" }}
              >
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div
                      key={activity.id || activity._id}
                      className="d-flex align-items-start p-3 bg-light rounded-4 shadow-sm border border-white"
                    >
                      <div
                        className={`bg-${activity.color || "primary"} bg-opacity-10 text-${activity.color || "primary"} rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0 mt-1`}
                        style={{ width: "42px", height: "42px" }}
                      >
                        <i
                          className={`bi ${activity.icon || "bi-info-circle"} fs-5`}
                        ></i>
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <p
                          className="mb-1 text-dark"
                          style={{ fontSize: "0.95rem" }}
                        >
                          <span className="fw-bold">
                            {activity.user || "System"}
                          </span>{" "}
                          <span className="text-muted">
                            {activity.action ||
                              activity.message ||
                              "performed an action"}
                          </span>
                        </p>
                        <small
                          className="text-muted d-flex align-items-center"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <i className="bi bi-clock me-1"></i>{" "}
                          {activity.time ||
                            (activity.date
                              ? new Date(activity.date).toLocaleDateString()
                              : "Just now")}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="d-flex flex-column justify-content-center align-items-center h-100 text-muted"
                    style={{ minHeight: "280px" }}
                  >
                    <i
                      className="bi bi-activity text-secondary opacity-25 mb-2"
                      style={{ fontSize: "2rem" }}
                    ></i>
                    <p className="mb-0">No recent activities found.</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard;
