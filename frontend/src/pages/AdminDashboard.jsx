import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]); // New state for delivery persons
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState({}); // Stores selected delivery person by orderId
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: null, // store File object
  });
  const [editingProduct, setEditingProduct] = useState(null);

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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://localhost:5000/api/orders/all");
      setOrders(res.data);
    } catch (err) {
      setError("Failed to fetch orders: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryPersons = async () => {
    try {
      setError(null);
      const res = await axios.get("http://localhost:5000/api/users/delivery");
      setDeliveryPersons(res.data);
      console.log("Delivery persons fetched:", res.data);
    } catch (err) {
      console.error("Failed to fetch delivery persons:", err);
      setError(`Failed to fetch delivery persons: ${err.response?.data?.error || err.message || "Unknown error occurred"}`);
    }
  };

  const handleDeliveryPersonChange = (orderId, personId) => {
    setSelectedDeliveryPerson(prev => ({ ...prev, [orderId]: personId }));
  };

  useEffect(() => {
    // Set page title
    document.title = "👨‍💼 Admin Dashboard - Management System";
    
    fetchProducts();
    fetchOrders();
    fetchDeliveryPersons(); // Fetch delivery persons on component mount
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "image") {
      setForm({ ...form, image: e.target.files[0] }); // store selected file
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', parseFloat(form.price));
      formData.append('stock', parseInt(form.stock) || 0);
      formData.append('category', form.category);
      
      // Add image file if selected
      if (form.image) {
        formData.append('image', form.image);
      }

      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct._id}`
        : "http://localhost:5000/api/products";
      
      const method = editingProduct ? 'put' : 'post';
      const res = await axios[method](url, formData);

      alert(res.data.message);
      setForm({ name: "", description: "", price: "", stock: "", category: "", image: null });
      setEditingProduct(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      fetchProducts();
    } catch (err) {
      setError("Failed to add product: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock?.toString() || "0",
      category: product.category || "",
      image: null // Don't pre-fill image
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setForm({ name: "", description: "", price: "", stock: "", category: "", image: null });
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`http://localhost:5000/api/products/${productId}`);
      alert("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      setError("Failed to delete product: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, deliveryPersonId = null) => {
    try {
      setLoading(true);
      setError(null);
      const updateData = { status: newStatus };
      if (deliveryPersonId) {
        updateData.deliveryPerson = deliveryPersonId;
        console.log("Assigning delivery person:", deliveryPersonId, "to order:", orderId);
      }

      const response = await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, updateData);
      console.log("Order status update response:", response.data);
      
      alert(`Order status updated successfully! ${deliveryPersonId ? 'Delivery person assigned.' : ''}`);
      fetchOrders();
      
      // Clear the selected delivery person for this order
      if (deliveryPersonId) {
        setSelectedDeliveryPerson(prev => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error occurred";
      console.error("Order status update error:", err);
      alert("Failed to update order status: " + errorMessage);
    } finally {
      setLoading(false);
    }
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
      case "pending": return "Pending";
      case "confirmed": return "Confirmed";
      case "preparing": return "Preparing";
      case "out_for_delivery": return "Out for Delivery";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

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
          .admin-container {
            position: relative;
            z-index: 1;
            background: #FFFFFF;
            border-radius: 20px;
            border: 1px solid #E0E0E0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            padding: 30px;
            margin: 20px;
          }
          
          .admin-header {
            background: #F8F9FA;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #E0E0E0;
          }
          
          .tab-button {
            padding: 12px 24px;
            border-radius: 10px;
            border: 1px solid #E0E0E0;
            cursor: pointer;
            transition: all 0.3s ease;
            background: #FFFFFF;
            color: #333;
            font-weight: bold;
            margin-right: 10px;
          }
          
          .tab-button:hover {
            background: #F8F9FA;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
          }
          
          .tab-button.active {
            background: #007BFF;
            color: white;
            border-color: #007BFF;
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
          }
          
          .glass-card {
            background: #FFFFFF;
            border-radius: 15px;
            border: 1px solid #E0E0E0;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          
          .glass-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          }
          
          .form-input {
            padding: 12px 15px;
            border-radius: 10px;
            border: 1px solid #E0E0E0;
            background: #FFFFFF;
            color: #333;
            margin-right: 10px;
            margin-bottom: 10px;
            transition: all 0.3s ease;
          }
          
          .form-input:focus {
            border: 1px solid #007BFF;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
            outline: none;
          }
          
          .form-input::placeholder {
            color: #999;
          }
          
          .btn-primary {
            padding: 12px 24px;
            border-radius: 10px;
            border: none;
            background: #007BFF;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .btn-primary:hover {
            background: #0056B3;
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
            transform: translateY(-2px);
          }
          
          .btn-danger {
            padding: 12px 24px;
            border-radius: 10px;
            border: none;
            background: #DC3545;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .btn-danger:hover {
            background: #C82333;
            box-shadow: 0 4px 12px rgba(220,53,69,0.3);
            transform: translateY(-2px);
          }
          
          .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
            margin-top: 25px;
          }
          
          .product-card {
            background: #FFFFFF;
            border-radius: 20px;
            border: 1px solid #E0E0E0;
            padding: 25px;
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          
          .product-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: #007BFF;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .product-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
            border-color: #007BFF;
          }
          
          .product-card:hover::before {
            opacity: 1;
          }
          
          .admin-product-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 15px;
            margin-bottom: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            border: 2px solid rgba(255,255,255,0.2);
          }
          
          .admin-product-image:hover {
            transform: scale(1.02);
            box-shadow: 0 12px 35px rgba(102,126,234,0.4);
          }
          
          .admin-product-placeholder {
            width: 100%;
            height: 200px;
            border-radius: 15px;
            background: #F8F9FA;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #E0E0E0;
            font-size: 64px;
            margin-bottom: 15px;
            color: #CCC;
          }
          
          .product-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          
          .product-description {
            color: #666;
            font-size: 14px;
            line-height: 1.4;
            margin-bottom: 15px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .product-price {
            font-size: 24px;
            font-weight: bold;
            color: #007BFF;
            text-align: center;
            padding: 10px;
            background: #F8F9FA;
            border-radius: 10px;
            border: 1px solid #E0E0E0;
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
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            display: inline-block;
            margin-bottom: 10px;
          }
          
          .delivery-select {
            padding: 8px 15px;
            border-radius: 8px;
            border: 1px solid #E0E0E0;
            background: #FFFFFF;
            color: #333;
            margin-right: 10px;
            transition: all 0.3s ease;
          }
          
          .delivery-select:focus {
            border: 1px solid #007BFF;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
            outline: none;
          }
          
          @media (max-width: 768px) {
            .admin-container {
              margin: 10px;
              padding: 20px;
            }
            
            .product-grid {
              grid-template-columns: 1fr;
            }
            
            .tab-button {
              margin-bottom: 10px;
              width: 100%;
            }
            
            .form-input {
              width: 100%;
              margin-right: 0;
            }
          }
        `}
      </style>

      <div className="admin-container">
        <div className="admin-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, color: "#333" }}>
              🛠️ Admin Dashboard
            </h2>
            <button 
              onClick={() => {
                localStorage.removeItem("user");
                navigate("/");
              }}
              className="btn-danger"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {error && (
          <div style={{ 
            background: "#FFF5F5", 
            color: "#E53E3E", 
            padding: "15px", 
            borderRadius: "10px", 
            marginBottom: "20px",
            border: "1px solid #FED7D7"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }}>
          <button 
            onClick={() => setActiveTab("products")}
            className={`tab-button ${activeTab === "products" ? "active" : ""}`}
          >
            📦 Product Management
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
          >
            📋 Order Management
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            <div className="glass-card">
              <h3 style={{ color: "#333", marginBottom: "20px" }}>
                {editingProduct ? "✏️ Edit Product" : "➕ Add Product"}
              </h3>
              {editingProduct && (
                <div style={{ marginBottom: "15px", padding: "10px", background: "#E3F2FD", borderRadius: "8px", border: "1px solid #2196F3" }}>
                  <span style={{ color: "#1976D2", fontWeight: "bold" }}>
                    Editing: {editingProduct.name}
                  </span>
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    style={{ 
                      marginLeft: "10px", 
                      padding: "5px 10px", 
                      background: "#f44336", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: "pointer" 
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Product Name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                  style={{ flex: "1", minWidth: "200px" }}
                />
                <input 
                  type="text" 
                  name="description" 
                  placeholder="Description" 
                  value={form.description} 
                  onChange={handleChange} 
                  className="form-input"
                  style={{ flex: "1", minWidth: "200px" }}
                />
                <input 
                  type="number" 
                  name="price" 
                  placeholder="Price (₹)" 
                  value={form.price} 
                  onChange={handleChange} 
                  required 
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ flex: "1", minWidth: "120px" }}
                />
                <input 
                  type="number" 
                  name="stock" 
                  placeholder="Stock Qty" 
                  value={form.stock} 
                  onChange={handleChange} 
                  min="0"
                  step="1"
                  className="form-input"
                  style={{ flex: "1", minWidth: "100px" }}
                />
                <input 
                  type="text" 
                  name="category" 
                  placeholder="Category" 
                  value={form.category} 
                  onChange={handleChange} 
                  className="form-input"
                  style={{ flex: "1", minWidth: "120px" }}
                />
                <input 
                  type="file" 
                  name="image" 
                  accept="image/*"
                  onChange={handleChange} 
                  className="form-input"
                  style={{ 
                    flex: "1", 
                    minWidth: "200px",
                    cursor: "pointer"
                  }}
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                  style={{ 
                    background: loading ? "#ccc" : "linear-gradient(135deg, #667eea, #764ba2)",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "⏳ Processing..." : (editingProduct ? "💾 Update Product" : "➕ Add Product")}
                </button>
              </form>
            </div>

            <h3 style={{ color: "#333", marginBottom: "20px" }}>📦 Existing Products</h3>
            {loading && <p style={{ color: "#333", textAlign: "center" }}>⏳ Loading products...</p>}
            <div className="product-grid">
              {products.map((p) => (
                <div key={p._id} className="product-card">
                  {/* Product Image */}
                  {p.image ? (
                    <img 
                      src={`http://localhost:5000/uploads/${p.image}`} 
                      alt={p.name} 
                      className="admin-product-image"
                    />
                  ) : (
                    <div className="admin-product-placeholder">
                      📦
                    </div>
                  )}
                  
                  {/* Product Info */}
                  <h4 className="product-title">{p.name}</h4>
                  <p className="product-description">
                    {p.description || "No description available"}
                  </p>
                  <div className="product-price">
                    💰 ₹{p.price.toFixed(2)}
                  </div>
                  
                  {/* Stock and Category Info */}
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
                    <div>📦 Stock: {p.stock || 0} units</div>
                    {p.category && <div>🏷️ Category: {p.category}</div>}
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ marginTop: "15px", display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button 
                      onClick={() => editProduct(p)}
                      style={{
                        padding: "6px 12px",
                        background: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                      title="Edit Product"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => deleteProduct(p._id)}
                      style={{
                        padding: "6px 12px",
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                      title="Delete Product"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <>
            <div className="glass-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <h3 style={{ color: "#333", margin: 0 }}>📋 Order Management</h3>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={fetchDeliveryPersons}
                    className="btn-primary"
                    style={{ background: "linear-gradient(135deg, #17a2b8, #138496)" }}
                  >
                    🔄 Refresh Delivery Persons
                  </button>
                  <span style={{ fontSize: "12px", color: "#ccc", background: "rgba(255,255,255,0.1)", padding: "5px 10px", borderRadius: "15px" }}>
                    Available: {deliveryPersons.length}
                  </span>
                </div>
              </div>
              
              {loading && <p style={{ color: "#333", textAlign: "center" }}>⏳ Loading orders...</p>}
              
              {/* Debug: Show delivery persons info */}
              {deliveryPersons.length === 0 && !loading && (
                <div style={{
                  background: "#FFFBF0",
                  border: "1px solid #FED7AA",
                  color: "#C05621",
                  padding: "15px",
                  borderRadius: "10px",
                  marginBottom: "20px"
                }}>
                  <strong>⚠️ No Delivery Persons Available</strong>
                  <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
                    You need to register delivery persons with role "delivery" before you can assign orders.
                    <br />
                    <strong>Current delivery persons count: {deliveryPersons.length}</strong>
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>
                        📦 Order #{order._id.slice(-8).toUpperCase()}
                      </h4>
                      <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                        👤 Customer: {order.customer.name} | {order.customer.email}
                      </p>
                      <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                        📅 Date: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="status-badge" style={{ background: getStatusColor(order.status) }}>
                        {getStatusText(order.status)}
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#007BFF" }}>
                        💰 ₹{order.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <strong style={{ color: "#333" }}>📍 Delivery Address:</strong> 
                    <span style={{ color: "#666", marginLeft: "5px" }}>{order.deliveryAddress}</span>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <strong style={{ color: "#333" }}>🛍️ Items:</strong>
                    <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {order.items.map((item, index) => (
                        <div 
                          key={index}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            padding: "10px", 
                            background: "#F8F9FA", 
                            borderRadius: "8px",
                            border: "1px solid #E0E0E0"
                          }}
                        >
                          {item.product && item.product.image && (
                            <img 
                              src={`http://localhost:5000/uploads/${item.product.image}`} 
                              alt={item.product?.name || 'Product'}
                              style={{ 
                                width: "30px", 
                                height: "30px", 
                                objectFit: "cover", 
                                borderRadius: "5px",
                                marginRight: "8px"
                              }}
                            />
                          )}
                          <span style={{ fontSize: "14px", color: "#333" }}>
                            {(item.product?.name || 'Product removed')} (×{item.quantity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {order.status === "pending" && (
                      <>
                        <button 
                          onClick={() => updateOrderStatus(order._id, "confirmed")}
                          className="btn-primary"
                          style={{ background: "linear-gradient(135deg, #17a2b8, #138496)" }}
                        >
                          ✅ Confirm Order
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order._id, "cancelled")}
                          className="btn-danger"
                        >
                          ❌ Cancel Order
                        </button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <button
                        onClick={() => updateOrderStatus(order._id, "preparing")}
                        className="btn-primary"
                        style={{ background: "linear-gradient(135deg, #fd7e14, #e55a00)" }}
                      >
                        👨‍🍳 Start Preparing
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          <label style={{ fontSize: "12px", color: "#666", fontWeight: "bold" }}>
                            🚚 Assign Delivery Person:
                          </label>
                          <select
                            value={selectedDeliveryPerson[order._id] || ""}
                            onChange={(e) => handleDeliveryPersonChange(order._id, e.target.value)}
                            className="delivery-select"
                            style={{ minWidth: "200px" }}
                          >
                            <option value="">Select Delivery Person</option>
                            {deliveryPersons.length === 0 ? (
                              <option value="" disabled>No delivery persons available</option>
                            ) : (
                              deliveryPersons.map(person => (
                                <option key={person._id} value={person._id}>
                                  {person.name} ({person.phone || 'No phone'})
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        <button
                          onClick={() => updateOrderStatus(order._id, "out_for_delivery", selectedDeliveryPerson[order._id])}
                          disabled={!selectedDeliveryPerson[order._id] || loading}
                          className="btn-primary"
                          style={{
                            background: selectedDeliveryPerson[order._id] && !loading ? "linear-gradient(135deg, #007bff, #0056b3)" : "#ccc",
                            cursor: selectedDeliveryPerson[order._id] && !loading ? "pointer" : "not-allowed"
                          }}
                        >
                          {loading ? "⏳ Assigning..." : "🚚 Assign for Delivery"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
