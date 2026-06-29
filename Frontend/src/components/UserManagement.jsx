import { useState, useEffect } from "react";
import {
  Container,
  Card,
  Table,
  Spinner,
  Badge,
  Button,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { useAuth } from "./AuthContext";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
  });
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const { privateFetch } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // This is a placeholder. You'll need to create this API endpoint.
        const response = await privateFetch(
          "https://agrigate-backend-drsi.onrender.com/api/admin/users",
        );
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [privateFetch]);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    setModalError("");
    setModalSuccess("");
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");
    try {
      const response = await privateFetch(
        `https://agrigate-backend-drsi.onrender.com/api/admin/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      if (!response.ok) throw new Error("Failed to update user");
      const updatedUser = await response.json();
      setUsers(users.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
      setModalSuccess("User updated successfully!");
      setTimeout(() => setShowEditModal(false), 2000);
    } catch (error) {
      setModalError(error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setModalError("");
    try {
      const response = await privateFetch(
        `https://agrigate-backend-drsi.onrender.com/api/admin/users/${selectedUser._id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("Failed to delete user");
      setUsers(users.filter((u) => u._id !== selectedUser._id));
      setShowEditModal(false);
    } catch (error) {
      setModalError(error.message);
    }
  };

  return (
    <Container fluid>
      <h1 className="h2 mb-4">User Management</h1>
      <Card>
        <Card.Header>All Users</Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user._id}</td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge
                        bg={
                          user.role === "admin"
                            ? "danger"
                            : user.role === "farmer"
                              ? "success"
                              : "primary"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showEditModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}
            {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="consumer">Consumer</option>
                <option value="farmer">Farmer</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between">
            <Button variant="danger" onClick={handleDeleteUser}>
              Delete User
            </Button>
            <div>
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                className="me-2"
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default UserManagement;
