import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // REMOVED the auto-redirect useEffect!
  // Login page should always show, let App.jsx handle redirects
  
  const redirectBasedOnRole = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'crew':
        navigate('/crew');
        break;
      case 'passenger':
        navigate('/home');
        break;
      default:
        navigate('/home');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };
  
  const validateForm = () => {
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost/db-project/backend/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (data.status === 'success') {
        // Store user data
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(data.user));
        
        // Update user state in App.jsx
        if (setUser) {
          setUser(data.user);
        }
        
        // Show success message briefly
        setError('Login successful! Redirecting...');
        
        // Redirect based on role
        setTimeout(() => {
          redirectBasedOnRole(data.user.role);
        }, 1000);
        
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };
  
  const handleSignup = () => {
    navigate('/signup');
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your Flight System account</p>
        </div>
        
        {error && (
          <div className={`error-message ${error.includes('successful') ? 'success' : ''}`}>
            {error.includes('successful') ? '✓ ' : '✗ '}
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMe}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            
            <button 
              type="button" 
              className="forgot-password"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : 'Sign In'}
          </button>
          
          <div className="login-footer">
            <p className="signup-link">
              Don't have an account?{' '}
              <button 
                type="button" 
                className="signup-btn-link"
                onClick={handleSignup}
              >
                Sign up here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;