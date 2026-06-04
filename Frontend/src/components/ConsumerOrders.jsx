import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Accordion,
  Badge,
  Table,
  Spinner,
  Alert,
  Button,
} from "react-bootstrap";
import { useAuth } from "./AuthContext";
import { useLanguage } from "../i18n/LanguageProvider";

function ConsumerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, privateFetch } = useAuth();
  const { t } = useLanguage();

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await privateFetch(
        "http://localhost:5000/api/orders/my-orders",
      );
      if (!res.ok) throw new Error("Failed to fetch orders.");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [privateFetch]);

  useEffect(() => {
    if (user && user.role === "consumer") {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, fetchOrders]); // fetchOrders is now a stable dependency

  const handleMarkAsDelivered = async (orderId) => {
    // Optimistically update the UI
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, status: "delivered" } : order,
      ),
    );

    try {
      const res = await privateFetch(
        `http://localhost:5000/api/orders/${orderId}/mark-delivered`,
        {
          method: "PUT",
        },
      );
      if (!res.ok) {
        // If the request fails, revert the UI change
        fetchOrders(); // Refetch to get the correct state
        throw new Error("Failed to update order status.");
      }
      // On success, the UI is already updated.
    } catch (err) {
      setError(err.message);
      console.error("Error marking order as delivered:", err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        t("confirmCancelOrder") ||
          "Are you sure you want to cancel this order?",
      )
    ) {
      return;
    }

    // Optimistically update the UI
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, status: "cancelled" } : order,
      ),
    );

    try {
      const res = await privateFetch(
        `http://localhost:5000/api/orders/${orderId}/cancel`,
        {
          method: "PUT",
        },
      );
      if (!res.ok) {
        fetchOrders(); // Revert UI on failure
        throw new Error("Failed to cancel the order.");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error cancelling order:", err);
    }
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4">{t("myOrders") || "My Orders"}</h2>
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p>
            {t("loading")} {t("orders") || ""}
          </p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          {t("errorPrefix")} {error}
        </Alert>
      ) : orders.length === 0 ? (
        <Card className="text-center p-4">
          <Card.Body>
            <Card.Title>{t("noOrdersFound") || "No Orders Found"}</Card.Title>
            <Card.Text>
              {t("noOrdersPlaced") || "You haven't placed any orders yet."}
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Accordion defaultActiveKey="0" alwaysOpen>
          {orders.map((order, index) => (
            <Accordion.Item eventKey={String(index)} key={order._id}>
              <Accordion.Header>
                <div className="d-flex justify-content-between w-100 me-3">
                  <span>
                    {t("orderIdLabel") || "Order ID"}: {order._id}
                  </span>
                  <span>
                    {t("dateLabel") || "Date"}:{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <Badge bg="info">
                    {t("statusLabel") || "Status"}:{" "}
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </Badge>
                  <Badge bg="success">
                    {t("totalLabel") || "Total"}: ₹
                    {order.totalEarnings.toFixed(2)}
                  </Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <h6>{t("orderDetails") || "Order Details"}</h6>
                <p></p>
                <h6>{t("itemsPurchased") || "Items Purchased"}</h6>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>{t("itemLabel") || "Item"}</th>
                      <th className="text-end">
                        {t("qtyLabel") || "Quantity"} (
                        {t("unitLabel") || "Unit"})
                      </th>
                      <th className="text-end">{t("priceLabel") || "Price"}</th>
                      <th className="text-end">
                        {t("subtotalLabel") || "Subtotal"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products.map((item) => (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td className="text-end">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="text-end">₹{item.price.toFixed(2)}</td>
                        <td className="text-end">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="text-end">
                  <strong>
                    {t("totalLabel") || "Total"}: ₹
                    {order.totalEarnings.toFixed(2)}
                  </strong>
                </div>
                <div className="text-end mt-3 d-flex justify-content-end gap-2">
                  {order.status === "pending" && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleCancelOrder(order._id)}
                    >
                      <i className="bi bi-x-circle me-2"></i>Cancel Order
                    </Button>
                  )}
                  {order.status === "shipped" && (
                    <Button
                      variant="success"
                      onClick={() => handleMarkAsDelivered(order._id)}
                    >
                      <i className="bi bi-check-circle-fill me-2"></i>Mark as
                      {t("markAsDelivered") || "Delivered"}
                    </Button>
                  )}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Container>
  );
}

export default ConsumerOrders;
