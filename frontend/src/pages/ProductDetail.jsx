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
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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

    if (productId) {
      fetchProduct();
      fetchReviews();
    }
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await axios.get(`http://localhost:5000/api/reviews/${productId}`);
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to post a review");
      navigate("/");
      return;
    }

    if (!comment.trim()) {
      alert("Please write a comment");
      return;
    }

    try {
      setSubmittingReview(true);
      await axios.post("http://localhost:5000/api/reviews", {
        productId: product._id,
        customerId: user._id,
        customerName: user.name,
        rating,
        comment: comment.trim(),
      });
      alert("Review posted successfully!");
      setComment("");
      setRating(5);
      fetchReviews();
    } catch (err) {
      alert("Failed to post review: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? "filled" : ""} ${interactive ? "interactive" : ""}`}
          onClick={interactive && onRate ? () => onRate(i) : undefined}
        >
          ★
        </span>
      );
    }
    return stars;
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
              <li>Customer support included</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h2>Customer Reviews</h2>
        
        {/* Add Review Form */}
        <div className="add-review">
          <h3>Write a Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="rating-input">
              <label>Your Rating:</label>
              <div className="stars-input">
                {renderStars(rating, true, setRating)}
              </div>
            </div>
            <div className="comment-input">
              <label>Your Comment:</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows="4"
                required
              />
            </div>
            <button type="submit" disabled={submittingReview} className="submit-review-btn">
              {submittingReview ? "Posting..." : "Post Review"}
            </button>
          </form>
        </div>

        {/* Display Reviews */}
        <div className="reviews-list">
          {reviewsLoading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong>{review.customerName || "Anonymous"}</strong>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="review-stars">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))
          )}
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

        .reviews-section {
          max-width: 1200px;
          margin: 30px auto;
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .reviews-section h2 {
          font-size: 24px;
          margin-bottom: 20px;
          border-bottom: 2px solid #FF9900;
          padding-bottom: 10px;
        }

        .add-review {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .add-review h3 {
          font-size: 18px;
          margin-bottom: 15px;
        }

        .rating-input {
          margin-bottom: 15px;
        }

        .rating-input label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .stars-input {
          display: flex;
          gap: 5px;
        }

        .star {
          font-size: 28px;
          color: #ddd;
          transition: color 0.2s;
        }

        .star.filled {
          color: #FFD814;
        }

        .star.interactive {
          cursor: pointer;
        }

        .star.interactive:hover {
          color: #FFC107;
        }

        .comment-input {
          margin-bottom: 15px;
        }

        .comment-input label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .comment-input textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: Arial, sans-serif;
          resize: vertical;
        }

        .submit-review-btn {
          background-color: #FF9900;
          border: none;
          padding: 10px 30px;
          cursor: pointer;
          font-weight: bold;
          color: white;
          border-radius: 4px;
          font-size: 14px;
        }

        .submit-review-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .submit-review-btn:hover:not(:disabled) {
          background-color: #e68a00;
        }

        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .no-reviews {
          text-align: center;
          color: #888;
          padding: 20px;
          font-style: italic;
        }

        .review-card {
          border: 1px solid #eee;
          padding: 15px;
          border-radius: 8px;
          background: #fafafa;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .reviewer-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .reviewer-info strong {
          font-size: 16px;
          color: #333;
        }

        .review-date {
          font-size: 12px;
          color: #888;
        }

        .review-stars {
          display: flex;
          gap: 2px;
        }

        .review-stars .star {
          font-size: 18px;
        }

        .review-comment {
          font-size: 14px;
          color: #555;
          line-height: 1.6;
          margin: 0;
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
