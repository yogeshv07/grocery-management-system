import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set page title
    document.title = "✅ Order Confirmation - Management System";
    
    const orderId = localStorage.getItem("lastOrderId");
    if (!orderId) {
      navigate("/home");
      return;
    }
    fetchOrder(orderId);
  }, [navigate]);

  const fetchOrder = async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      setError("Failed to fetch order: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#ffc107";
      case "confirmed": return "#17a2b8";
      case "preparing": return "#fd7e14";
      case "out_for_delivery": return "#007bff";
      case "delivered": return "#28a745";
      case "cancelled": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Order Received";
      case "confirmed": return "Order Confirmed";
      case "preparing": return "Preparing Your Order";
      case "out_for_delivery": return "Out for Delivery";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  if (loading) return <LoadingScreen message="Loading order details..." />;
  if (error) return <ErrorScreen message={error} />;
  if (!order) return <ErrorScreen message="Order not found" warning />;

  return (
    <div style={{
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      background: "#f5f7fa"
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)"
      }}>
        {/* Success Header */}
        <div style={{
          textAlign: "center",
          padding: "20px",
          borderRadius: "15px",
          background: "#28a74520",
          marginBottom: "30px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
          <h1 style={{ margin: 0, color: "#28a745" }}>Order Confirmed!</h1>
          <p style={{ color: "#555" }}>Thank you for your order. We'll start preparing it right away.</p>
        </div>

        {/* Order Details */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
            <h2 style={{ margin: 0 }}>📋 Order Details</h2>
            <span style={{
              ...statusBadge,
              backgroundColor: getStatusColor(order.status)
            }}>
              {getStatusText(order.status)}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div><strong>🆔 Order ID:</strong> #{order._id.slice(-8).toUpperCase()}</div>
            <div><strong>📅 Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</div>
            <div><strong>💰 Total Amount:</strong> ₹{order.totalAmount.toFixed(2)}</div>
            <div><strong>📍 Delivery Address:</strong> {order.deliveryAddress}</div>
          </div>
          {order.notes && <p><strong>📝 Special Instructions:</strong> {order.notes}</p>}
        </div>

        {/* Order Items */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px" }}>🛍️ Order Items</h3>
          {order.items.map(item => (
            <div key={item.product._id} style={itemCardStyle}>
              <img src={item.product.image ? `http://localhost:5000/uploads/${item.product.image}` : undefined} 
                   alt={item.product.name} 
                   style={item.product.image ? itemImageStyle : placeholderStyle} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>{item.product.name}</div>
                <div style={{ color: "#666", fontSize: "14px" }}>{item.product.description || "No description"}</div>
                <div style={{ color: "#666", fontSize: "14px" }}>Qty: {item.quantity} × ₹{item.price.toFixed(2)}</div>
              </div>
              <div style={{ fontWeight: "bold", color: "#667eea", fontSize: "16px" }}>
                ₹{(item.quantity * item.price).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div style={cardStyle}>
          <h3>🚀 What's Next?</h3>
          <ul>
            <li>📧 We'll send updates via email</li>
            <li>📋 Track your order in order history</li>
            <li>⏰ Estimated delivery time will be provided</li>
            <li>📞 Contact us for questions</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/customer/dashboard")} style={primaryBtn}>🛍️ Continue Shopping</button>
          <button onClick={() => navigate("/order-history")} style={successBtn}>📋 View Order History</button>
        </div>
      </div>
    </div>
  );
}

// Reusable styles
const cardStyle = {
  padding: "20px",
  marginBottom: "20px",
  borderRadius: "12px",
  background: "#f8f9fa",
  boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
};

const statusBadge = {
  padding: "6px 14px",
  borderRadius: "20px",
  fontSize: "14px",
  color: "#fff",
  fontWeight: "bold",
  display: "inline-block"
};

const itemCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  padding: "12px",
  borderRadius: "12px",
  background: "#fff",
  marginBottom: "10px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
};

const itemImageStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "10px",
  objectFit: "cover"
};

const placeholderStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "10px",
  background: "#ddd",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "24px"
};

const primaryBtn = {
  padding: "12px 24px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#667eea",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer"
};

const successBtn = {
  padding: "12px 24px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#28a745",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer"
};

// Loading & Error screens
function LoadingScreen({ message }) {
  return <CenteredScreen bg="#f5f7fa" text={message} icon="🔄" />;
}

function ErrorScreen({ message, warning }) {
  return <CenteredScreen bg={warning ? "#fff3cd" : "#f8d7da"} text={message} icon={warning ? "❓" : "⚠️"} color={warning ? "#856404" : "#721c24"} />;
}

function CenteredScreen({ bg, text, icon, color = "#333" }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: bg,
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        textAlign: "center",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>{icon}</div>
        <h2 style={{ color }}>{text}</h2>
      </div>
    </div>
  );
}
