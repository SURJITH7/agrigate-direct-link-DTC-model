import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useGeoLocation } from "./LocationContext";
import {
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  Badge,
  Image,
  Modal,
} from "react-bootstrap";
import "./ProfilePage.css";
import { useLanguage } from "../i18n/LanguageProvider";

function FarmerProfile() {
  const { user, privateFetch, login } = useAuth();
  const { t } = useLanguage();
  const { location: realtimeLocation } = useGeoLocation();
  const [profile, setProfile] = useState(null);
  const [productCategories, setProductCategories] = useState([]);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [autoFetchLocation, setAutoFetchLocation] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await privateFetch(
          "http://localhost:5000/api/users/profile",
        );
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
        setFormData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchProductCategories = async () => {
      try {
        const res = await privateFetch("http://localhost:5000/api/products");
        if (!res.ok) return;
        const products = await res.json();
        const categories = [...new Set(products.map((p) => p.category))].slice(
          0,
          5,
        ); // Get top 5 unique categories
        setProductCategories(categories);
      } catch (err) {
        console.error("Failed to fetch product categories", err);
      }
    };

    if (user) {
      fetchProfile();
      fetchProductCategories();
    }
  }, [user, privateFetch, setProductCategories]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const submissionData = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        submissionData.append(key, formData[key]);
      }
    }
    if (profilePicFile) {
      submissionData.append("profilePic", profilePicFile);
    }

    try {
      const res = await privateFetch(
        "http://localhost:5000/api/users/profile",
        {
          method: "PUT",
          // No 'Content-Type' header, browser sets it for FormData
          body: submissionData,
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      setProfile(data);
      login(data); // Update user in auth context
      setSuccess("Profile updated successfully! Closing in 2 seconds...");
      setProfilePicFile(null); // Reset file input state
      setTimeout(() => setShowEditModal(false), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      );
      const data = await response.json();
      return data.display_name || "";
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      // Fallback to coordinates if geocoding fails
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
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
        const { latitude, longitude } = position.coords;
        const locationName = await reverseGeocode(latitude, longitude);
        setFormData((prev) => ({
          ...prev,
          latitude: latitude,
          longitude: longitude,
          locationName: locationName,
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
            message = "Could not get your location in time. Please try again.";
            break;
        }
        setError(message);
      } finally {
        setIsLocating(false);
      }
    }
  };

  const handleEditClick = () => {
    // Initialize form with current profile data when opening modal
    setFormData(profile);
    setProfilePicFile(null);
    setError("");
    setSuccess("");
    setAutoFetchLocation(true);
    setShowEditModal(true);
  };

  // Auto-fetch location when modal opens
  useEffect(() => {
    if (autoFetchLocation && showEditModal) {
      fetchLocation();
      setAutoFetchLocation(false);
    }
  }, [showEditModal, autoFetchLocation]);

  // Update location in real-time if it changes
  useEffect(() => {
    if (realtimeLocation && showEditModal) {
      const updateLocationData = async () => {
        const locationName = await reverseGeocode(
          realtimeLocation.latitude,
          realtimeLocation.longitude,
        );
        setFormData((prev) => ({
          ...prev,
          latitude: realtimeLocation.latitude,
          longitude: realtimeLocation.longitude,
          locationName: locationName,
        }));
      };
      updateLocationData();
    }
  }, [realtimeLocation, showEditModal]);
  if (loading)
    return (
      <div className="profile-page spinner-container">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">
          {t("loading")} {t("profile")}
        </p>
      </div>
    );
  if (error && !profile) return <Alert variant="danger">{error}</Alert>;
  if (!profile) return <div>{t("noProfileData")}</div>;

  return (
    <div className="profile-page">
      <Row>
        {/* Sidebar-like Profile Card */}
        <Col lg={4} className="mb-4">
          <Card className="card-custom text-center h-100">
            <Card.Body>
              <Image
                src={
                  profile.profilePic
                    ? // if backend already returned absolute url, use it; otherwise prefix with localhost
                      profile.profilePic.startsWith("http")
                      ? profile.profilePic
                      : `http://localhost:5000${profile.profilePic}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        profile.fullName,
                      )}&background=28a745&color=fff&size=128`
                }
                roundedCircle
                className="mb-3 profile-image"
              />
              <h4 className="profile-name">{profile.fullName}</h4>
              <p className="profile-role">{profile.email}</p>
              <Button variant="primary" onClick={handleEditClick}>
                <i className="bi bi-pencil-square me-2"></i>
                {t("editProfile")}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content Area */}
        <Col lg={8}>
          <Card className="card-custom">
            <Card.Body>
              <h5 className="section-title mb-4">{t("farmDetails")}</h5>
              <Row>
                <Col md={6} className="mb-3">
                  <div className="detail-label">{t("farmName")}</div>
                  <div className="detail-value">
                    {profile.farmName || "Not specified"}
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="detail-label">{t("farmAddress")}</div>
                  <div className="detail-value">
                    {profile.farmAddress || "Not specified"}
                  </div>
                </Col>
                <Col md={12} className="mb-3">
                  <div className="detail-label">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    {t("currentLocation")}
                  </div>
                  <div className="detail-value">
                    {profile.locationName || t("notSet")}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Body>
              <h5 className="section-title mb-4">{t("contactAndPayment")}</h5>
              <Row>
                <Col md={6} className="mb-3">
                  <div className="detail-label">{t("phoneLabel")}</div>
                  <div className="detail-value">
                    {profile.phone || "Not set"}
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="detail-label">{t("upiLabel")}</div>
                  <div className="detail-value">
                    {profile.upi || t("notSet")}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Body>
              <h5 className="section-title mb-3">{t("aboutMyFarm")}</h5>
              <p className="text-muted">
                {profile.description || t("noDescription")}
              </p>
            </Card.Body>
          </Card>

          {productCategories.length > 0 && (
            <Card className="card-custom">
              <Card.Body>
                <h5 className="section-title mb-3">
                  {t("mainProductCategories")}
                </h5>
                <div>
                  {productCategories.map((cat) => (
                    <Badge key={cat} pill bg="success" className="me-2 p-2">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Farmer Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Profile Picture</Form.Label>
              <Form.Control
                type="file"
                name="profilePic"
                onChange={(e) => setProfilePicFile(e.target.files[0])}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Farm Name</Form.Label>
              <Form.Control
                type="text"
                name="farmName"
                value={formData.farmName || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Farm Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="farmAddress"
                value={formData.farmAddress || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>UPI ID</Form.Label>
              <Form.Control
                type="text"
                name="upi"
                value={formData.upi || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3 position-relative">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                name="locationName"
                value={formData.locationName || ""}
                onChange={handleInputChange}
                placeholder="Your farm's general location"
              />
              <Form.Text className="text-muted">
                Click the button below to set your precise location. This will
                also be updated automatically when you are live.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Latitude</Form.Label>
              <Form.Control
                type="number"
                step="0.00001"
                name="latitude"
                value={formData.latitude || ""}
                onChange={handleInputChange}
                placeholder="Latitude"
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Longitude</Form.Label>
              <Form.Control
                type="number"
                step="0.00001"
                name="longitude"
                value={formData.longitude || ""}
                onChange={handleInputChange}
                placeholder="Longitude"
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Button
                variant="info"
                onClick={fetchLocation}
                disabled={isLocating}
                className="text-white"
              >
                {isLocating ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />{" "}
                    Fetching...
                  </>
                ) : (
                  "Use My Current Location"
                )}
              </Button>
              <Form.Text className="d-block mt-2 text-muted">
                Real-time location updates:{" "}
                {realtimeLocation ? "Active ✓" : "Inactive"}
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default FarmerProfile;
