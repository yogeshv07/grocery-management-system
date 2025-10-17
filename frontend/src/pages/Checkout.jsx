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
      
      const issues = [];
      for (const it of res.data.items) {
        if (!it.product) continue;
        const available = typeof it.product.stock === 'number' ? it.product.stock : 0;
        const isActive = it.product.isActive !== false;
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
    document.title = "Checkout";
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
    if (stockIssues.length > 0) {
      alert("Please resolve stock issues before placing the order.");
      return;
    }
    try {
      setProcessing(true);
      setError(null);
      const res = await axios.post("http://localhost:5000/api/orders", {
        customerId: user._id,
        deliveryAddress: form.deliveryAddress.trim(),
        notes: form.notes.trim()
      });
      if (res.data.order && res.data.order._id) {
        localStorage.setItem("lastOrderId", res.data.order._id);
        alert(`Order placed successfully! Order #${res.data.orderNumber || res.data.order._id.slice(-8).toUpperCase()}`);
        navigate("/order-history");
      } else {
        throw new Error("Invalid order response from server");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error occurred";
      if (errorMessage.includes("stock") || errorMessage.includes("available") || errorMessage.includes("Insufficient")) {
        if (window.confirm(`Stock Error: ${errorMessage}\nGo to cart to adjust quantities?`)) navigate("/cart");
        else fetchCart(user._id);
      } else if (errorMessage.includes("Cart is empty")) {
        alert("Your cart is empty.");
        navigate("/home");
      } else alert(`Failed to place order: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading..." />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f3f3", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", gap: "20px", flexWrap: "wrap" }}>
        
        {/* Order Summary */}
        <div style={{ flex: 2, minWidth: "320px", background: "#fff", borderRadius: "6px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "15px" }}>🛒 Order Summary</h2>
          {cart.items.filter(i => i.product).map(item => (
            <div key={item.product._id} style={{ display: "flex", alignItems: "center", gap: "15px", borderBottom: "1px solid #ddd", padding: "10px 0" }}>
              {item.product.image ? (
                <img src={`http://localhost:5000/uploads/${item.product.image}`} alt={item.product.name} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
              ) : <div style={{ width: "60px", height: "60px", background: "#eee", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px" }}>📦</div>}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{item.product.name}</div>
                <div style={{ fontSize: "12px", color: "#555" }}>Qty: {item.quantity} × ₹{item.product.price?.toFixed(2)}</div>
              </div>
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>₹{(item.product.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #ddd", display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
            <span>Total:</span>
            <span>₹{cart.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Form */}
        <div style={{ flex: 1, minWidth: "300px", background: "#fff", borderRadius: "6px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "15px" }}>📍 Delivery Information</h2>
          {stockIssues.length > 0 && (
            <div style={{ background: "#fff3cd", color: "#856404", padding: "10px", borderRadius: "4px", marginBottom: "10px" }}>
              ⚠️ Stock issues detected
              <ul style={{ paddingLeft: "16px" }}>{stockIssues.map((msg, idx) => <li key={idx}>{msg}</li>)}</ul>
              <button onClick={() => navigate("/cart")} style={{ marginTop: "5px", background: "#f0ad4e", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" }}>Fix in Cart</button>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <textarea name="deliveryAddress" value={form.deliveryAddress} onChange={handleChange} rows="4" placeholder="Delivery address" style={amazonInputStyle} required />
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" placeholder="Special instructions (optional)" style={amazonInputStyle} />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => navigate("/cart")} style={amazonSecondaryBtn}>Back to Cart</button>
              <button type="submit" disabled={processing || stockIssues.length > 0} style={{ ...amazonPrimaryBtn, cursor: (processing || stockIssues.length > 0) ? "not-allowed" : "pointer" }}>
                {processing ? "⏳ Processing..." : "Place Order"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

// Amazon-style input/buttons
const amazonInputStyle = {
  padding: "10px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  fontSize: "14px",
  resize: "vertical"
};
const amazonPrimaryBtn = {
  flex: 1,
  background: "#ff9900",
  color: "#111",
  border: "none",
  padding: "10px",
  borderRadius: "4px",
  fontWeight: "bold"
};
const amazonSecondaryBtn = {
  flex: 1,
  background: "#e7e7e7",
  color: "#111",
  border: "none",
  padding: "10px",
  borderRadius: "4px",
  fontWeight: "bold"
};

function LoadingScreen({ message }) {
  return <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px", color: "#555" }}>{message}</div>;
}
function ErrorScreen({ message }) {
  return <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", background: "#f8d7da", color: "#721c24" }}>{message}</div>;
}
