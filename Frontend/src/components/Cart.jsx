import { useState } from "react";
import { Container, Card, Button, Form, Modal, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext";
import { useLanguage } from "../i18n/LanguageProvider";

function Cart({ cart, setCart, onClose }) {
  const navigate = useNavigate();

  const [showBill, setShowBill] = useState(false);

  const handleBillClose = () => {
    setShowBill(false);
    setCart([]);
    if (user && user.role === "consumer") {
      const cartKey = `cart_${user._id}`;
      localStorage.setItem(cartKey, JSON.stringify([]));
    }
    if (onClose) onClose();
  };

  const handleBuyNow = (itemToBuy) => {
    const newCart = [{ ...itemToBuy, quantity: itemToBuy.quantity || 1 }];
    setCart(newCart);
    if (user && user.role === "consumer") {
      const cartKey = `cart_${user._id}`;
      localStorage.setItem(cartKey, JSON.stringify(newCart));
    }
    navigate("/payment");
  };
  // Quantity increment/decrement handlers
  const handleCheckout = () => {
    if (cart.length === 0) return;
    navigate("/payment"); // Redirect to payment page
  };

  const handleIncrement = (id) => {
    setCart((prev) => {
      const updated = prev.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );
      if (user && user.role === "consumer") {
        const cartKey = `cart_${user._id}`;
        localStorage.setItem(cartKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleDecrement = (id) => {
    setCart((prev) => {
      const updated = prev.map((item) =>
        item._id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      );
      if (user && user.role === "consumer") {
        const cartKey = `cart_${user._id}`;
        localStorage.setItem(cartKey, JSON.stringify(updated));
      }
      return updated;
    });
  };
  // Calculate total cart amount
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0,
  );
  const { t } = useLanguage();
  const { user } = useAuth();
  const handleQuantityChange = (id, value) => {
    setCart((prev) => {
      const updated = prev.map((item) =>
        item._id === id ? { ...item, quantity: Number(value) } : item,
      );
      // Store in localStorage per user
      if (user && user.role === "consumer") {
        const cartKey = `cart_${user._id}`;
        localStorage.setItem(cartKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleRemove = (id) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item._id !== id);
      if (user && user.role === "consumer") {
        const cartKey = `cart_${user._id}`;
        localStorage.setItem(cartKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #e9f7ef 100%)",
        minHeight: "100vh",
      }}
    >
      <Container className="py-5">
        {/* Bill Modal */}
        <Modal show={showBill} onHide={handleBillClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>{t("checkoutBill")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5 className="mb-3 text-success">{t("thankYouPurchase")}</h5>
            <Table bordered hover responsive className="mb-4">
              <thead>
                <tr>
                  <th>{t("product")}</th>
                  <th>{t("unitPrice")}</th>
                  <th>{t("quantity")}</th>
                  <th>{t("subtotal")}</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>₹{item.price}</td>
                    <td>
                      {item.quantity} {item.unit}
                    </td>
                    <td>₹{item.price * (item.quantity || 1)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="text-end">
              <span className="fw-bold fs-4 me-2">{t("totalAmountLabel")}</span>
              <span className="text-success fs-3">₹{cartTotal}</span>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="success" onClick={handleBillClose}>
              {t("close")}
            </Button>
          </Modal.Footer>
        </Modal>
        <h2
          className="mb-5 text-center fw-bold display-5 text-success"
          style={{ letterSpacing: 1 }}
        >
          {t("shoppingCart")}
        </h2>
        {cart.length === 0 ? (
          <div className="text-center text-muted fs-4">{t("cartEmpty")}</div>
        ) : (
          <>
            <div className="row g-5 mb-5 justify-content-center">
              {cart.map((item) => (
                <div className="col-12 col-md-10 col-lg-8" key={item._id}>
                  <Card
                    className="h-100 shadow-lg border-0 rounded-4 cart-card-hover"
                    style={{ transition: "box-shadow 0.2s" }}
                  >
                    <Card.Body className="d-flex flex-column justify-content-between p-4">
                      <div className="d-flex align-items-center mb-4">
                        <img
                          src={
                            item.image
                              ? `https://agrigate-backend-drsi.onrender.com${item.image}`
                              : "https://via.placeholder.com/60"
                          }
                          alt={item.name}
                          style={{
                            width: 90,
                            height: 90,
                            objectFit: "cover",
                            borderRadius: 18,
                            marginRight: 32,
                            boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
                            border: "2px solid #d1e7dd",
                          }}
                        />
                        <div className="flex-grow-1">
                          <div
                            className="fw-bold fs-3 mb-2 text-dark"
                            style={{ letterSpacing: 0.5 }}
                          >
                            {item.name}
                          </div>
                          <div className="text-success mb-2 fs-4">
                            ₹{item.price} per {item.unit}
                          </div>
                          <div className="text-muted mb-2 fs-5">
                            <strong>{t("harvested")}</strong>{" "}
                            {item.harvestTime || (
                              <span className="text-danger">
                                {t("notSpecified")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemove(item._id)}
                          style={{
                            marginLeft: "18px",
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <span className="fw-bold fs-5">{t("quantity")}</span>
                        <div className="d-flex align-items-center gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            style={{
                              width: 38,
                              height: 38,
                              fontWeight: "bold",
                              fontSize: "1.3rem",
                              borderRadius: "50%",
                            }}
                            onClick={() => handleDecrement(item._id)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <span
                            className="px-4 py-2 border rounded bg-light fs-4"
                            style={{
                              minWidth: 48,
                              textAlign: "center",
                              fontWeight: "bold",
                            }}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            style={{
                              width: 38,
                              height: 38,
                              fontWeight: "bold",
                              fontSize: "1.3rem",
                              borderRadius: "50%",
                            }}
                            onClick={() => handleIncrement(item._id)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="mb-3 text-end">
                        <span className="fw-bold fs-5">
                          {t("totalAmountLabel")}
                        </span>
                        <span className="text-success fs-3 fw-bold">
                          ₹{item.price * (item.quantity || 1)}
                        </span>
                      </div>
                      <Button
                        variant="success"
                        className="w-100 mt-auto py-3 fs-4 rounded-4 shadow-sm"
                        onClick={() => handleBuyNow(item)}
                      >
                        {t("buyNow")}
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
            <div className="d-flex flex-column justify-content-center align-items-center mt-5 gap-4">
              <div
                className="bg-light rounded-4 p-5 shadow-lg border border-success text-center"
                style={{ minWidth: 320 }}
              >
                <span className="fw-bold fs-2 me-3 text-dark">
                  Total Amount:
                </span>
                <span className="text-success fs-1">₹{cartTotal}</span>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="px-5 py-3 fs-4 rounded-4 shadow-sm"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

export default Cart;
