import { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

function Checkout({ cartItems, clearCart }) {
  const navigate = useNavigate()
  const [showAlert, setShowAlert] = useState(false)
  const [formData, setFormData] = useState({
    // Shipping Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Payment Information
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Delivery Options
    deliveryOption: 'standard',
    specialInstructions: ''
  })

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08
  const shipping = subtotal > 50 ? 0 : 5.99
  const total = subtotal + tax + shipping

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Mock API call - replace with actual payment processing
      console.log('Order data:', {
        items: cartItems,
        customer: formData,
        totals: { subtotal, tax, shipping, total }
      })
      
      setShowAlert(true)
      
      setTimeout(() => {
        clearCart()
        navigate('/orders')
      }, 3000)
      
    } catch (error) {
      console.error('Error processing order:', error)
    }
  }

  if (cartItems.length === 0) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h3>Your cart is empty</h3>
          <p>Add some items to your cart before checking out.</p>
          <Button onClick={() => navigate('/products')} variant="primary">
            Continue Shopping
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <div>
      <div className="page-header">
        <Container>
          <h1 className="mb-0">Checkout 💳</h1>
          <p className="mb-0 opacity-75">Complete your order</p>
        </Container>
      </div>

      <Container>
        {showAlert && (
          <Alert variant="success" className="mb-4">
            <Alert.Heading>Order Placed Successfully! 🎉</Alert.Heading>
            <p>Thank you for your order! You will receive a confirmation email shortly.</p>
            <p>Redirecting to your orders...</p>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col lg={8} className="mb-4">
              {/* Shipping Information */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Shipping Information</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street address"
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>State</Form.Label>
                        <Form.Select
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select State</option>
                          <option value="CA">California</option>
                          <option value="NY">New York</option>
                          <option value="TX">Texas</option>
                          <option value="FL">Florida</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>ZIP Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Delivery Options */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Delivery Options</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="radio"
                      name="deliveryOption"
                      value="standard"
                      checked={formData.deliveryOption === 'standard'}
                      onChange={handleInputChange}
                      label="Standard Delivery (3-5 business days) - FREE over $50"
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      name="deliveryOption"
                      value="express"
                      checked={formData.deliveryOption === 'express'}
                      onChange={handleInputChange}
                      label="Express Delivery (1-2 business days) - $12.99"
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Special Instructions (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleInputChange}
                      placeholder="Any special delivery instructions..."
                    />
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Payment Information */}
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Payment Information</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Cardholder Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Expiry Date</Form.Label>
                        <Form.Control
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          placeholder="MM/YY"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>CVV</Form.Label>
                        <Form.Control
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Order Summary */}
            <Col lg={4}>
              <Card className="cart-summary">
                <Card.Header>
                  <h5 className="mb-0">Order Summary</h5>
                </Card.Header>
                <Card.Body>
                  {cartItems.map(item => (
                    <div key={item.id} className="d-flex justify-content-between mb-2">
                      <div>
                        <small>{item.name}</small>
                        <br />
                        <small className="text-muted">Qty: {item.quantity}</small>
                      </div>
                      <small>₹{(item.price * item.quantity).toFixed(2)}</small>
                    </div>
                  ))}
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <span>Shipping:</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-success">FREE</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between mb-4">
                    <strong>Total:</strong>
                    <strong className="text-primary">${total.toFixed(2)}</strong>
                  </div>

                  <div className="d-grid">
                    <Button type="submit" variant="primary" size="lg">
                      Place Order
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  )
}

export default Checkout