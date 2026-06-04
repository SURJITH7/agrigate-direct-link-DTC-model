import { useParams } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import RegisterForm from "../components/RegisterForm";

function RegisterPage() {
  const { userType } = useParams();
  const title = userType === "farmer" ? "Farmer" : "Consumer";

  return (
    <div>
      <div className="page-header">
        <Container>
          <h1 className="mb-0">Create Your {title} Account</h1>
          <p className="mb-0 opacity-75">Join our community today!</p>
        </Container>
      </div>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <RegisterForm userType={userType} />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default RegisterPage;
