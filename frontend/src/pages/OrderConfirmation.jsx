import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Order Confirmation";
    const orderId = localStorage.getItem("lastOrderId");
    if (!orderId) navigate("/home");
    else fetchOrder(orderId);
  }, [navigate]);

  const fetchOrder = async (orderId) => {
    try {
      setLoading(true);
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
      case "pending": return "#ff9900";
      case "confirmed": return "#0073bb";
      case "preparing": return "#ff9900";
      case "out_for_delivery": return "#0073bb";
      case "delivered": return "#007a33";
      case "cancelled": return "#d32f2f";
      default: return "#6c757d";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Order Received";
      case "confirmed": return "Order Confirmed";
      case "preparing": return "Preparing";
      case "out_for_delivery": return "Out for Delivery";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  if (loading) return <Screen message="Loading order details..." icon="🔄" />;
  if (error) return <Screen message={error} icon="⚠️" color="#d32f2f" />;
  if (!order) return <Screen message="Order not found" icon="❌" color="#d32f2f" />;

  return (
    <div style={{ minHeight: "100vh", padding: "30px", fontFamily: "'Arial', sans-serif", background: "#f3f3f3" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Success Header */}
        <div style={{ textAlign: "center", padding: "20px", borderRadius: "12px", background: "#dff0d8", color: "#28a745" }}>
          <div style={{ fontSize: "48px" }}>✅</div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase. Your order is being prepared.</p>
        </div>

        {/* Order Summary */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
            <h2 style={{ margin: 0 }}>📋 Order Summary</h2>
            <span style={{ ...statusBadge, backgroundColor: getStatusColor(order.status) }}>
              {getStatusText(order.status)}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div><strong>🆔 Order ID:</strong> #{order._id.slice(-8).toUpperCase()}</div>
            <div><strong>📅 Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</div>
            <div><strong>💰 Total:</strong> ₹{order.totalAmount.toFixed(2)}</div>
            <div><strong>📍 Delivery:</strong> {order.deliveryAddress}</div>
          </div>
          {order.notes && <p><strong>📝 Instructions:</strong> {order.notes}</p>}
        </div>

        {/* Order Items */}
        <div style={cardStyle}>
          <h3>🛍️ Items</h3>
          {order.items.map((item, idx) => (
            <div key={idx} style={itemCardStyle}>
              <img
                src={item.product?.image ? `http://localhost:5000/uploads/${item.product.image}` : undefined}
                alt={item.product?.name || 'Product'}
                style={item.product?.image ? itemImageStyle : placeholderStyle}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>{item.product?.name || 'Removed Product'}</div>
                {item.product?.description && <div style={{ fontSize: "14px", color: "#555" }}>{item.product.description}</div>}
                <div style={{ fontSize: "14px", color: "#555" }}>Qty: {item.quantity} × ₹{item.price.toFixed(2)}</div>
              </div>
              <div style={{ fontWeight: "bold", color: "#0073bb", fontSize: "16px" }}>
                ₹{(item.quantity * item.price).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div style={cardStyle}>
          <h3>🚀 What's Next?</h3>
          <ul style={{ paddingLeft: "20px", color: "#555" }}>
            <li>📧 Updates via email</li>
            <li>📋 Track your order in order history</li>
            <li>⏰ Estimated delivery time</li>
            <li>📞 Contact support for questions</li>
          </ul>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/home")} style={primaryBtn}>🛍️ Continue Shopping</button>
          <button onClick={() => navigate("/order-history")} style={successBtn}>📋 View Order History</button>
        </div>
      </div>
    </div>
  );
}

// Styles
const cardStyle = {
  padding: "20px",
  borderRadius: "12px",
  background: "#fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const statusBadge = {
  padding: "6px 14px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: "bold",
  color: "#fff",
  display: "inline-block"
};

const itemCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  borderRadius: "12px",
  background: "#f9f9f9",
  marginBottom: "10px"
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
  borderRadius: "8px",
  border: "none",
  background: "#ff9900",
  color: "#111",
  fontWeight: "bold",
  cursor: "pointer"
};

const successBtn = {
  padding: "12px 24px",
  borderRadius: "8px",
  border: "none",
  background: "#0073bb",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer"
};

// Loading & Error
function Screen({ message, icon, color = "#333" }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Arial', sans-serif",
      background: "#f3f3f3",
      color
    }}>
      <div style={{ textAlign: "center", padding: "30px", borderRadius: "12px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "48px", marginBottom: "15px" }}>{icon}</div>
        <h2>{message}</h2>
      </div>
    </div>
  );
}
