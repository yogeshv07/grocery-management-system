import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderHistory from "./pages/OrderHistory";

// Protected route component
function PrivateRoute({ children, allowedRoles }) {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return <Navigate to="/login" />;
  
  const user = JSON.parse(storedUser);
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Front page */}
        <Route path="/" element={<Home />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Routes */}
        <Route
          path="/customer/dashboard"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/home"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/product/:productId"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <ProductDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <Cart />
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <Checkout />
            </PrivateRoute>
          }
        />
        <Route
          path="/order-confirmation"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <OrderConfirmation />
            </PrivateRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <OrderHistory />
            </PrivateRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Delivery Routes */}
        <Route
          path="/delivery/dashboard"
          element={
            <PrivateRoute allowedRoles={["delivery"]}>
              <DeliveryDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
