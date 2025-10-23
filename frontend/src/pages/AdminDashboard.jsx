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
  const [analytics, setAnalytics] = useState({
    salesByDate: [],
    topProducts: [],
    totalRevenue: 0,
    totalOrders: 0,
    statusBreakdown: [],
  });
  const [chartType, setChartType] = useState("line"); // 'line' or 'bar'
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

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const res = await axios.get("http://localhost:5000/api/analytics/sales");
      setAnalytics(res.data);
    } catch (err) {
      setError(`Failed to fetch analytics: ${err.response?.data?.error || err.message}`);
    }
  };

  useEffect(() => {
    document.title = "Admin panel";
    fetchProducts(); fetchOrders(); fetchDeliveryPersons(); fetchAnalytics();
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
        <button onClick={() => setActiveTab('analytics')} style={sidebarBtnStyle(activeTab==='analytics')}>📊 Analytics</button>
        <button onClick={() => setActiveTab('products')} style={sidebarBtnStyle(activeTab==='products')}>📦 Products</button>
        <button onClick={() => setActiveTab('orders')} style={sidebarBtnStyle(activeTab==='orders')}>📋 Orders</button>
        <button onClick={() => { localStorage.removeItem('user'); navigate('/') }} style={{ ...sidebarBtnStyle(), background: '#f44336' }}>🚪 Logout</button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', background: '#f5f5f5', overflowY: 'auto' }}>
        {error && <div style={{ background: "#FFF5F5", color: "#E53E3E", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>⚠️ {error}</div>}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <>
            <h2 style={{ marginBottom: '20px', color: '#232f3e', fontSize: '24px', fontWeight: '700' }}>📊 Sales Analytics Dashboard</h2>
            
            {/* Summary Cards - Amazon Style */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderTop: '4px solid #FF9900' }}>
                <div style={{ fontSize: '13px', color: '#565959', fontWeight: '500', marginBottom: '8px' }}>💰 TOTAL REVENUE</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#0F1111' }}>₹{analytics.totalRevenue.toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: '#007600', marginTop: '5px' }}>✓ Delivered orders only</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderTop: '4px solid #FEBD69' }}>
                <div style={{ fontSize: '13px', color: '#565959', fontWeight: '500', marginBottom: '8px' }}>📦 DELIVERED ORDERS</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#0F1111' }}>{analytics.totalOrders}</div>
                <div style={{ fontSize: '12px', color: '#007600', marginTop: '5px' }}>✓ Successfully completed</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderTop: '4px solid #232F3E' }}>
                <div style={{ fontSize: '13px', color: '#565959', fontWeight: '500', marginBottom: '8px' }}>📊 AVG ORDER VALUE</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#0F1111' }}>₹{analytics.totalOrders > 0 ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2) : '0.00'}</div>
                <div style={{ fontSize: '12px', color: '#565959', marginTop: '5px' }}>Per transaction</div>
              </div>
            </div>

            {/* Sales Chart - Amazon Style */}
            <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e7e7e7', paddingBottom: '10px' }}>
                <h3 style={{ color: '#0F1111', fontWeight: '700', fontSize: '18px', margin: 0 }}>📈 Delivered Orders Revenue (Last 30 Days)</h3>
                
                {/* Chart Type Toggle */}
                <div style={{ display: 'flex', gap: '8px', background: '#F7F8F8', padding: '4px', borderRadius: '6px' }}>
                  <button 
                    onClick={() => setChartType('line')}
                    style={{
                      padding: '6px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      background: chartType === 'line' ? '#FF9900' : 'transparent',
                      color: chartType === 'line' ? '#fff' : '#565959',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    📈 Line
                  </button>
                  <button 
                    onClick={() => setChartType('bar')}
                    style={{
                      padding: '6px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      background: chartType === 'bar' ? '#FF9900' : 'transparent',
                      color: chartType === 'bar' ? '#fff' : '#565959',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    📊 Bar
                  </button>
                </div>
              </div>
              {analytics.salesByDate.length > 0 ? (
                <div style={{ padding: '15px 0' }}>
                  {chartType === 'line' ? (
                  <svg width="100%" height="380" style={{ overflow: 'visible' }}>
                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF9900" stopOpacity="0.5" />
                        <stop offset="50%" stopColor="#FEBD69" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#FFD814" stopOpacity="0.1" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF9900" />
                        <stop offset="50%" stopColor="#F08804" />
                        <stop offset="100%" stopColor="#C45500" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <filter id="shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                    </defs>

                    {/* Background grid */}
                    {(() => {
                      const maxSales = Math.max(...analytics.salesByDate.map(d => d.totalSales));
                      const gridLines = 5;
                      return Array.from({ length: gridLines + 1 }).map((_, i) => {
                        const y = (i / gridLines) * 300;
                        const value = maxSales - (i / gridLines) * maxSales;
                        return (
                          <g key={i}>
                            <line x1="60" y1={y + 20} x2="95%" y2={y + 20} stroke="#f0f0f0" strokeWidth="1" strokeDasharray="8,4" opacity="0.6" />
                            <text x="10" y={y + 25} fill="#999" fontSize="12" fontWeight="500">₹{value.toFixed(0)}</text>
                          </g>
                        );
                      });
                    })()}

                    {/* Chart content */}
                    {(() => {
                      const maxSales = Math.max(...analytics.salesByDate.map(d => d.totalSales));
                      const dataCount = analytics.salesByDate.length;
                      const chartWidth = typeof window !== 'undefined' ? window.innerWidth * 0.75 : 800;
                      
                      const points = analytics.salesByDate.map((day, index) => {
                        const x = 60 + ((index / Math.max(dataCount - 1, 1)) * (chartWidth - 120));
                        const y = 320 - ((day.totalSales / maxSales) * 300);
                        return { x, y, data: day };
                      });

                      // Create smooth curve using quadratic bezier curves
                      const smoothPath = points.map((point, index) => {
                        if (index === 0) return `M ${point.x} ${point.y}`;
                        const prevPoint = points[index - 1];
                        const cpX = (prevPoint.x + point.x) / 2;
                        return `Q ${cpX} ${prevPoint.y}, ${point.x} ${point.y}`;
                      }).join(' ');

                      return (
                        <>
                          {/* Shadow line */}
                          <path
                            d={smoothPath}
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.3"
                            transform="translate(0, 3)"
                          />

                          {/* Area fill with gradient */}
                          <path
                            d={`${smoothPath} L ${points[points.length - 1].x} 320 L 60 320 Z`}
                            fill="url(#salesGradient)"
                            opacity="0.5"
                          >
                            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
                          </path>
                          
                          {/* Main line with glow */}
                          <path
                            d={smoothPath}
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                          />
                          
                          {/* Data points with hover effect */}
                          {points.map((point, index) => {
                            const isHighlight = index % Math.ceil(dataCount / 8) === 0;
                            return (
                              <g key={index}>
                                {/* Outer glow circle */}
                                <circle
                                  cx={point.x}
                                  cy={point.y}
                                  r="8"
                                  fill="#FF9900"
                                  opacity="0.2"
                                >
                                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
                                </circle>
                                
                                {/* Main data point */}
                                <circle
                                  cx={point.x}
                                  cy={point.y}
                                  r="6"
                                  fill="#fff"
                                  stroke="url(#lineGradient)"
                                  strokeWidth="3"
                                  filter="url(#shadow)"
                                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                                  onMouseOver={(e) => { e.target.setAttribute('r', '9'); }}
                                  onMouseOut={(e) => { e.target.setAttribute('r', '6'); }}
                                >
                                  <title>{`📅 ${new Date(point.data._id).toLocaleDateString()}\n💰 Sales: ₹${point.data.totalSales.toFixed(2)}\n📦 Orders: ${point.data.orderCount}`}</title>
                                </circle>

                                {/* Value labels on hover points */}
                                {isHighlight && (
                                  <>
                                    <rect
                                      x={point.x - 25}
                                      y={point.y - 35}
                                      width="50"
                                      height="22"
                                      fill="#232F3E"
                                      rx="3"
                                      opacity="0.95"
                                      filter="url(#shadow)"
                                    />
                                    <text
                                      x={point.x}
                                      y={point.y - 20}
                                      fill="#FEBD69"
                                      fontSize="11"
                                      fontWeight="bold"
                                      textAnchor="middle"
                                    >
                                      ₹{point.data.totalSales.toFixed(0)}
                                    </text>
                                  </>
                                )}
                                
                                {/* X-axis date labels */}
                                {isHighlight && (
                                  <text
                                    x={point.x}
                                    y="350"
                                    fill="#666"
                                    fontSize="11"
                                    fontWeight="500"
                                    textAnchor="middle"
                                  >
                                    {new Date(point.data._id).getDate()}/{new Date(point.data._id).getMonth() + 1}
                                  </text>
                                )}
                              </g>
                            );
                          })}

                          {/* Peak indicator */}
                          {(() => {
                            const maxPoint = points.reduce((max, p) => p.data.totalSales > max.data.totalSales ? p : max);
                            return (
                              <g>
                                <line x1={maxPoint.x} y1={maxPoint.y} x2={maxPoint.x} y2={maxPoint.y - 25} stroke="#FF9900" strokeWidth="2" strokeDasharray="4,2" />
                                <text x={maxPoint.x} y={maxPoint.y - 30} fill="#FF9900" fontSize="16" textAnchor="middle" fontWeight="bold">⭐</text>
                              </g>
                            );
                          })()}
                        </>
                      );
                    })()}

                    {/* Axes with style */}
                    <line x1="60" y1="320" x2="95%" y2="320" stroke="#ddd" strokeWidth="2" />
                    <line x1="60" y1="20" x2="60" y2="320" stroke="#ddd" strokeWidth="2" />
                  </svg>
                  ) : (
                  /* Premium 3D Bar Chart */
                  <div style={{ 
                    position: 'relative',
                    background: 'linear-gradient(to bottom, #FAFAFA 0%, #FFFFFF 100%)',
                    borderRadius: '8px',
                    padding: '20px',
                    paddingBottom: '60px'
                  }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    justifyContent: 'center', 
                    height: '320px', 
                    padding: '40px 60px 0px 80px', 
                    position: 'relative',
                    gap: '6px',
                    borderBottom: '2px solid #232F3E'
                  }}>
                    {/* Enhanced Y-axis grid with labels */}
                    {(() => {
                      const maxSales = Math.max(...analytics.salesByDate.map(d => d.totalSales));
                      const gridHeight = 320; // Match the container height
                      return [0, 1, 2, 3, 4, 5, 6].map((i) => {
                        const yPixels = (i / 6) * gridHeight;
                        const value = (i / 6) * maxSales;
                        return (
                          <div key={i} style={{
                            position: 'absolute',
                            left: '0',
                            right: '0',
                            bottom: `${yPixels}px`,
                            zIndex: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            {/* Y-axis label */}
                            <div style={{
                              position: 'absolute',
                              left: '10px',
                              background: '#FFFFFF',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#232F3E',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              zIndex: 2
                            }}>
                              ₹{value >= 1000 ? (value/1000).toFixed(1) + 'K' : value.toFixed(0)}
                            </div>
                            {/* Grid line - skip baseline since we have border-bottom */}
                            {i > 0 && (
                              <div style={{
                                position: 'absolute',
                                left: '80px',
                                right: '20px',
                                borderTop: '1px dashed #E0E0E0',
                                opacity: '0.4'
                              }} />
                            )}
                          </div>
                        );
                      });
                    })()}
                    
                    {analytics.salesByDate.map((day, index) => {
                      const maxSales = Math.max(...analytics.salesByDate.map(d => d.totalSales));
                      const heightPercent = maxSales > 0 ? (day.totalSales / maxSales) * 100 : 0;
                      const isTopSale = day.totalSales === maxSales;
                      const showLabel = index % Math.ceil(analytics.salesByDate.length / 10) === 0 || index === 0 || index === analytics.salesByDate.length - 1 || isTopSale;
                      
                      return (
                        <div key={index} style={{ 
                          flex: 1, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'flex-end',
                          position: 'relative',
                          zIndex: 1,
                          maxWidth: '45px',
                          minWidth: '20px',
                          height: '100%',
                          paddingBottom: '0'
                        }}>
                          {/* Premium 3D Bar with enhanced styling */}
                          <div 
                            id={`bar-${index}`}
                            style={{
                              width: '100%',
                              height: `${heightPercent}%`,
                              background: isTopSale 
                                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 30%, #FF9900 60%, #C45500 100%)' 
                                : 'linear-gradient(135deg, #FFE599 0%, #FFD814 20%, #FF9900 60%, #F08804 100%)',
                              borderRadius: '10px 10px 0 0',
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              boxShadow: `
                                0 -6px 16px rgba(255, 153, 0, 0.45),
                                inset 0 3px 6px rgba(255, 255, 255, 0.6),
                                inset 0 -3px 6px rgba(0, 0, 0, 0.25),
                                inset 2px 0 4px rgba(255, 255, 255, 0.3)
                              `,
                              minHeight: day.totalSales > 0 ? '20px' : '0',
                              transformStyle: 'preserve-3d',
                              animation: `slideUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.04}s both`
                            }}
                            onMouseOver={(e) => { 
                              e.currentTarget.style.transform = 'translateY(-15px) scale(1.12)'; 
                              e.currentTarget.style.boxShadow = `
                                0 -12px 28px rgba(255, 153, 0, 0.7),
                                inset 0 4px 8px rgba(255, 255, 255, 0.7),
                                inset 0 -4px 8px rgba(0, 0, 0, 0.3),
                                inset 2px 0 6px rgba(255, 255, 255, 0.4)
                              `;
                              e.currentTarget.style.zIndex = '100';
                              // Show tooltip
                              const tooltip = document.getElementById(`tooltip-${index}`);
                              if (tooltip) {
                                tooltip.style.display = 'block';
                                tooltip.style.opacity = '1';
                              }
                            }}
                            onMouseOut={(e) => { 
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = `
                                0 -6px 16px rgba(255, 153, 0, 0.45),
                                inset 0 3px 6px rgba(255, 255, 255, 0.6),
                                inset 0 -3px 6px rgba(0, 0, 0, 0.25),
                                inset 2px 0 4px rgba(255, 255, 255, 0.3)
                              `;
                              e.currentTarget.style.zIndex = '1';
                              // Hide tooltip
                              const tooltip = document.getElementById(`tooltip-${index}`);
                              if (tooltip) {
                                tooltip.style.display = 'none';
                                tooltip.style.opacity = '0';
                              }
                            }}
                          >
                            {/* Enhanced Top Cap (3D effect) */}
                            <div style={{
                              position: 'absolute',
                              top: '-6px',
                              left: '0',
                              right: '0',
                              height: '10px',
                              background: isTopSale 
                                ? 'linear-gradient(135deg, #FFE066 0%, #FFD814 50%, #FFC107 100%)' 
                                : 'linear-gradient(135deg, #FFF9C4 0%, #FFE599 50%, #FFD814 100%)',
                              borderRadius: '10px 10px 0 0',
                              boxShadow: '0 -3px 10px rgba(255, 153, 0, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.5)',
                              borderBottom: 'none'
                            }} />
                            
                            {/* Enhanced Shine effect */}
                            <div style={{
                              position: 'absolute',
                              top: '0',
                              left: '0',
                              width: '40%',
                              height: '100%',
                              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.2), transparent)',
                              borderRadius: '10px 0 0 0',
                              pointerEvents: 'none'
                            }} />
                            
                            {/* Right edge shadow for depth */}
                            <div style={{
                              position: 'absolute',
                              top: '0',
                              right: '0',
                              width: '15%',
                              height: '100%',
                              background: 'linear-gradient(to left, rgba(0, 0, 0, 0.15), transparent)',
                              borderRadius: '0 10px 0 0',
                              pointerEvents: 'none'
                            }} />
                            
                            {/* Top performer trophy with glow */}
                            {isTopSale && (
                              <div style={{
                                position: 'absolute',
                                top: '-50px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 10
                              }}>
                                <div style={{
                                  position: 'relative',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {/* Glow effect */}
                                  <div style={{
                                    position: 'absolute',
                                    width: '40px',
                                    height: '40px',
                                    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.6), transparent)',
                                    borderRadius: '50%',
                                    animation: 'pulse 2s infinite',
                                    top: '-5px',
                                    left: '50%',
                                    transform: 'translateX(-50%)'
                                  }} />
                                  <div style={{
                                    fontSize: '28px',
                                    animation: 'bounce 2s infinite',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                                    position: 'relative',
                                    zIndex: 1
                                  }}>🏆</div>
                                  <div style={{
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    color: '#FF9900',
                                    background: '#232F3E',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                  }}>TOP SALE</div>
                                </div>
                              </div>
                            )}
                            
                            {/* Value label for selected bars */}
                            {showLabel && day.totalSales > 0 && !isTopSale && (
                              <div style={{ 
                                position: 'absolute', 
                                top: '-32px', 
                                left: '50%', 
                                transform: 'translateX(-50%)',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#232F3E',
                                whiteSpace: 'nowrap',
                                background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                boxShadow: '0 3px 8px rgba(0,0,0,0.18)',
                                border: '1.5px solid #FFD814',
                                zIndex: 2
                              }}>
                                ₹{day.totalSales >= 1000 ? (day.totalSales/1000).toFixed(1) + 'K' : day.totalSales.toFixed(0)}
                              </div>
                            )}
                            
                            {/* Interactive Tooltip */}
                            <div 
                              id={`tooltip-${index}`}
                              style={{ 
                                display: 'none',
                                opacity: '0',
                                position: 'absolute', 
                                top: '-95px', 
                                left: '50%', 
                                transform: 'translateX(-50%)',
                                background: '#232F3E',
                                color: '#FFFFFF',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                whiteSpace: 'nowrap',
                                zIndex: 1000,
                                transition: 'opacity 0.2s ease',
                                pointerEvents: 'none',
                                border: '2px solid #FF9900'
                              }}>
                              <div style={{ fontSize: '10px', color: '#FEBD69', fontWeight: '600', marginBottom: '4px' }}>
                                📅 {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFD814', marginBottom: '4px' }}>
                                ₹{day.totalSales.toFixed(2)}
                              </div>
                              <div style={{ fontSize: '10px', color: '#AAB7B8', fontWeight: '500' }}>
                                📦 {day.orderCount} {day.orderCount === 1 ? 'order' : 'orders'}
                              </div>
                              {/* Tooltip arrow */}
                              <div style={{
                                position: 'absolute',
                                bottom: '-8px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '0',
                                height: '0',
                                borderLeft: '8px solid transparent',
                                borderRight: '8px solid transparent',
                                borderTop: '8px solid #FF9900'
                              }} />
                            </div>
                          </div>
                          
                          {/* Date label with enhanced styling - positioned absolutely below baseline */}
                          {showLabel && (
                            <div style={{ 
                              position: 'absolute',
                              bottom: '-30px',
                              left: '50%',
                              transform: 'translateX(-50%) rotate(-35deg)',
                              transformOrigin: 'center center',
                              fontSize: '9px', 
                              color: '#232F3E',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                              textShadow: '0 1px 2px rgba(255,255,255,0.9)',
                              background: 'rgba(255, 255, 255, 0.9)',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              zIndex: 10,
                              pointerEvents: 'none'
                            }}>
                              {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Enhanced keyframes for animations */}
                    <style>{`
                      @keyframes slideUp {
                        from {
                          opacity: 0;
                          transform: translateY(30px) scale(0.8);
                        }
                        to {
                          opacity: 1;
                          transform: translateY(0) scale(1);
                        }
                      }
                      
                      @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                      }
                      
                      @keyframes pulse {
                        0%, 100% { 
                          transform: translateX(-50%) scale(1);
                          opacity: 0.6;
                        }
                        50% { 
                          transform: translateX(-50%) scale(1.3);
                          opacity: 0.3;
                        }
                      }
                    `}</style>
                  </div>
                  </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '60px', textAlign: 'center', color: '#565959', fontSize: '14px', background: '#F7F8F8', borderRadius: '4px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px', color: '#FF9900' }}>📊</div>
                  <div style={{ fontWeight: '600', color: '#0F1111' }}>No sales data available yet</div>
                  <div style={{ fontSize: '13px', marginTop: '8px', color: '#565959' }}>Sales data will appear here once orders are confirmed</div>
                </div>
              )}
            </div>

            {/* Top Selling Products - Amazon Style */}
            <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '15px', color: '#0F1111', fontWeight: '700', fontSize: '18px', borderBottom: '1px solid #e7e7e7', paddingBottom: '10px' }}>🏆 Top Selling Products</h3>
              {analytics.topProducts.length > 0 ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {analytics.topProducts.map((product, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#FAFAFA', borderRadius: '4px', border: '1px solid #DDD', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'} onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#FF9900', minWidth: '35px', background: '#FFF3E0', borderRadius: '4px', padding: '8px', textAlign: 'center' }}>#{index + 1}</div>
                      {product.productImage ? (
                        <img src={`http://localhost:5000/uploads/${product.productImage}`} alt={product.productName} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <div style={{ width: '60px', height: '60px', background: '#ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '16px', color: '#0F1111' }}>{product.productName}</div>
                        <div style={{ fontSize: '13px', color: '#565959', marginTop: '4px' }}>📦 Sold: <strong>{product.totalQuantity}</strong> units</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#B12704' }}>₹{product.totalRevenue.toFixed(2)}</div>
                        <div style={{ fontSize: '11px', color: '#007600', fontWeight: '600' }}>Revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#565959', background: '#F7F8F8', borderRadius: '4px' }}>No product sales data available</div>
              )}
            </div>
          </>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <>
            {/* Add/Edit Form */}
            <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#0F1111', fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>{editingProduct ? "✏️ Edit Product" : "➕ Add Product"}</h3>
              {editingProduct && <div style={{ margin: '10px 0', padding: '10px', background: '#FFF3E0', border: '1px solid #FFD814', borderRadius: '4px', color: '#0F1111' }}><strong>Editing:</strong> {editingProduct.name} <button onClick={cancelEdit} style={{ marginLeft:'10px', background:'#232F3E', color:'#fff', border:'none', borderRadius:'4px', padding:'6px 12px', cursor:'pointer', fontWeight:'600'}}>Cancel</button></div>}
              <form onSubmit={handleSubmit} style={{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center' }}>
                <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required style={inputStyle}/>
                <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleChange} style={inputStyle}/>
                <input type="number" name="price" placeholder="Price" value={form.price} onChange={handleChange} required min="0" step="0.01" style={inputStyle}/>
                <input type="number" name="stock" placeholder="Stock" value={form.stock} onChange={handleChange} min="0" step="1" style={inputStyle}/>
                <input type="text" name="category" placeholder="Category" value={form.category} onChange={handleChange} style={inputStyle}/>
                <input type="file" name="image" accept="image/*" onChange={handleChange} style={inputStyle}/>
                <button type="submit" disabled={loading} style={{ ...btnStyle, background: loading ? "#ccc" : "#FF9900", cursor: loading ? "not-allowed" : "pointer", border: '1px solid #E77600', fontWeight: '600' }}>{loading ? "⏳ Processing..." : editingProduct ? "💾 Update Product" : "➕ Add Product"}</button>
              </form>
            </div>

            {/* Products Grid */}
            <h3 style={{ color: '#0F1111', fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>📦 Existing Products</h3>
            <div style={{ display: 'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))', gap:'20px' }}>
              {products.map(p => (
                <div key={p._id} style={{ background:'#fff', border:'1px solid #ddd', borderRadius:'8px', padding:'15px', boxShadow:'0 2px 4px rgba(0,0,0,0.08)', position:'relative', transition:'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'} onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)'}>
                  {p.image ? <img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} style={{ width:'100%', height:'180px', objectFit:'cover', borderRadius:'8px'}}/> : <div style={{ width:'100%', height:'180px', background:'#eee', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>📦</div>}
                  <h4 style={{ color: '#0F1111', fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{p.name}</h4>
                  <p style={{ color:'#565959', fontSize:'13px', height:'36px', overflow:'hidden', lineHeight:'1.4' }}>{p.description || "No description"}</p>
                  <div style={{ fontWeight:'700', fontSize:'18px', color:'#B12704', marginTop:'8px' }}>₹{p.price.toFixed(2)}</div>
                  <div style={{ marginTop:'6px', fontSize:'12px', color:'#565959' }}><strong>Stock:</strong> {p.stock} {p.category && `| ${p.category}`}</div>
                  <div style={{ display:'flex', gap:'5px', marginTop:'10px' }}>
                    <button onClick={() => editProduct(p)} style={{ flex:1, padding:'8px', background:'#FFD814', color:'#0F1111', border:'1px solid #FCD200', borderRadius:'4px', fontWeight:'600', cursor:'pointer'}}>Edit</button>
                    <button onClick={() => deleteProduct(p._id)} style={{ flex:1, padding:'8px', background:'#fff', color:'#C45500', border:'1px solid #C45500', borderRadius:'4px', fontWeight:'600', cursor:'pointer'}}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            <h3 style={{ color: '#0F1111', fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>📋 Order Management</h3>
            {orders.map(order => (
              <div key={order._id} style={{ background:'#fff', border:'1px solid #ddd', borderRadius:'8px', padding:'15px', marginBottom:'15px', boxShadow:'0 2px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap' }}>
                  <div>
                    <h4 style={{ color: '#0F1111', fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Order #{order._id.slice(-8).toUpperCase()}</h4>
                    <p style={{ fontSize:'13px', color:'#565959', marginTop: '4px' }}>👤 {order.customer.name} | {order.customer.email}</p>
                    <p style={{ fontSize:'13px', color:'#565959', marginTop: '4px' }}>📅 {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ background:getStatusColor(order.status), color:'#fff', padding:'5px 10px', borderRadius:'12px', fontSize:'12px' }}>{getStatusText(order.status)}</div>
                    <div style={{ fontWeight:'700', fontSize: '20px', color:'#B12704' }}>₹{order.totalAmount.toFixed(2)}</div>
                  </div>
                </div>

                <div style={{ color: '#0F1111', fontSize: '14px', marginTop: '10px', padding: '10px', background: '#F7F8F8', borderRadius: '4px' }}>📍 {order.deliveryAddress}</div>

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
                    <button onClick={()=>updateOrderStatus(order._id,'confirmed')} style={{ ...btnStyle, background:'#FF9900', border:'1px solid #E77600', fontWeight:'600', color:'#fff'}}>✅ Confirm</button>
                    <button onClick={()=>updateOrderStatus(order._id,'cancelled')} style={{ ...btnStyle, background:'#fff', border:'1px solid #C45500', color:'#C45500', fontWeight:'600'}}>❌ Cancel</button>
                  </>}
                  {order.status === "confirmed" && <button onClick={()=>updateOrderStatus(order._id,'preparing')} style={{ ...btnStyle, background:'#FFD814', border:'1px solid #FCD200', color:'#0F1111', fontWeight:'600'}}>👨‍🍳 Start Preparing</button>}
                  {order.status === "preparing" && <>
                    <select value={selectedDeliveryPerson[order._id]||''} onChange={(e)=>handleDeliveryPersonChange(order._id,e.target.value)} style={{ padding:'8px 12px', borderRadius:'4px', border:'1px solid #ddd', fontSize:'13px', color:'#0F1111' }}>
                      <option value="">Select Delivery Person</option>
                      {deliveryPersons.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <button disabled={!selectedDeliveryPerson[order._id] || loading} onClick={()=>updateOrderStatus(order._id,'out_for_delivery',selectedDeliveryPerson[order._id])} style={{ ...btnStyle, background: selectedDeliveryPerson[order._id] ? '#FF9900':'#ccc', border: selectedDeliveryPerson[order._id] ? '1px solid #E77600':'1px solid #999', color:'#fff', fontWeight:'600'}}>🚚 Assign</button>
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
