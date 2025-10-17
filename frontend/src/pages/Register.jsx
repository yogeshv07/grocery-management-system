import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    role: "customer",
    address: ""
  });

  useEffect(() => {
    document.title = "Register";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "role") {
      if (value === "admin") {
        const adminPassword = prompt("Enter admin password for verification:");
        if (adminPassword !== "admin123") {
          alert("Incorrect admin password! Defaulting to customer role.");
          setForm({ ...form, role: "customer" });
          return;
        } else {
          alert("Admin verified! You can register as admin.");
        }
      } else if (value === "delivery") {
        const deliveryPassword = prompt("Enter delivery personnel password for verification:");
        if (deliveryPassword !== "delivery123") {
          alert("Incorrect delivery password! Defaulting to customer role.");
          setForm({ ...form, role: "customer" });
          return;
        } else {
          alert("Delivery verified! You can register as delivery personnel.");
        }
      }
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.role === "admin") {
      const confirmAdmin = window.confirm("You are registering as ADMIN. Proceed?");
      if (!confirmAdmin) return;
    }
    if (form.role === "delivery") {
      const confirmDelivery = window.confirm("You are registering as DELIVERY personnel. Proceed?");
      if (!confirmDelivery) return;
    }
    try {
      const res = await axios.post("http://localhost:5000/api/users/register", form);
      alert(res.data.message);
      setForm({ username:"", name:"", email:"", phone:"", address:"", password:"", role:"customer" });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
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
          .register-card {
            background: #ffffff;
            padding: 40px 32px;
            max-width: 400px;
            width: 100%;
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            text-align: left;
          }

          .register-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 6px;
            color: #111;
          }

          .register-subtitle {
            font-size: 14px;
            color: #555;
            margin-bottom: 24px;
          }

          .form-input, .form-select {
            width: 100%;
            padding: 10px 12px;
            margin-bottom: 16px;
            font-size: 14px;
            border-radius: 4px;
            border: 1px solid #ccc;
          }

          .form-input:focus, .form-select:focus {
            border-color: #f90;
            outline: none;
            box-shadow: 0 0 0 2px rgba(255,153,0,0.2);
          }

          .register-button {
            width: 100%;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #a88734;
            background: #f0c14b;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            color: #111;
            transition: all 0.2s ease;
          }

          .register-button:hover {
            background: #e2b33c;
          }

          .footer-text {
            margin-top: 20px;
            font-size: 12px;
            color: #555;
          }

          .footer-link {
            color: #0066c0;
            text-decoration: none;
          }

          .footer-link:hover {
            text-decoration: underline;
          }

          .role-warning {
            margin-bottom:16px;
            padding:10px;
            border-radius:4px;
            font-size:13px;
            text-align:center;
          }

          .admin-warning { background:#fff3cd; border:1px solid #ffeeba; color:#856404; }
          .delivery-warning { background:#d1ecf1; border:1px solid #bee5eb; color:#0c5460; }
        `}
      </style>

      <div className="register-card">
        <h2 className="register-title">Create account</h2>
        <p className="register-subtitle">Please fill in the details to create your account.</p>

        <form onSubmit={handleSubmit}>
          <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required className="form-input"/>
          <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required className="form-input"/>
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required className="form-input"/>
          <input type="text" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="form-input"/>
          <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} className="form-input"/>
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required className="form-input"/>
          <select name="role" value={form.role} onChange={handleChange} className="form-select">
            <option value="customer">Customer</option>
            <option value="admin">Admin (password required)</option>
            <option value="delivery">Delivery Personnel (password required)</option>
          </select>

          {form.role==="admin" && (
            <div className="role-warning admin-warning">
              Admin registration verified.
            </div>
          )}

          {form.role==="delivery" && (
            <div className="role-warning delivery-warning">
              Delivery registration verified.
            </div>
          )}

          <button type="submit" className="register-button">Create Account</button>
        </form>

        <div className="footer-text">
          Already have an account? <Link to="/login" className="footer-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
