import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaTractor, FaShoppingCart } from "react-icons/fa";
import "./LandingPage.css";

function LandingPage() {
  return (
    <div
      className="landing-page d-flex align-items-center justify-content-center"
      style={{ minHeight: "calc(100vh - 56px)" }}
    >
      <Container className="text-center py-5">
        <h1 className="display-3 fw-bold mb-3 landing-title">
          Welcome to AgriGate
        </h1>
        <p className="lead text-muted mb-5 landing-subtitle">
          Connecting local farmers directly with consumers. Freshness
          guaranteed.
        </p>
        <Row className="justify-content-center">
          <Col md={6} lg={5} className="mb-4">
            <Card className="h-100 landing-card">
              <Card.Body className="d-flex flex-column justify-content-between p-4">
                <div className="mb-4">
                  <FaTractor size={60} className="text-success mb-4" />
                  <Card.Title as="h2" className="mb-3">
                    For Farmers
                  </Card.Title>
                  <Card.Text className="text-muted px-3">
                    Sell your produce directly to a wider market. Manage your
                    inventory, track orders, and grow your business.
                  </Card.Text>
                </div>
                <Button
                  as={Link}
                  to="/register/farmer"
                  variant="success"
                  size="lg"
                  className="w-100 mt-3"
                >
                  Register as a Farmer
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col
            md={6}
            lg={5}
            className="mb-4"
            style={{ animationDelay: "0.2s" }}
          >
            <Card className="h-100 landing-card">
              <Card.Body className="d-flex flex-column justify-content-between p-4">
                <div className="mb-4">
                  <FaShoppingCart size={60} className="text-primary mb-4" />
                  <Card.Title as="h2" className="mb-3">
                    For Consumers
                  </Card.Title>
                  <Card.Text className="text-muted px-3">
                    Buy fresh, high-quality produce directly from local farms.
                    Support your community and eat healthier.
                  </Card.Text>
                </div>
                <Button
                  as={Link}
                  to="/register/consumer"
                  variant="primary"
                  size="lg"
                  className="w-100 mt-3"
                >
                  Register as a Consumer
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <div className="mt-5 text-center login-link">
          <p className="text-muted">
            Already have an account? <Link to="/login">Log in here</Link>.
          </p>
        </div>
      </Container>
    </div>
  );
}

export default LandingPage;
