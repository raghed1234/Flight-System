import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fname: '',
    lname: '',
    phone_number: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Check required fields
    if (!formData.email || !formData.password || !formData.confirmPassword || 
        !formData.fname || !formData.lname || !formData.phone_number) {
      setError('All fields are required');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Name validation
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(formData.fname) || !nameRegex.test(formData.lname)) {
      setError('Name can only contain letters and spaces');
      return false;
    }
    
    // Phone validation (basic)
    const phoneRegex = /^[0-9\-\+\(\)\s]{10,20}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError('Please enter a valid phone number');
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
      
      const response = await fetch('http://localhost/db-project/backend/api/signup.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fname: formData.fname,
          lname: formData.lname,
          phone_number: formData.phone_number
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          fname: '',
          lname: '',
          phone_number: ''
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
        
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoginRedirect = () => {
    navigate('/');
  };
  
  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Create Passenger Account</h2>
        <p className="signup-subtitle">Join our flight system and book your flights</p>
        
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <strong>Success:</strong> {success}
            <div className="redirect-countdown">
              Redirecting to login page in 3 seconds...
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fname">First Name *</label>
              <input
                type="text"
                id="fname"
                name="fname"
                value={formData.fname}
                onChange={handleChange}
                placeholder="John"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lname">Last Name *</label>
              <input
                type="text"
                id="lname"
                name="lname"
                value={formData.lname}
                onChange={handleChange}
                placeholder="Doe"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone_number">Phone Number *</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+1234567890"
              required
              disabled={loading}
            />
            <small className="hint">Format: +1234567890 or 123-456-7890</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="signup-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Account...
              </>
            ) : 'Create Account'}
          </button>
          
          <div className="signup-footer">
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                className="login-link"
                onClick={handleLoginRedirect}
                disabled={loading}
              >
                Login here
              </button>
            </p>
            <p className="note">
              * Only passengers can sign up here. Crew & Admin accounts are created by administrators.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;