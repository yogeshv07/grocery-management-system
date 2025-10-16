import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Set page title and favicon
    document.title = "🏠 Home - Management System";
    
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "customer") {
      navigate("/");
      return;
    }
    fetchProducts();
    fetchCartCount(user._id);
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (err) {
      setError("Failed to fetch products: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async (customerId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/cart/${customerId}`);
      setCartCount(res.data.items.length);
      setCartItems(res.data.items || []);
    } catch {
      setCartCount(0);
      setCartItems([]);
    }
  };

  const addToCart = async (productId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
      await axios.post("http://localhost:5000/api/cart/add", {
        customerId: user._id,
        productId: productId,
        quantity: 1
      });
      fetchCartCount(user._id);
      alert("Item added to cart!");
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg.includes('available in stock')) {
        alert("Cannot add to cart: " + errorMsg + "\nPlease check your cart or reduce the quantity.");
      } else if (errorMsg.includes('out of stock')) {
        alert("This item is currently out of stock.");
      } else {
        alert("Failed to add to cart: " + errorMsg);
      }
    }
  };

  const viewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getCartQuantity = (productId) => {
    const cartItem = cartItems.find(item => item.product._id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔄</div>
        <h2 style={{ color: "#333" }}>Loading products...</h2>
        <p style={{ color: "#666" }}>Please wait while we fetch the latest products</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: "center", padding: "40px", background: "#FFF5F5", borderRadius: "12px", border: "1px solid #FED7D7", maxWidth: "400px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
        <h2 style={{ color: "#E53E3E", marginBottom: "8px" }}>Error Loading Products</h2>
        <p style={{ color: "#666" }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: "#FFFFFF", color: "#333" }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

          .product-card {
            background: #FFFFFF;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            border: 1px solid #F0F0F0;
            transition: all 0.3s ease;
            overflow: hidden;
            cursor: pointer;
          }

          .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
            border-color: #007BFF;
          }

          .product-image-container {
            position: relative;
            width: 100%;
            height: 220px;
            overflow: hidden;
            background: #F8F9FA;
          }

          .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          .product-card:hover .product-image {
            transform: scale(1.05);
          }

          .product-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            background: #F8F9FA;
            color: #CCC;
          }

          .product-info {
            padding: 20px;
          }

          .product-title {
            font-size: 18px;
            font-weight: 600;
            color: #222;
            margin-bottom: 8px;
            line-height: 1.4;
          }

          .product-description {
            color: #666;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 12px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .product-price {
            font-size: 20px;
            font-weight: 700;
            color: #007BFF;
            margin-bottom: 16px;
          }

          .product-actions {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .btn-add-cart {
            flex: 1;
            padding: 10px 16px;
            background: #007BFF;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-add-cart:hover {
            background: #0056B3;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
          }

          .btn-view-details {
            padding: 10px 16px;
            background: white;
            color: #007BFF;
            border: 1px solid #007BFF;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-view-details:hover {
            background: #007BFF;
            color: white;
            transform: translateY(-1px);
          }

          .header {
            background: #FFFFFF;
            box-shadow: 0 2px 5px rgba(0,0,0,0.08);
            padding: 16px 0;
            margin-bottom: 40px;
            position: sticky;
            top: 0;
            z-index: 100;
          }

          .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #007BFF;
          }

          .nav-buttons {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .header-btn {
            padding: 8px 16px;
            border-radius: 6px;
            border: 1px solid #E0E0E0;
            background: white;
            color: #555;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 14px;
          }

          .header-btn:hover {
            color: #007BFF;
            border-color: #007BFF;
          }

          .header-btn.primary {
            background: #007BFF;
            color: white;
            border-color: #007BFF;
          }

          .header-btn.primary:hover {
            background: #0056B3;
          }

          .header-btn.danger {
            background: #DC3545;
            color: white;
            border-color: #DC3545;
          }

          .header-btn.danger:hover {
            background: #C82333;
          }

          .search-section {
            max-width: 1200px;
            margin: 0 auto 40px;
            padding: 0 20px;
            text-align: center;
          }

          .search-container {
            position: relative;
            max-width: 600px;
            margin: 0 auto;
          }

          .search-input {
            width: 100%;
            padding: 16px 24px 16px 50px;
            font-size: 16px;
            border: 2px solid #E0E0E0;
            border-radius: 25px;
            background: #FFFFFF;
            outline: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          }

          .search-input:focus {
            border-color: #007BFF;
            box-shadow: 0 4px 20px rgba(0,123,255,0.15);
          }

          .search-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 18px;
            color: #666;
            pointer-events: none;
          }

          .clear-search {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            font-size: 20px;
            color: #999;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.2s ease;
          }

          .clear-search:hover {
            background: #F0F0F0;
            color: #666;
          }

          .hero-section {
            max-width: 1200px;
            margin: 0 auto 60px;
            padding: 0 20px;
            text-align: center;
          }

          .hero-title {
            font-size: 48px;
            font-weight: 700;
            color: #222;
            margin-bottom: 16px;
            line-height: 1.2;
          }

          .hero-subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 32px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }

          .products-section {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }

          .section-title {
            font-size: 32px;
            font-weight: 600;
            color: #222;
            text-align: center;
            margin-bottom: 40px;
          }

          .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
          }

          @media (max-width: 768px) {
            .header-content {
              flex-direction: column;
              gap: 16px;
            }
            
            .hero-title {
              font-size: 36px;
            }
            
            .products-grid {
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
              gap: 16px;
            }
          }
        `}
      </style>

      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="logo">🛍️ Grocery Management</div>
          <div className="nav-buttons">
            <button className="header-btn" onClick={() => navigate("/cart")}>🛒 Cart ({cartCount})</button>
            <button className="header-btn" onClick={() => navigate("/order-history")}>📋 Orders</button>
            <button className="header-btn danger" onClick={() => { localStorage.removeItem("user"); navigate("/"); }}>Logout</button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">Welcome to Our Store!</h1>
        <p className="hero-subtitle">
          Browse and shop from a wide variety of products. Fast delivery, easy returns, and great service!
        </p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder="Search for products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p style={{ marginTop: "12px", color: "#666", fontSize: "14px" }}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Products Section */}
      <div className="products-section">
        <h2 className="section-title">
          {searchQuery ? `Search Results (${filteredProducts.length})` : "Featured Products"}
        </h2>
        <div className="products-grid">
          {filteredProducts.map((product) => {
            const cartQty = getCartQuantity(product._id);
            const availableStock = typeof product.stock === 'number' ? product.stock : 0;
            const canAddMore = cartQty < availableStock;
            
            return (
              <div key={product._id} className="product-card">
                <div className="product-image-container">
                  {product.image ? (
                    <img src={`http://localhost:5000/uploads/${product.image}`} alt={product.name} className="product-image" />
                  ) : (
                    <div className="product-placeholder">🛍️</div>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-title">{product.name || "Unnamed Product"}</h3>
                  <p className="product-description">{product.description || "No description available"}</p>
                  <div className="product-price">₹{(product.price || 0).toFixed(2)}</div>
                  
                  <div style={{ fontSize: "12px", marginBottom: "12px" }}>
                    <div style={{ 
                      color: availableStock <= 0 ? '#dc3545' : 
                             availableStock <= 5 ? '#fd7e14' : '#28a745',
                      marginBottom: "4px"
                    }}>
                      Stock: {availableStock} available
                      {availableStock <= 5 && availableStock > 0 && (
                        <span style={{ color: '#fd7e14', fontWeight: 'bold' }}> (Limited!)</span>
                      )}
                    </div>
                    {cartQty > 0 && (
                      <div style={{ color: '#007BFF', fontWeight: 'bold' }}>
                        In your cart: {cartQty}
                      </div>
                    )}
                  </div>
                  
                  <div className="product-actions">
                    <button 
                      className="btn-add-cart" 
                      onClick={(e) => { e.stopPropagation(); addToCart(product._id); }}
                      disabled={!canAddMore}
                      style={{ 
                        opacity: !canAddMore ? 0.5 : 1,
                        cursor: !canAddMore ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {availableStock <= 0 ? 'Out of Stock' : 
                       !canAddMore ? 'Max in Cart' : 'Add to Cart'}
                    </button>
                    <button className="btn-view-details" onClick={() => viewProduct(product._id)}>View Details</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && products.length > 0 && searchQuery && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#666", background: "#F8F9FA", borderRadius: "12px", margin: "40px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ color: "#333", marginBottom: "8px" }}>No products found</h3>
            <p>No products match your search for "{searchQuery}". Try a different search term.</p>
            <button 
              onClick={() => setSearchQuery("")}
              style={{
                marginTop: "16px",
                padding: "10px 20px",
                background: "#007BFF",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              Clear Search
            </button>
          </div>
        )}
        
        {products.length === 0 && !searchQuery && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#666", background: "#F8F9FA", borderRadius: "12px", margin: "40px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
            <h3 style={{ color: "#333", marginBottom: "8px" }}>No products available</h3>
            <p>Check back later for new products!</p>
          </div>
        )}
      </div>
    </div>
  );
}
