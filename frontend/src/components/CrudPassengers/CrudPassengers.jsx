import React, { useState, useEffect } from 'react';
import './CrudPassengers.css';

const CrudPassengers = () => {
  const [passengers, setPassengers] = useState([]);
  const [filteredPassengers, setFilteredPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fname: '',
    lname: '',
    phone_number: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Base URL for API calls
  const API_BASE_URL = 'http://localhost/db-project/backend/api/';

  useEffect(() => {
    fetchPassengers();
  }, []);

  useEffect(() => {
    filterPassengers();
  }, [passengers, searchTerm]);

  const filterPassengers = () => {
    if (!searchTerm.trim()) {
      setFilteredPassengers(passengers);
      return;
    }

    const filtered = passengers.filter(passenger =>
      (passenger.fname && passenger.fname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (passenger.lname && passenger.lname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (passenger.email && passenger.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (passenger.passenger_id && passenger.passenger_id.toString().includes(searchTerm)) ||
      (passenger.phone_number && passenger.phone_number.includes(searchTerm))
    );
    setFilteredPassengers(filtered);
  };

  const fetchPassengers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Files are PLURAL: getPassengers.php
      const response = await fetch(`${API_BASE_URL}getPassengers.php`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success) {
        const passengersData = data.data || data;
        setPassengers(Array.isArray(passengersData) ? passengersData : []);
      } else {
        throw new Error(data.message || 'Failed to fetch passengers');
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
      phone_number: ''
    });
    setEditingPassenger(null);
    setShowForm(false);
  };

  const validateForm = () => {
    if (!formData.email || !formData.fname || !formData.lname) {
      setError('Email, First Name, and Last Name are required');
      return false;
    }
    
    if (!editingPassenger && !formData.password) {
      setError('Password is required for new passenger');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleCreatePassenger = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setCreating(true);
      setError(null);

      // Files are PLURAL: createPassengers.php
      const response = await fetch(`${API_BASE_URL}createPassengers.php`, {
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
        await fetchPassengers();
        alert(data.message || 'Passenger created successfully!');
      } else {
        throw new Error(data.message || 'Failed to create passenger');
      }
    } catch (err) {
      setError(err.message);
      console.error('Create passenger error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditPassenger = (passenger) => {
    setEditingPassenger(passenger);
    setFormData({
      email: passenger.email || '',
      password: '', // Don't pre-fill password for security
      fname: passenger.fname || '',
      lname: passenger.lname || '',
      phone_number: passenger.phone_number || ''
    });
    setShowForm(true);
    setError(null);
  };

  const handleUpdatePassenger = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setUpdating(true);
      setError(null);

      const updateData = {
        passenger_id: editingPassenger.passenger_id,
        email: formData.email,
        fname: formData.fname,
        lname: formData.lname,
        phone_number: formData.phone_number
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Files are PLURAL: updatePassengers.php
      const response = await fetch(`${API_BASE_URL}updatePassengers.php`, {
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
        await fetchPassengers();
        alert(data.message || 'Passenger updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update passenger');
      }
    } catch (err) {
      setError(err.message);
      console.error('Update passenger error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePassenger = async (passengerId) => {
    if (!window.confirm('Are you sure you want to delete this passenger?\nThis action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(passengerId);
      setError(null);

      // Files are PLURAL: deletePassengers.php
      const response = await fetch(`${API_BASE_URL}deletePassengers.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passenger_id: passengerId })
      });

      const data = await response.json();
      console.log('Delete Response:', data);

      if (data.success) {
        await fetchPassengers();
        alert(data.message || 'Passenger deleted successfully!');
      } else {
        throw new Error(data.message || 'Failed to delete passenger');
      }
    } catch (err) {
      setError(err.message);
      console.error('Delete passenger error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && passengers.length === 0) {
    return (
      <div className="passengers-container">
        <div className="passengers-header">
          <h2 className="passengers-title">Manage Passengers</h2>
        </div>
        <div className="passengers-loading">
          <div className="loading-spinner"></div>
          <div>Loading passengers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="passengers-container">
      <div className="passengers-header">
        <h2 className="passengers-title">Manage Passengers</h2>
        <div className="header-actions">
          <button 
            onClick={() => {
              if (!showForm) {
                setEditingPassenger(null);
                setFormData({
                  email: '',
                  password: '',
                  fname: '',
                  lname: '',
                  phone_number: ''
                });
              }
              setShowForm(!showForm);
            }}
            className={`passengers-btn ${showForm ? 'passengers-btn-secondary' : 'passengers-btn-primary'}`}
          >
            {showForm ? 'Cancel' : '➕ Add New Passenger'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search passengers by ID, name, email, or phone..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="passengers-search"
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
        <div className="passengers-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error: </strong> {error}
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="passengers-error-close"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create/Edit Passenger Form */}
      {showForm && (
        <div className="passengers-form-container">
          <div className="form-header">
            <h3 className="passengers-form-title">
              {editingPassenger ? '✏️ Edit Passenger' : '➕ Create New Passenger'}
            </h3>
            <span className="form-subtitle">
              {editingPassenger ? 'Update existing passenger details' : 'Add a new passenger to the system'}
            </span>
          </div>
          <form onSubmit={editingPassenger ? handleUpdatePassenger : handleCreatePassenger}>
            <div className="passengers-form-grid">
              <div className="passengers-form-group">
                <label className="passengers-label">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="fname"
                  value={formData.fname}
                  onChange={handleInputChange}
                  required
                  className="passengers-input"
                  placeholder="Enter first name"
                  maxLength="50"
                />
              </div>
              <div className="passengers-form-group">
                <label className="passengers-label">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="lname"
                  value={formData.lname}
                  onChange={handleInputChange}
                  required
                  className="passengers-input"
                  placeholder="Enter last name"
                  maxLength="50"
                />
              </div>
            </div>
            
            <div className="passengers-form-group">
              <label className="passengers-label">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="passengers-input"
                placeholder="passenger@example.com"
                maxLength="255"
              />
            </div>

            <div className="passengers-form-group">
              <label className="passengers-label">
                Password {editingPassenger ? '(leave blank to keep current)' : <span className="required">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingPassenger}
                className="passengers-input"
                placeholder={editingPassenger ? "Leave blank to keep current" : "Enter password"}
                minLength="6"
              />
              {editingPassenger && (
                <div className="password-hint">
                  Leave blank if you don't want to change the password
                </div>
              )}
            </div>

            <div className="passengers-form-group">
              <label className="passengers-label">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="passengers-input"
                placeholder="(123) 456-7890"
                maxLength="20"
              />
              <div className="phone-hint">
                Optional - Include country code if needed
              </div>
            </div>

            <div className="passengers-form-actions">
              <button 
                type="submit" 
                disabled={creating || updating}
                className={`passengers-btn ${editingPassenger ? 'passengers-btn-warning' : 'passengers-btn-success'}`}
              >
                {creating && <span className="btn-loading">⏳</span>}
                {updating && <span className="btn-loading">⏳</span>}
                {!creating && !updating && (editingPassenger ? '💾 Update Passenger' : '✅ Create Passenger')}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="passengers-btn passengers-btn-secondary"
                disabled={creating || updating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Passengers List */}
      <div className="table-section">
        <div className="table-header">
          <div className="table-title-container">
            <h3 className="table-title">Passengers</h3>
            <span className="count-badge">
              {filteredPassengers.length} {filteredPassengers.length === 1 ? 'passenger' : 'passengers'}
              {searchTerm && filteredPassengers.length > 0 && ' found'}
            </span>
          </div>
          {filteredPassengers.length > 0 && (
            <div className="table-summary">
              Showing {filteredPassengers.length} of {passengers.length} total passengers
            </div>
          )}
        </div>
        
        {filteredPassengers.length === 0 ? (
          <div className="passengers-empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">
                {searchTerm ? '🔍' : '👥'}
              </div>
              <h4>{searchTerm ? 'No matching passengers found' : 'No passengers yet'}</h4>
              <p>
                {searchTerm 
                  ? `No results for "${searchTerm}". Try a different search.`
                  : 'Click "Add New Passenger" to create your first passenger'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="passengers-btn passengers-btn-secondary"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="passengers-table-container">
            <table className="passengers-table">
              <thead>
                <tr className="passengers-table-header">
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPassengers.map((passenger) => (
                  <tr key={passenger.passenger_id} className={deletingId === passenger.passenger_id ? 'deleting-row' : ''}>
                    <td className="passenger-id">
                      <span className="id-badge">#{passenger.passenger_id}</span>
                    </td>
                    <td className="passenger-fname">{passenger.fname}</td>
                    <td className="passenger-lname">{passenger.lname}</td>
                    <td className="passenger-email">
                      <a href={`mailto:${passenger.email}`} className="email-link">
                        {passenger.email}
                      </a>
                    </td>
                    <td className="passenger-phone">
                      {passenger.phone_number || 'N/A'}
                    </td>
                    <td className="passenger-actions">
                      <div className="passengers-table-actions">
                        <button 
                          onClick={() => handleEditPassenger(passenger)}
                          className="passengers-action-btn passengers-btn-warning"
                          title="Edit passenger"
                          disabled={deletingId === passenger.passenger_id}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePassenger(passenger.passenger_id)}
                          disabled={deletingId === passenger.passenger_id}
                          className="passengers-action-btn passengers-btn-danger"
                          title="Delete passenger"
                        >
                          {deletingId === passenger.passenger_id ? (
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

export default CrudPassengers;