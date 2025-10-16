import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stockIssues, setStockIssues] = useState([]);
  const [form, setForm] = useState({
    deliveryAddress: "",
    notes: ""
  });

  const fetchCart = useCallback(async (customerId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/cart/${customerId}`);
      setCart(res.data);
      
      // Compute stock issues using populated product.stock
      const issues = [];
      for (const it of res.data.items) {
        // Skip validation if product is null (will be handled by backend)
        if (!it.product) {
          continue;
        }
        
        const available = typeof it.product.stock === 'number' ? it.product.stock : 0;
        const isActive = it.product.isActive !== false; // Default to true if not specified
        
        if (!isActive) {
          issues.push(`${it.product.name || 'Product'} is no longer available`);
        } else if (available <= 0) {
          issues.push(`${it.product.name || 'Product'} is out of stock`);
        } else if (it.quantity > available) {
          issues.push(`${it.product.name || 'Product'} exceeds stock: ${available} available, ${it.quantity} requested`);
        }
      }
      
      setStockIssues(issues);
      
      if (res.data.items.length === 0) {
        alert("Your cart is empty!");
        navigate("/home");
      }
    } catch (err) {
      setError("Failed to fetch cart: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Set page title
    document.title = "💳 Checkout - Management System";
    
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/");
      return;
    }
    fetchCart(user._id);
    if (user.address) setForm(prev => ({ ...prev, deliveryAddress: user.address }));
  }, [navigate, fetchCart]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.deliveryAddress.trim()) {
      alert("Please enter a delivery address");
      return;
    }
    
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/");
      return;
    }

    // Double-check stock issues before submitting
    if (stockIssues.length > 0) {
      alert("Please resolve stock issues before placing the order. Click 'Fix in Cart' to update quantities.");
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      
      console.log("Placing order with data:", {
        customerId: user._id,
        deliveryAddress: form.deliveryAddress.trim(),
        notes: form.notes.trim(),
        cartItems: cart.items.length
      });
      
      const res = await axios.post("http://localhost:5000/api/orders", {
        customerId: user._id,
        deliveryAddress: form.deliveryAddress.trim(),
        notes: form.notes.trim()
      });
      
      console.log("Order placed successfully:", res.data);
      
      if (res.data.order && res.data.order._id) {
        localStorage.setItem("lastOrderId", res.data.order._id);
        alert(`Order placed successfully! Order #${res.data.orderNumber || res.data.order._id.slice(-8).toUpperCase()}`);
        navigate("/order-history");
      } else {
        throw new Error("Invalid order response from server");
      }
    } catch (err) {
      console.error("Order placement error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Unknown error occurred";
      
      if (errorMessage.includes("stock") || errorMessage.includes("available") || errorMessage.includes("Insufficient")) {
        const shouldGoToCart = window.confirm(`Stock Error: ${errorMessage}\n\nThis usually happens when:\n• Someone else purchased the item while you were checking out\n• The product stock was updated\n\nWould you like to go to your cart to adjust quantities?\n\nClick OK to go to cart, or Cancel to stay here and refresh.`);
        
        if (shouldGoToCart) {
          navigate("/cart");
        } else {
          // Refresh cart to get latest stock info
          fetchCart(user._id);
        }
      } else if (errorMessage.includes("Cart is empty")) {
        alert("Your cart is empty. Please add items before placing an order.");
        navigate("/home");
      } else {
        alert(`Failed to place order: ${errorMessage}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading..." />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        background: "rgba(255,255,255,0.95)",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h2 style={{ margin: 0, color: "#333" }}>💳 Checkout</h2>
          <button 
            onClick={() => {
              const user = JSON.parse(localStorage.getItem("user"));
              if (user) fetchCart(user._id);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #007BFF",
              background: "#007BFF",
              color: "white",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            🔄 Refresh Cart
          </button>
        </div>
        
        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
          {stockIssues.length > 0 && (
            <div style={{
              width: '100%',
              background: '#FFF5F5',
              border: '1px solid #FED7D7',
              color: '#E53E3E',
              padding: '12px',
              borderRadius: '10px',
              marginBottom: '10px'
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>⚠️ Stock issues preventing checkout:</strong>
                <button 
                  onClick={() => navigate("/cart")}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #E53E3E",
                    background: "white",
                    color: "#E53E3E",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Fix in Cart
                </button>
              </div>
              <ul style={{ margin: '8px 0 0 18px' }}>
                {stockIssues.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
          
          {stockIssues.length === 0 && (
            <div style={{
              width: '100%',
              background: '#F0FFF4',
              border: '1px solid #68D391',
              color: '#2F855A',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '10px',
              fontSize: '14px'
            }}>
              ✅ All items are available and ready for checkout
            </div>
          )}
          
          {/* Order Summary */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>📦 Order Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {cart.items.filter(item => item.product).map(item => (
                <div key={item.product._id} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  background: "#fafafa",
                  gap: "15px"
                }}>
                  {item.product.image ? (
                    <img src={`http://localhost:5000/uploads/${item.product.image}`} alt={item.product.name} style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "10px",
                      objectFit: "cover"
                    }} />
                  ) : (
                    <div style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "10px",
                      background: "#eee",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: "24px"
                    }}>📦</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", color: "#333" }}>
                      {item.product.name || 'Product'}
                    </div>
                    <div style={{ color: "#666" }}>
                      Qty: {item.quantity} × ₹{(item.product.price || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      Stock: {typeof item.product.stock === 'number' ? item.product.stock : 'Unknown'}
                    </div>
                  </div>
                  <div style={{ fontWeight: "bold", color: "#667eea" }}>
                    ₹{((item.product.price || 0) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
              <div style={{
                marginTop: "15px",
                padding: "15px",
                borderRadius: "12px",
                background: "#f0f0f0",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "18px"
              }}>
                <span>Total:</span>
                <span>₹{cart.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>📍 Delivery Information</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <textarea
                name="deliveryAddress"
                value={form.deliveryAddress}
                onChange={handleChange}
                rows="4"
                placeholder="Enter your delivery address..."
                required
                style={inputStyle}
              />
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Special instructions (optional)..."
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => navigate("/cart")} style={secondaryBtn}>🛒 Back to Cart</button>
                <button type="submit" disabled={processing || stockIssues.length > 0} style={{ ...successBtn, cursor: (processing || stockIssues.length > 0) ? "not-allowed" : "pointer", opacity: (processing || stockIssues.length > 0) ? 0.6 : 1 }}>
                  {processing ? "⏳ Processing..." : "💳 Place Order"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

// Reusable Styles
const inputStyle = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #ccc",
  fontSize: "14px",
  resize: "vertical"
};

const secondaryBtn = {
  flex: 1,
  minWidth: "150px",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#6c757d",
  color: "#fff",
  fontWeight: "bold"
};

const successBtn = {
  flex: 1,
  minWidth: "150px",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#28a745",
  color: "#fff",
  fontWeight: "bold"
};

function LoadingScreen({ message }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f5f7fa",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ fontSize: "24px", color: "#333" }}>{message}</div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f8d7da",
      fontFamily: "Arial, sans-serif",
      color: "#721c24",
      padding: "20px",
      textAlign: "center"
    }}>
      ⚠️ {message}
    </div>
  );
}
