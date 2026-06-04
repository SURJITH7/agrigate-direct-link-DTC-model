import React, { useState, useEffect } from "react";
import { Card, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FaMapMarkerAlt } from "react-icons/fa"; // Location icon
import "./Products.css";
import { useLanguage } from "../i18n/LanguageProvider";
import socket from "../socket";

const Products = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, privateFetch } = useAuth();
  // get language context safely; if provider isn't mounted for any reason,
  // fall back to an identity translation function to avoid runtime crashes
  const _langCtx = useLanguage() || {};
  const t = _langCtx.t || ((k) => k);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Use absolute backend URL by default; privateFetch handles session/cookies.
        // Keep this inside try/catch so network errors are handled gracefully.
        const response = await privateFetch(
          "http://localhost:5000/api/products",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [privateFetch]);

  useEffect(() => {
    const handleProductAvailable = (data) => {
      console.log('New product available:', data);
      if (data.product && data.product.status === 'approved') {
        setProducts((prevProducts) => {
          const exists = prevProducts.some((p) => p._id === data.product._id);
          if (exists) return prevProducts;
          return [data.product, ...prevProducts];
        });
      }
    };

    socket.on('product_available', handleProductAvailable);
    return () => {
      socket.off('product_available', handleProductAvailable);
    };
  }, []);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      let newCart;
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        newCart = [...prevCart, { ...product, quantity: 1 }];
      }

      // Persist to localStorage
      if (user && user.role === "consumer") {
        const cartKey = `cart_${user._id}`;
        localStorage.setItem(cartKey, JSON.stringify(newCart));
      }

      return newCart;
    });
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t("loading")}</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center mt-5">
        <p className="text-danger">
          {t("errorPrefix")} {error}
        </p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h1 className="mb-4">{t("freshProducts")}</h1>
      <Row>
        {products.map((product) => (
          <Col key={product._id} sm={12} md={6} lg={4} xl={3} className="mb-4">
            <Card className="h-100 product-card">
              <Card.Img
                variant="top"
                src={`http://localhost:5000${product.image}`}
                alt={product.name} // Added alt attribute for accessibility
                className="product-image"
              />
              <Card.Body className="d-flex flex-column">
                <Card.Title className="card-title">{product.name}</Card.Title>
                <Card.Text className="mb-2">₹{product.price} / kg</Card.Text>
                <Card.Text>
                  <small
                    className="text-muted d-flex align-items-center"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <span>
                      {t("fromLabel")} {product.farmer?.farmName || "A Farmer"}
                      {product.farmer?.location &&
                        ` - ${product.farmer.location}`}
                    </span>
                    {product.farmer?.latitude && product.farmer?.longitude && (
                      <Link
                        to={`/map?lat=${product.farmer.latitude}&lng=${
                          product.farmer.longitude
                        }&label=${encodeURIComponent(product.farmer.farmName)}`}
                        className="ms-2 text-success"
                        title={t("viewLocationTitle")}
                      >
                        <FaMapMarkerAlt />
                      </Link>
                    )}
                  </small>
                </Card.Text>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-auto"
                  onClick={() => addToCart(product)}
                >
                  {t("addToCart")}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Products;
