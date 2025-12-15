import "./Crew.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; // ADD THIS
import CardsCrew from "../../components/CardsCrew/CardsCrew";

const Crew = () => {
    const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true); // ADD THIS

  // 🔴 ADD THIS EFFECT - IMMEDIATE CHECK
  useEffect(() => {
    const forceAuthCheck = async () => {
      try {
        console.log("🛑 ADMIN PAGE: Force checking auth...");
        
        const response = await fetch("http://localhost/db-project/backend/api/auth-check.php", {
          method: 'GET',
          credentials: "include",
          headers: { 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        console.log("🛑 Crew PAGE: Auth result:", data);
        
        if (!data.authenticated || data.user.role !== 'crew') {
          console.log("🛑 Crew PAGE: NOT AUTHORIZED! Redirecting...");
          // Use window.location for FORCE redirect
          window.location.href = '/';
          return;
        }
        
        console.log("🛑 ADMIN PAGE: Authorized, showing page");
        setIsChecking(false);
        
      } catch (error) {
        console.error("🛑 ADMIN PAGE: Check failed", error);
        window.location.href = '/';
      }
    };
    
    forceAuthCheck();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost/db-project/backend/api/logout.php", {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/'; // Full page reload
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // 🔴 SHOW LOADING WHILE CHECKING
  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        🔐 Verifying crew access...
      </div>
    );
  }
  return (
    <>
      <div className="admin-super-wrapper">
        <div className="admin-header">
          <h1>Crew Page</h1>
            <button className="log-out-btn" onClick={handleLogout}>
              Log out
            </button>
        </div>
        
        <CardsCrew />
      </div>
    </>
  );
};

export default Crew;