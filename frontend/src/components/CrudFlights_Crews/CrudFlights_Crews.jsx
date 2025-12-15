import React, { useState, useEffect } from 'react';
import './CrudFlights_Crews.css';

const Crew = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    flight_id: '',
    crew_id: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [flights, setFlights] = useState([]);
  const [crewMembers, setCrewMembers] = useState([]);

  // Base URL for API calls
  const API_BASE_URL = 'http://localhost/db-project/backend/api/';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [assignmentsRes, flightsRes, crewRes] = await Promise.all([
        fetch(`${API_BASE_URL}getFlight_Crew.php`),
        fetch(`${API_BASE_URL}getFlights.php`),
        fetch(`${API_BASE_URL}getCrews.php`)
      ]);
      
      const assignmentsData = await assignmentsRes.json();
      const flightsData = await flightsRes.json();
      const crewData = await crewRes.json();
      
      if (assignmentsData.success) {
        setAssignments(Array.isArray(assignmentsData.data) ? assignmentsData.data : []);
      } else {
        throw new Error(assignmentsData.message || 'Failed to fetch assignments');
      }
      
      if (flightsData.success) {
        setFlights(Array.isArray(flightsData.data) ? flightsData.data : []);
      }
      
      if (crewData.success) {
        setCrewMembers(Array.isArray(crewData.data) ? crewData.data : []);
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    if (!searchTerm.trim()) {
      setFilteredAssignments(assignments);
      return;
    }

    const filtered = assignments.filter(assignment =>
      (assignment.fname && assignment.fname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignment.lname && assignment.lname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignment.origin_code && assignment.origin_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignment.destination_code && assignment.destination_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignment.flight_crew_id && assignment.flight_crew_id.toString().includes(searchTerm))
    );
    setFilteredAssignments(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const resetForm = () => {
    setFormData({
      flight_id: '',
      crew_id: ''
    });
    setEditingAssignment(null);
    setShowForm(false);
    setError(null);
  };

  const validateForm = () => {
    if (!formData.flight_id || !formData.crew_id) {
      setError('Both Flight and Crew Member are required');
      return false;
    }
    return true;
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setCreating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}createFlight_Crew.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        await fetchData();
        alert(data.message || 'Crew assigned to flight successfully!');
      } else {
        throw new Error(data.message || 'Failed to create assignment');
      }
    } catch (err) {
      setError(err.message);
      console.error('Create assignment error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      flight_id: assignment.flight_id || '',
      crew_id: assignment.crew_id || ''
    });
    setShowForm(true);
    setError(null);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setUpdating(true);
      setError(null);

      const updateData = {
        flight_crew_id: editingAssignment.flight_crew_id,
        flight_id: formData.flight_id,
        crew_id: formData.crew_id
      };

      const response = await fetch(`${API_BASE_URL}updateFlight_Crew.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        await fetchData();
        alert(data.message || 'Assignment updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update assignment');
      }
    } catch (err) {
      setError(err.message);
      console.error('Update assignment error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAssignment = async (flightCrewId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?\nThis action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(flightCrewId);
      setError(null);

      const response = await fetch(`${API_BASE_URL}deleteFlight_Crew.php?id=${flightCrewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        await fetchData();
        alert(data.message || 'Assignment deleted successfully!');
      } else {
        throw new Error(data.message || 'Failed to delete assignment');
      }
    } catch (err) {
      setError(err.message);
      console.error('Delete assignment error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="crew-container">
        <div className="crew-header">
          <h2 className="crew-title">Manage Crew Assignments</h2>
        </div>
        <div className="crew-loading">
          <div className="loading-spinner"></div>
          <div>Loading crew assignments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="crew-container">
      <div className="crew-header">
        <h2 className="crew-title">Manage Crew Assignments</h2>
        <div className="header-actions">
          <button 
            onClick={() => {
              if (!showForm) {
                setEditingAssignment(null);
                setFormData({
                  flight_id: '',
                  crew_id: ''
                });
              }
              setShowForm(!showForm);
            }}
            className={`crew-btn ${showForm ? 'crew-btn-secondary' : 'crew-btn-primary'}`}
          >
            {showForm ? 'Cancel' : '➕ Assign Crew to Flight'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search assignments by crew name, flight, or ID..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="crew-search"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="clear-search-btn"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="crew-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error: </strong> {error}
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="crew-error-close"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="crew-form-container">
          <div className="form-header">
            <h3 className="crew-form-title">
              {editingAssignment ? '✏️ Edit Assignment' : '➕ New Assignment'}
            </h3>
            <span className="form-subtitle">
              {editingAssignment ? 'Update crew assignment to flight' : 'Assign crew member to a flight'}
            </span>
          </div>
          <form onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}>
            <div className="crew-form-grid">
              <div className="crew-form-group">
                <label className="crew-label">
                  Flight <span className="required">*</span>
                </label>
                <select
                  name="flight_id"
                  value={formData.flight_id}
                  onChange={handleInputChange}
                  required
                  className="crew-select"
                >
                  <option value="">Select a Flight</option>
                  {flights.map(flight => (
                    <option key={flight.flight_id} value={flight.flight_id}>
                      {flight.origin_code} → {flight.destination_code} - {new Date(flight.departure_time).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="crew-form-group">
                <label className="crew-label">
                  Crew Member <span className="required">*</span>
                </label>
                <select
                  name="crew_id"
                  value={formData.crew_id}
                  onChange={handleInputChange}
                  required
                  className="crew-select"
                >
                  <option value="">Select Crew Member</option>
                  {crewMembers.map(crew => (
                    <option key={crew.crew_id} value={crew.crew_id}>
                      {crew.fname} {crew.lname} ({crew.rank})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="crew-form-actions">
              <button 
                type="submit" 
                disabled={creating || updating}
                className={`crew-btn ${editingAssignment ? 'crew-btn-warning' : 'crew-btn-success'}`}
              >
                {creating && <span className="btn-loading">⏳</span>}
                {updating && <span className="btn-loading">⏳</span>}
                {!creating && !updating && (editingAssignment ? '💾 Update Assignment' : '✅ Create Assignment')}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="crew-btn crew-btn-secondary"
                disabled={creating || updating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments List */}
      <div className="table-section">
        <div className="table-header">
          <div className="table-title-container">
            <h3 className="table-title">Crew Assignments</h3>
            <span className="count-badge">
              {filteredAssignments.length} {filteredAssignments.length === 1 ? 'assignment' : 'assignments'}
              {searchTerm && filteredAssignments.length > 0 && ' found'}
            </span>
          </div>
          {filteredAssignments.length > 0 && (
            <div className="table-summary">
              Showing {filteredAssignments.length} of {assignments.length} total assignments
            </div>
          )}
        </div>
        
        {filteredAssignments.length === 0 ? (
          <div className="crew-empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">
                {searchTerm ? '🔍' : '👥'}
              </div>
              <h4>{searchTerm ? 'No matching assignments found' : 'No crew assignments yet'}</h4>
              <p>
                {searchTerm 
                  ? `No results for "${searchTerm}". Try a different search.`
                  : 'Click "Assign Crew to Flight" to create your first assignment'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="crew-btn crew-btn-secondary"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="crew-table-container">
            <table className="crew-table">
              <thead>
                <tr className="crew-table-header">
                  <th>ID</th>
                  <th>Crew Member</th>
                  <th>Rank</th>
                  <th>Flight Route</th>
                  <th>Departure Time</th>
                  <th>Aircraft</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.flight_crew_id} className={deletingId === assignment.flight_crew_id ? 'deleting-row' : ''}>
                    <td className="assignment-id">
                      <span className="id-badge">#{assignment.flight_crew_id}</span>
                    </td>
                    <td className="crew-name">
                      <strong>{assignment.fname} {assignment.lname}</strong>
                      <div className="crew-email">{assignment.email}</div>
                    </td>
                    <td className="crew-rank">
                      <span className="rank-badge">{assignment.rank}</span>
                    </td>
                    <td className="flight-route">
                      <div className="route-display">
                        <span className="origin">{assignment.origin_code}</span>
                        <span className="arrow">→</span>
                        <span className="destination">{assignment.destination_code}</span>
                      </div>
                      <div className="route-cities">
                        {assignment.origin_city} → {assignment.destination_city}
                      </div>
                    </td>
                    <td className="departure-time">
                      {new Date(assignment.departure_time).toLocaleString()}
                    </td>
                    <td className="aircraft-info">
                      <div>{assignment.aircraft_model}</div>
                      <div className="capacity">Capacity: {assignment.capacity}</div>
                    </td>
                    <td className="assignment-actions">
                      <div className="crew-table-actions">
                        <button 
                          onClick={() => handleEditAssignment(assignment)}
                          className="crew-action-btn crew-btn-warning"
                          title="Edit assignment"
                          disabled={deletingId === assignment.flight_crew_id}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteAssignment(assignment.flight_crew_id)}
                          disabled={deletingId === assignment.flight_crew_id}
                          className="crew-action-btn crew-btn-danger"
                          title="Delete assignment"
                        >
                          {deletingId === assignment.flight_crew_id ? (
                            <span className="btn-loading">⏳</span>
                          ) : (
                            '🗑️ Delete'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Crew;