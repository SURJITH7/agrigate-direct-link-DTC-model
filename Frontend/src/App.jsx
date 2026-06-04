import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import Navigation from "./components/Navigation";
import { LanguageProvider } from "./i18n/LanguageProvider";
import FarmerDashboard from "./components/FarmerDashboard";
import AddProductForm from "./components/AddProductForm";
import MyProducts from "./components/MyProducts";
import EditProductForm from "./components/EditProductForm";
import FarmerOrders from "./components/FarmerOrders";
import FarmerProfile from "./components/FarmerProfile";
import LandingPage from "./components/LandingPage";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import FreshProducts from "./components/FreshProducts";
import Cart from "./components/Cart";
import { useState, useEffect, lazy, Suspense } from "react";
import ConsumerOrders from "./components/ConsumerOrders";
import ConsumerDashboard from "./components/ConsumerDashboard";
import ConsumerProfile from "./components/ConsumerProfile";
import { useAuth } from "./components/AuthContext";
import PaymentPage from "./components/PaymentPage";
import AdminLoginPage from "./components/AdminLoginPage";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./components/AdminDashboard";
import FarmerRouteGuard from "./components/FarmerRouteGuard"; // Import FarmerRouteGuard
import UserManagement from "./components/UserManagement";
import RegisterAdminPage from "./components/RegisterAdminPage";
import AdminRouteGuard from "./components/AdminRouteGuard";
import AdminProductCommissions from "./components/AdminProductCommissions";
import { useGeoLocation } from "./LocationContext";

// Lazy load map-related components to reduce initial bundle size
const LocationSender = lazy(() => import("./components/LocationSender"));
const LiveMap = lazy(() => import("./components/LiveMap"));
const MyLocationView = lazy(() => import("./components/MyLocationView"));

function CartRouteWrapper({ cart, setCart }) {
  return <Cart cart={cart} setCart={setCart} onClose={() => {}} />;
}

function App() {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const { location, error: locationError } = useGeoLocation();

  useEffect(() => {
    if (user && user.role === "consumer") {
      const cartKey = `cart_${user._id}`;
      const storedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
      setCart(storedCart);
    }
  }, [user]);

  useEffect(() => {
    if (locationError) {
      console.error("Location tracking error:", locationError);
    }
  }, [locationError]);

  // Loading fallback for map components
  const MapLoader = () => (
    <div className="d-flex justify-content-center align-items-center p-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading Map...</span>
      </div>
    </div>
  );

  return (
    <LanguageProvider>
      <div className="App">
        <Navigation cart={cart} location={location} />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register/:userType?" element={<RegisterPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/change-password"
              element={<div>Change Password Page</div>}
            />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRouteGuard />}>
              <Route element={<AdminLayout />}>
                <Route
                  index
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="register-admin" element={<RegisterAdminPage />} />
                <Route path="products" element={<MyProducts />} />
                <Route path="commissions" element={<AdminProductCommissions />} />
              </Route>
            </Route>

            {/* Farmer Routes */}
            <Route path="/farmer" element={<FarmerRouteGuard />}>
              {" "}
              {/* Wrap farmer routes */}
              <Route index element={<Navigate to="dashboard" replace />} />{" "}
              {/* Redirect /farmer to /farmer/dashboard */}
              <Route path="dashboard" element={<FarmerDashboard />} />
              <Route path="add-product" element={<AddProductForm />} />
              <Route path="my-products" element={<MyProducts />} />
              <Route path="edit-product/:id" element={<EditProductForm />} />
              <Route path="orders" element={<FarmerOrders />} />
              <Route path="profile" element={<FarmerProfile />} />
            </Route>

            {/* Consumer Routes */}
            <Route
              path="/live-track"
              element={
                <Suspense fallback={<MapLoader />}>
                  <LocationSender />
                  <LiveMap />
                </Suspense>
              }
            />
            <Route path="/consumer/dashboard" element={<ConsumerDashboard />} />
            <Route path="/products" element={<FreshProducts />} />
            <Route
              path="/map"
              element={
                <Suspense fallback={<MapLoader />}>
                  <LiveMap />
                </Suspense>
              }
            />
            <Route
              path="/my-location"
              element={
                <Suspense fallback={<MapLoader />}>
                  <MyLocationView />
                </Suspense>
              }
            />
            <Route
              path="/cart"
              element={<CartRouteWrapper cart={cart} setCart={setCart} />}
            />
            <Route path="/consumer/orders" element={<ConsumerOrders />} />
            <Route path="/consumer/profile" element={<ConsumerProfile />} />
            <Route path="/payment" element={<PaymentPage />} />
          </Routes>
        </main>
      </div>
    </LanguageProvider>
  );
}
export default App;
