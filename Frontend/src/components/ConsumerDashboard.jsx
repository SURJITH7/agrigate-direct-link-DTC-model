import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Carousel,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageProvider";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";
import "./ConsumerDashboard.css";

const features = [
  {
    icon: "🌱",
    title: "Farm Fresh",
    description:
      "Direct from local farms to ensure maximum freshness and quality.",
  },
  {
    icon: "🚚",
    title: "Fast Delivery",
    description: "Same-day delivery available for orders placed before 2 PM.",
  },
  {
    icon: "💚",
    title: "Support Local",
    description:
      "Every purchase supports local farmers and sustainable agriculture.",
  },
];

function ConsumerDashboard() {
  const { user, privateFetch } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    featuredProducts: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const productsRes = await privateFetch(
          "http://localhost:5000/api/products",
        );

        if (!productsRes.ok) {
          const errorData = await productsRes.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to fetch products from the server.",
          );
        }

        const products = await productsRes.json();

        const featuredProducts = products.slice(0, 6);

        const categoryCounts = products.reduce((acc, product) => {
          const categoryName = product.category || "Other";
          acc[categoryName] = (acc[categoryName] || 0) + 1;
          return acc;
        }, {});

        const categoryIcons = {
          Vegetables: "🥕",
          Fruits: "🍎",
          Grains: "🌾",
          Dairy: "🥛",
          Meat: "🥩",
          "Herbs & Spices": "🌿",
          Other: "🛍️",
        };

        const categories = Object.entries(categoryCounts).map(
          ([name, count]) => ({
            name,
            count,
            icon: categoryIcons[name] || "🛍️",
          }),
        );

        setDashboardData({ featuredProducts, categories });
      } catch (err) {
        setError(
          err.message || "Could not load dashboard. Please try again later.",
        );
        setDashboardData({ featuredProducts: [], categories: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [privateFetch]);

  // safe language hook usage: avoid crashes if provider isn't mounted
  const _langCtx = useLanguage() || {};
  const t = _langCtx.t || ((k) => (typeof k === "string" ? k : ""));

  const handleBuyNow = (product) => {
    addToCart(product);
    // Navigate to the cart page after adding the item
    navigate("/cart");
  };

  if (loading) {
    return (
      <Container className="loading-container">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">{t("loadingConsumerExperience")}</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="error-container">
        <Alert variant="danger">
          <Alert.Heading>{t("errorTitle")}</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <div className="hero-section py-5 mb-5">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <h1 className="display-3 fw-bold mb-4">{t("heroTitle")}</h1>
              <p className="lead mb-4 opacity-75">
                {t("heroSubtitle", {
                  name: user?.fullName || t("guest"),
                })}
              </p>
              <div className="d-flex gap-3">
                <Button as={Link} to="/products" variant="light" size="lg">
                  <i className="bi bi-basket-fill me-2"></i>
                  {t("browseProducts")}
                </Button>
                <Button as={Link} to="/" variant="outline-light" size="lg">
                  {t("aboutUs")}
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              {dashboardData.featuredProducts.length > 0 && (
                <Card className="shadow-lg border-0">
                  <Carousel fade>
                    {dashboardData.featuredProducts.map((product) => (
                      <Carousel.Item key={product._id}>
                        <img
                          className="d-block w-100 rounded carousel-product-image"
                          src={
                            product.image
                              ? `http://localhost:5000${product.image}`
                              : "https://via.placeholder.com/800x350"
                          }
                          alt={product.name}
                        />
                        <Carousel.Caption className="bg-dark bg-opacity-50 rounded-bottom">
                          <h5>{product.name}</h5>
                          <p>
                            {t("fromFarm", {
                              farmName:
                                product.farmer?.farmName || t("aGreatFarm"),
                            })}
                          </p>
                        </Carousel.Caption>
                      </Carousel.Item>
                    ))}
                  </Carousel>
                </Card>
              )}
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-5">
        {/* Categories Section */}
        <Row className="mb-5 text-center">
          <Col>
            <h2 className="fw-bold">{t("shopByCategory")}</h2>
            <p className="text-muted">{t("shopByCategorySubtitle")}</p>
          </Col>
        </Row>
        <Row>
          {dashboardData.categories.map((category) => (
            <Col lg={3} md={6} key={category.name} className="mb-4">
              <Link
                to={`/products?category=${category.name}`}
                className="text-decoration-none text-dark"
              >
                <Card className="category-card h-100 shadow-sm">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
                    <div className="category-icon mb-3">{category.icon}</div>
                    <h5 className="mb-1 fw-semibold">{category.name}</h5>
                    <p className="text-muted mb-0">
                      {t("productCount", { count: category.count })}
                    </p>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Fresh Products */}
      <div className="bg-light py-5">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">{t("freshProductsTitle")}</h2>
            <Button as={Link} to="/products" variant="outline-success">
              {t("viewAllProducts")}
            </Button>
          </div>
          <Row>
            {dashboardData.featuredProducts.map((product) => (
              <Col lg={4} md={6} key={product._id} className="mb-4">
                <Card className="product-card h-100 shadow-sm">
                  <Link
                    to={`/products/${product._id}`}
                    className="product-image-link"
                  >
                    <Card.Img
                      variant="top"
                      src={
                        product.image
                          ? `http://localhost:5000${product.image}`
                          : "https://via.placeholder.com/400x200"
                      }
                      alt={product.name}
                      className="product-image"
                    />
                  </Link>
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">
                        <Link
                          to={`/products/${product._id}`}
                          className="text-decoration-none text-dark text-truncate"
                        >
                          {product.name}
                        </Link>
                      </h5>
                      <Badge bg="success" pill className="fs-6 px-3 py-2">
                        ₹{product.price}
                      </Badge>
                    </div>
                    <p className="text-muted mb-3">
                      <small>
                        🚜 {product.farmer?.farmName || "a great farm"}
                      </small>
                    </p>
                    <div className="mt-auto d-grid">
                      <Button
                        variant="success"
                        onClick={() => addToCart(product)}
                        disabled={product.quantity === 0}
                      >
                        <i className="bi bi-cart-plus-fill me-2"></i>
                        {product.quantity === 0
                          ? t("outOfStock")
                          : t("addToCart")}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* My Account Section */}
      <Container className="py-5">
        <Row className="mb-5 text-center">
          <Col>
            <h2 className="fw-bold">{t("myAccount")}</h2>
            <p className="text-muted">{t("myAccountSubtitle")}</p>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col lg={4} md={6} className="mb-4">
            <Card className="account-card h-100 text-center shadow-sm">
              <Card.Body className="p-4 d-flex flex-column">
                <div className="account-card-icon mb-3">
                  <i className="bi bi-person-circle"></i>
                </div>
                <h5 className="card-title fw-bold">
                  {t("myProfileCardTitle")}
                </h5>
                <p className="card-text text-muted">
                  {t("myProfileCardSubtitle")}
                </p>
                <Button
                  as={Link}
                  to="/consumer/profile"
                  variant="success"
                  className="mt-auto"
                >
                  {t("goToProfile")}
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} className="mb-4">
            <Card className="account-card h-100 text-center shadow-sm">
              <Card.Body className="p-4 d-flex flex-column">
                <div className="account-card-icon mb-3">
                  <i className="bi bi-receipt-cutoff"></i>
                </div>
                <h5 className="card-title fw-bold">{t("myOrdersCardTitle")}</h5>
                <p className="card-text text-muted">
                  {t("myOrdersCardSubtitle")}
                </p>
                <Button
                  as={Link}
                  to="/consumer/orders"
                  variant="success"
                  className="mt-auto"
                >
                  {t("viewOrders")}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Features Section */}
      <div className="bg-light py-5">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <h2 className="fw-bold">{t("whyChooseAgriGate")}</h2>
              <p className="text-muted">{t("whyChooseAgriGateSubtitle")}</p>
            </Col>
          </Row>
          <Row>
            {features.map((feature) => (
              <Col lg={4} md={6} key={feature.title} className="mb-4">
                <div className="text-center p-4">
                  <div className="feature-icon-wrapper mb-3">
                    {feature.icon}
                  </div>
                  <h5 className="fw-bold">{feature.title}</h5>
                  <p className="text-muted px-lg-3">{feature.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </div>
    </>
  );
}

export default ConsumerDashboard;
