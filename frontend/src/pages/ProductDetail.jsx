import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = "📦 Product Details - Management System";
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`http://localhost:5000/api/products/${productId}`);
        setProduct(res.data);
        // Update title with product name
        document.title = `📦 ${res.data.name} - Management System`;
      } catch (err) {
        setError("Failed to fetch product: " + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchProduct();
    }
    
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      fetchCartCount(user._id);
    }
  }, [productId]);

  const fetchCartCount = async (customerId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/cart/${customerId}`);
      setCartCount(res.data.items.length);
    } catch {
      setCartCount(0);
    }
  };

  const handleAddToCart = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to add items to cart");
      navigate("/");
      return;
    }

    try {
      setAddingToCart(true);
      await axios.post("http://localhost:5000/api/cart/add", {
        customerId: user._id,
        productId: product._id,
        quantity: quantity
      });
      alert("Item added to cart successfully!");
    } catch (err) {
      alert("Failed to add to cart: " + (err.response?.data?.error || err.message));
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(15px) saturate(180%)",
          WebkitBackdropFilter: "blur(15px) saturate(180%)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 0 40px rgba(0,0,0,0.3)",
          padding: "40px",
          textAlign: "center",
          color: "#fff"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔄</div>
          <h2>Loading...</h2>
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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{
          background: "rgba(220,53,69,0.1)",
          backdropFilter: "blur(15px) saturate(180%)",
          WebkitBackdropFilter: "blur(15px) saturate(180%)",
          borderRadius: "20px",
          border: "1px solid rgba(220,53,69,0.3)",
          boxShadow: "0 0 40px rgba(0,0,0,0.3)",
          padding: "40px",
          textAlign: "center",
          color: "#ff6b6b"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
          <h2>{error}</h2>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div style={{ 
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{
          background: "rgba(255,193,7,0.1)",
          backdropFilter: "blur(15px) saturate(180%)",
          WebkitBackdropFilter: "blur(15px) saturate(180%)",
          borderRadius: "20px",
          border: "1px solid rgba(255,193,7,0.3)",
          boxShadow: "0 0 40px rgba(0,0,0,0.3)",
          padding: "40px",
          textAlign: "center",
          color: "#ffc107"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>❓</div>
          <h2>Product not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: "relative",
      minHeight: "100vh",
      padding: "20px", 
      fontFamily: "Arial, sans-serif",
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
          .product-container {
            position: relative;
            z-index: 1;
            background: #FFFFFF;
            border-radius: 20px;
            border: 1px solid #E0E0E0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            padding: 30px;
            margin: 20px auto;
            max-width: 800px;
          }
          
          .btn-primary {
            padding: 12px 24px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(102,126,234,0.3);
          }
          
          .btn-primary:hover {
            box-shadow: 0 0 25px rgba(102,126,234,0.6);
            transform: translateY(-2px);
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
          
          .btn-secondary {
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.1);
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .btn-secondary:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-1px);
          }
          
          .product-image-gallery {
            position: relative;
            width: 100%;
            height: 500px;
            border-radius: 20px;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            border: 2px solid rgba(255,255,255,0.2);
            box-shadow: 0 15px 50px rgba(0,0,0,0.3);
          }
          
          .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: all 0.4s ease;
            cursor: zoom-in;
          }
          
          .product-image:hover {
            transform: scale(1.05);
          }
          
          .product-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 120px;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            color: rgba(255,255,255,0.6);
          }
          
          .product-details-card {
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 30px;
            height: fit-content;
          }
          
          .product-title {
            font-size: 32px;
            font-weight: bold;
            color: #fff;
            margin-bottom: 15px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            line-height: 1.2;
          }
          
          .product-description {
            color: #ccc;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 25px;
            opacity: 0.9;
          }
          
          .product-price {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            text-shadow: 0 0 15px rgba(102,126,234,0.6);
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .price-badge {
            background: linear-gradient(135deg, #667eea, #764ba2);
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 14px;
            color: #fff;
            font-weight: normal;
          }
          
          .quantity-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 30px;
          }
          
          .quantity-display {
            padding: 8px 15px;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: #fff;
            min-width: 50px;
            text-align: center;
          }
          
          .add-to-cart-btn {
            padding: 15px 30px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(102,126,234,0.3);
            width: 100%;
          }
          
          .add-to-cart-btn:hover {
            box-shadow: 0 0 25px rgba(102,126,234,0.6);
            transform: translateY(-2px);
          }
          
          .add-to-cart-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          
          .view-cart-btn {
            padding: 15px 30px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #28a745, #218838);
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(40,167,69,0.3);
            width: 100%;
            margin-top: 10px;
          }
          
          .view-cart-btn:hover {
            box-shadow: 0 0 25px rgba(40,167,69,0.6);
            transform: translateY(-2px);
          }
          
          @media (max-width: 768px) {
            .product-container {
              margin: 10px;
              padding: 20px;
            }
            
            .product-image {
              height: 300px;
            }
          }
        `}
      </style>

      <div className="product-container">
        <button 
          onClick={() => navigate(-1)}
          className="btn-primary"
          style={{ marginBottom: "20px" }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          {/* Product Image Gallery */}
          <div style={{ flex: "1", minWidth: "400px" }}>
            <div className="product-image-gallery">
              {product.image ? (
                <img 
                  src={`http://localhost:5000/uploads/${product.image}`} 
                  alt={product.name}
                  className="product-image"
                />
              ) : (
                <div className="product-placeholder">
                  🛍️
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div style={{ flex: "1", minWidth: "400px" }}>
            <div className="product-details-card">
              <h1 className="product-title">
                {product.name}
              </h1>
              
              <p className="product-description">
                {product.description || "No description available for this product."}
              </p>
              
              <div className="product-price">
                💰 ₹{product.price.toFixed(2)}
                <span className="price-badge">Best Price</span>
              </div>
              <div style={{ color: "#eee", fontSize: "14px", marginTop: "6px" }}>
                In stock: {typeof product.stock === 'number' ? product.stock : 0}
              </div>

              {/* Quantity Selection */}
              <div style={{ marginBottom: "30px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "15px", 
                  fontWeight: "bold", 
                  color: "#fff",
                  fontSize: "18px"
                }}>
                  📦 Select Quantity:
                </label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="btn-secondary"
                    disabled={quantity <= 1}
                    title="Decrease quantity"
                  >
                    ➖
                  </button>
                  <span className="quantity-display">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(Math.min((product?.stock ?? Infinity), quantity + 1))}
                    className="btn-secondary"
                    disabled={typeof product?.stock === 'number' && quantity >= product.stock}
                    title="Increase quantity"
                  >
                    ➕
                  </button>
                </div>
                <div style={{ 
                  marginTop: "10px", 
                  color: "#ccc", 
                  fontSize: "14px" 
                }}>
                  Total: ₹{(product.price * quantity).toFixed(2)}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <button 
                  onClick={handleAddToCart}
                  disabled={addingToCart || (typeof product?.stock === 'number' && product.stock <= 0)}
                  className="add-to-cart-btn"
                  style={{ fontSize: "18px", padding: "18px 30px" }}
                >
                  {addingToCart ? "⏳ Adding to Cart..." : (product?.stock > 0 ? "🛒 Add to Cart" : "❌ Out of Stock")}
                </button>

                <button 
                  onClick={() => navigate("/cart")}
                  className="view-cart-btn"
                  style={{ fontSize: "16px", padding: "15px 30px" }}
                >
                  🛒 View Cart
                </button>
              </div>

              {/* Product Features */}
              <div style={{ 
                marginTop: "30px", 
                padding: "20px", 
                background: "rgba(255,255,255,0.05)",
                borderRadius: "15px",
                border: "1px solid rgba(255,255,255,0.2)"
              }}>
                <h4 style={{ color: "#fff", marginBottom: "15px", fontSize: "16px" }}>
                  ✨ Product Features:
                </h4>
                <ul style={{ 
                  color: "#ccc", 
                  fontSize: "14px", 
                  lineHeight: "1.6",
                  paddingLeft: "20px",
                  margin: 0
                }}>
                  <li>✅ High quality materials</li>
                  <li>✅ Fast and secure delivery</li>
                  <li>✅ 30-day return policy</li>
                  <li>✅ Customer support included</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
