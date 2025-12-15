import React, { useState, useEffect } from 'react';
import './AssignmentList.css';

const CrewAssignments = ({ crewId }) => {
  const [assignments, setAssignments] = useState([]);
  const [crewInfo, setCrewInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const API_BASE_URL = 'http://localhost/db-project/backend/api/';

  useEffect(() => {
    if (crewId) {
      fetchAssignments();
    }
  }, [crewId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}AssignmentList.php?crew_id=${crewId}`);
      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.assignments);
        setCrewInfo(data.crew_info);
      } else {
        throw new Error(data.message || 'Failed to fetch assignments');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = (status) => {
    if (status === 'all') return assignments;
    return assignments.filter(assignment => assignment.flight_status === status);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Upcoming': return 'status-upcoming';
      case 'In Progress': return 'status-inprogress';
      case 'Completed': return 'status-completed';
      default: return 'status-default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTabCount = (status) => {
    if (status === 'all') return assignments.length;
    return assignments.filter(a => a.flight_status === status).length;
  };

  if (loading) {
    return (
      <div className="crew-assignments-container">
        <div className="assignments-loading">
          <div className="loading-spinner"></div>
          <p>Loading your flight assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crew-assignments-container">
      {/* Header with Crew Info */}
      <div className="assignments-header">
        <div className="crew-welcome">
          <h2>👨‍✈️ Flight Assignments</h2>
          {crewInfo && (
            <div className="crew-details">
              <div className="crew-name">{crewInfo.fname} {crewInfo.lname}</div>
              <div className="crew-rank">{crewInfo.rank}</div>
              <div className="crew-hours">Total Hours: {crewInfo.flight_hours || 0}</div>
            </div>
          )}
        </div>
        <button 
          onClick={fetchAssignments}
          className="refresh-btn"
          title="Refresh assignments"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="assignments-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {/* Stats Summary */}
      {assignments.length > 0 && (
        <div className="assignments-stats">
          <div className="stat-card">
            <div className="stat-number">{getTabCount('Upcoming')}</div>
            <div className="stat-label">Upcoming</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{getTabCount('In Progress')}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{getTabCount('Completed')}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{assignments.length}</div>
            <div className="stat-label">Total Assignments</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="assignments-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Flights ({getTabCount('all')})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('Upcoming')}
        >
          Upcoming ({getTabCount('Upcoming')})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'In Progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('In Progress')}
        >
          In Progress ({getTabCount('In Progress')})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('Completed')}
        >
          Completed ({getTabCount('Completed')})
        </button>
      </div>

      {/* Assignments List */}
      <div className="assignments-list">
        {filterAssignments(activeTab).length === 0 ? (
          <div className="no-assignments">
            <div className="empty-icon">✈️</div>
            <h3>No {activeTab === 'all' ? '' : activeTab.toLowerCase()} assignments</h3>
            <p>
              {activeTab === 'all' 
                ? "You don't have any flight assignments yet." 
                : `You don't have any ${activeTab.toLowerCase()} flights.`}
            </p>
          </div>
        ) : (
          filterAssignments(activeTab).map((assignment) => (
            <div key={assignment.flight_crew_id} className="assignment-card">
              <div className="assignment-header">
                <div className="flight-route">
                  <div className="origin">
                    <span className="airport-code">{assignment.origin_code}</span>
                    <span className="city">{assignment.origin_city}</span>
                  </div>
                  <div className="route-separator">
                    <div className="duration">{assignment.duration_formatted}</div>
                    <div className="arrow">→</div>
                  </div>
                  <div className="destination">
                    <span className="airport-code">{assignment.destination_code}</span>
                    <span className="city">{assignment.destination_city}</span>
                  </div>
                </div>
                <div className={`status-badge ${getStatusBadgeClass(assignment.flight_status)}`}>
                  {assignment.flight_status}
                </div>
              </div>
              
              <div className="assignment-details">
                <div className="detail-group">
                  <div className="detail-label">Flight ID</div>
                  <div className="detail-value">#{assignment.flight_id}</div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Date</div>
                  <div className="detail-value">{formatDate(assignment.departure_datetime)}</div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Time</div>
                  <div className="detail-value">
                    {assignment.departure_time} - {assignment.arrival_time}
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Aircraft</div>
                  <div className="detail-value">{assignment.aircraft_model}</div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Capacity</div>
                  <div className="detail-value">{assignment.capacity} seats</div>
                </div>
              </div>
              
              <div className="assignment-actions">
                <button className="view-details-btn">View Flight Details</button>
                {assignment.flight_status === 'Upcoming' && (
                  <button className="checkin-btn">Check-in</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Crew Card (Example of how to use this component) */}
      <div className="usage-note" style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
        <h4>How to use:</h4>
        <p>Pass the crew ID as a prop when crew logs in:</p>
        <pre>{`<CrewAssignments crewId={loggedInCrewId} />`}</pre>
      </div>
    </div>
  );
};

export default CrewAssignments;