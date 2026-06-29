import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageProvider";
import { useGeoLocation } from "../LocationContext";
import { getDistance } from "../utils/distance";
import api from "../api";
import { useCart } from "./CartContext";
import socket from "../socket";
import "./FreshProducts.css";

function FreshProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { t } = useLanguage();
  const { location } = useGeoLocation();
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    "all",
    "Vegetables",
    "Fruits",
    "Dairy",
    "Grains",
    "Herbs & Spices",
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/products");
      let productsData = response.data;

      if (location && location.latitude && location.longitude) {
        productsData = productsData.map((product) => {
          let distance = Infinity;
          if (
            product.farmer &&
            product.farmer.latitude &&
            product.farmer.longitude
          ) {
            distance = getDistance(
              location.latitude,
              location.longitude,
              product.farmer.latitude,
              product.farmer.longitude,
            );
          }
          return {
            ...product,
            farmerDistance: distance,
          };
        });
      } else {
        productsData = productsData.map((product) => ({
          ...product,
          farmerDistance: Infinity,
        }));
      }

      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleProductAvailable = () => {
      fetchProducts();
    };

    socket.on("product_available", handleProductAvailable);
    return () => {
      socket.off("product_available", handleProductAvailable);
    };
  }, [fetchProducts]);

  useEffect(() => {
    let filtered = products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.farmer &&
          product.farmer.farmName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          // Sort by distance (nearest first, infinities last)
          if (a.farmerDistance === Infinity && b.farmerDistance === Infinity)
            return 0;
          if (a.farmerDistance === Infinity) return 1;
          if (b.farmerDistance === Infinity) return -1;
          return a.farmerDistance - b.farmerDistance;
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm, sortBy]);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  return (
    <div>
      <div className="page-header">
        <Container>
          <h1 className="mb-0">{t("freshProducts")} 🛒</h1>
          <p className="mb-0 opacity-75">
            Discover fresh, local produce from trusted farmers
          </p>
        </Container>
      </div>

      <Container>
        <Row>
          {/* Filters Sidebar */}
          <Col lg={3} className="mb-4">
            <div className="category-filter">
              <h5 className="mb-3">Filters</h5>

              {/* Search */}
              <Form.Group className="mb-3">
                <Form.Label>Search Products</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or farmer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>

              {/* Category Filter */}
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Sort By */}
              <Form.Group className="mb-3">
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="distance">Nearest Farmer (By Distance)</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                  <option value="rating">Rating</option>
                </Form.Select>
              </Form.Group>

              <div className="mt-4">
                <h6>Quick Categories</h6>
                {categories.slice(1).map((category) => (
                  <Badge
                    key={category}
                    bg={selectedCategory === category ? "primary" : "light"}
                    text={selectedCategory === category ? "white" : "dark"}
                    className="me-2 mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </Col>

          {/* Products Grid */}
          <Col lg={9}>
            {error && <Alert variant="danger">{error}</Alert>}
            {!location && !loading && (
              <Alert variant="info">
                📍 Enable location access to see products sorted by nearest
                farmer distance
              </Alert>
            )}
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-3">Loading products...</p>
              </div>
            )}
            {!loading && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">
                    {filteredProducts.length} Products Found
                  </h5>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchTerm("");
                      setSortBy("distance");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h5>No products found</h5>
                    <p>Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <Row>
                    {filteredProducts.map((product) => (
                      <Col
                        lg={4}
                        md={6}
                        key={product._id || product.id}
                        className="mb-4"
                      >
                        <Card className="product-card h-100">
                          <div className="position-relative">
                            <img
                              src={
                                product.image
                                  ? `https://agrigate-backend-drsi.onrender.com${product.image}`
                                  : "https://via.placeholder.com/400x300?text=No+Image"
                              }
                              alt={product.name}
                              className="product-image"
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/400x300?text=Image+Not+Found";
                              }}
                            />
                            {product.quantity <= 0 && (
                              <Badge
                                bg="danger"
                                className="position-absolute top-0 start-0 m-2"
                              >
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                          <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title mb-0">
                                {product.name}
                              </h6>
                              <span className="price-badge">
                                ₹{product.price}
                              </span>
                            </div>

                            <p className="text-muted mb-2">
                              <small>
                                🚜{" "}
                                {product.farmer && product.farmer.farmName
                                  ? product.farmer.farmName
                                  : "Unknown Farmer"}
                              </small>
                              {product.farmerDistance &&
                                product.farmerDistance !== Infinity && (
                                  <div className="text-primary">
                                    <small>
                                      📍 {product.farmerDistance.toFixed(2)} km
                                      away
                                    </small>
                                  </div>
                                )}
                            </p>

                            <p
                              className="card-text text-muted mb-2"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {product.description}
                            </p>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div>
                                <span className="text-warning">
                                  {"★".repeat(Math.floor(product.rating))}
                                </span>
                                <small className="text-muted ms-1">
                                  ({product.rating})
                                </small>
                              </div>
                              <Badge bg="secondary" className="farmer-badge">
                                {product.category}
                              </Badge>
                            </div>

                            <div className="mt-auto">
                              <Row>
                                <Col>
                                  <Button
                                    as={Link}
                                    to={`/product/${product._id || product.id}`}
                                    variant="outline-primary"
                                    size="sm"
                                    className="w-100"
                                  >
                                    View Details
                                  </Button>
                                </Col>
                                <Col>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-100"
                                    disabled={product.quantity <= 0}
                                    onClick={() => handleAddToCart(product)}
                                  >
                                    {product.quantity > 0
                                      ? "Add to Cart"
                                      : "Out of Stock"}
                                  </Button>
                                </Col>
                              </Row>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default FreshProducts;
