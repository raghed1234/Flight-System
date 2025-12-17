import React, { useState, useEffect } from 'react';
import './AssignmentList.css';

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const API_BASE_URL = 'http://localhost/db-project/backend/api/';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authResponse = await fetch(`${API_BASE_URL}auth-check.php`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const authData = await authResponse.json();
      
      if (!authData.authenticated || authData.user.role !== 'crew') {
        window.location.href = '/';
        return;
      }
      
      fetchAssignments();
      
    } catch (err) {
      setError('Authentication failed');
      window.location.href = '/';
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}AssignmentList.php`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Assignments');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.assignments || []);
      } else {
        throw new Error(data.message || 'Failed to load assignments');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    if (activeTab === 'all') return assignments;
    return assignments.filter(assignment => 
      assignment.flight_status.toLowerCase() === activeTab
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTabCount = (status) => {
    if (status === 'all') return assignments.length;
    return assignments.filter(a => 
      a.flight_status.toLowerCase() === status
    ).length;
  };

  if (loading) {
    return (
      <div className="assignments-loading">
        <div className="loading-spinner"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="assignments-container">
      <div className="assignments-header">
        <h2>Flight Assignments</h2>
        <button 
          onClick={fetchAssignments}
          className="refresh-btn"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="assignments-error">
          <span>{error}</span>
        </div>
      )}

      <div className="assignments-tabs">
        <button 
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({getTabCount('upcoming')})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({getTabCount('completed')})
        </button>
      </div>

      <div className="assignments-content">
        {filterAssignments().length === 0 ? (
          <div className="no-assignments">
            <p>No {activeTab} assignments found</p>
          </div>
        ) : (
          <div className="assignments-grid">
            {filterAssignments().map((assignment) => (
              <div key={assignment.flight_crew_id} className="assignment-card">
                <div className="flight-header">
                  <div className="flight-id">Flight #{assignment.flight_id}</div>
                  <div className={`status-badge ${assignment.flight_status.toLowerCase()}`}>
                    {assignment.flight_status}
                  </div>
                </div>
                
                <div className="flight-route">
                  <div className="airport-section">
                    <div className="airport-code">{assignment.origin_code}</div>
                    <div className="airport-city">{assignment.origin_city}</div>
                  </div>
                  
                  <div className="route-middle">
                    <div className="duration">{assignment.duration_formatted}</div>
                    <div className="flight-arrow">→</div>
                  </div>
                  
                  <div className="airport-section">
                    <div className="airport-code">{assignment.destination_code}</div>
                    <div className="airport-city">{assignment.destination_city}</div>
                  </div>
                </div>
                
                <div className="flight-info">
                  <div className="info-row">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{formatDate(assignment.flight_date)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Time:</span>
                    <span className="info-value">{assignment.departure_time} - {assignment.arrival_time}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Aircraft:</span>
                    <span className="info-value">{assignment.aircraft_model}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Capacity:</span>
                    <span className="info-value">{assignment.capacity} seats</span>
                  </div>
                </div>
                
                {assignment.flight_image && (
                  <div className="flight-image">
                    <img 
                      src={assignment.flight_image} 
                      alt={`Flight ${assignment.flight_id}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentList;