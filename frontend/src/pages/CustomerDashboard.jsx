import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  // Set page title
  useEffect(() => {
    document.title = "Customer Panel";
  }, []);

  useEffect(() => {
    // Redirect to home page for better UX
    navigate("/home");
  }, [navigate]);

  return (
    <div style={{ 
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#FFFFFF",
      fontFamily: "Arial, sans-serif",
      overflow: "hidden"
    }}>
      {/* Grid Background */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundSize: "50px 50px",
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
        `,
        zIndex: 0,
        opacity: 0.3
      }} />
      
      <div style={{
        position: "relative",
        zIndex: 1,
        background: "#FFFFFF",
        borderRadius: "20px",
        border: "1px solid #E0E0E0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        padding: "40px",
        textAlign: "center",
        color: "#333"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔄</div>
        <h2 style={{ margin: "0 0 10px 0" }}>
          Redirecting to Home Page...
        </h2>
        <p style={{ margin: 0, opacity: 0.8, color: "#666" }}>Please wait while we redirect you</p>
      </div>
    </div>
  );
}
