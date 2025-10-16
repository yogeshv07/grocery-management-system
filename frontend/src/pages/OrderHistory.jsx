import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set page title
    document.title = "📋 Order History - Management System";
    
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

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', sans-serif", background: "#F8F9FA" }}>
      <div style={{ textAlign: "center", padding: "20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔄</div>
        <h2 style={{ color: "#333" }}>Loading order history...</h2>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', sans-serif", background: "#F8F9FA" }}>
      <div style={{ textAlign: "center", padding: "20px", background: "#FFE5E5", borderRadius: "12px", border: "1px solid #FFCCCC" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
        <h2 style={{ color: "#E53E3E" }}>{error}</h2>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", padding: "40px", fontFamily: "'Inter', sans-serif", background: "#F8F9FA" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1000px", margin: "0 auto 40px auto" }}>
        <h1 style={{ fontSize: "36px", color: "#333", margin: 0 }}>📋 Order History</h1>
        <button
          onClick={() => navigate("/home")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "1px solid #007BFF",
            background: "#007BFF",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          🏠 Back to Home
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1000px", margin: "0 auto" }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E0E0E0" }}>
            <div style={{ fontSize: "60px", marginBottom: "20px" }}>📦</div>
            <h3 style={{ color: "#333" }}>No orders yet</h3>
            <p style={{ color: "#666" }}>Start shopping to place your first order!</p>
          </div>
        ) : orders.map(order => (
          <div key={order._id} style={{ background: "#FFFFFF", borderRadius: "12px", padding: "20px", border: "1px solid #E0E0E0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", transition: "all 0.3s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ color: "#333", margin: "0 0 5px 0" }}>📦 #{order._id.slice(-8).toUpperCase()}</h2>
                <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>📅 {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{
                  padding: "6px 12px",
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
                <div style={{ color: "#007BFF", fontWeight: "bold", fontSize: "18px" }}>💰 ₹{order.totalAmount.toFixed(2)}</div>
              </div>
            </div>

            {/* Items */}
            <div style={{ marginTop: "15px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px", background: "#F8F9FA", borderRadius: "8px", border: "1px solid #E0E0E0" }}>
                  {item.product && item.product.image ? (
                    <img src={`http://localhost:5000/uploads/${item.product.image}`} alt={item.product?.name || 'Product'} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", marginRight: "10px" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", marginRight: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "#E0E0E0", fontSize: "18px" }}>
                      {item.product ? "📦" : "❌"}
                    </div>
                  )}
                  <span style={{ color: "#333", fontWeight: "500" }}>
                    {item.product ? item.product.name : 'Product removed'} (×{item.quantity})
                    {!item.product && (
                      <span style={{ color: "#dc3545", fontSize: "12px", marginLeft: "8px" }}>
                        - Item no longer available
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap", marginTop: "15px" }}>
              <button
                onClick={() => viewOrderDetails(order._id)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#007BFF",
                  color: "#fff",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#0056B3"}
                onMouseLeave={e => e.currentTarget.style.background = "#007BFF"}
              >
                👁️ View Details
              </button>
              {order.status === "delivered" && (
                <button
                  onClick={() => alert("Reorder coming soon!")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#28a745",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#218838"}
                  onMouseLeave={e => e.currentTarget.style.background = "#28a745"}
                >
                  🔄 Reorder
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
