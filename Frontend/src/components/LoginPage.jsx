import { Container, Row, Col, Card } from "react-bootstrap";
import LoginForm from "./LoginForm";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageProvider";

function LoginPage() {
  const { t } = useLanguage();
  return (
    <div>
      <div className="page-header">
        <Container>
          <h1 className="mb-0">{t("loginToAccount")}</h1>
          <p className="mb-0 opacity-75">{t("welcomeBack")}</p>
        </Container>
      </div>
      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "calc(100vh - 200px)" }}
      >
        <Row className="justify-content-center w-100">
          <Col md={8} lg={6} xl={5}>
            <Card className="shadow-sm">
              <Card.Body className="p-4">
                <LoginForm />
              </Card.Body>
              <Card.Footer className="text-center py-3 bg-light">
                <small className="text-muted">
                  {t("dontHaveAccount")}{" "}
                  <Link to="/register/consumer">{t("registerAsConsumer")}</Link>{" "}
                  {t("or")}{" "}
                  <Link to="/register/farmer">{t("registerAsFarmer")}</Link>
                </small>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default LoginPage;
