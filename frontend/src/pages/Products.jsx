import { useEffect, useState } from "react";
import axios from "axios";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Set page title
    document.title = "🛍️ Products - Management System";
    
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products");
        setProducts(res.data);
      } catch (err) {
        alert("Failed to fetch products");
      }
    };
    
    fetchProducts();
  }, []);

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      padding: "40px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      overflow: "hidden",
    }}>
      {/* Soft glowing grid */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundSize: "60px 60px",
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        zIndex: 0,
        opacity: 0.2
      }} />

      <style>{`
        .products-container {
          position: relative;
          z-index: 1;
          padding: 40px;
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 25px;
          margin-top: 30px;
        }

        .product-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 25px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.4s ease;
          cursor: pointer;
        }

        .product-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          background: rgba(255, 255, 255, 0.15);
        }

        .product-title {
          color: #fff;
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .product-desc {
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          margin-bottom: 15px;
          line-height: 1.4;
        }

        .product-price {
          font-size: 18px;
          font-weight: bold;
          color: #ffdd59;
          text-align: center;
        }

        @media (max-width: 768px) {
          .products-container {
            padding: 25px;
          }
          
          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="products-container">
        <h2 style={{
          color: "#fff",
          textAlign: "center",
          fontSize: "36px",
          marginBottom: "35px",
          textShadow: "0 0 20px rgba(255,255,255,0.3)"
        }}>
          🛒 Our Products
        </h2>

        <div className="products-grid">
          {products.length > 0 ? (
            products.map((p) => (
              <div 
                key={p._id} 
                className="product-card"
                style={{ opacity: typeof p.stock === 'number' && p.stock <= 0 ? 0.6 : 1 }}
              >
                <h3 className="product-title">{p.name}</h3>
                <p className="product-desc">{p.description}</p>
                <div className="product-price">₹{p.price}</div>
                <div style={{ color: '#fff', marginTop: '10px', fontSize: '14px' }}>
                  {typeof p.stock === 'number' ? `In stock: ${p.stock}` : 'In stock: 0'}
                </div>
                {typeof p.stock === 'number' && p.stock <= 0 && (
                  <div style={{ marginTop: '8px', color: '#ff6b6b', fontWeight: 'bold' }}>
                    ❌ Out of Stock
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{
              gridColumn: "1/-1",
              textAlign: "center",
              color: "#fff",
              padding: "50px"
            }}>
              <div style={{ fontSize: "60px", marginBottom: "20px" }}>📦</div>
              <h3>No products available</h3>
              <p style={{ opacity: 0.8 }}>Check back soon for new arrivals!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
