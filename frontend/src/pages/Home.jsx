import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.title = "Home";
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);

    if (storedUser && storedUser.role === "customer") {
      fetchProducts();
      fetchCartCount(storedUser._id);
    } else {
      fetchProducts(); // allow browsing even if not logged in
    }
  }, []);

  // Fetch products
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

  // Fetch cart items/count
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
    if (!user) {
      alert("Please login first!");
      navigate("/login");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/cart/add", {
        customerId: user._id,
        productId,
        quantity: 1,
      });
      fetchCartCount(user._id);
      alert("Item added to cart!");
    } catch (err) {
      alert("Failed to add to cart: " + (err.response?.data?.error || err.message));
    }
  };

  const viewProduct = (productId) => navigate(`/product/${productId}`);

  const getCartQuantity = (productId) => {
    const cartItem = cartItems.find(item => item.product._id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const availableCategories = [
    "All",
    ...Array.from(new Set(
      products
        .filter(p => p.stock > 0)
        .map(p => p.category)
    ))
  ];

  const filteredProducts = products.filter(product =>
    (selectedCategory === "All" || product.category === selectedCategory) &&
    product.stock > 0 &&
    (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     product.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="loading-screen">Loading products...</div>;
  if (error) return <div className="error-screen">{error}</div>;

  return (
    <div className="home-container">

      {/* Header */}
      <header className="header">
        <div className="logo" onClick={() => navigate("/")}>🛒 Amazon Mart</div>

        <div className="header-center">
          <input
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button className="clear-btn" onClick={() => setSearchQuery("")}>✕</button>}
        </div>

        <div className="header-right">
          {!user && <button className="header-btn login" onClick={() => navigate("/login")}>Login</button>}
          {user && (
            <>
              <button className="header-btn" onClick={() => navigate("/cart")}>🛒 Cart ({cartCount})</button>
              <button className="header-btn" onClick={() => navigate("/order-history")}>📋 Orders</button>
              <button className="header-btn danger" onClick={() => { localStorage.removeItem("user"); setUser(null); navigate("/"); }}>Logout</button>
            </>
          )}
        </div>
      </header>

      {/* Categories below header */}
      <div className="categories-bar">
        {availableCategories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {filteredProducts.length === 0 && <div className="no-products">No products found</div>}
        {filteredProducts.map(product => {
          const cartQty = getCartQuantity(product._id);
          const availableStock = typeof product.stock === 'number' ? product.stock : 0;
          const canAddMore = cartQty < availableStock;

          return (
            <div key={product._id} className="product-card">
              <div className="product-image">
                {product.image ? <img src={`http://localhost:5000/uploads/${product.image}`} alt={product.name} /> : <div className="placeholder">📦</div>}
              </div>
              <div className="product-details">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="price-stock">
                  <span className="price">₹{(product.price || 0).toFixed(2)}</span>
                  <span className={`stock ${availableStock <= 0 ? 'out' : ''}`}>Stock: {availableStock}</span>
                </div>
                {cartQty > 0 && <div className="in-cart">In cart: {cartQty}</div>}
                <div className="actions">
                  <button 
                    className="btn-add-cart" 
                    onClick={() => addToCart(product._id)}
                    disabled={!canAddMore}
                  >
                    {availableStock <= 0 ? 'Out of Stock' : !canAddMore ? 'Max in Cart' : 'Add to Cart'}
                  </button>
                  <button className="btn-view" onClick={() => viewProduct(product._id)}>View Details</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Styles */}
      <style>{`
        body { font-family: 'Amazon Ember', sans-serif; margin: 0; }
        .header { background: #131921; color: white; display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; position: sticky; top: 0; z-index: 1000; }
        .logo { font-size: 24px; font-weight: bold; cursor: pointer; }
        .header-center { flex: 1; margin: 0 20px; position: relative; }
        .header-center input { width: 100%; padding: 8px 12px; border-radius: 4px; border: none; font-size: 16px; }
        .clear-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); border: none; background: #eee; padding: 2px 6px; border-radius: 50%; cursor: pointer; }
        .header-right { display: flex; align-items: center; gap: 10px; }
        .header-btn { background: #febd69; color: #111; border: none; padding: 8px 16px; cursor: pointer; border-radius: 4px; font-weight: 600; font-size: 14px; transition: background 0.2s, transform 0.1s; }
        .header-btn:hover { background: #f3a847; transform: translateY(-1px); }
        .header-btn.danger { background: #f08804; color: white; }
        .header-btn.danger:hover { background: #d77b02; }
        .categories-bar { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 20px; background: #f3f3f3; }
        .category-btn { background: #fff; border: 1px solid #ddd; border-radius: 3px; padding: 6px 12px; cursor: pointer; }
        .category-btn.active, .category-btn:hover { background: #febd69; color: black; font-weight: bold; border-color: #f0c14b; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; padding: 20px; }
        .product-card { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; cursor: pointer; transition: box-shadow 0.2s; background: #fff; display: flex; flex-direction: column; }
        .product-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
        .product-image img { width: 100%; height: 180px; object-fit: cover; }
        .product-details { padding: 10px; display: flex; flex-direction: column; flex: 1; }
        .product-details h3 { font-size: 16px; margin: 0 0 5px; font-weight: 600; color: #111; }
        .product-details p { font-size: 13px; color: #555; flex: 1; }
        .price-stock { display: flex; justify-content: space-between; margin: 8px 0; }
        .price { font-weight: 700; color: #b12704; }
        .stock { font-size: 12px; color: #007600; }
        .stock.out { color: #b12704; }
        .in-cart { font-size: 12px; color: #0073bb; margin-bottom: 8px; }
        .actions { display: flex; gap: 5px; margin-top: auto; }
        .btn-add-cart { flex: 1; background: #f0c14b; border: 1px solid #a88734; border-radius: 2px; padding: 6px; font-size: 14px; cursor: pointer; }
        .btn-add-cart:disabled { background: #ddd; cursor: not-allowed; }
        .btn-view { flex: 1; border: 1px solid #ddd; background: #fff; padding: 6px; font-size: 14px; cursor: pointer; }
        .no-products { text-align: center; padding: 60px; color: #555; font-size: 18px; }
      `}</style>
    </div>
  );
}
