import React, { useState, useEffect } from 'react';
import './CrudAirports.css';

const CrudAirports = () => {
  const [airports, setAirports] = useState([]);
  const [filteredAirports, setFilteredAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAirport, setEditingAirport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    country: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [forceDelete, setForceDelete] = useState(false);

  // Base URL for API calls
  const API_BASE_URL = 'http://localhost/db-project/backend/api/';

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    fetchAirports();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    filterAirports();
  }, [airports, searchTerm]);

  const filterAirports = () => {
    if (!searchTerm.trim()) {
      setFilteredAirports(airports);
      return;
    }

    const filtered = airports.filter(airport =>
      (airport.name && airport.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (airport.code && airport.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (airport.city && airport.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (airport.country && airport.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (airport.airport_id && airport.airport_id.toString().includes(searchTerm))
    );
    setFilteredAirports(filtered);
  };

  const fetchAirports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL(`${API_BASE_URL}getAirports.php`);
      url.searchParams.append('page', pagination.page);
      url.searchParams.append('limit', pagination.limit);
      
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success) {
        // Handle both data.data and direct data response
        const airportsData = data.data || data;
        setAirports(Array.isArray(airportsData) ? airportsData : []);
        
        // Update pagination info if available
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch airports');
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
    
    // Convert code to uppercase automatically
    if (name === 'code') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      city: '',
      country: ''
    });
    setEditingAirport(null);
    setShowForm(false);
    setForceDelete(false);
    setError(null);
  };

  const validateForm = () => {
    const requiredFields = ['name', 'code', 'city', 'country'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Validate airport code format (typically 3 letters)
    if (formData.code.length < 2 || formData.code.length > 10) {
      setError('Airport code should be between 2 and 10 characters');
      return false;
    }
    
    return true;
  };

  const handleCreateAirport = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setCreating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}createAirports.php`, {
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
        await fetchAirports();
        alert(data.message || 'Airport created successfully!');
      } else {
        throw new Error(data.message || 'Failed to create airport');
      }
    } catch (err) {
      setError(err.message);
      console.error('Create airport error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditAirport = (airport) => {
    setEditingAirport(airport);
    setFormData({
      name: airport.name || '',
      code: airport.code || '',
      city: airport.city || '',
      country: airport.country || ''
    });
    setShowForm(true);
    setError(null);
  };

  const handleUpdateAirport = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setUpdating(true);
      setError(null);

      const updateData = {
        airport_id: editingAirport.airport_id,
        ...formData
      };

      const response = await fetch(`${API_BASE_URL}updateAirports.php`, {
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
        await fetchAirports();
        alert(data.message || 'Airport updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update airport');
      }
    } catch (err) {
      setError(err.message);
      console.error('Update airport error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAirport = async (airportId) => {
    let message = 'Are you sure you want to delete this airport?\nThis action cannot be undone.';
    
    if (forceDelete) {
      message = '⚠️ FORCE DELETE ENABLED ⚠️\n\nThis will delete the airport AND all related flights!\nThis action cannot be undone.\n\nAre you absolutely sure?';
    }

    if (!window.confirm(message)) {
      return;
    }

    try {
      setDeletingId(airportId);
      setError(null);

      let url = `${API_BASE_URL}deleteAirports.php?id=${airportId}`;
      if (forceDelete) {
        url += '&force=true';
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log('Delete Response:', data);

      if (data.success) {
        resetForm();
        await fetchAirports();
        alert(data.message || 'Airport deleted successfully!');
        setForceDelete(false);
      } else {
        // If deletion failed due to references, offer force delete option
        if (data.references && data.totalReferences > 0) {
          const shouldForce = window.confirm(
            `Cannot delete: Airport is referenced in ${data.totalReferences} flight(s).\n\n` +
            `• As origin: ${data.references.as_origin}\n` +
            `• As destination: ${data.references.as_destination}\n\n` +
            'Would you like to force delete (this will delete all related flights)?'
          );
          
          if (shouldForce) {
            setForceDelete(true);
            // Retry with force delete
            await handleDeleteAirport(airportId);
            return;
          }
        }
        throw new Error(data.message || 'Failed to delete airport');
      }
    } catch (err) {
      setError(err.message);
      console.error('Delete airport error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  if (loading && airports.length === 0) {
    return (
      <div className="airports-container">
        <div className="airports-header">
          <h2 className="airports-title">Manage Airports</h2>
        </div>
        <div className="airports-loading">
          <div className="loading-spinner"></div>
          <div>Loading airports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="airports-container">
      <div className="airports-header">
        <h2 className="airports-title">Manage Airports</h2>
        <div className="header-actions">
          <button 
            onClick={() => {
              if (!showForm) {
                setEditingAirport(null);
                setFormData({
                  name: '',
                  code: '',
                  city: '',
                  country: ''
                });
              }
              setShowForm(!showForm);
            }}
            className={`airports-btn ${showForm ? 'airports-btn-secondary' : 'airports-btn-primary'}`}
          >
            {showForm ? 'Cancel' : '➕ Add New Airport'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search airports by name, code, city, or country..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="airports-search"
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

      {/* Force Delete Warning */}
      {forceDelete && (
        <div className="force-delete-warning">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>Force Delete Enabled:</strong> Deleting an airport will also delete all related flights!
            </div>
          </div>
          <button 
            onClick={() => setForceDelete(false)}
            className="warning-close-btn"
          >
            Disable Force Delete
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="airports-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error: </strong> {error}
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="airports-error-close"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create/Edit Airport Form */}
      {showForm && (
        <div className="airports-form-container">
          <div className="form-header">
            <h3 className="airports-form-title">
              {editingAirport ? '✏️ Edit Airport' : '➕ Create New Airport'}
            </h3>
            <span className="form-subtitle">
              {editingAirport ? 'Update existing airport details' : 'Add a new airport to the system'}
            </span>
          </div>
          <form onSubmit={editingAirport ? handleUpdateAirport : handleCreateAirport}>
            <div className="airports-form-grid">
              <div className="airports-form-group">
                <label className="airports-label">
                  Airport Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="airports-input"
                  placeholder="Enter airport name"
                  maxLength="255"
                />
              </div>
              <div className="airports-form-group">
                <label className="airports-label">
                  Airport Code (IATA) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="airports-input"
                  placeholder="e.g., JFK"
                  maxLength="10"
                  style={{ textTransform: 'uppercase' }}
                />
                <div className="input-hint">2-10 characters, auto-uppercase</div>
              </div>
            </div>

            <div className="airports-form-grid">
              <div className="airports-form-group">
                <label className="airports-label">
                  City <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="airports-input"
                  placeholder="Enter city"
                  maxLength="100"
                />
              </div>
              <div className="airports-form-group">
                <label className="airports-label">
                  Country <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="airports-input"
                  placeholder="Enter country"
                  maxLength="100"
                />
              </div>
            </div>

            <div className="airports-form-actions">
              <button 
                type="submit" 
                disabled={creating || updating}
                className={`airports-btn ${editingAirport ? 'airports-btn-warning' : 'airports-btn-success'}`}
              >
                {creating && <span className="btn-loading">⏳</span>}
                {updating && <span className="btn-loading">⏳</span>}
                {!creating && !updating && (editingAirport ? '💾 Update Airport' : '✅ Create Airport')}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="airports-btn airports-btn-secondary"
                disabled={creating || updating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Airports List */}
      <div className="table-section">
        <div className="table-header">
          <div className="table-title-container">
            <h3 className="table-title">Airports</h3>
            <span className="count-badge">
              {filteredAirports.length} {filteredAirports.length === 1 ? 'airport' : 'airports'}
              {searchTerm && filteredAirports.length > 0 && ' found'}
            </span>
          </div>
          <div className="table-controls">
            <div className="pagination-info">
              Page {pagination.page} of {pagination.totalPages} • Total: {pagination.total}
            </div>
            <div className="table-actions">
              <select 
                value={pagination.limit} 
                onChange={handleLimitChange}
                className="limit-select"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
              <div className="pagination-buttons">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {filteredAirports.length === 0 ? (
          <div className="airports-empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">
                {searchTerm ? '🔍' : '✈️'}
              </div>
              <h4>{searchTerm ? 'No matching airports found' : 'No airports yet'}</h4>
              <p>
                {searchTerm 
                  ? `No results for "${searchTerm}". Try a different search.`
                  : 'Click "Add New Airport" to add your first airport'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="airports-btn airports-btn-secondary"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="airports-table-container">
            <table className="airports-table">
              <thead>
                <tr className="airports-table-header">
                  <th>ID</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAirports.map((airport) => (
                  <tr key={airport.airport_id} className={deletingId === airport.airport_id ? 'deleting-row' : ''}>
                    <td className="airport-id">
                      <span className="id-badge">#{airport.airport_id}</span>
                    </td>
                    <td className="airport-code">
                      <span className="code-badge">{airport.code}</span>
                    </td>
                    <td className="airport-name">{airport.name}</td>
                    <td className="airport-city">{airport.city}</td>
                    <td className="airport-country">
                      <span className="country-flag" title={airport.country}>
                        {getCountryFlag(airport.country)}
                      </span>
                      {airport.country}
                    </td>
                    <td className="airport-actions">
                      <div className="airports-table-actions">
                        <button 
                          onClick={() => handleEditAirport(airport)}
                          className="airports-action-btn airports-btn-warning"
                          title="Edit airport"
                          disabled={deletingId === airport.airport_id}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteAirport(airport.airport_id)}
                          disabled={deletingId === airport.airport_id}
                          className={`airports-action-btn airports-btn-danger ${forceDelete ? 'force-delete-btn' : ''}`}
                          title={`Delete airport${forceDelete ? ' (and related flights)' : ''}`}
                        >
                          {deletingId === airport.airport_id ? (
                            <span className="btn-loading">⏳</span>
                          ) : (
                            `🗑️ ${forceDelete ? 'Force Delete' : 'Delete'}`
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

      {/* Debug info - remove in production */}
      <div className="debug-info" style={{ display: 'none' }}>
        <h4>Debug Info:</h4>
        <p>Total Airports: {airports.length}</p>
        <p>Filtered: {filteredAirports.length}</p>
        <p>Editing: {editingAirport ? editingAirport.airport_id : 'None'}</p>
      </div>
    </div>
  );
};

// Helper function to get country flag emoji (simplified)
const getCountryFlag = (country) => {
  const countryFlags = {
    'USA': '🇺🇸',
    'UK': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'UAE': '🇦🇪',
    'Singapore': '🇸🇬'
  };
  
  return countryFlags[country] || '🏳️';
};

export default CrudAirports;