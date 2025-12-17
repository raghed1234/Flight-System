import React, { useState, useEffect } from 'react';
import './CrewProfile.css';

const CrewProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_BASE_URL = 'http://localhost/db-project/backend/api/';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching profile from:', `${API_BASE_URL}CrewProfile.php`);
      
      const response = await fetch(`${API_BASE_URL}CrewProfile.php`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      // Check if response is empty
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('Raw response:', text);
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      
      if (data.success) {
        console.log('Profile data received:', data.profile);
        setProfile(data.profile);
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchProfile();
  };

  const getInitials = (fname, lname) => {
    if (!fname || !lname) return '??';
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Crew Profile</h2>
        <button 
          onClick={handleRefresh}
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} style={{background:'none',border:'none',color:'white',cursor:'pointer'}}>×</button>
        </div>
      )}

      {profile ? (
        <div className="profile-card">
          {/* Header with Avatar */}
          <div className="profile-header-section">
            <div className="avatar">
              {getInitials(profile.fname, profile.lname)}
            </div>
            <div className="profile-info">
              <h3>{profile.fname} {profile.lname}</h3>
              <p className="profile-rank">
                ⭐ {profile.rank || 'Crew Member'}
              </p>
              <p className="profile-email">
                ✉️ {profile.email}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="profile-details-grid">
            <div className="details-section">
              <h4>👤 Personal Information</h4>
              <div className="detail-row">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value">{profile.fname} {profile.lname}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{profile.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">{profile.role}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Rank:</span>
                <span className="detail-value">{profile.rank || 'Not specified'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{profile.phone_number || 'Not provided'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Crew ID:</span>
                <span className="detail-value highlight">{profile.user_id}</span>
              </div>
            </div>

            <div className="details-section">
              <h4>📊 Flight Statistics</h4>
             
              <div className="detail-row">
                <span className="detail-label">Total Flights:</span>
                <span className="detail-value">{profile.total_flights || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Upcoming:</span>
                <span className="detail-value" style={{color: '#fbbf24'}}>
                  {profile.upcoming_flights || 0}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Completed:</span>
                <span className="detail-value" style={{color: '#10b981'}}>
                  {profile.completed_flights || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            <button className="action-btn edit-profile-btn">
              <span>✏️</span> Edit Profile
            </button>
            <button className="action-btn change-password-btn">
              <span>🔒</span> Change Password
            </button>
            <button className="action-btn view-assignments-btn">
              <span>✈️</span> View Assignments
            </button>
          </div>
        </div>
      ) : (
        !error && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#1e293b',
            borderRadius: '10px',
            color: '#94a3b8'
          }}>
            <p>No profile data available</p>
            <button 
              onClick={handleRefresh}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default CrewProfile;