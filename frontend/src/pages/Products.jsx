import { useEffect, useState } from "react";
import axios from "axios";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    document.title = "Products";

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
      background: "#f5f5f5",
      overflow: "hidden",
    }}>
      {/* Amazon-style header */}
      <div style={{
        background: "#232f3e",
        padding: "20px 40px",
        borderRadius: "10px",
        color: "#fff",
        fontSize: "28px",
        fontWeight: "bold",
        textAlign: "center",
        boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        marginBottom: "40px",
      }}>
        🛒 Explore Products
      </div>

      {/* Soft glowing grid for subtle texture */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundSize: "60px 60px",
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
        `,
        zIndex: 0,
        opacity: 0.2
      }} />

      <style>{`
        .products-container {
          position: relative;
          z-index: 1;
          padding: 30px;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 25px;
        }

        .product-card {
          background: #fff;
          border-radius: 15px;
          border: 1px solid #e0e0e0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .product-card:hover {
          transform: translateY(-5px) scale(1.03);
          box-shadow: 0 12px 35px rgba(0,0,0,0.25);
        }

        .product-title {
          color: #111;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .product-desc {
          color: #555;
          font-size: 14px;
          margin-bottom: 12px;
          line-height: 1.5;
          min-height: 40px;
        }

        .product-price {
          font-size: 18px;
          font-weight: bold;
          color: #b12704;
          margin-bottom: 6px;
          text-align: center;
        }

        .product-stock {
          font-size: 13px;
          color: #555;
          text-align: center;
        }

        .out-of-stock {
          font-size: 14px;
          color: #d9534f;
          font-weight: bold;
          text-align: center;
          margin-top: 6px;
        }

        @media (max-width: 768px) {
          .products-container {
            padding: 20px;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="products-container">
        <div className="products-grid">
          {products.length > 0 ? products.map((p) => (
            <div 
              key={p._id} 
              className="product-card"
              style={{ opacity: typeof p.stock === 'number' && p.stock <= 0 ? 0.6 : 1 }}
            >
              {p.image && (
                <img 
                  src={`http://localhost:5000/uploads/${p.image}`}
                  alt={p.name}
                  style={{ width: "100%", borderRadius: "10px", marginBottom: "12px", objectFit: "cover" }}
                />
              )}
              <h3 className="product-title">{p.name}</h3>
              <p className="product-desc">{p.description}</p>
              <div className="product-price">₹{p.price}</div>
              <div className="product-stock">
                {typeof p.stock === 'number' ? `In stock: ${p.stock}` : 'In stock: 0'}
              </div>
              {typeof p.stock === 'number' && p.stock <= 0 && (
                <div className="out-of-stock">❌ Out of Stock</div>
              )}
            </div>
          )) : (
            <div style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "50px",
              color: "#555"
            }}>
              <div style={{ fontSize: "60px", marginBottom: "20px" }}>📦</div>
              <h3>No products available</h3>
              <p>Check back soon for new arrivals!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
