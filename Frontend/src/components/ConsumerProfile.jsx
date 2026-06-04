import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  Image,
  Modal,
} from "react-bootstrap";
import "./ProfilePage.css"; // Reusing the same CSS
import { useLanguage } from "../i18n/LanguageProvider";

function ConsumerProfile() {
  const { user, privateFetch, login } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await privateFetch(
          "http://localhost:5000/api/users/profile"
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

    if (user) {
      fetchProfile();
    }
  }, [user, privateFetch]);

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
          body: submissionData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      setProfile(data);
      login(data); // Update user in auth context
      setSuccess("Profile updated successfully! Closing in 2 seconds...");
      setProfilePicFile(null);
      setTimeout(() => setShowEditModal(false), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      return data.display_name || "";
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
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
          latitude,
          longitude,
          locationName,
        }));
      } catch (err) {
        setError(`Could not get location: ${err.message}`);
      } finally {
        setIsLocating(false);
      }
    }
  };

  const handleEditClick = () => {
    setFormData(profile);
    setProfilePicFile(null);
    setError("");
    setSuccess("");
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="profile-page spinner-container">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">
          {t("loading")} {t("profile")}
        </p>
      </div>
    );
  }

  if (error && !profile) return <Alert variant="danger">{error}</Alert>;
  if (!profile) return <div>No profile data.</div>;

  return (
    <div className="profile-page">
      <Row>
        {/* Sidebar-like Profile Card */}
        <Col lg={4} className="mb-4">
          <Card className="card-custom text-center h-100">
            <Card.Body>
              <Image
                src={
                  profile.profilePic // The backend now provides an absolute URL
                    ? profile.profilePic.startsWith("http")
                      ? profile.profilePic
                      : `http://localhost:5000${profile.profilePic}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        profile.fullName
                      )}&background=667eea&color=fff&size=128`
                }
                roundedCircle
                className="mb-3 profile-image"
              />
              <h4 className="profile-name">{profile.fullName}</h4>
              <p className="profile-role">{profile.email}</p>
              <Button variant="primary" onClick={handleEditClick}>
                <i className="bi bi-pencil-square me-2"></i>Edit Profile
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content Area */}
        <Col lg={8}>
          <Card className="card-custom">
            <Card.Body>
              <h5 className="section-title mb-4">
                {t("accountDetails") || "Account Details"}
              </h5>
              <Row>
                <Col md={6} className="mb-3">
                  <div className="detail-label">
                    {t("fullNameLabel") || "Full Name"}
                  </div>
                  <div className="detail-value">{profile.fullName || "-"}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="detail-label">
                    {t("emailLabel") || "Email"}
                  </div>
                  <div className="detail-value">{profile.email || "-"}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="detail-label">{t("phoneLabel")}</div>
                  <div className="detail-value">{profile.phone || "-"}</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Body>
              <h5 className="section-title mb-4">
                {t("addressAndLocation") || "Address & Location"}
              </h5>
              <div className="detail-label">
                {t("deliveryAddress") || "Delivery Address"}
              </div>
              <div className="detail-value mb-3">
                {profile.deliveryAddress || t("notSet")}
              </div>
              <div className="detail-label">
                {t("savedLocation") || "Saved Location"}
              </div>
              <div className="detail-value">
                {profile.locationName || t("notSet")}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Consumer Profile</Modal.Title>
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
                accept="image/*"
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
              <Form.Label>Delivery Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="deliveryAddress"
                value={formData.deliveryAddress || ""}
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
                placeholder="Your general location"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Button
                variant="info"
                onClick={fetchLocation}
                disabled={isLocating}
                className="text-white"
              >
                {isLocating ? "Fetching..." : "Use My Current Location"}
              </Button>
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

export default ConsumerProfile;
