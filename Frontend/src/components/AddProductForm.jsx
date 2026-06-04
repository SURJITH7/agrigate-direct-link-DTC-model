import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Alert,
  Card,
  Form,
  Button,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const categories = ["Vegetables", "Fruits", "Grains", "Dairy", "Other"];

function AddProductForm() {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    unit: "kg",
    quantity: "",
    category: "",
    image: null,
    harvestTime: "",
    description: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { privateFetch } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("price", formData.price);
    payload.append("unit", formData.unit);
    payload.append("quantity", formData.quantity);
    payload.append("category", formData.category);
    payload.append("harvestTime", formData.harvestTime);
    payload.append("description", formData.description);
    if (formData.image) {
      payload.append("image", formData.image);
    }
    try {
      const res = await privateFetch("http://localhost:5000/api/products", {
        method: "POST",
        body: payload,
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to add product.");
        return;
      }
      setShowAlert(true);
      setTimeout(() => {
        navigate("/farmer/my-products");
      }, 2000);
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    }
  };

  return (
    <>
      <div className="page-header">
        <Container>
          <h1 className="mb-0">Add New Product 🌱</h1>
          <p className="mb-0 opacity-75">
            Share your fresh produce with the community
          </p>
        </Container>
      </div>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            {showAlert && (
              <Alert variant="success" className="mb-4">
                <Alert.Heading>Success!</Alert.Heading>
                Product added successfully. Redirecting to your products...
              </Alert>
            )}
            {errorMsg && (
              <Alert variant="danger" className="mb-4">
                {errorMsg}
              </Alert>
            )}
            <Card>
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                  {/* ...existing form fields... */}
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          Product Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., Fresh Organic Tomatoes"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold">Price (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold">Unit</Form.Label>
                        <Form.Select
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="kg">per kg</option>
                          <option value="liter">per liter</option>
                          <option value="piece">per piece</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold">Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="1"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold">Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          Product Image
                        </Form.Label>
                        <Form.Control
                          type="file"
                          name="image"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          Harvest Time
                        </Form.Label>
                        <Form.Control
                          type="datetime-local"
                          name="harvestTime"
                          value={formData.harvestTime}
                          onChange={handleInputChange}
                          placeholder="e.g., August 2025, or 2 days ago, or specify date"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold">Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe your product, its quality, farming methods, etc."
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate(-1)}
                      className="me-md-2"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="lg">
                      Add Product
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default AddProductForm;
