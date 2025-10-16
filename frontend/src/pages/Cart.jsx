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
    // Set page title
    document.title = "🛒 Shopping Cart - Management System";
    
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/");
      return;
    }

    fetchCart(user._id);
  }, [navigate]);

  const fetchCart = async (customerId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/cart/${customerId}`);
      
      // Check for stock issues and show warning
      const stockIssues = [];
      for (const item of res.data.items) {
        if (item.product && typeof item.product.stock === 'number') {
          if (item.product.stock <= 0) {
            stockIssues.push(`${item.product.name} is now out of stock`);
          } else if (item.quantity > item.product.stock) {
            stockIssues.push(`${item.product.name}: Only ${item.product.stock} available (you have ${item.quantity})`);
          }
        }
      }
      
      if (stockIssues.length > 0) {
        setStockWarning(`Stock Update: ${stockIssues.join(', ')}`);
        setTimeout(() => setStockWarning(null), 8000); // Clear after 8 seconds
      }
      
      setCart(res.data);
    } catch (err) {
      setError("Failed to fetch cart: " + (err.response?.data?.error || err.message));
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
        productId: productId,
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
        data: {
          customerId: user._id,
          productId: productId
        }
      });
      fetchCart(user._id);
    } catch (err) {
      alert("Failed to remove item: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const proceedToCheckout = () => {
    if (cart.items.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div style={{ 
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#FFFFFF",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{
          background: "#FFFFFF",
          borderRadius: "20px",
          border: "1px solid #E0E0E0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          padding: "40px",
          textAlign: "center",
          color: "#333"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔄</div>
          <h2>Loading cart...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#FFFFFF",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{
          background: "#FFF5F5",
          borderRadius: "20px",
          border: "1px solid #FED7D7",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          padding: "40px",
          textAlign: "center",
          color: "#E53E3E"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8F9FA",
      fontFamily: "'Inter', 'Roboto', sans-serif"
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          .cart-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .cart-header {
            background: #FFFFFF;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            border: 1px solid #E0E0E0;
          }
          
          .btn-primary {
            padding: 10px 20px;
            border-radius: 6px;
            border: none;
            background: #007BFF;
            color: white;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px;
          }
          
          .btn-primary:hover {
            background: #0056B3;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
          }
          
          .btn-success {
            padding: 12px 24px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #28a745, #218838);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(40,167,69,0.3);
          }
          
          .btn-success:hover {
            box-shadow: 0 0 25px rgba(40,167,69,0.6);
            transform: translateY(-2px);
          }
          
          .btn-danger {
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 0 10px rgba(220,53,69,0.3);
          }
          
          .btn-danger:hover {
            box-shadow: 0 0 20px rgba(220,53,69,0.6);
            transform: translateY(-1px);
          }
          
          .cart-item {
            background: #FFFFFF;
            border-radius: 12px;
            border: 1px solid #E0E0E0;
            padding: 24px;
            margin-bottom: 16px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          
          .cart-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
            border-color: #007BFF;
          }
          
          .product-image {
            width: 120px;
            height: 120px;
            object-fit: cover;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            border: 2px solid rgba(255,255,255,0.2);
          }
          
          .product-image:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 35px rgba(102,126,234,0.4);
          }
          
          .product-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 120px;
          }
          
          .product-title {
            font-size: 18px;
            font-weight: 600;
            color: #222;
            margin-bottom: 6px;
          }
          
          .product-description {
            color: #666;
            font-size: 14px;
            line-height: 1.4;
            margin-bottom: 8px;
          }
          
          .product-price {
            font-size: 16px;
            font-weight: 500;
            color: #007BFF;
          }
          
          .item-total {
            font-size: 20px;
            font-weight: 600;
            color: #222;
            text-align: right;
          }
          
          .quantity-controls {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .quantity-btn {
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #E0E0E0;
            background: #FFFFFF;
            color: #333;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: bold;
          }
          
          .quantity-btn:hover {
            background: #F8F9FA;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .quantity-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .quantity-display {
            padding: 8px 12px;
            border: 1px solid #E0E0E0;
            border-radius: 8px;
            background: #FFFFFF;
            color: #333;
            min-width: 50px;
            text-align: center;
            font-weight: bold;
          }
          
          .total-section {
            background: #FFFFFF;
            border-radius: 12px;
            border: 1px solid #E0E0E0;
            padding: 24px;
            margin-top: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          
          @media (max-width: 768px) {
            .cart-container {
              margin: 10px;
              padding: 20px;
            }
            
            .cart-item {
              flex-direction: column;
              gap: 15px;
            }
            
            .quantity-controls {
              justify-content: center;
            }
          }
        `}
      </style>

      <div className="cart-container">
        <div className="cart-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ 
                margin: "0 0 4px 0", 
                color: "#222", 
                fontSize: "28px", 
                fontWeight: "600" 
              }}>
                Shopping Cart
              </h1>
              <p style={{ 
                margin: "0", 
                color: "#666", 
                fontSize: "14px" 
              }}>
                Review your items before checkout
              </p>
            </div>
            <button
              onClick={() => navigate("/customer/dashboard")}
              className="btn-primary"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Stock Warning */}
        {stockWarning && (
          <div style={{
            background: '#FFF3CD',
            border: '1px solid #FFEAA7',
            color: '#856404',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <strong>⚠️ {stockWarning}</strong>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Please adjust quantities before checkout
              </div>
            </div>
            <button 
              onClick={() => setStockWarning(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#856404'
              }}
            >
              ×
            </button>
          </div>
        )}

      {cart.items.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "80px 40px",
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E0E0E0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "24px" }}>🛒</div>
            <h3 style={{ color: "#333", marginBottom: "8px", fontSize: "24px", fontWeight: "600" }}>
              Your cart is empty
            </h3>
            <p style={{ color: "#666", marginBottom: "32px", fontSize: "16px" }}>
              Add some products to get started!
            </p>
            <button 
              onClick={() => navigate("/customer/dashboard")}
              className="btn-primary"
              style={{ padding: "12px 24px", fontSize: "16px" }}
            >
              Browse Products
            </button>
          </div>
      ) : (
        <>
          <div style={{ marginBottom: "30px" }}>
            {cart.items.map((item) => (
                    <div key={item.product._id} className="cart-item">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
                        {/* Product Image */}
                        <div style={{ flexShrink: 0 }}>
                          {item.product.image ? (
                    <img 
                      src={`http://localhost:5000/uploads/${item.product.image}`} 
                      alt={item.product.name}
                              className="product-image"
                            />
                          ) : (
                            <div style={{
                              width: "120px",
                              height: "120px",
                              borderRadius: "15px",
                              background: "#F8F9FA",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "2px solid #E0E0E0",
                              fontSize: "48px",
                              color: "#666"
                            }}>
                              📦
                            </div>
                  )}
                </div>

                        {/* Product Info */}
                        <div className="product-info">
                          <div>
                            <h4 className="product-title">{item.product.name}</h4>
                            <p className="product-description">
                              {item.product.description || "No description available"}
                            </p>
                            <div className="product-price">
                              💰 ₹{item.product.price.toFixed(2)} each
                            </div>
                            <div style={{ color: "#6c757d", fontSize: "13px", marginTop: "6px" }}>
                              In stock: {item.product.stock ?? 0}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px", minWidth: "120px" }}>
                          <div style={{ color: "#333", fontSize: "14px", fontWeight: "bold" }}>Quantity</div>
                          <div className="quantity-controls">
                            <button 
                              onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                              disabled={updating || item.quantity <= 1}
                              className="quantity-btn"
                              title="Decrease quantity"
                            >
                              ➖
                            </button>
                            <span className="quantity-display">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                              disabled={updating || (typeof item.product.stock === 'number' && item.quantity >= item.product.stock)}
                              className="quantity-btn"
                              title="Increase quantity"
                            >
                              ➕
                            </button>
                          </div>
                          {typeof item.product.stock === 'number' && item.quantity >= item.product.stock && (
                            <div style={{ color: "#dc3545", fontSize: "12px", marginTop: "6px" }}>
                              Max available stock reached
                            </div>
                          )}
                        </div>

                        {/* Item Total and Remove */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "15px", minWidth: "120px" }}>
                          <div className="item-total">
                            ₹{(item.product.price * item.quantity).toFixed(2)}
                          </div>
                          <button 
                            onClick={() => removeItem(item.product._id)}
                            disabled={updating}
                            className="btn-danger"
                            title="Remove item from cart"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    </div>
            ))}
          </div>

            <div className="total-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", color: "#222", fontSize: "24px", fontWeight: "600" }}>
                    Total: ₹{cart.total.toFixed(2)}
                  </h3>
                  <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                    Including all taxes and fees
                  </p>
                </div>
                <button 
                  onClick={proceedToCheckout}
                  disabled={updating}
                  className="btn-success"
                  style={{ 
                    fontSize: "16px", 
                    padding: "12px 24px",
                    background: "#28A745",
                    borderRadius: "6px",
                    border: "none",
                    color: "white",
                    fontWeight: "500"
                  }}
                >
                  {updating ? "Processing..." : "Proceed to Checkout"}
                </button>
              </div>
            </div>
        </>
      )}
      </div>
    </div>
  );
}
