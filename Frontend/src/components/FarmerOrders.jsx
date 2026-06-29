import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Form,
  Spinner,
  Alert,
  Dropdown,
} from "react-bootstrap";
import { useAuth } from "./AuthContext";
import { useLanguage } from "../i18n/LanguageProvider";
import socket from "../socket";
import toast from "../utils/toastShim";

function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, privateFetch } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || user.role !== "farmer") return;
      setLoading(true);
      setError("");
      try {
        // This endpoint should return orders filtered for the current farmer
        const res = await privateFetch("https://agrigate-backend-drsi.onrender.com/api/orders");
        if (!res.ok) throw new Error("Failed to fetch orders.");
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Failed to load orders");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, privateFetch]);

  // Socket listener for real-time order updates
  useEffect(() => {
    if (!user || user.role !== "farmer") return;

    const handleNewOrder = (orderData) => {
      console.log("New order received:", orderData);
      
      // Show toast notification
      toast.success(`New order received from ${orderData.customerName}!`);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('New Order Received!', {
          body: `Order from ${orderData.customerName} for ₹${orderData.totalEarnings}`,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('New Order Received!', {
              body: `Order from ${orderData.customerName} for ₹${orderData.totalEarnings}`,
              icon: '/favicon.ico'
            });
          }
        });
      }
      
      // Add the new order to the orders list
      setOrders(prevOrders => {
        // Check if order already exists
        const existingOrder = prevOrders.find(order => order._id === orderData.orderId);
        if (existingOrder) return prevOrders;
        
        // Create a new order object from the socket data
        const newOrder = {
          _id: orderData.orderId,
          customerName: orderData.customerName,
          products: orderData.products,
          totalEarnings: orderData.totalEarnings,
          status: 'pending',
          createdAt: orderData.createdAt,
          shippingAddress: 'To be updated'
        };
        
        return [newOrder, ...prevOrders];
      });
    };

    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new_order', handleNewOrder);
    };
  }, [user]);

  const handleStatusChange = async (orderId, newStatus) => {
    // Optimistically update UI
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, status: newStatus } : order
      )
    );

    try {
      const res = await privateFetch(
        `https://agrigate-backend-drsi.onrender.com/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Failed to update status.");
      // The UI is already updated, so we don't need to do anything with the response
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.message || "Failed to update status");
    }
  };

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  const totalEarnings = Array.isArray(orders)
    ? orders.reduce((sum, order) => sum + (order.totalEarnings || 0), 0)
    : 0;

  // Calculate new orders count
  const newOrdersCount = orders.filter(order => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return new Date(order.createdAt) > oneDayAgo && order.status === 'pending';
  }).length;

  return (
    <div>
      <div className="page-header">
        <Container>
          <h1 className="mb-0">
            <i className="bi bi-wallet2 me-2"></i> Orders & Earnings
            {newOrdersCount > 0 && (
              <Badge bg="info" className="ms-2" pill>
                {newOrdersCount} New
              </Badge>
            )}
          </h1>
          <p className="mb-0 opacity-75">
            Track your orders and monitor earnings
          </p>
        </Container>
      </div>

      <Container>
        <Row className="mb-4">
          <Col lg={4} md={6} className="mb-3">
            <Card className="stats-card success h-100">
              <Card.Body className="text-center">
                <h2 className="display-6 fw-bold mb-2">
                  ₹
                  {totalEarnings.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
                <h6 className="mb-0 opacity-90">Total Earnings</h6>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} className="mb-3">
            <Card className="stats-card info h-100">
              <Card.Body className="text-center">
                <h2 className="display-6 fw-bold mb-2">{orders.length}</h2>
                <h6 className="mb-0 opacity-90">Total Orders</h6>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} className="mb-3">
            <Card className="stats-card warning h-100">
              <Card.Body className="text-center">
                <h2 className="display-6 fw-bold mb-2">
                  {orders.filter((order) => order.status === "pending").length}
                </h2>
                <h6 className="mb-0 opacity-90">Pending Orders</h6>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="success" />
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {/* New Orders Notification */}
        {orders.length > 0 && (
          <div className="mb-3">
            {(() => {
              const now = new Date();
              const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              const newOrders = orders.filter(order => 
                new Date(order.createdAt) > oneDayAgo && order.status === 'pending'
              );
              
              if (newOrders.length > 0) {
                const totalNewEarnings = newOrders.reduce((sum, order) => sum + order.totalEarnings, 0);
                return (
                  <Alert variant="info" className="d-flex align-items-start">
                    <i className="bi bi-bell-fill me-3 mt-1"></i>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>🆕 New Orders Alert!</strong>
                          <p className="mb-1">You have {newOrders.length} new order{newOrders.length > 1 ? 's' : ''} 
                          requiring your attention.</p>
                          <small className="text-muted">
                            Total potential earnings: ₹{totalNewEarnings.toFixed(2)}
                          </small>
                        </div>
                        <Badge bg="primary" pill className="ms-2">
                          {newOrders.length}
                        </Badge>
                      </div>
                      <hr className="my-2" />
                      <small className="text-muted">
                        💡 Tip: Update order status to "shipped" once you've prepared the items for delivery.
                      </small>
                    </div>
                  </Alert>
                );
              }
              return null;
            })()}
          </div>
        )}

        <Card>
          <Card.Header className="bg-white">
            <Row className="align-items-center">
              <Col md={6}>
                <h5 className="mb-0">Order History</h5>
              </Col>
              <Col md={6}>
                <Form.Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ maxWidth: "200px", marginLeft: "auto" }}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-5">
                <h5 className="text-muted mb-3">No orders found</h5>
                <p className="text-muted">
                  Orders matching your filter will appear here
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Shipping Address</th>
                      <th>Products</th>
                      <th>Order Date</th>
                      <th>Status</th>
                      <th>Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const now = new Date();
                      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                      const isNewOrder = new Date(order.createdAt) > oneDayAgo && order.status === 'pending';
                      
                      return (
                        <tr key={order._id} className={isNewOrder ? 'table-warning' : ''}>
                          <td>
                            <span className="fw-bold text-primary">
                              {order._id}
                              {isNewOrder && (
                                <Badge bg="info" className="ms-2" style={{ fontSize: '0.7em' }}>
                                  NEW
                                </Badge>
                              )}
                            </span>
                          </td>
                        <td>
                          <span className="text-muted">
                            {order.customerName}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted">
                            {order.shippingAddress || "Not provided"}
                          </span>
                        </td>
                        <td>
                          <div>
                            {order.products.map((product, index) => (
                              <div key={index} className="mb-1">
                                <small>
                                  {product.name} × {product.quantity || 1}{" "}
                                  {product.unit || ""}
                                </small>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="text-muted">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <Dropdown
                            onSelect={(newStatus) =>
                              handleStatusChange(order._id, newStatus)
                            }
                          >
                            <Dropdown.Toggle
                              variant={
                                {
                                  pending: "warning",
                                  approved: "primary",
                                  shipped: "info",
                                  delivered: "success",
                                  cancelled: "danger",
                                }[order.status]
                              }
                              size="sm"
                              className="text-capitalize"
                            >
                              {order.status}
                            </Dropdown.Toggle>
                            {order.status === "pending" && (
                              <Dropdown.Menu>
                                <Dropdown.Item eventKey="shipped">
                                  Mark as Shipped
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            )}
                          </Dropdown>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
                            ₹{order.totalEarnings.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default FarmerOrders;
