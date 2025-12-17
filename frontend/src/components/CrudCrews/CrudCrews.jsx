import React, { useState, useEffect } from 'react';
import './CrudCrews.css';

const CrudCrews = () => {
  const [crews, setCrews] = useState([]);
  const [filteredCrews, setFilteredCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fname: '',
    lname: '',
    rank: '',
    flight_hours: '',
    phone_number: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Base URL for API calls
  const API_BASE_URL = 'http://localhost/db-project/backend/api/';

  useEffect(() => {
    fetchCrews();
  }, []);

  useEffect(() => {
    filterCrews();
  }, [crews, searchTerm]);

  const filterCrews = () => {
    if (!searchTerm.trim()) {
      setFilteredCrews(crews);
      return;
    }

    const filtered = crews.filter(crew =>
      (crew.fname && crew.fname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (crew.lname && crew.lname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (crew.email && crew.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (crew.crew_id && crew.crew_id.toString().includes(searchTerm)) ||
      (crew.rank && crew.rank.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (crew.phone_number && crew.phone_number.includes(searchTerm))
    );
    setFilteredCrews(filtered);
  };

  const fetchCrews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}getCrews.php`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success) {
        const crewsData = data.data || data;
        setCrews(Array.isArray(crewsData) ? crewsData : []);
      } else {
        throw new Error(data.message || 'Failed to fetch crew members');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
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
      email: '',
      password: '',
      fname: '',
      lname: '',
      rank: '',
      flight_hours: '',
      phone_number: ''
    });
    setEditingCrew(null);
    setShowForm(false);
  };

  const validateForm = () => {
    if (!formData.email || !formData.fname || !formData.lname || 
        !formData.rank || !formData.flight_hours) {
      setError('All fields except phone number are required');
      return false;
    }
    
    if (!editingCrew && !formData.password) {
      setError('Password is required for new crew member');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (isNaN(formData.flight_hours) || parseFloat(formData.flight_hours) < 0) {
      setError('Flight hours must be a valid positive number');
      return false;
    }
    
    return true;
  };

  const handleCreateCrew = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setCreating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}createCrews.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Create Response:', data);

      if (data.success) {
        resetForm();
        await fetchCrews();
        alert(data.message || 'Crew member created successfully!');
      } else {
        throw new Error(data.message || 'Failed to create crew member');
      }
    } catch (err) {
      setError(err.message);
      console.error('Create crew error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditCrew = (crew) => {
    setEditingCrew(crew);
    setFormData({
      email: crew.email || '',
      password: '', // Don't pre-fill password for security
      fname: crew.fname || '',
      lname: crew.lname || '',
      rank: crew.rank || '',
      flight_hours: crew.flight_hours || '',
      phone_number: crew.phone_number || ''
    });
    setShowForm(true);
    setError(null);
  };

  const handleUpdateCrew = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setUpdating(true);
      setError(null);

      const updateData = {
        crew_id: editingCrew.crew_id,
        email: formData.email,
        fname: formData.fname,
        lname: formData.lname,
        rank: formData.rank,
        flight_hours: parseFloat(formData.flight_hours),
        phone_number: formData.phone_number || null
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_BASE_URL}updateCrews.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      console.log('Update Response:', data);

      if (data.success) {
        resetForm();
        await fetchCrews();
        alert(data.message || 'Crew member updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update crew member');
      }
    } catch (err) {
      setError(err.message);
      console.error('Update crew error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCrew = async (crewId) => {
    if (!window.confirm('Are you sure you want to delete this crew member?\nThis action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(crewId);
      setError(null);

      const response = await fetch(`${API_BASE_URL}deleteCrews.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crew_id: crewId })
      });

      const data = await response.json();
      console.log('Delete Response:', data);

      if (data.success) {
        await fetchCrews();
        alert(data.message || 'Crew member deleted successfully!');
      } else {
        throw new Error(data.message || 'Failed to delete crew member');
      }
    } catch (err) {
      setError(err.message);
      console.error('Delete crew error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && crews.length === 0) {
    return (
      <div className="crews-container">
        <div className="crews-header">
          <h2 className="crews-title">Manage Crew Members</h2>
        </div>
        <div className="crews-loading">
          <div className="loading-spinner"></div>
          <div>Loading crew members...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="crews-container">
      <div className="crews-header">
        <h2 className="crews-title">Manage Crew Members</h2>
        <div className="header-actions">
          <button 
            onClick={() => {
              if (!showForm) {
                setEditingCrew(null);
                setFormData({
                  email: '',
                  password: '',
                  fname: '',
                  lname: '',
                  rank: '',
                  flight_hours: '',
                  phone_number: ''
                });
              }
              setShowForm(!showForm);
            }}
            className={`crews-btn ${showForm ? 'crews-btn-secondary' : 'crews-btn-primary'}`}
          >
            {showForm ? 'Cancel' : '➕ Add New Crew'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search crew by ID, name, email, rank, or phone..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="crews-search"
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
        <div className="crews-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error: </strong> {error}
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="crews-error-close"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create/Edit Crew Form */}
      {showForm && (
        <div className="crews-form-container">
          <div className="form-header">
            <h3 className="crews-form-title">
              {editingCrew ? '✏️ Edit Crew Member' : '➕ Create New Crew Member'}
            </h3>
            <span className="form-subtitle">
              {editingCrew ? 'Update existing crew member details' : 'Add a new crew member to the system'}
            </span>
          </div>
          <form onSubmit={editingCrew ? handleUpdateCrew : handleCreateCrew}>
            <div className="crews-form-grid">
              <div className="crews-form-group">
                <label className="crews-label">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="fname"
                  value={formData.fname}
                  onChange={handleInputChange}
                  required
                  className="crews-input"
                  placeholder="Enter first name"
                  maxLength="50"
                />
              </div>
              <div className="crews-form-group">
                <label className="crews-label">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="lname"
                  value={formData.lname}
                  onChange={handleInputChange}
                  required
                  className="crews-input"
                  placeholder="Enter last name"
                  maxLength="50"
                />
              </div>
            </div>
            
            <div className="crews-form-group">
              <label className="crews-label">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="crews-input"
                placeholder="crew@example.com"
                maxLength="255"
              />
            </div>

            <div className="crews-form-grid">
              <div className="crews-form-group">
                <label className="crews-label">
                  Rank <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  required
                  className="crews-input"
                  placeholder="e.g., Captain, First Officer, Flight Attendant"
                  maxLength="100"
                />
              </div>
              <div className="crews-form-group">
                <label className="crews-label">
                  Flight Hours <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="flight_hours"
                  value={formData.flight_hours}
                  onChange={handleInputChange}
                  required
                  className="crews-input"
                  placeholder="e.g., 1500.5"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="crews-form-group">
              <label className="crews-label">
                Password {editingCrew ? '(leave blank to keep current)' : <span className="required">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingCrew}
                className="crews-input"
                placeholder={editingCrew ? "Leave blank to keep current" : "Enter password"}
                minLength="6"
              />
              {editingCrew && (
                <div className="password-hint">
                  Leave blank if you don't want to change the password
                </div>
              )}
            </div>

            <div className="crews-form-group">
              <label className="crews-label">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="crews-input"
                placeholder="(123) 456-7890"
                maxLength="20"
              />
              <div className="phone-hint">
                Optional - Must be unique if provided
              </div>
            </div>

            <div className="crews-form-actions">
              <button 
                type="submit" 
                disabled={creating || updating}
                className={`crews-btn ${editingCrew ? 'crews-btn-warning' : 'crews-btn-success'}`}
              >
                {creating && <span className="btn-loading">⏳</span>}
                {updating && <span className="btn-loading">⏳</span>}
                {!creating && !updating && (editingCrew ? '💾 Update Crew' : '✅ Create Crew')}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="crews-btn crews-btn-secondary"
                disabled={creating || updating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Crew List */}
      <div className="table-section">
        <div className="table-header">
          <div className="table-title-container">
            <h3 className="table-title">Crew Members</h3>
            <span className="count-badge">
              {filteredCrews.length} {filteredCrews.length === 1 ? 'crew member' : 'crew members'}
              {searchTerm && filteredCrews.length > 0 && ' found'}
            </span>
          </div>
          {filteredCrews.length > 0 && (
            <div className="table-summary">
              Showing {filteredCrews.length} of {crews.length} total crew members
            </div>
          )}
        </div>
        
        {filteredCrews.length === 0 ? (
          <div className="crews-empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">
                {searchTerm ? '🔍' : '👥'}
              </div>
              <h4>{searchTerm ? 'No matching crew members found' : 'No crew members yet'}</h4>
              <p>
                {searchTerm 
                  ? `No results for "${searchTerm}". Try a different search.`
                  : 'Click "Add New Crew" to create your first crew member'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="crews-btn crews-btn-secondary"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="crews-table-container">
            <table className="crews-table">
              <thead>
                <tr className="crews-table-header">
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Rank</th>
                  <th>Flight Hours</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCrews.map((crew) => (
                  <tr key={crew.crew_id} className={deletingId === crew.crew_id ? 'deleting-row' : ''}>
                    <td className="crew-id">
                      <span className="id-badge">#{crew.crew_id}</span>
                    </td>
                    <td>
                      <div className="crew-name">
                        <div className="crew-fname">{crew.fname}</div>
                        <div className="crew-lname">{crew.lname}</div>
                      </div>
                    </td>
                    <td className="crew-email">
                      <a href={`mailto:${crew.email}`} className="email-link">
                        {crew.email}
                      </a>
                    </td>
                    <td className="crew-rank">
                      <span className="rank-badge">{crew.rank}</span>
                    </td>
                    <td className="crew-hours">
                      <span className="hours-badge">{parseFloat(crew.flight_hours).toFixed(2)} hrs</span>
                    </td>
                    <td className="crew-phone">
                      {crew.phone_number || 'N/A'}
                    </td>
                    <td className="crew-actions">
                      <div className="crews-table-actions">
                        <button 
                          onClick={() => handleEditCrew(crew)}
                          className="crews-action-btn crews-btn-warning"
                          title="Edit crew member"
                          disabled={deletingId === crew.crew_id}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCrew(crew.crew_id)}
                          disabled={deletingId === crew.crew_id}
                          className="crews-action-btn crews-btn-danger"
                          title="Delete crew member"
                        >
                          {deletingId === crew.crew_id ? (
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

export default CrudCrews;