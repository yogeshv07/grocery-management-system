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

  // Set page title
  useEffect(() => {
    document.title = "📝 Register - Management System";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If user selects admin role, verify password
    if (name === "role" && value === "admin") {
      const adminPassword = prompt("🔐 Admin Registration Verification\n\nPlease enter the admin password to register as admin:");
      
      if (adminPassword !== "admin123") {
        alert("❌ Incorrect admin password! Registration as admin denied.");
        // Reset to customer role
        setForm({ ...form, role: "customer" });
        return;
      } else {
        alert("✅ Admin password verified! You can now register as admin.");
      }
    }
    
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final verification for admin registration
    if (form.role === "admin") {
      const finalConfirm = window.confirm("🔐 Final Confirmation\n\nYou are about to register as an ADMIN user with full system privileges.\n\nAre you sure you want to proceed?");
      if (!finalConfirm) {
        return;
      }
    }
    
    try {
      const res = await axios.post("http://localhost:5000/api/users/register", form);
      alert(`✅ ${res.data.message}\n\n${form.role === "admin" ? "🔑 Admin account created successfully!" : "🎉 Welcome to the platform!"}`);
      setForm({
        username: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        role: "customer"
      });
    } catch (err) {
      if (err.response) {
        alert(`❌ Registration Failed\n\n${err.response.data.message}`);
      } else if (err.request) {
        alert("❌ Server Error\n\nServer did not respond. Please check if the backend is running!");
      } else {
        alert("❌ Error: " + err.message);
      }
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      padding: "20px",
      position: "relative"
    }}>
      {/* Light Background Pattern */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(0,123,255,0.05) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(40,167,69,0.05) 0%, transparent 50%)
        `,
        zIndex: 0
      }} />
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          .register-form {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 480px;
            padding: 50px 40px;
            border-radius: 20px;
            background: #ffffff;
            box-shadow: 
              0 10px 30px rgba(0, 0, 0, 0.08),
              0 2px 10px rgba(0, 0, 0, 0.04);
            border: 1px solid #e9ecef;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .register-form:hover {
            transform: translateY(-3px);
            box-shadow: 
              0 15px 40px rgba(0, 0, 0, 0.12),
              0 5px 15px rgba(0, 0, 0, 0.06);
          }
          
          .form-input {
            width: 100%;
            marginBottom: 20px;
            padding: 16px 20px;
            border-radius: 12px;
            border: 2px solid #e9ecef;
            outline: none;
            fontSize: 15px;
            background: #ffffff;
            color: #495057;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .form-input:focus {
            border: 2px solid #007bff;
            background: #ffffff;
            box-shadow: 
              0 0 0 4px rgba(0, 123, 255, 0.1),
              0 4px 15px rgba(0, 123, 255, 0.08);
            transform: translateY(-1px);
          }
          
          .form-input::placeholder {
            color: #6c757d;
            font-weight: 400;
          }
          
          .form-select {
            width: 100%;
            marginBottom: 20px;
            padding: 16px 20px;
            border-radius: 12px;
            border: 2px solid #e9ecef;
            outline: none;
            fontSize: 15px;
            background: #ffffff;
            color: #495057;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          }
          
          .form-select:focus {
            border: 2px solid #007bff;
            background: #ffffff;
            box-shadow: 
              0 0 0 4px rgba(0, 123, 255, 0.1),
              0 4px 15px rgba(0, 123, 255, 0.08);
            transform: translateY(-1px);
          }
          
          .submit-btn {
            width: 100%;
            padding: 18px 24px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            fontWeight: 600;
            fontSize: 16px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
            position: relative;
            overflow: hidden;
          }
          
          .submit-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          
          .submit-btn:hover::before {
            left: 100%;
          }
          
          .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
            background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
          }
          
          .submit-btn:active {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
          }
          
          .register-link {
            color: #007bff;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            position: relative;
          }
          
          .register-link::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -2px;
            left: 0;
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            transition: width 0.3s ease;
          }
          
          .register-link:hover::after {
            width: 100%;
          }
          
          .register-link:hover {
            color: #0056b3;
          }
          
          @media (max-width: 768px) {
            .register-form {
              padding: 40px 30px;
              margin: 10px;
              max-width: 100%;
            }
            
            .form-input, .form-select {
              padding: 14px 18px;
              fontSize: 14px;
            }
            
            .submit-btn {
              padding: 16px 20px;
              fontSize: 15px;
            }
          }
        `}
      </style>

      <div className="register-form">
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            boxShadow: "0 4px 15px rgba(0, 123, 255, 0.2)"
          }}>
            👤
          </div>
          <h2 style={{ 
            margin: "0 0 12px 0", 
            color: "#343a40", 
            fontSize: "32px", 
            fontWeight: "700"
          }}>
            Create Account
          </h2>
          <p style={{ 
            margin: "0", 
            color: "#6c757d", 
            fontSize: "16px",
            fontWeight: "500",
            lineHeight: "1.5"
          }}>
            Join our professional platform and start your journey today
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="username" 
            placeholder="Username" 
            value={form.username} 
            onChange={handleChange} 
            required 
            className="form-input"
          />
          <input 
            type="text" 
            name="name" 
            placeholder="Full Name" 
            value={form.name} 
            onChange={handleChange} 
            required 
            className="form-input"
          />
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            className="form-input"
          />
          <input 
            type="text" 
            name="phone" 
            placeholder="Phone" 
            value={form.phone} 
            onChange={handleChange} 
            className="form-input"
          />
          <input 
            type="text" 
            name="address" 
            placeholder="Address" 
            value={form.address} 
            onChange={handleChange} 
            className="form-input"
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={form.password} 
            onChange={handleChange} 
            required 
            className="form-input"
          />
          <select 
            name="role" 
            value={form.role} 
            onChange={handleChange} 
            className="form-select"
            title="Select your account type. Admin requires special verification."
          >
            <option value="customer">👤 Customer</option>
            <option value="admin">🔐 Admin (Password Required)</option>
            <option value="delivery">🚚 Delivery Personnel</option>
          </select>
          
          {form.role === "admin" && (
            <div style={{
              marginBottom: "20px",
              padding: "12px 16px",
              background: "rgba(255, 193, 7, 0.1)",
              border: "1px solid rgba(255, 193, 7, 0.3)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#856404",
              textAlign: "center"
            }}>
              🔐 <strong>Admin Registration:</strong> You have been verified to create an admin account with full system privileges.
            </div>
          )}
          
          <button type="submit" className="submit-btn">
            Create Account
          </button>
        </form>
        
        <div style={{ 
          marginTop: "32px", 
          fontSize: "15px", 
          color: "#6c757d",
          textAlign: "center",
          fontWeight: "500"
        }}>
          Already have an account?{" "}
          <Link to="/login" className="register-link">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
