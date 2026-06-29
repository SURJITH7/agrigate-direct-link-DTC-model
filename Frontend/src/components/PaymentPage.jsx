import React, { useState, useMemo, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Form,
  Row,
  Col,
  Table,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Corrected: Added privateFetch
import { useLanguage } from "../i18n/LanguageProvider";

/*
  PaymentPage
  - Reads the cart from localStorage for the signed-in consumer (cart_{user._id}).
  - Shows itemized order summary (subtotal, tax, shipping, total).
  - Collects payer details (name, email, phone, billing address).
  - Provides payment method options: Card, UPI, NetBanking, Wallets, Cash on Delivery.
  - Coupon input (simple demo codes: SAVE10 -> 10% off, FREESHIP -> free shipping).
  - Terms & Conditions checkbox required.
  - Pay Now simulates a payment flow and exposes integration stubs where real gateway code should be placed.

  Integration points:
  - handleProcessCardPayment -> integrate Stripe/Razorpay/your gateway here (tokenize card, send to backend, capture payment)
  - handleProcessUPI / NetBanking / Wallets -> integrate UPI deep links or payment SDKs
  - After successful payment, create order on backend and show receipt

  Note: This is a frontend-first scaffolding and intentionally keeps gateway code as placeholders to avoid shipping secrets.
*/

function PaymentPage() {
  const { user, privateFetch } = useAuth(); // Corrected: Added privateFetch
  const navigate = useNavigate();

  // Load cart from localStorage for the consumer user
  const initialCart = useMemo(() => {
    try {
      if (user && user.role === "consumer") {
        const key = `cart_${user._id}`;
        return JSON.parse(localStorage.getItem(key) || "[]").filter(
          (item) => item.quantity > 0,
        );
      }
    } catch (e) {
      console.error("Failed to parse cart from localStorage", e);
    }
    // Fallback demo cart only if there is no user logged in
    if (!user) {
      return [
        { _id: "demo1", name: "Tomatoes", price: 80, quantity: 2, unit: "kg" },
        { _id: "demo2", name: "Potatoes", price: 40, quantity: 1, unit: "kg" },
      ];
    }
    return [];
  }, [user]);

  const [cart] = useState(initialCart);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [payer, setPayer] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    billingAddress: user?.deliveryAddress || "",
    shippingAddress: "",
    shipDifferent: false,
  });

  const [paymentMethod, setPaymentMethod] = useState("card");

  // Card fields (placeholder - replace with gateway's secure fields)
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [agreeTnC, setAgreeTnC] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const subtotal = cart.reduce(
    (s, it) => s + (it.price || 0) * (it.quantity || 1),
    0,
  );
  const taxRate = 0.05; // 5%
  const tax = parseFloat((subtotal * taxRate).toFixed(2));
  const baseShipping = 0; // Shipping is always free
  let shipping = baseShipping;

  // Apply coupon effects
  let discount = 0;
  if (appliedCoupon === "SAVE10") {
    discount = +(subtotal * 0.1).toFixed(2);
  }

  const total = +(subtotal + tax + shipping - discount).toFixed(2);

  const handleApplyCoupon = () => {
    setError("");
    const code = (coupon || "").trim().toUpperCase();
    if (!code) return setError("Enter a coupon code or leave blank.");
    if (code === "SAVE10") {
      setAppliedCoupon(code);
    } else {
      setAppliedCoupon(null);
      setError("Invalid coupon code.");
    }
  };

  const validateForm = () => {
    if (!payer.name) return "Please enter your name.";
    if (!payer.email) return "Please enter your email.";
    if (!agreeTnC) return "You must accept the Terms & Conditions.";
    return null;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      // Check if script is already being loaded
      if (
        document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
        )
      ) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  async function handleRazorpayPayment() {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      throw new Error(
        "Razorpay SDK failed to load. Please check your connection.",
      );
    }

    if (total <= 0) {
      throw new Error("Order amount must be greater than zero to proceed.");
    }

    let orderId = null;

    // Create order on backend first
    try {
      const orderRes = await privateFetch(
        "https://agrigate-backend-drsi.onrender.com/api/payment/create-razorpay-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "INR",
            description: `AgriGate Market Order - ${new Date().toISOString()}`,
          }),
        },
      );

      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create Razorpay order");
      }

      const orderData = await orderRes.json();
      orderId = orderData.id;
    } catch (error) {
      console.error("Backend order creation failed:", error);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }

    const rzpKey = (import.meta.env.VITE_RAZORPAY_KEY_ID || "").trim();

    console.log(
      "Razorpay Key loaded:",
      rzpKey ? `${rzpKey.substring(0, 8)}...` : "NOT FOUND",
    );
    console.log("Key length:", rzpKey.length);

    if (!rzpKey) {
      throw new Error(
        "Razorpay Key ID not found. Please ensure VITE_RAZORPAY_KEY_ID is set in your .env file.",
      );
    }

    if (!rzpKey.startsWith("rzp_")) {
      throw new Error(
        "Invalid Razorpay Key ID format. Key should start with 'rzp_test_' or 'rzp_live_'.",
      );
    }

    if (rzpKey.length > 100) {
      throw new Error(
        "Razorpay Key ID appears to be too long. Make sure you're not using the Key Secret instead of Key ID.",
      );
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: rzpKey,
        amount: Math.round(total * 100), // amount in paise
        currency: "INR",
        order_id: orderId, // Use the order_id from backend
        name: "AgriGate Market",
        description: "Purchase of fresh products",
        handler: async function (response) {
          // Verify payment with backend
          try {
            const verifyRes = await privateFetch(
              "https://agrigate-backend-drsi.onrender.com/api/payment/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              },
            );

            if (!verifyRes.ok) {
              const errorData = await verifyRes.json().catch(() => ({}));
              throw new Error(
                errorData.message || "Payment verification failed",
              );
            }

            resolve({
              ok: true,
              id: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
          } catch (error) {
            reject(new Error(`Payment verification failed: ${error.message}`));
          }
        },
        prefill: {
          name: payer.name,
          email: payer.email,
          contact: payer.phone,
        },
        theme: {
          color: "#198754",
        },
        modal: {
          ondismiss: function () {
            reject(new Error("Payment popup closed by user."));
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        reject(new Error(response.error.description || "Payment failed"));
      });
      rzp.open();
    });
  }

  async function createOrderOnBackend(txn) {
    // TODO: POST order details / payment confirmation to your backend to create an order record.
    const orderPayload = {
      transactionId: txn.id,
      items: cart,
      amount: total,
      paymentMethod: paymentMethod,
      shippingDetails: {
        name: payer.name,
        email: payer.email,
        phone: payer.phone,
        address: payer.shipDifferent
          ? payer.shippingAddress
          : payer.billingAddress,
      },
    };

    const response = await privateFetch("https://agrigate-backend-drsi.onrender.com/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Helpful debug message for common middleware issues
      if (response.status === 500) {
        throw new Error(
          "Failed to create order (500). This is likely a server-side issue. Please check if the '/api/orders' route is correctly configured to accept orders from 'consumer' roles, not 'farmer' roles.",
        );
      } else if (response.status === 403) {
        throw new Error(
          `Server rejected order with a 403 Forbidden error. Ensure you are logged in as a 'consumer'. Message: ${errorData.message}`,
        );
      }
      throw new Error(
        errorData.message ||
          `Failed to create order on backend (${response.status})`,
      );
    }

    const createdOrder = await response.json();
    return { ok: true, orderId: createdOrder.orderId || createdOrder._id };
  }

  const handlePayNow = async () => {
    setError("");
    const validation = validateForm();
    if (validation) return setError(validation);

    setProcessing(true);
    try {
      let result;
      if (paymentMethod === "cod") {
        result = { ok: true, id: `txn_cod_${Date.now()}` };
      } else {
        // For card, upi, netbank, and wallet, trigger Razorpay
        result = await handleRazorpayPayment();
      }

      if (!result || !result.ok) throw new Error("Payment provider error");

      const backend = await createOrderOnBackend(result);
      if (!backend.ok) throw new Error("Failed to create order on backend");

      const receipt = {
        transactionId: result.id,
        orderId: backend.orderId,
        amount: total,
        method: paymentMethod,
        date: new Date().toISOString(),
        items: cart,
        payer,
      };

      setSuccess(receipt);

      // Navigate to consumer's order history page
      if (user && user.role === "consumer") {
        // Clear consumer's cart after successful payment
        localStorage.removeItem(`cart_${user._id}`);
        setTimeout(() => navigate("/consumer/orders"), 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!success) return;
    const blob = new Blob([JSON.stringify(success, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt_${success.orderId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4">{t("checkout")}</h2>
      <Row>
        <Col md={6}>
          <Card className="p-3 mb-3">
            <h5>{t("payerDetails")}</h5>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>{t("nameLabel")}</Form.Label>
                <Form.Control
                  value={payer.name}
                  onChange={(e) => setPayer({ ...payer, name: e.target.value })}
                  placeholder={t("nameLabel")}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>{t("emailLabel")}</Form.Label>
                <Form.Control
                  type="email"
                  value={payer.email}
                  onChange={(e) =>
                    setPayer({ ...payer, email: e.target.value })
                  }
                  placeholder={t("emailLabel")}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>{t("phoneLabel")}</Form.Label>
                <Form.Control
                  value={payer.phone}
                  onChange={(e) =>
                    setPayer({ ...payer, phone: e.target.value })
                  }
                  placeholder={t("phoneLabel")}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>{t("billingAddress")}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={payer.billingAddress}
                  onChange={(e) =>
                    setPayer({ ...payer, billingAddress: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-2 d-flex align-items-center">
                <Form.Check
                  type="checkbox"
                  checked={payer.shipDifferent}
                  onChange={(e) =>
                    setPayer({ ...payer, shipDifferent: e.target.checked })
                  }
                  className="me-2"
                  id="shipDiff"
                />
                <Form.Label htmlFor="shipDiff" className="mb-0">
                  {t("shippingDifferent")}
                </Form.Label>
              </Form.Group>
              {payer.shipDifferent && (
                <Form.Group className="mb-2">
                  <Form.Label>{t("shippingAddress")}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={payer.shippingAddress}
                    onChange={(e) =>
                      setPayer({ ...payer, shippingAddress: e.target.value })
                    }
                  />
                </Form.Group>
              )}
            </Form>
          </Card>

          <Card className="p-3">
            <h5>{t("paymentMethod")}</h5>
            <Form>
              <div className="mb-2">
                <Form.Check
                  type="radio"
                  label={t("cardLabel")}
                  name="method"
                  id="method-card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
              </div>

              <div className="mb-2">
                <Form.Check
                  type="radio"
                  label={t("upiLabel")}
                  name="method"
                  id="method-upi"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                />
              </div>

              <div className="mb-2">
                <Form.Check
                  type="radio"
                  label={t("netbankLabel")}
                  name="method"
                  id="method-netbank"
                  checked={paymentMethod === "netbank"}
                  onChange={() => setPaymentMethod("netbank")}
                />
              </div>

              <div className="mb-2">
                <Form.Check
                  type="radio"
                  label={t("walletsLabel")}
                  name="method"
                  id="method-wallet"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                />
              </div>

              <div className="mb-2">
                <Form.Check
                  type="radio"
                  label={t("codLabel")}
                  name="method"
                  id="method-cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
              </div>
            </Form>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="p-3 mb-3">
            <h5>{t("orderSummary")}</h5>
            <Table responsive bordered size="sm" className="mb-2">
              <thead>
                <tr>
                  <th>{t("itemLabel")}</th>
                  <th className="text-end">{t("qtyLabel")}</th>
                  <th className="text-end">{t("totalPriceLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((it) => (
                  <tr key={it._id}>
                    <td>{it.name}</td>
                    <td className="text-end">{it.quantity || 1}</td>
                    <td className="text-end">
                      ₹{(it.price * (it.quantity || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between small mb-1">
              <div>Subtotal</div>
              <div>₹{subtotal.toFixed(2)}</div>
            </div>
            <div className="d-flex justify-content-between small mb-1">
              <div>Tax ({(taxRate * 100).toFixed(0)}%)</div>
              <div>₹{tax.toFixed(2)}</div>
            </div>
            <div className="d-flex justify-content-between small mb-1">
              <div>Shipping</div>
              <div>₹{shipping.toFixed(2)}</div>
            </div>
            {discount > 0 && (
              <div className="d-flex justify-content-between small mb-1 text-success">
                <div>Discount</div>
                <div>-₹{discount.toFixed(2)}</div>
              </div>
            )}

            <hr />
            <div className="d-flex justify-content-between fw-bold mb-2">
              <div>Total</div>
              <div>₹{total.toFixed(2)}</div>
            </div>

            <InputGroup className="mb-2">
              <Form.Control
                placeholder="Coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <Button onClick={handleApplyCoupon} variant="outline-success">
                Apply
              </Button>
            </InputGroup>

            <div className="mb-2 small text-muted">
              Secure payment processing is powered by Razorpay. You will be
              redirected to their secure checkout modal.
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && (
              <Alert variant="success">
                Payment Success! Order <strong>{success.orderId}</strong>{" "}
                created. Redirecting to your orders...
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={handleDownloadReceipt}
                  >
                    Download receipt
                  </Button>
                </div>
              </Alert>
            )}

            <Form.Check
              className="mb-2"
              type="checkbox"
              checked={agreeTnC}
              onChange={(e) => setAgreeTnC(e.target.checked)}
              label={"I accept the Terms & Conditions and Refund Policy"}
            />

            <div className="d-grid">
              <Button
                variant="success"
                size="lg"
                onClick={handlePayNow}
                disabled={processing || !!success}
              >
                {processing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />{" "}
                    Processing Payment...
                  </>
                ) : (
                  "Pay Now"
                )}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default PaymentPage;
