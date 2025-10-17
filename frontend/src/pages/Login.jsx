import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Auto-redirect if user is already logged in
  useEffect(() => {
    document.title = "Login";

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "delivery") navigate("/delivery/dashboard");
      else navigate("/home");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/users/login", {
        username,
        password,
      });

      const user = res.data.user || res.data;
      if (!user || !user.role) {
        alert("Invalid server response");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      alert(`Login successful! Role: ${user.role}`);

      // Redirect based on role
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
      backgroundColor: "#f2f2f2",
      fontFamily: "'Amazon Ember', 'Arial', sans-serif",
      padding: "20px"
    }}>
      <style>
        {`
          .login-card {
            background: #ffffff;
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            border: 1px solid #ddd;
            max-width: 360px;
            width: 100%;
            padding: 36px 32px;
            text-align: left;
          }
          .login-title { font-size: 24px; font-weight: 600; margin-bottom: 6px; color: #111; }
          .login-subtitle { font-size: 14px; color: #555; margin-bottom: 24px; }
          .form-input { width: 100%; padding: 10px 12px; margin-bottom: 16px; font-size: 14px; border-radius: 4px; border: 1px solid #ccc; }
          .form-input:focus { border-color: #f90; outline: none; box-shadow: 0 0 0 2px rgba(255, 153, 0, 0.2); }
          .login-button { width: 100%; padding: 12px; background: #f0c14b; border: 1px solid #a88734; border-radius: 4px; font-size: 16px; font-weight: 500; cursor: pointer; color: #111; transition: all 0.2s ease; }
          .login-button:hover { background: #e2b33c; }
          .login-footer { margin-top: 20px; font-size: 12px; color: #555; }
          .login-link { color: #0066c0; text-decoration: none; }
          .login-link:hover { text-decoration: underline; }
        `}
      </style>

      <div className="login-card">
        <h2 className="login-title">Sign-In</h2>
        <p className="login-subtitle">Welcome back! Please sign in to your account.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Email or mobile phone number"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="form-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
          <button type="submit" className="login-button">Sign-In</button>
        </form>

        <div className="login-footer">
          <p>New to My E-commerce? <Link to="/register" className="login-link">Create your account</Link></p>
        </div>
      </div>
    </div>
  );
}
