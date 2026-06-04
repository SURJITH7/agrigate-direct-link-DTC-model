import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "./AuthContext";
import { useParams, useNavigate } from "react-router-dom";

function EditProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { privateFetch } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    unit: "kg",
    quantity: "",
    description: "",
    category: "",
    image: "", // Use empty string for text input
    harvestTime: "",
  });

  const categories = [
    "Vegetables",
    "Fruits",
    "Grains",
    "Dairy",
    "Meat",
    "Herbs & Spices",
    "Other",
  ];

  useEffect(() => {
    // Fetch product data from backend
    const fetchProduct = async () => {
      try {
        const response = await privateFetch(
          `http://localhost:5000/api/products/${id}`
        );
        const product = await response.json();
        setFormData({
          name: product.name || "",
          price: product.price?.toString() || "",
          unit: product.unit || "kg",
          quantity: product.quantity?.toString() || "",
          description: product.description || "",
          category: product.category || "",
          image: product.image || "", // Correctly load existing image URL
          harvestTime: product.harvestTime || "",
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching product:", error);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, privateFetch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("price", formData.price);
      payload.append("unit", formData.unit);
      payload.append("quantity", formData.quantity);
      payload.append("description", formData.description);
      payload.append("category", formData.category);
      payload.append("harvestTime", formData.harvestTime);
      if (imageFile) {
        payload.append("image", imageFile);
      }

      const response = await privateFetch(
        `http://localhost:5000/api/products/${id}`,
        {
          method: "PUT",
          // Do not stringify FormData; let the browser set the Content-Type header.
          body: payload,
        }
      );
      if (!response.ok) throw new Error("Failed to update product");
      setShowAlert(true);
      setTimeout(() => {
        navigate("/farmer/my-products");
      }, 2000);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading product details...</p>
      </Container>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Container>
          <h1 className="mb-0">Edit Product ✏️</h1>
          <p className="mb-0 opacity-75">Update your product information</p>
        </Container>
      </div>

      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            {showAlert && (
              <Alert variant="success" className="mb-4">
                <Alert.Heading>Success!</Alert.Heading>
                Product updated successfully. Redirecting to your products...
              </Alert>
            )}

            <Card>
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
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
                          min="0"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
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
                  </Row>
                  <Row>
                    <Col md={6} className="mb-3">
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
                        {formData.image && !imageFile && (
                          <div className="mb-2">
                            <p className="fw-bold mb-1">Current Image:</p>
                            <img
                              src={`http://localhost:5000${formData.image}`}
                              alt="Current product"
                              style={{
                                width: "100px",
                                height: "100px",
                                objectFit: "cover",
                                borderRadius: "8px",
                              }}
                            />
                          </div>
                        )}
                        <Form.Label className="fw-bold">
                          Update Image (Optional)
                        </Form.Label>
                        <Form.Control
                          type="file"
                          name="image"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                        <Form.Text className="text-muted">
                          Leave empty to keep current image
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
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

                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate(-1)}
                      className="me-md-2"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="lg">
                      Update Product
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default EditProductForm;
