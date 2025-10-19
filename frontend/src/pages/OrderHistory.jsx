import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Order History";
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/");
      return;
    }
    fetchOrders(user._id);
  }, [navigate]);

  const fetchOrders = async (customerId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/orders/customer/${customerId}`);
      setOrders(res.data);
    } catch (err) {
      setError("Failed to fetch orders: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 🔴 Cancel Order function - Restores inventory automatically
  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?\n")) return;

    try {
      const response = await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: "cancelled" } : o
        )
      );
      
      // Refresh orders to get updated data
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) fetchOrders(user._id);
    } catch (err) {
      alert("Failed to cancel order: " + (err.response?.data?.error || err.message));
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

  const viewOrderDetails = (orderId) => {
    localStorage.setItem("lastOrderId", orderId);
    navigate("/order-confirmation");
  };

  if (loading) return <LoadingScreen message="Loading your orders..." />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div style={{ minHeight: "100vh", padding: "40px", background: "#f3f3f3", fontFamily: "'Arial', sans-serif" }}>
      
      {/* Header */}
      <div style={{ maxWidth: "1100px", margin: "0 auto 40px auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#111", margin: 0 }}>📋 Your Orders</h1>
        <button onClick={() => navigate("/home")} style={amazonPrimaryBtn}>🏠 Back to Home</button>
      </div>

      {/* Orders List */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        {orders.length === 0 ? (
          <div style={emptyOrderStyle}>
            <div style={{ fontSize: "60px", marginBottom: "15px" }}>📦</div>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#111" }}>No orders yet</h3>
            <p style={{ color: "#555" }}>Browse products and place your first order!</p>
          </div>
        ) : orders.map(order => (
          <div key={order._id} style={orderCardStyle}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 5px 0" }}>📦 #{order._id.slice(-8).toUpperCase()}</h2>
                <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>📅 {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{
                  padding: "5px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#fff",
                  background: getStatusColor(order.status),
                  display: "inline-block",
                  marginBottom: "5px"
                }}>
                  {getStatusText(order.status)}
                </span>
                <div style={{ fontWeight: "bold", fontSize: "16px", color: "#111" }}>💰 ₹{order.totalAmount.toFixed(2)}</div>
              </div>
            </div>

            {/* Items */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
              {order.items.map((item, i) => (
                <div key={i} style={orderItemStyle}>
                  {item.product && item.product.image ? (
                    <img src={`http://localhost:5000/uploads/${item.product.image}`} alt={item.product.name} style={orderItemImageStyle} />
                  ) : <div style={orderItemPlaceholderStyle}>{item.product ? "📦" : "❌"}</div>}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: "500", color: "#111" }}>
                      {item.product ? item.product.name : "Product removed"} ×{item.quantity}
                      {!item.product && <span style={{ color: "#d32f2f", fontSize: "12px", marginLeft: "6px" }}> - Not available</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px", flexWrap: "wrap" }}>
              <button onClick={() => viewOrderDetails(order._id)} style={amazonSecondaryBtn}>👁️ View Details</button>

              {/* 🔴 Show cancel btn only if not delivered or cancelled */}
              {["pending", "confirmed", "preparing"].includes(order.status) && (
                <button onClick={() => cancelOrder(order._id)} style={amazonCancelBtn}>❌ Cancel Order</button>
              )}

              {order.status === "delivered" && (
                <button onClick={() => alert("Reorder coming soon!")} style={amazonReorderBtn}>🔄 Reorder</button>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

// Styles
const amazonPrimaryBtn = {
  background: "#ff9900",
  color: "#111",
  border: "none",
  padding: "10px 18px",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer"
};

const amazonSecondaryBtn = {
  background: "#0073bb",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.2s ease"
};

const amazonReorderBtn = {
  background: "#28a745",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.2s ease"
};

// 🔴 New Cancel Button style
const amazonCancelBtn = {
  background: "#d32f2f",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.2s ease"
};

const orderCardStyle = {
  background: "#fff",
  borderRadius: "8px",
  padding: "20px",
  border: "1px solid #e0e0e0",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  transition: "all 0.2s ease"
};

const orderItemStyle = {
  display: "flex",
  alignItems: "center",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #e0e0e0",
  background: "#f9f9f9",
  gap: "10px",
  minWidth: "200px",
  flex: "1"
};

const orderItemImageStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "4px",
  objectFit: "cover"
};

const orderItemPlaceholderStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "4px",
  background: "#e0e0e0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px"
};

const emptyOrderStyle = {
  textAlign: "center",
  padding: "50px",
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e0e0e0"
};

function LoadingScreen({ message }) {
  return (
    <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px", color: "#555" }}>
      {message}
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", color: "#d32f2f" }}>
      ⚠️ {message}
    </div>
  );
}
