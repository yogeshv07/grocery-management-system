import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Your Orders - Grocery Store";
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
      const res = await axios.get(`http://localhost:5000/api/orders/customer/${customerId}`);
      setOrders(res.data);
    } catch (err) {
      setError("Failed to fetch orders: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`);
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
      case "confirmed": return "Confirmed";
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

  const downloadInvoice = async (orderId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/invoice/${orderId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert("Failed to download invoice: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <LoadingScreen message="Fetching your orders..." />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div style={pageContainer}>
      <div style={headerBar}>
        <h1 style={pageTitle}>Your Orders</h1>
        <button onClick={() => navigate("/home")} style={primaryBtn}>🏠 Back to Home</button>
      </div>

      {orders.length === 0 ? (
        <div style={emptyOrderStyle}>
          <div style={{ fontSize: "60px", marginBottom: "15px" }}>📦</div>
          <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#111" }}>No orders yet</h3>
          <p style={{ color: "#555" }}>Browse our products and place your first order!</p>
        </div>
      ) : (
        <div style={ordersContainer}>
          {orders.map((order) => (
            <div key={order._id} style={orderCard}>
              <div style={orderHeader}>
                <div>
                  <h2 style={orderIdText}>Order #{order._id.slice(-8).toUpperCase()}</h2>
                  <p style={orderDate}>📅 {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    ...statusBadge,
                    background: getStatusColor(order.status)
                  }}>
                    {getStatusText(order.status)}
                  </span>
                  <div style={orderAmount}>💰 ₹{order.totalAmount.toFixed(2)}</div>
                </div>
              </div>

              <div style={itemContainer}>
                {order.items.map((item, i) => (
                  <div key={i} style={orderItem}>
                    {item.product?.image ? (
                      <img src={`http://localhost:5000/uploads/${item.product.image}`} alt={item.product.name} style={itemImg} />
                    ) : (
                      <div style={itemPlaceholder}>📦</div>
                    )}
                    <div>
                      <span style={itemName}>{item.product?.name || "Removed Product"}</span>
                      <p style={itemQty}>Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={btnGroup}>
                <button onClick={() => viewOrderDetails(order._id)} style={secondaryBtn}>👁️ View Details</button>
                {["pending", "confirmed", "preparing"].includes(order.status) && (
                  <button onClick={() => cancelOrder(order._id)} style={cancelBtn}>❌ Cancel Order</button>
                )}
                {order.status === "delivered" && (
                  <button onClick={() => downloadInvoice(order._id)} style={primaryBtn}>⬇️ Save Invoice</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ Amazon-like UI Styles
const pageContainer = {
  minHeight: "100vh",
  padding: "40px",
  background: "linear-gradient(180deg, #f8f8f8, #ffffff)",
  fontFamily: "'Amazon Ember', Arial, sans-serif",
};

const headerBar = {
  maxWidth: "1100px",
  margin: "0 auto 40px auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
};

const pageTitle = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#232f3e",
  margin: 0,
};

const ordersContainer = {
  maxWidth: "1100px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const orderCard = {
  background: "#fff",
  borderRadius: "10px",
  padding: "20px",
  border: "1px solid #ddd",
  boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};
orderCard[':hover'] = {
  transform: "translateY(-2px)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const orderHeader = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "10px",
};

const orderIdText = { fontSize: "18px", fontWeight: "600", color: "#111", marginBottom: "5px" };
const orderDate = { fontSize: "13px", color: "#555", margin: 0 };
const orderAmount = { fontWeight: "bold", fontSize: "16px", color: "#111" };

const statusBadge = {
  padding: "6px 12px",
  borderRadius: "16px",
  fontSize: "12px",
  fontWeight: "bold",
  color: "#fff",
  display: "inline-block",
  marginBottom: "5px",
};

const itemContainer = { display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "15px" };
const orderItem = {
  display: "flex",
  alignItems: "center",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #e0e0e0",
  background: "#fafafa",
  gap: "10px",
  minWidth: "200px",
  flex: "1",
};
const itemImg = { width: "50px", height: "50px", borderRadius: "4px", objectFit: "cover" };
const itemPlaceholder = { width: "50px", height: "50px", borderRadius: "4px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" };
const itemName = { fontWeight: "500", color: "#111" };
const itemQty = { fontSize: "12px", color: "#555", margin: 0 };

const btnGroup = { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "15px", flexWrap: "wrap" };
const primaryBtn = { background: "#ffa41c", color: "#111", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" };
const secondaryBtn = { background: "#007185", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const cancelBtn = { background: "#d32f2f", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };

const emptyOrderStyle = { textAlign: "center", padding: "50px", background: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0" };

function LoadingScreen({ message }) {
  return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px", color: "#555" }}>{message}</div>;
}

function ErrorScreen({ message }) {
  return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", color: "#d32f2f" }}>⚠️ {message}</div>;
}
