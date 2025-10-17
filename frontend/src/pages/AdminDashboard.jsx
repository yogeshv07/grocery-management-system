import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState({});
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: null,
  });
  const [editingProduct, setEditingProduct] = useState(null);

  // FETCH FUNCTIONS
  const fetchProducts = async () => {
    try {
      setLoading(true); setError(null);
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (err) {
      setError("Failed to fetch products: " + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true); setError(null);
      const res = await axios.get("http://localhost:5000/api/orders/all");
      setOrders(res.data);
    } catch (err) {
      setError("Failed to fetch orders: " + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const fetchDeliveryPersons = async () => {
    try {
      setError(null);
      const res = await axios.get("http://localhost:5000/api/users/delivery");
      setDeliveryPersons(res.data);
    } catch (err) {
      setError(`Failed to fetch delivery persons: ${err.response?.data?.error || err.message}`);
    }
  };

  useEffect(() => {
    document.title = "Admin panel";
    fetchProducts(); fetchOrders(); fetchDeliveryPersons();
  }, []);

  // FORM HANDLERS
  const handleChange = (e) => {
    if (e.target.name === "image") {
      setForm({ ...form, image: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setError(null);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', parseFloat(form.price));
      formData.append('stock', parseInt(form.stock) || 0);
      formData.append('category', form.category);
      if (form.image) formData.append('image', form.image);

      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct._id}`
        : "http://localhost:5000/api/products";
      const method = editingProduct ? 'put' : 'post';
      const res = await axios[method](url, formData);

      alert(res.data.message);
      setForm({ name: "", description: "", price: "", stock: "", category: "", image: null });
      setEditingProduct(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      fetchProducts();
    } catch (err) {
      setError("Failed to add product: " + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock?.toString() || "0",
      category: product.category || "",
      image: null
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setForm({ name: "", description: "", price: "", stock: "", category: "", image: null });
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      setLoading(true); setError(null);
      await axios.delete(`http://localhost:5000/api/products/${productId}`);
      alert("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      setError("Failed to delete product: " + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  // ORDER HANDLERS
  const handleDeliveryPersonChange = (orderId, personId) => {
    setSelectedDeliveryPerson(prev => ({ ...prev, [orderId]: personId }));
  };

  const updateOrderStatus = async (orderId, newStatus, deliveryPersonId = null) => {
    try {
      setLoading(true); setError(null);
      const updateData = { status: newStatus };
      if (deliveryPersonId) updateData.deliveryPerson = deliveryPersonId;
      const response = await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, updateData);
      alert(`Order updated! ${deliveryPersonId ? 'Delivery assigned.' : ''}`);
      fetchOrders();
      if (deliveryPersonId) {
        setSelectedDeliveryPerson(prev => { const s={...prev}; delete s[orderId]; return s; });
      }
    } catch (err) {
      alert("Failed to update order: " + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const getStatusColor = (status) => {
    switch(status) {
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
    switch(status) {
      case "pending": return "Pending";
      case "confirmed": return "Confirmed";
      case "preparing": return "Preparing";
      case "out_for_delivery": return "Out for Delivery";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  // SIDEBAR BUTTON STYLE
  const sidebarBtnStyle = (active) => ({
    padding: '10px 15px',
    borderRadius: '4px',
    border: 'none',
    background: active ? '#febd69' : 'transparent',
    color: active ? '#232f3e' : '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    fontWeight: active ? 'bold' : 'normal'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '220px', background: '#232f3e', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ fontSize: '20px' }}>Admin Panel</h2>
        <button onClick={() => setActiveTab('products')} style={sidebarBtnStyle(activeTab==='products')}>Products</button>
        <button onClick={() => setActiveTab('orders')} style={sidebarBtnStyle(activeTab==='orders')}>Orders</button>
        <button onClick={() => { localStorage.removeItem('user'); navigate('/') }} style={{ ...sidebarBtnStyle(), background: '#f44336' }}>Logout</button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', background: '#f5f5f5', overflowY: 'auto' }}>
        {error && <div style={{ background: "#FFF5F5", color: "#E53E3E", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>⚠️ {error}</div>}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <>
            {/* Add/Edit Form */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <h3>{editingProduct ? "✏️ Edit Product" : "➕ Add Product"}</h3>
              {editingProduct && <div style={{ margin: '10px 0', padding: '8px', background: '#E3F2FD', borderRadius: '5px' }}>Editing: {editingProduct.name} <button onClick={cancelEdit} style={{ marginLeft:'10px', background:'#f44336', color:'#fff', border:'none', borderRadius:'4px'}}>Cancel</button></div>}
              <form onSubmit={handleSubmit} style={{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center' }}>
                <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required style={inputStyle}/>
                <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleChange} style={inputStyle}/>
                <input type="number" name="price" placeholder="Price" value={form.price} onChange={handleChange} required min="0" step="0.01" style={inputStyle}/>
                <input type="number" name="stock" placeholder="Stock" value={form.stock} onChange={handleChange} min="0" step="1" style={inputStyle}/>
                <input type="text" name="category" placeholder="Category" value={form.category} onChange={handleChange} style={inputStyle}/>
                <input type="file" name="image" accept="image/*" onChange={handleChange} style={inputStyle}/>
                <button type="submit" disabled={loading} style={{ ...btnStyle, background: loading ? "#ccc" : "linear-gradient(135deg, #ff9900, #f08804)", cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "⏳ Processing..." : editingProduct ? "💾 Update Product" : "➕ Add Product"}</button>
              </form>
            </div>

            {/* Products Grid */}
            <h3>📦 Existing Products</h3>
            <div style={{ display: 'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))', gap:'20px' }}>
              {products.map(p => (
                <div key={p._id} style={{ background:'#fff', borderRadius:'10px', padding:'15px', boxShadow:'0 2px 10px rgba(0,0,0,0.1)', position:'relative' }}>
                  {p.image ? <img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} style={{ width:'100%', height:'180px', objectFit:'cover', borderRadius:'8px'}}/> : <div style={{ width:'100%', height:'180px', background:'#eee', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>📦</div>}
                  <h4>{p.name}</h4>
                  <p style={{ color:'#666', fontSize:'13px', height:'36px', overflow:'hidden' }}>{p.description || "No description"}</p>
                  <div style={{ fontWeight:'bold', fontSize:'16px', color:'#ff9900' }}>₹{p.price.toFixed(2)}</div>
                  <div style={{ marginTop:'5px', fontSize:'12px', color:'#666' }}>Stock: {p.stock} | {p.category}</div>
                  <div style={{ display:'flex', gap:'5px', marginTop:'10px' }}>
                    <button onClick={() => editProduct(p)} style={{ flex:1, padding:'6px', background:'#0073bb', color:'#fff', border:'none', borderRadius:'4px'}}>Edit</button>
                    <button onClick={() => deleteProduct(p._id)} style={{ flex:1, padding:'6px', background:'#d93025', color:'#fff', border:'none', borderRadius:'4px'}}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            <h3>📋 Orders</h3>
            {orders.map(order => (
              <div key={order._id} style={{ background:'#fff', borderRadius:'10px', padding:'15px', marginBottom:'15px', boxShadow:'0 2px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap' }}>
                  <div>
                    <h4>Order #{order._id.slice(-8).toUpperCase()}</h4>
                    <p style={{ fontSize:'13px', color:'#666' }}>👤 {order.customer.name} | {order.customer.email}</p>
                    <p style={{ fontSize:'13px', color:'#666' }}>📅 {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ background:getStatusColor(order.status), color:'#fff', padding:'5px 10px', borderRadius:'12px', fontSize:'12px' }}>{getStatusText(order.status)}</div>
                    <div style={{ fontWeight:'bold', color:'#ff9900' }}>₹{order.totalAmount.toFixed(2)}</div>
                  </div>
                </div>

                <div>📍 {order.deliveryAddress}</div>

                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', margin:'10px 0' }}>
                  {order.items.map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px', background:'#f5f5f5', padding:'5px 8px', borderRadius:'5px' }}>
                      {item.product?.image && <img src={`http://localhost:5000/uploads/${item.product.image}`} alt={item.product.name} style={{ width:'25px', height:'25px', objectFit:'cover', borderRadius:'3px' }}/>}
                      <span style={{ fontSize:'13px', color:'#333' }}>{item.product?.name || "Removed"} x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'flex-end' }}>
                  {order.status === "pending" && <>
                    <button onClick={()=>updateOrderStatus(order._id,'confirmed')} style={{ ...btnStyle, background:'linear-gradient(135deg,#17a2b8,#138496)'}}>✅ Confirm</button>
                    <button onClick={()=>updateOrderStatus(order._id,'cancelled')} style={{ ...btnStyle, background:'#d93025'}}>❌ Cancel</button>
                  </>}
                  {order.status === "confirmed" && <button onClick={()=>updateOrderStatus(order._id,'preparing')} style={{ ...btnStyle, background:'linear-gradient(135deg,#fd7e14,#e55a00)'}}>👨‍🍳 Start Preparing</button>}
                  {order.status === "preparing" && <>
                    <select value={selectedDeliveryPerson[order._id]||''} onChange={(e)=>handleDeliveryPersonChange(order._id,e.target.value)} style={{ padding:'6px', borderRadius:'5px', border:'1px solid #ccc' }}>
                      <option value="">Select Delivery Person</option>
                      {deliveryPersons.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <button disabled={!selectedDeliveryPerson[order._id] || loading} onClick={()=>updateOrderStatus(order._id,'out_for_delivery',selectedDeliveryPerson[order._id])} style={{ ...btnStyle, background: selectedDeliveryPerson[order._id] ? 'linear-gradient(135deg,#007bff,#0056b3)':'#ccc' }}>🚚 Assign</button>
                  </>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// COMMON STYLES
const inputStyle = { flex:'1', minWidth:'120px', padding:'8px', borderRadius:'5px', border:'1px solid #ccc' };
const btnStyle = { padding:'6px 12px', border:'none', borderRadius:'5px', color:'#fff', cursor:'pointer' };
