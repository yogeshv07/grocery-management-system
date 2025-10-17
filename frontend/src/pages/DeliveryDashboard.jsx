import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    document.title = "Delivery Panel";

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "delivery") {
      navigate("/");
      return;
    }
    fetchOrders(user._id);
  }, [navigate]);

  const fetchOrders = async (deliveryPersonId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");
      const res = await axios.get(`http://localhost:5000/api/orders/delivery/${deliveryPersonId}`);
      setOrders(res.data);
    } catch (err) {
      setError(`Failed to fetch orders: ${err.response?.data?.error || err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      setError(null);
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus });
      const user = JSON.parse(localStorage.getItem("user"));
      await fetchOrders(user._id);
      setSuccessMessage(`Order status updated to: ${getStatusText(newStatus)}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(`Failed to update order status: ${err.response?.data?.error || err.message || "Unknown error"}`);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => filterStatus === "all" || order.status === filterStatus);
  const getOrderCount = (status) => orders.filter(order => order.status === status).length;

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#ff9900";
      case "confirmed": return "#0073bb";
      case "preparing": return "#f0ad4e";
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

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "pending": return "confirmed";
      case "confirmed": return "preparing";
      case "preparing": return "out_for_delivery";
      case "out_for_delivery": return "delivered";
      default: return null;
    }
  };

  const getNextStatusText = (currentStatus) => {
    switch (currentStatus) {
      case "pending": return "Confirm Order";
      case "confirmed": return "Start Preparing";
      case "preparing": return "Start Delivery";
      case "out_for_delivery": return "Mark as Delivered";
      default: return null;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return "⏳";
      case "confirmed": return "✅";
      case "preparing": return "👨‍🍳";
      case "out_for_delivery": return "🚚";
      case "delivered": return "🎉";
      case "cancelled": return "❌";
      default: return "📦";
    }
  };

  if (loading) return (
    <div style={{ padding: 50, textAlign: "center" }}>
      <div style={{ fontSize: 24 }}>🔄</div>
      <div style={{ fontSize: 18, color: "#666" }}>Loading delivery orders...</div>
    </div>
  );

  return (
    <div style={{ background: "#f7f7f7", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, color: "#111" }}>🚚 Delivery Dashboard</h1>
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={() => fetchOrders(JSON.parse(localStorage.getItem("user"))._id)}
              className="amazon-btn amazon-btn-blue"
              disabled={loading}
            >🔄 Refresh</button>
            <button 
              onClick={() => {
                localStorage.removeItem("user");
                navigate("/");
              }}
              className="amazon-btn amazon-btn-red"
            >🚪 Logout</button>
          </div>
        </div>

        {/* Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 15, marginBottom: 25 }}>
          <div className="stat-card amazon-gradient-blue">
            <h3>{orders.length}</h3>
            <p>📦 Total Orders</p>
          </div>
          {["pending","confirmed","preparing","out_for_delivery","delivered"].map(status => (
            <div key={status} className={`stat-card amazon-gradient-${status}`}>
              <h3>{getOrderCount(status)}</h3>
              <p>{getStatusIcon(status)} {getStatusText(status)}</p>
            </div>
          ))}
        </div>

        {/* Filter Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {["all","pending","confirmed","preparing","out_for_delivery","delivered"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`amazon-filter-btn ${filterStatus === status ? "active" : ""}`}
            >
              {status === "all" ? `All (${orders.length})` : `${getStatusIcon(status)} ${getStatusText(status)} (${getOrderCount(status)})`}
            </button>
          ))}
        </div>

        {/* Orders */}
        {filteredOrders.length === 0 ? (
          <div className="no-orders">No orders match the current filter</div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {filteredOrders.map(order => (
              <div key={order._id} className="order-card">
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3>📦 Order #{order._id.slice(-8).toUpperCase()}</h3>
                    <p>📅 {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="status-badge" style={{ background: getStatusColor(order.status) }}>
                      {getStatusIcon(order.status)} {getStatusText(order.status)}
                    </div>
                    <div style={{ fontWeight: "bold", fontSize: 18, color: "#0073bb" }}>💰 ₹{order.totalAmount.toFixed(2)}</div>
                  </div>
                </div>

                {/* Customer & Address */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginTop: 15 }}>
                  <div className="info-card">
                    <h4>👤 Customer Info</h4>
                    <p><strong>Name:</strong> {order.customer.name}</p>
                    <p><strong>Email:</strong> {order.customer.email}</p>
                  </div>
                  <div className="info-card">
                    <h4>📍 Delivery Address</h4>
                    <p>{order.deliveryAddress}</p>
                  </div>
                </div>

                {/* Items */}
                <div style={{ marginTop: 15 }}>
                  <h4>🛍️ Order Items</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {order.items.map((item, i) => (
                      <div key={i} className="item-card">
                        {item.product?.image && <img src={`http://localhost:5000/uploads/${item.product.image}`} alt={item.product?.name} />}
                        <div>
                          <p><strong>{item.product?.name || 'Removed'}</strong></p>
                          <p>Qty: {item.quantity} × ₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <div style={{ marginTop: 15 }}>
                  {getNextStatus(order.status) && (
                    <button 
                      onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                      disabled={updating}
                      className="amazon-btn amazon-btn-blue"
                    >
                      {getNextStatusText(order.status)}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        .amazon-btn { padding: 10px 20px; border-radius: 6px; font-weight: 600; border: none; cursor: pointer; transition: 0.3s; }
        .amazon-btn:hover { opacity: 0.85; }
        .amazon-btn-blue { background: #0073bb; color: #fff; }
        .amazon-btn-red { background: #dc3545; color: #fff; }

        .alert { padding: 12px 18px; border-radius: 5px; margin-bottom: 15px; font-weight: 500; }
        .alert-error { background: #f8d7da; color: #721c24; }
        .alert-success { background: #d4edda; color: #155724; }

        .stat-card { padding: 22px; border-radius: 10px; color: #fff; text-align: center; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .amazon-gradient-blue { background: linear-gradient(135deg,#667eea,#764ba2); }
        .amazon-gradient-pending { background: linear-gradient(135deg,#ffc107,#e0a800); }
        .amazon-gradient-confirmed { background: linear-gradient(135deg,#17a2b8,#138496); }
        .amazon-gradient-preparing { background: linear-gradient(135deg,#fd7e14,#e55a00); }
        .amazon-gradient-out_for_delivery { background: linear-gradient(135deg,#007bff,#0056b3); }
        .amazon-gradient-delivered { background: linear-gradient(135deg,#28a745,#1e7e34); }

        .amazon-filter-btn { padding: 8px 15px; border-radius: 5px; border: 1px solid #ccc; background: #fff; cursor: pointer; transition: 0.3s; }
        .amazon-filter-btn.active { background: #0073bb; color: #fff; border-color: #0073bb; }

        .order-card { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 3px 12px rgba(0,0,0,0.08); }
        .status-badge { padding: 5px 14px; border-radius: 12px; font-weight: 600; color: #fff; display: inline-block; margin-bottom: 5px; }
        .info-card { background: #f8f9fa; padding: 14px; border-radius: 8px; border: 1px solid #e0e0e0; }
        .item-card { display: flex; align-items: center; gap: 12px; background: #f8f9fa; padding: 10px; border-radius: 6px; border: 1px solid #e0e0e0; min-width: 200px; }
        .item-card img { width: 50px; height: 50px; border-radius: 6px; object-fit: cover; }
        .no-orders { text-align: center; padding: 50px; font-size: 18px; color: #555; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
}
