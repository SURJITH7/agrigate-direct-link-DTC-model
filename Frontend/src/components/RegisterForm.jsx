import { useState, useEffect } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Card,
  Alert,
  Spinner,
  InputGroup,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function RegisterForm({ userType }) {
  const navigate = useNavigate();

  // State for OTP verification step
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("email"); // "email" or "sms"
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(0);

  // State for registration step
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    farmName: "",
    farmAddress: "",
    upi: "",
    deliveryAddress: "",
    phone: "",
    latitude: null,
    longitude: null,
    role: userType || "consumer",
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(timer - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Email validation regex
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Phone validation (basic)
  const validatePhone = (phone) => {
    const phoneDigits = phone.replace(/\D/g, "");
    return phoneDigits.length >= 10;
  };

  // Step 1: Send OTP (Email or SMS)
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (verificationMethod === "email") {
      if (!email || !validateEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }
    } else if (verificationMethod === "sms") {
      if (!phone || !validatePhone(phone)) {
        setError("Please enter a valid phone number (at least 10 digits)");
        return;
      }
    }

    setLoading(true);
    try {
      const payload =
        verificationMethod === "email"
          ? { email, method: "email" }
          : { phone, method: "sms" };

      const response = await axios.post(
        "https://agrigate-backend-drsi.onrender.com/api/auth/send-otp",
        payload,
      );
      setOtpSent(true);
      const message =
        verificationMethod === "email"
          ? `OTP sent to ${email}`
          : `OTP sent to ${phone.slice(-4)}`;
      setSuccess(
        `✓ ${message}. Check your ${verificationMethod} for the code.`,
      );
      setTimer(30); // 30 second cooldown
    } catch (err) {
      setError(
        err.response?.data?.message || `Failed to send OTP. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const payload =
        verificationMethod === "email"
          ? { email, otp, method: "email" }
          : { phone, otp, method: "sms" };

      const response = await axios.post(
        "https://agrigate-backend-drsi.onrender.com/api/auth/verify-otp",
        payload,
      );
      setEmailVerified(true);
      setFormData((prev) => ({ ...prev, email: email || "" }));
      setSuccess("✓ Verification successful! Now complete your registration.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to verify OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload =
        verificationMethod === "email"
          ? { email, method: "email" }
          : { phone, method: "sms" };

      await axios.post("https://agrigate-backend-drsi.onrender.com/api/auth/resend-otp", payload);
      setOtp("");
      const message = verificationMethod === "email" ? "email" : "phone";
      setSuccess(`✓ New OTP sent to your ${message}. Check for the code.`);
      setTimer(30);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to resend OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressBlur = async (e) => {
    const address = e.target.value;
    if (address.trim() === "") {
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address,
        )}&format=json&limit=1`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }));
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const fetchLocation = async () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      setError("");
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          });
        });
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      } catch (err) {
        let message = `Could not get location: ${err.message}`;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message =
              "Location permission denied. Please enable it in your browser settings.";
            break;
          case err.POSITION_UNAVAILABLE:
            message =
              "Location information is unavailable. Please try again later.";
            break;
          case err.TIMEOUT:
            message =
              "Could not get your location in time. Please try again, perhaps in an area with a better signal.";
            break;
        }
        setError(message);
      } finally {
        setIsLocating(false);
      }
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.fullName) {
      setError("Please enter your full name");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.role === "consumer" && !formData.phone) {
      setError("Please enter your phone number");
      return;
    }

    if (formData.role === "farmer" && !formData.farmName) {
      setError("Please enter your farm name");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://agrigate-backend-drsi.onrender.com/api/users/register",
        formData,
        { withCredentials: true },
      );

      setSuccess("Registration successful! Redirecting to dashboard...");
      setTimeout(() => {
        if (formData.role === "farmer") {
          navigate("/farmer");
        } else if (formData.role === "consumer") {
          navigate("/consumer");
        } else {
          navigate("/login");
        }
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============ RENDER OTP VERIFICATION STEP ============
  if (!emailVerified) {
    return (
      <div className="auth-container">
        <Card className="shadow-sm">
          <Card.Body>
            <h2 className="text-center mb-4">
              <i className="bi bi-shield-check me-2"></i>Verify Your Account
            </h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {!otpSent ? (
              // Step 1: Choose verification method & send OTP
              <Form onSubmit={handleSendOTP}>
                <div className="mb-4">
                  <Form.Label className="fw-bold mb-3">
                    Choose Verification Method:
                  </Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="radio"
                      id="method-email"
                      label={
                        <span>
                          <i className="bi bi-envelope-fill me-2"></i>Email OTP
                        </span>
                      }
                      name="verificationMethod"
                      value="email"
                      checked={verificationMethod === "email"}
                      onChange={(e) => {
                        setVerificationMethod(e.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      disabled={loading}
                    />
                    <Form.Check
                      type="radio"
                      id="method-sms"
                      label={
                        <span>
                          <i className="bi bi-telephone-fill me-2"></i>SMS OTP
                        </span>
                      }
                      name="verificationMethod"
                      value="sms"
                      checked={verificationMethod === "sms"}
                      onChange={(e) => {
                        setVerificationMethod(e.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                {verificationMethod === "email" ? (
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="bi bi-envelope-fill me-2"></i>Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <Form.Text className="text-muted">
                      We'll send a 6-digit OTP to verify your email
                    </Form.Text>
                  </Form.Group>
                ) : (
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="bi bi-telephone-fill me-2"></i>Phone Number
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="Enter your phone number (10+ digits)"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ""))
                      }
                      disabled={loading}
                      required
                    />
                    <Form.Text className="text-muted">
                      We'll send a 6-digit OTP via SMS
                    </Form.Text>
                  </Form.Group>
                )}

                <Button
                  variant="primary"
                  className="w-100"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-2"></i>Send OTP
                    </>
                  )}
                </Button>

                <div className="text-center mt-3">
                  <p className="text-muted mb-2">Already registered?</p>
                  <Button
                    variant="link"
                    onClick={() => navigate("/login")}
                    className="text-decoration-none"
                  >
                    Login here
                  </Button>
                </div>
              </Form>
            ) : (
              // Step 2: Verify OTP
              <Form onSubmit={handleVerifyOTP}>
                <div className="alert alert-info d-flex align-items-center mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  <span>
                    OTP sent to{" "}
                    <strong>
                      {verificationMethod === "email"
                        ? email
                        : `${phone.slice(-4)}`}
                    </strong>
                    <Badge bg="success" className="ms-2">
                      {verificationMethod.toUpperCase()}
                    </Badge>
                  </span>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-shield-check me-2"></i>Enter OTP
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength="6"
                    disabled={loading}
                    required
                    className="text-center font-monospace"
                  />
                  <Form.Text className="text-muted">
                    6-digit code | Expires in 5 minutes
                  </Form.Text>
                </Form.Group>

                <Button
                  variant="primary"
                  className="w-100"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>Verify OTP
                    </>
                  )}
                </Button>

                <div className="text-center mt-3">
                  {timer > 0 ? (
                    <p className="text-muted mb-0">
                      <i className="bi bi-hourglass-split me-1"></i>
                      Resend available in {timer}s
                    </p>
                  ) : (
                    <Button
                      variant="link"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-decoration-none p-0"
                    >
                      <i className="bi bi-arrow-repeat me-1"></i>Resend OTP
                    </Button>
                  )}
                </div>

                <hr className="my-3" />

                <Button
                  variant="secondary"
                  className="w-100"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                    setSuccess("");
                  }}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Try Different Method
                </Button>
              </Form>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  }

  // ============ RENDER REGISTRATION FORM (After OTP Verification) ============
  return (
    <Form onSubmit={handleRegistrationSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          {/* Verification Confirmed Badge */}
          <div className="alert alert-success d-flex align-items-center mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            <span>
              {verificationMethod === "email"
                ? `Email verified: ${email}`
                : `Phone verified: ${phone.slice(-4)}`}
            </span>
            <Badge bg="success" className="ms-auto">
              {verificationMethod.toUpperCase()}
            </Badge>
          </div>

          <h4 className="mb-3">Complete Your Registration</h4>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <i className="bi bi-person-fill me-2"></i>Full Name
                </Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  disabled={loading}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <i className="bi bi-telephone-fill me-2"></i>Phone Number
                </Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  disabled={loading}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-lock-fill me-2"></i>Password
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min. 6 characters"
                  disabled={loading}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                  disabled={loading}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Account Type</Form.Label>
            <Form.Select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              disabled={loading}
              required
            >
              <option value="consumer">Consumer</option>
              <option value="farmer">Farmer</option>
            </Form.Select>
          </Form.Group>

          {/* Consumer Fields */}
          {formData.role === "consumer" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <i className="bi bi-geo-alt-fill me-2"></i>Delivery Address
                </Form.Label>
                <Form.Control
                  type="text"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  onBlur={handleAddressBlur}
                  placeholder="Enter your delivery address"
                  disabled={loading}
                  required
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Latitude</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.latitude || ""}
                      readOnly
                      className="bg-light"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Longitude</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.longitude || ""}
                      readOnly
                      className="bg-light"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Button
                  variant="info"
                  onClick={fetchLocation}
                  disabled={loading || isLocating}
                  className="text-white w-100"
                >
                  {isLocating ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Fetching Location...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-crosshair me-2"></i>
                      Use My Current Location
                    </>
                  )}
                </Button>
              </Form.Group>
            </>
          )}

          {/* Farmer Fields */}
          {formData.role === "farmer" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-shop me-2"></i>Farm Name / Location
                </Form.Label>
                <Form.Control
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleInputChange}
                  placeholder="Enter your farm name"
                  disabled={loading}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <i className="bi bi-geo-alt-fill me-2"></i>Farm Address
                </Form.Label>
                <Form.Control
                  type="text"
                  name="farmAddress"
                  value={formData.farmAddress}
                  onChange={handleInputChange}
                  onBlur={handleAddressBlur}
                  placeholder="Enter your farm address"
                  disabled={loading}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-credit-card-2-front me-2"></i>UPI ID
                </Form.Label>
                <Form.Control
                  type="text"
                  name="upi"
                  value={formData.upi}
                  onChange={handleInputChange}
                  placeholder="Enter your UPI ID"
                  disabled={loading}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Latitude</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.latitude || ""}
                      readOnly
                      className="bg-light"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Longitude</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.longitude || ""}
                      readOnly
                      className="bg-light"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Button
                  variant="info"
                  onClick={fetchLocation}
                  disabled={loading || isLocating}
                  className="text-white w-100"
                >
                  {isLocating ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Fetching Location...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-crosshair me-2"></i>
                      Use My Current Location
                    </>
                  )}
                </Button>
              </Form.Group>
            </>
          )}
        </Card.Body>
      </Card>

      <div className="d-grid gap-2">
        <Button
          variant="success"
          size="lg"
          type="submit"
          disabled={loading}
          className="py-2"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Creating Account...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-2"></i>
              Complete Registration
            </>
          )}
        </Button>

        <Button
          variant="link"
          onClick={() => navigate("/login")}
          className="text-decoration-none"
          disabled={loading}
        >
          Already have an account? Login here
        </Button>
      </div>
    </Form>
  );
}

export default RegisterForm;
