import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    document.title = "Product Details - Shop";

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/products/${productId}`);
        setProduct(res.data);
        document.title = res.data.name + " - Shop";
      } catch (err) {
        setError("Failed to fetch product: " + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

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
        quantity,
      });
      alert("Item added to cart!");
    } catch (err) {
      alert("Failed to add to cart: " + (err.response?.data?.error || err.message));
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (error) return <div className="error-screen">{error}</div>;
  if (!product) return <div className="error-screen">Product not found</div>;

  return (
    <div className="container">
      <div className="breadcrumb">
        <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Home</span> {" > "} {product.name}
      </div>

      <div className="product-detail">
        {/* Left side - Images */}
        <div className="product-images">
          {product.image ? (
            <img src={`http://localhost:5000/uploads/${product.image}`} alt={product.name} />
          ) : (
            <div className="placeholder">🛍️</div>
          )}
        </div>

        {/* Right side - Details */}
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="price">₹{product.price.toFixed(2)}</p>
          <div className="stock">{product.stock > 0 ? `In Stock: ${product.stock}` : "Out of Stock"}</div>
          <p className="description">{product.description || "No description available."}</p>

          <div className="quantity-section">
            <label>Quantity:</label>
            <div className="quantity-controls">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}>+</button>
            </div>
          </div>

          <button 
            className="add-to-cart" 
            onClick={handleAddToCart} 
            disabled={addingToCart || product.stock <= 0}
          >
            {addingToCart ? "Adding..." : product.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
          <button className="buy-now" onClick={() => alert("Proceed to Buy Now")}>Buy Now</button>

          <div className="features">
            <h4>Product Features:</h4>
            <ul>
              <li>High quality materials</li>
              <li>Fast delivery</li>
              <li>30-day return policy</li>
              <li>Customer support included</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          background: #f5f5f5;
        }

        .breadcrumb {
          font-size: 14px;
          margin-bottom: 20px;
          color: #555;
        }

        .product-detail {
          display: flex;
          gap: 40px;
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .product-images {
          flex: 1;
          min-width: 400px;
        }

        .product-images img {
          width: 100%;
          border-radius: 8px;
        }

        .placeholder {
          height: 400px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #eee;
          font-size: 60px;
          border-radius: 8px;
        }

        .product-info {
          flex: 1;
          min-width: 400px;
          display: flex;
          flex-direction: column;
        }

        .product-info h1 {
          font-size: 28px;
          margin-bottom: 15px;
        }

        .price {
          font-size: 24px;
          color: #B12704;
          margin-bottom: 10px;
        }

        .stock {
          margin-bottom: 20px;
          color: ${product.stock > 0 ? "#007600" : "#B12704"};
        }

        .description {
          font-size: 14px;
          color: #555;
          margin-bottom: 20px;
        }

        .quantity-section {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .quantity-controls button {
          padding: 5px 10px;
          font-size: 16px;
          cursor: pointer;
        }

        .quantity-controls span {
          display: inline-block;
          min-width: 30px;
          text-align: center;
        }

        .add-to-cart {
          background-color: #FFD814;
          border: 1px solid #FCD200;
          padding: 10px;
          margin-bottom: 10px;
          cursor: pointer;
          font-weight: bold;
        }

        .add-to-cart:disabled {
          background: #eee;
          cursor: not-allowed;
        }

        .buy-now {
          background-color: #FF9900;
          border: none;
          padding: 10px;
          cursor: pointer;
          font-weight: bold;
          color: white;
        }

        .features {
          margin-top: 30px;
        }

        .features ul {
          padding-left: 20px;
        }

        .loading-screen, .error-screen {
          height: 80vh;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 24px;
        }

        @media(max-width: 768px) {
          .product-detail {
            flex-direction: column;
          }

          .product-images, .product-info {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
