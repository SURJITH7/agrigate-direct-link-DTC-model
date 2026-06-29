import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import "./AdminProductCommissions.css";

function AdminProductCommissions() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [commission, setCommission] = useState("");
  const { privateFetch } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await privateFetch("https://agrigate-backend-drsi.onrender.com/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        setError("Failed to fetch products");
      }
    } catch (err) {
      setError("Error fetching products: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCommission = (product) => {
    setSelectedProduct(product);
    setCommission(product.commission || 3);
    setShowModal(true);
  };

  const handleSaveCommission = async () => {
    if (!selectedProduct) return;

    const commissionValue = Number(commission);

    // Validation
    if (isNaN(commissionValue)) {
      setError("Commission must be a valid number");
      return;
    }

    if (commissionValue < 2 || commissionValue > 5) {
      setError("Commission must be between 2% and 5%");
      return;
    }

    try {
      const response = await privateFetch(
        `https://agrigate-backend-drsi.onrender.com/api/products/${selectedProduct._id}/commission`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commission: commissionValue }),
        }
      );

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(
          products.map((p) =>
            p._id === selectedProduct._id ? updatedProduct : p
          )
        );
        setSuccess(`Commission set to ${commissionValue}% for ${selectedProduct.name}`);
        setShowModal(false);
        setSelectedProduct(null);
        setCommission("");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update commission");
      }
    } catch (err) {
      setError("Error updating commission: " + err.message);
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setCommission("");
    setError("");
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Product Commission Management</h2>
        <Button variant="success" size="sm" onClick={fetchProducts}>
          <i className="bi bi-arrow-clockwise me-2"></i>Refresh
        </Button>
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
          className="mb-3"
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccess("")}
          className="mb-3"
        >
          {success}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <Alert variant="info">No products found</Alert>
      ) : (
        <div className="table-responsive shadow-sm rounded-3 overflow-hidden">
          <Table hover className="mb-0">
            <thead className="bg-light border-bottom">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-bottom">
                  <td className="px-4 py-3">
                    <strong>{product.name}</strong>
                  </td>
                  <td className="px-4 py-3">
                    {typeof product.farmer === 'object' && product.farmer
                      ? product.farmer.farmName || product.farmer.fullName || 'Unknown'
                      : product.farmer || 'Unknown'}
                  </td>
                  <td className="px-4 py-3">{product.category}</td>
                  <td className="px-4 py-3">₹{product.price}</td>
                  <td className="px-4 py-3">
                    <Badge
                      bg={
                        product.status === "approved"
                          ? "success"
                          : product.status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge bg="info">{product.commission || 3}%</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEditCommission(product)}
                      className="commission-edit-btn"
                    >
                      <i className="bi bi-pencil me-1"></i>Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Commission Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            Set Commission for {selectedProduct?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Commission (%)</Form.Label>
              <Form.Control
                type="number"
                min="2"
                max="5"
                step="0.5"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="Enter commission percentage"
                className="form-control-lg"
              />
              <Form.Text className="text-muted">
                Commission must be between 2% and 5%
              </Form.Text>
            </Form.Group>

            {selectedProduct && (
              <div className="bg-light p-3 rounded-2 mb-3">
                <p className="mb-1">
                  <strong>Product:</strong> {selectedProduct.name}
                </p>
                <p className="mb-1">
                  <strong>Price:</strong> ₹{selectedProduct.price}
                </p>
                <p className="mb-0">
                  <strong>Current Commission:</strong>{" "}
                  {selectedProduct.commission || 3}%
                </p>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveCommission}>
            Save Commission
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AdminProductCommissions;
