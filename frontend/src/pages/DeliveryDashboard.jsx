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
    // Set page title
    document.title = "Delivery Dashboard - Management System";
    
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
      const errorMessage = err.response?.data?.error || err.message || "Unknown error occurred";
      setError(`Failed to fetch orders: ${errorMessage}`);
      console.error("Delivery orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      setError(null);
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, {
        status: newStatus
      });
      
      // Refresh orders
      const user = JSON.parse(localStorage.getItem("user"));
      await fetchOrders(user._id);
      
      setSuccessMessage(`Order status updated to: ${getStatusText(newStatus)}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error occurred";
      setError(`Failed to update order status: ${errorMessage}`);
      console.error("Order status update error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    filterStatus === "all" || order.status === filterStatus
  );

  const getOrderCount = (status) => {
    return orders.filter(order => order.status === status).length;
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

  if (loading) {
    return (
      <div style={{ 
        padding: "50px", 
        textAlign: "center", 
        fontFamily: "Arial, sans-serif" 
      }}>
        <div style={{ 
          fontSize: "24px", 
          marginBottom: "10px" 
        }}>🔄</div>
        <div style={{ 
          fontSize: "18px", 
          color: "#666" 
        }}>Loading delivery orders...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: "relative",
      minHeight: "100vh",
      padding: "20px", 
      fontFamily: "Arial, sans-serif", 
      maxWidth: "1200px", 
      margin: "0 auto",
      background: "#FFFFFF",
      overflow: "hidden"
    }}>
      {/* Grid Background */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundSize: "60px 60px",
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
        `,
        zIndex: 0,
        opacity: 0.3
      }} />
      
      <style>
        {`
          .delivery-container {
            position: relative;
            z-index: 1;
            background: #FFFFFF;
            border-radius: 20px;
            border: 1px solid #E0E0E0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            padding: 30px;
            margin: 20px;
          }
          
          .delivery-header {
            background: #F8F9FA;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #E0E0E0;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: #FFFFFF;
            border-radius: 15px;
            border: 1px solid #E0E0E0;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          
          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          }
          
          .filter-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flexWrap: wrap;
            alignItems: center;
          }
          
          .filter-btn {
            padding: 8px 15px;
            border-radius: 8px;
            border: 1px solid #E0E0E0;
            background: #FFFFFF;
            color: #333;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: bold;
          }
          
          .filter-btn:hover {
            background: #F8F9FA;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
          }
          
          .filter-btn.active {
            background: #007BFF;
            color: white;
            border-color: #007BFF;
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
          }
          
          .order-card {
            background: #FFFFFF;
            border-radius: 15px;
            border: 1px solid #E0E0E0;
            padding: 25px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          
          .order-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          }
          
          .status-badge {
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            color: white;
            display: inline-block;
            margin-bottom: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .action-buttons {
            display: flex;
            gap: 10px;
            justifyContent: flex-end;
            flexWrap: wrap;
          }
          
          .btn-primary {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            background: #007BFF;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            alignItems: center;
            gap: 8px;
          }
          
          .btn-primary:hover {
            background: #0056B3;
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
            transform: translateY(-2px);
          }
          
          .btn-success {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            background: #28A745;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            alignItems: center;
            gap: 8px;
          }
          
          .btn-success:hover {
            background: #218838;
            box-shadow: 0 4px 12px rgba(40,167,69,0.3);
            transform: translateY(-2px);
          }
          
          .btn-info {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            background: #17A2B8;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            alignItems: center;
            gap: 8px;
          }
          
          .btn-info:hover {
            background: #138496;
            box-shadow: 0 4px 12px rgba(23,162,184,0.3);
            transform: translateY(-2px);
          }
          
          .btn-whatsapp {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            background: #25D366;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            alignItems: center;
            gap: 8px;
          }
          
          .btn-whatsapp:hover {
            background: #128C7E;
            box-shadow: 0 4px 12px rgba(37,211,102,0.3);
            transform: translateY(-2px);
          }
          
          @media (max-width: 768px) {
            .delivery-container {
              margin: 10px;
              padding: 20px;
            }
            
            .stats-grid {
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            }
            
            .filter-buttons {
              flex-direction: column;
              align-items: stretch;
            }
            
            .filter-btn {
              width: 100%;
              text-align: center;
            }
            
            .action-buttons {
              flex-direction: column;
              align-items: stretch;
            }
          }
        `}
      </style>

      <div className="delivery-container">
        {/* Error Message */}
        {error && (
          <div style={{
            background: "rgba(220,53,69,0.1)",
            color: "#ff6b6b",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
            border: "1px solid rgba(220,53,69,0.3)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#ff6b6b",
                cursor: "pointer",
                fontSize: "18px",
                marginLeft: "auto"
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{
            background: "rgba(40,167,69,0.1)",
            color: "#28a745",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
            border: "1px solid rgba(40,167,69,0.3)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="delivery-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ margin: 0, color: "#333" }}>
              🚚 Delivery Dashboard
            </h2>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button 
            onClick={() => {
              const user = JSON.parse(localStorage.getItem("user"));
              fetchOrders(user._id);
            }}
            disabled={loading}
                className="btn-info"
            style={{ 
                  background: loading ? "#ccc" : "linear-gradient(135deg, #17a2b8, #138496)",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
                {loading ? "⏳ Loading..." : "🔄 Refresh"}
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/");
            }}
                className="btn-primary"
                style={{ background: "linear-gradient(135deg, #dc3545, #c82333)" }}
              >
                🚪 Logout
          </button>
            </div>
        </div>
      </div>

      {/* Order Statistics */}
        <div className="stats-grid">
          <div className="stat-card" style={{ 
            background: "linear-gradient(135deg, #667eea, #764ba2)" 
          }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#fff" }}>{orders.length}</h3>
            <p style={{ margin: "0", opacity: "0.9", color: "#fff" }}>📦 Total Orders</p>
          </div>
          <div className="stat-card" style={{ 
            background: "linear-gradient(135deg, #ffc107, #e0a800)" 
          }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#fff" }}>{getOrderCount("pending")}</h3>
            <p style={{ margin: "0", opacity: "0.9", color: "#fff" }}>⏳ Pending</p>
          </div>
          <div className="stat-card" style={{ 
            background: "linear-gradient(135deg, #17a2b8, #138496)" 
          }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#fff" }}>{getOrderCount("confirmed")}</h3>
            <p style={{ margin: "0", opacity: "0.9", color: "#fff" }}>✅ Confirmed</p>
          </div>
          <div className="stat-card" style={{ 
            background: "linear-gradient(135deg, #fd7e14, #e55a00)" 
          }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#fff" }}>{getOrderCount("preparing")}</h3>
            <p style={{ margin: "0", opacity: "0.9", color: "#fff" }}>👨‍🍳 Preparing</p>
        </div>
          <div className="stat-card" style={{ 
            background: "linear-gradient(135deg, #007bff, #0056b3)" 
          }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#fff" }}>{getOrderCount("out_for_delivery")}</h3>
            <p style={{ margin: "0", opacity: "0.9", color: "#fff" }}>🚚 Out for Delivery</p>
        </div>
          <div className="stat-card" style={{ 
            background: "linear-gradient(135deg, #28a745, #1e7e34)" 
          }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#fff" }}>{getOrderCount("delivered")}</h3>
            <p style={{ margin: "0", opacity: "0.9", color: "#fff" }}>🎉 Delivered</p>
        </div>
      </div>

        {/* Filter Section */}
        <div className="filter-buttons">
          <span style={{ fontWeight: "bold", color: "#333", fontSize: "16px" }}>Filter by status:</span>
          <button 
            onClick={() => setFilterStatus("all")}
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
          >
            All ({orders.length})
          </button>
          <button 
            onClick={() => setFilterStatus("pending")}
            className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
          >
            ⏳ Pending ({getOrderCount("pending")})
          </button>
          <button 
            onClick={() => setFilterStatus("confirmed")}
            className={`filter-btn ${filterStatus === "confirmed" ? "active" : ""}`}
          >
            ✅ Confirmed ({getOrderCount("confirmed")})
          </button>
          <button 
            onClick={() => setFilterStatus("preparing")}
            className={`filter-btn ${filterStatus === "preparing" ? "active" : ""}`}
          >
            👨‍🍳 Preparing ({getOrderCount("preparing")})
          </button>
          <button 
            onClick={() => setFilterStatus("out_for_delivery")}
            className={`filter-btn ${filterStatus === "out_for_delivery" ? "active" : ""}`}
          >
            🚚 Out for Delivery ({getOrderCount("out_for_delivery")})
          </button>
          <button 
            onClick={() => setFilterStatus("delivered")}
            className={`filter-btn ${filterStatus === "delivered" ? "active" : ""}`}
          >
            🎉 Delivered ({getOrderCount("delivered")})
          </button>
        </div>

        {orders.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "50px",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            borderRadius: "15px",
            border: "1px solid rgba(255,255,255,0.2)"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>📦</div>
            <h3 style={{ color: "#333", marginBottom: "10px" }}>No delivery orders assigned</h3>
            <p style={{ color: "#666" }}>You don't have any orders assigned for delivery yet.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "50px",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            borderRadius: "15px",
            border: "1px solid rgba(255,255,255,0.2)"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔍</div>
            <h3 style={{ color: "#333", marginBottom: "10px" }}>No orders match the current filter</h3>
            <p style={{ color: "#666" }}>Try selecting a different status filter.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {filteredOrders.map((order) => (
              <div key={order._id} className="order-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>
                      📦 Order #{order._id.slice(-8).toUpperCase()}
                    </h3>
                    <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                      📅 Created: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="status-badge" style={{ background: getStatusColor(order.status) }}>
                      {getStatusIcon(order.status)} {getStatusText(order.status)}
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#007BFF", marginBottom: "5px" }}>
                      💰 ₹{order.totalAmount.toFixed(2)}
                    </div>
                    {order.estimatedDelivery && (
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        ⏰ Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>👤 Customer Information</h4>
                    <div style={{ 
                      background: "rgba(255,255,255,0.05)", 
                      padding: "15px", 
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)"
                    }}>
                      <div style={{ color: "#333", marginBottom: "5px" }}><strong>Name:</strong> {order.customer.name}</div>
                      <div style={{ color: "#333", marginBottom: "5px" }}><strong>Email:</strong> {order.customer.email}</div>
                      {order.customer.phone && <div style={{ color: "#333" }}><strong>Phone:</strong> {order.customer.phone}</div>}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>📍 Delivery Address</h4>
                    <div style={{ 
                      background: "#F8F9FA", 
                      padding: "15px", 
                      borderRadius: "10px",
                      border: "1px solid #E0E0E0",
                      color: "#333"
                    }}>
                      {order.deliveryAddress}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>🛍️ Order Items</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {order.items.map((item, index) => (
                      <div 
                        key={index}
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          padding: "10px", 
                          background: "#F8F9FA", 
                          borderRadius: "8px",
                          border: "1px solid #E0E0E0",
                          minWidth: "200px"
                        }}
                      >
                        {item.product && item.product.image && (
                          <img 
                            src={`http://localhost:5000/uploads/${item.product.image}`} 
                            alt={item.product?.name || 'Product'}
                            style={{ 
                              width: "40px", 
                              height: "40px", 
                              objectFit: "cover", 
                              borderRadius: "5px",
                              marginRight: "10px",
                              boxShadow: "0 0 10px rgba(255,255,255,0.1)"
                            }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>{item.product?.name || 'Product removed'}</div>
                          <div style={{ color: "#666", fontSize: "12px" }}>
                            Qty: {item.quantity} × ₹{item.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>📝 Special Instructions</h4>
                    <div style={{ 
                      background: "#FFFBF0", 
                      padding: "15px", 
                      borderRadius: "10px", 
                      border: "1px solid #FED7AA",
                      color: "#C05621"
                    }}>
                      {order.notes}
                    </div>
                  </div>
                )}

                <div className="action-buttons">
                  {getNextStatus(order.status) && (
                    <button 
                      onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                      disabled={updating}
                      className="btn-primary"
                      style={{ 
                        background: updating ? "#ccc" : getStatusColor(getNextStatus(order.status)),
                        cursor: updating ? "not-allowed" : "pointer"
                      }}
                    >
                      {updating ? "⏳ Updating..." : `${getStatusIcon(getNextStatus(order.status))} ${getNextStatusText(order.status)}`}
                    </button>
                  )}
                  
                  {order.customer.phone && (
                    <button 
                      onClick={() => {
                        window.open(`tel:${order.customer.phone}`);
                      }}
                      className="btn-info"
                    >
                      📞 Call Customer
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      const message = `Hi ${order.customer.name}, this is your delivery person. I'm on my way with your order #${order._id.slice(-8).toUpperCase()}. ETA: ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleTimeString() : 'Soon'}`;
                      const encodedMessage = encodeURIComponent(message);
                      window.open(`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
                    }}
                    className="btn-whatsapp"
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
