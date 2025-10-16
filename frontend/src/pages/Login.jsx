import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Set page title
  useEffect(() => {
    document.title = "🔐 Login - Management System";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/users/login", {
        username,
        password,
      });

      const user = res.data.user;
      alert(`Login successful! Role: ${user.role}`);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "delivery") navigate("/delivery/dashboard");
      else navigate("/home");
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F8F9FA",
      fontFamily: "'Inter', 'Roboto', sans-serif",
      padding: "20px"
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          .login-card {
            background: #FFFFFF;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #E0E0E0;
            transition: all 0.3s ease;
          }
          
          .login-card:hover {
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          }
          
          .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #E0E0E0;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s ease;
            background: #FFFFFF;
            color: #333;
          }
          
          .form-input:focus {
            outline: none;
            border-color: #007BFF;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
          }
          
          .form-input::placeholder {
            color: #999;
          }
          
          .login-button {
            width: 100%;
            padding: 12px 16px;
            background: #007BFF;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .login-button:hover {
            background: #0056B3;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
          }
          
          .login-link {
            color: #007BFF;
            text-decoration: none;
            font-weight: 500;
          }
          
          .login-link:hover {
            text-decoration: underline;
          }
        `}
      </style>

      {/* Login Card */}
      <div className="login-card" style={{
        width: "100%",
        maxWidth: "400px",
        padding: "40px",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            margin: "0 0 8px 0", 
            color: "#222", 
            fontSize: "28px", 
            fontWeight: "600" 
          }}>
            Welcome Back
          </h2>
          <p style={{ 
            margin: "0", 
            color: "#666", 
            fontSize: "14px" 
          }}>
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <div style={{ marginBottom: "24px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <button
            type="submit"
            className="login-button"
          >
            Sign In
          </button>
        </form>
        
        <div style={{ 
          marginTop: "24px", 
          fontSize: "14px", 
          color: "#666",
          textAlign: "center"
        }}>
          Don't have an account?{" "}
          <Link to="/register" className="login-link">
            Create one here
          </Link>
        </div>
      </div>
    </div>
  );
}
