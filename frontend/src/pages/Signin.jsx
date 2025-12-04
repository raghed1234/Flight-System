
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
export default function SignIn() {
   const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate(); // used to redirect

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost/db-project/backend/api/signin.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        // Redirect to home/dashboard
        navigate("/home"); // change to your home route
      } else {
        alert(result.message);
        // If user not found → redirect to signup
        if (result.message === "User not found") {
          navigate("/signup");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-card">
        <h2 className="signin-title">Flight Management System</h2>
        <p className="signin-subtitle">Sign in to continue</p>
        <form className="signin-form" onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        <button type="submit">Sign In</button>
        </form>
        <p className="signin-footer">© 2025 SkyTech Airlines</p>
      </div>

      <style>{`
         
        .signin-page {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
          background: linear-gradient(to right, #0f2027, #203a43, #2c5364);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .signin-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          padding: 40px;
          width: 350px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: white;
        }

        .signin-title {
          font-size: 24px;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }

        .signin-subtitle {
          font-size: 14px;
          margin-bottom: 30px;
          color: #d1d1d1;
        }

        .signin-form input {
          width: 100%;
          padding: 12px 15px;
          margin: 10px 0;
          border-radius: 10px;
          border: none;
          outline: none;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .signin-form input::placeholder {
          color: #d1d1d1;
        }

        .signin-form button {
          width: 100%;
          padding: 12px;
          margin-top: 15px;
          border: none;
          border-radius: 10px;
          background-color: #1db954;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .signin-form button:hover {
          background-color: #1ed760;
        }

        .signin-footer {
          margin-top: 20px;
          font-size: 12px;
          color: #a1a1a1;
        }
      `}</style>
    </div>
  );
}
