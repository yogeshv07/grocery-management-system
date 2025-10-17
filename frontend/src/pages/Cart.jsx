import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [stockWarning, setStockWarning] = useState(null);

  useEffect(() => {
    document.title = "Cart";
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return navigate("/login");

    fetchCart(user._id);
  }, [navigate]);

  const fetchCart = async (customerId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/cart/${customerId}`);
      const stockIssues = res.data.items
        .filter(item => item.product && item.quantity > item.product.stock)
        .map(item => `${item.product.name}: Only ${item.product.stock} available`);

      if (stockIssues.length) {
        setStockWarning(stockIssues.join(", "));
        setTimeout(() => setStockWarning(null), 8000);
      }

      setCart(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
      setUpdating(true);
      await axios.put("http://localhost:5000/api/cart/update", {
        customerId: user._id,
        productId,
        quantity: newQuantity
      });
      fetchCart(user._id);
    } catch (err) {
      alert("Failed to update cart: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (productId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
      setUpdating(true);
      await axios.delete("http://localhost:5000/api/cart/remove", {
        data: { customerId: user._id, productId }
      });
      fetchCart(user._id);
    } catch (err) {
      alert("Failed to remove item: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const proceedToCheckout = () => {
    if (!cart.items.length) return alert("Your cart is empty!");
    navigate("/checkout");
  };

  if (loading) return <h2 style={{ textAlign: "center", marginTop: "100px" }}>Loading cart...</h2>;
  if (error) return <h2 style={{ textAlign: "center", marginTop: "100px", color: "red" }}>{error}</h2>;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f3f3", fontFamily: "'Amazon Ember', Arial, sans-serif", padding: "20px 0" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "10px", color: "#111" }}>Shopping Cart</h1>
        <p style={{ color: "#555", marginBottom: "20px" }}>Review your items before checkout</p>

        {stockWarning && (
          <div style={{
            background: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', padding: '12px 20px',
            borderRadius: '4px', marginBottom: '20px'
          }}>{stockWarning}</div>
        )}

        {cart.items.length === 0 ? (
          <div style={{
            background: "#fff", padding: "40px", borderRadius: "8px", textAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
          }}>
            <h2>Your cart is empty</h2>
            <p>Add products to get started!</p>
            <button
              onClick={() => navigate("/home")}
              style={{
                padding: "10px 20px", background: "#f0c14b", border: "1px solid #a88734", borderRadius: "4px",
                cursor: "pointer", fontWeight: 600
              }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {cart.items.map(item => (
                <div key={item.product._id} style={{
                  display: "flex", gap: "20px", background: "#fff", padding: "20px",
                  borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.08)", alignItems: "center"
                }}>
                  <img
                    src={item.product.image ? `http://localhost:5000/uploads/${item.product.image}` : ""}
                    alt={item.product.name}
                    style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "4px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>{item.product.name}</h3>
                    <p style={{ color: "#555", marginBottom: "6px", fontSize: "14px" }}>{item.product.description || "No description"}</p>
                    <p style={{ fontWeight: 600 }}>₹{item.product.price.toFixed(2)} each</p>
                    <p style={{ fontSize: "13px", color: "#777" }}>In stock: {item.product.stock}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updating}
                        style={{ padding: "4px 8px", borderRadius: "2px", border: "1px solid #ccc", cursor: "pointer" }}
                      >-</button>
                      <span style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "2px" }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock || updating}
                        style={{ padding: "4px 8px", borderRadius: "2px", border: "1px solid #ccc", cursor: "pointer" }}
                      >+</button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product._id)}
                      disabled={updating}
                      style={{ background: "#f0c14b", border: "1px solid #a88734", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontWeight: 600 }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "16px" }}>₹{(item.product.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: "#fff", padding: "20px", marginTop: "20px", borderRadius: "8px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
            }}>
              <div>
                <h2 style={{ margin: 0, fontWeight: 600 }}>Total: ₹{cart.total.toFixed(2)}</h2>
              </div>
              <button
                onClick={proceedToCheckout}
                disabled={updating}
                style={{
                  padding: "10px 20px", background: "#f0c14b", border: "1px solid #a88734",
                  borderRadius: "4px", cursor: "pointer", fontWeight: 600
                }}
              >
                {updating ? "Processing..." : "Proceed to Checkout"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
