import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Modal,
  Table,
  Spinner,
  Alert,
} from "react-bootstrap";
import api from "/src/api.js";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/orders/myorders");
        setOrders(data);
      } catch (err) {
        setError("Failed to fetch your orders. Please try again later.");
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, []);

  const getStatusBadge = (status) => {
    const variants = {
      processing: 'warning',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'danger'
    };
    return (
      <Badge bg={variants[status]} className="status-badge">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const handleReorder = (order) => {
    console.log('Reordering items:', order.orderItems)
    alert('Items added to cart!')
  }

  return (
    <div>
      <div className="page-header">
        <Container>
          <h1 className="mb-0">Order History 📦</h1>
          <p className="mb-0 opacity-75">Track your orders and view past purchases</p>
        </Container>
      </div>

      <Container>
        <Row>
          <Col> 
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading your orders...</p>
              </div>
            )}
            {error && (
              <Alert variant="danger" className="text-center">{error}</Alert>
            )}
            {!loading && !error && (
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>No orders yet</h3>
                <p className="text-muted mb-4">
                  When you place orders, they will appear here.
                </p>
                <Button href="/products" variant="primary" size="lg">
                  Start Shopping
                </Button>
              </div>
            ) : (
              <Row>
                {orders.map(order => (
                  <Col lg={6} key={order._id} className="mb-4">
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="mb-1">ID: {order._id}</h6>
                            <small className="text-muted">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>

                        <div className="mb-3">
                          <strong>Items:</strong>
                          <ul className="list-unstyled mb-0 mt-1"> 
                            {order.orderItems.slice(0, 2).map((item, index) => (
                              <li key={index} className="text-muted">
                                <small>
                                  {item.qty}x {item.name}
                                </small>
                              </li>
                            ))}
                            {order.orderItems.length > 2 && (
                              <li className="text-muted"> 
                                <small>
                                  +{order.orderItems.length - 2} more items
                                </small>
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <strong>Total: ₹{order.totalPrice.toFixed(2)}</strong>
                          {order.trackingNumber && (
                            <small className="text-muted">
                              Tracking: {order.trackingNumber}
                            </small>
                          )}
                        </div>

                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                          >
                            View Details
                          </Button>
                          {order.status === 'delivered' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleReorder(order)}
                            >
                              Reorder
                            </Button>
                          )}
                          {order.trackingNumber && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => window.open(`https://tracking.example.com/${order.trackingNumber}`, '_blank')}
                            >
                              Track
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )})}
          </Col>
        </Row>

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Order Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedOrder && (
              <div>
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Order ID:</strong> {selectedOrder._id}
                  </Col>
                  <Col md={6}>
                    <strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </Col>
                  <Col md={6}>
                    <strong>Status:</strong> {getStatusBadge(selectedOrder.status)}
                  </Col>
                  <Col md={6}>
                    <strong>Total:</strong> ₹{selectedOrder.totalPrice.toFixed(2)}
                  </Col>
                </Row>

                <h6>Items Ordered:</h6>
                <Table striped bordered hover className="mb-3">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.qty}</td>
                        <td>₹{item.price.toFixed(2)}</td>
                        <td>₹{(item.qty * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <h6>Delivery Address:</h6>
                <p className="text-muted">{`${selectedOrder.shippingInfo.address}, ${selectedOrder.shippingInfo.city}, ${selectedOrder.shippingInfo.postalCode}, ${selectedOrder.shippingInfo.country}`}</p>

                {selectedOrder.trackingNumber && (
                  <div>
                    <h6>Tracking Information:</h6>
                    <p className="text-muted">
                      Tracking Number: {selectedOrder.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            {selectedOrder && selectedOrder.status === 'delivered' && (
              <Button
                variant="primary"
                onClick={() => {
                  handleReorder(selectedOrder)
                  setShowModal(false)
                }}
              >
                Reorder Items
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  )
};

export default OrderHistory;