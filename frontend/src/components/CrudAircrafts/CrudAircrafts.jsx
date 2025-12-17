import React, { useState, useEffect } from 'react';
import './CrudAircrafts.css';

const CrudAircrafts = () => {
  const [aircrafts, setAircrafts] = useState([]);
  const [filteredAircrafts, setFilteredAircrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    model: '',
    capacity: '',
    status: 'Active'
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statistics, setStatistics] = useState({
    status_distribution: {},
    total_aircrafts: 0
  });

  // Base URL for API calls
  const API_BASE_URL = 'http://localhost/db-project/backend/api/';

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const statusOptions = ['Active', 'Maintenance', 'Inactive', 'Scheduled'];

  useEffect(() => {
    fetchAircrafts();
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    filterAircrafts();
  }, [aircrafts, searchTerm]);

  const filterAircrafts = () => {
    let filtered = aircrafts;

    // Apply search term filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(aircraft =>
        (aircraft.model && aircraft.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (aircraft.aircraft_id && aircraft.aircraft_id.toString().includes(searchTerm)) ||
        (aircraft.capacity && aircraft.capacity.toString().includes(searchTerm))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(aircraft => aircraft.status === statusFilter);
    }

    setFilteredAircrafts(filtered);
  };

  const fetchAircrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL(`${API_BASE_URL}getAircrafts.php`);
      url.searchParams.append('page', pagination.page);
      url.searchParams.append('limit', pagination.limit);
      
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }
      
      if (statusFilter !== 'all') {
        url.searchParams.append('status', statusFilter);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success) {
        // Handle both data.data and direct data response
        const aircraftsData = data.data || data;
        setAircrafts(Array.isArray(aircraftsData) ? aircraftsData : []);
        
        // Update pagination info if available
        if (data.pagination) {
          setPagination(data.pagination);
        }
        
        // Update statistics if available
        if (data.statistics) {
          setStatistics(data.statistics);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch aircrafts');
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
    
    // Parse capacity to integer
    if (name === 'capacity') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseInt(value) || 0
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

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetForm = () => {
    setFormData({
      model: '',
      capacity: '',
      status: 'Active'
    });
    setEditingAircraft(null);
    setShowForm(false);
    setForceDelete(false);
    setError(null);
  };

  const validateForm = () => {
    const requiredFields = ['model', 'capacity', 'status'];
    const missingFields = requiredFields.filter(field => !formData[field].toString().trim());
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Validate capacity
    if (formData.capacity <= 0 || isNaN(formData.capacity)) {
      setError('Capacity must be a positive number');
      return false;
    }
    
    // Validate model length
    if (formData.model.length < 2) {
      setError('Model name must be at least 2 characters');
      return false;
    }
    
    // Validate status
    if (!statusOptions.includes(formData.status)) {
      setError(`Invalid status. Must be one of: ${statusOptions.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleCreateAircraft = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setCreating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}createAircrafts.php`, {
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
        await fetchAircrafts();
        alert(data.message || 'Aircraft created successfully!');
      } else {
        throw new Error(data.message || 'Failed to create aircraft');
      }
    } catch (err) {
      setError(err.message);
      console.error('Create aircraft error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditAircraft = (aircraft) => {
    setEditingAircraft(aircraft);
    setFormData({
      model: aircraft.model || '',
      capacity: aircraft.capacity || '',
      status: aircraft.status || 'Active'
    });
    setShowForm(true);
    setError(null);
  };

  const handleUpdateAircraft = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setUpdating(true);
      setError(null);

      const updateData = {
        aircraft_id: editingAircraft.aircraft_id,
        ...formData
      };

      const response = await fetch(`${API_BASE_URL}updateAircrafts.php`, {
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
        await fetchAircrafts();
        alert(data.message || 'Aircraft updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update aircraft');
      }
    } catch (err) {
      setError(err.message);
      console.error('Update aircraft error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAircraft = async (aircraftId) => {
    let message = 'Are you sure you want to delete this aircraft?\nThis action cannot be undone.';
    
    if (forceDelete) {
      message = '⚠️ FORCE DELETE ENABLED ⚠️\n\nThis will attempt to delete the aircraft even if it has flight assignments.\nThis action cannot be undone.\n\nAre you absolutely sure?';
    }

    if (!window.confirm(message)) {
      return;
    }

    try {
      setDeletingId(aircraftId);
      setError(null);

      let url = `${API_BASE_URL}deleteAircrafts.php?id=${aircraftId}`;
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
        await fetchAircrafts();
        alert(data.message || 'Aircraft deleted successfully!');
        setForceDelete(false);
      } else {
        // If deletion failed due to references, offer force delete option
        if (data.flight_references && data.flight_references > 0) {
          const shouldForce = window.confirm(
            `Cannot delete: Aircraft is assigned to ${data.flight_references} flight(s).\n\n` +
            'Would you like to try force delete?'
          );
          
          if (shouldForce) {
            setForceDelete(true);
            // Retry with force delete
            await handleDeleteAircraft(aircraftId);
            return;
          }
        }
        throw new Error(data.message || 'Failed to delete aircraft');
      }
    } catch (err) {
      setError(err.message);
      console.error('Delete aircraft error:', err);
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

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Active': return 'status-badge-active';
      case 'Maintenance': return 'status-badge-maintenance';
      case 'Inactive': return 'status-badge-inactive';
      case 'Scheduled': return 'status-badge-scheduled';
      default: return 'status-badge-default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Active': return '✅';
      case 'Maintenance': return '🔧';
      case 'Inactive': return '⏸️';
      case 'Scheduled': return '📅';
      default: return '✈️';
    }
  };

  if (loading && aircrafts.length === 0) {
    return (
      <div className="aircrafts-container">
        <div className="aircrafts-header">
          <h2 className="aircrafts-title">Manage Aircrafts</h2>
        </div>
        <div className="aircrafts-loading">
          <div className="loading-spinner"></div>
          <div>Loading aircrafts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="aircrafts-container">
      <div className="aircrafts-header">
        <h2 className="aircrafts-title">Manage Aircrafts</h2>
        <div className="header-actions">
          <button 
            onClick={() => {
              if (!showForm) {
                setEditingAircraft(null);
                setFormData({
                  model: '',
                  capacity: '',
                  status: 'Active'
                });
              }
              setShowForm(!showForm);
            }}
            className={`aircrafts-btn ${showForm ? 'aircrafts-btn-secondary' : 'aircrafts-btn-primary'}`}
          >
            {showForm ? 'Cancel' : '➕ Add New Aircraft'}
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="statistics-bar">
        <div className="stat-item">
          <span className="stat-label">Total Aircrafts:</span>
          <span className="stat-value">{statistics.total_aircrafts || aircrafts.length}</span>
        </div>
        {Object.entries(statistics.status_distribution || {}).map(([status, count]) => (
          <div key={status} className="stat-item">
            <span className="stat-label">
              <span className={`status-icon ${getStatusBadgeClass(status)}`}>
                {getStatusIcon(status)}
              </span>
              {status}:
            </span>
            <span className="stat-value">{count}</span>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="filter-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search aircrafts by model, ID, or capacity..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="aircrafts-search"
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
        
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">Status Filter:</label>
            <select 
              value={statusFilter} 
              onChange={handleStatusFilterChange}
              className="status-filter-select"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="aircrafts-btn aircrafts-btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Force Delete Warning */}
      {forceDelete && (
        <div className="force-delete-warning">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>Force Delete Enabled:</strong> Attempting to delete aircraft even with flight assignments
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
        <div className="aircrafts-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error: </strong> {error}
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="aircrafts-error-close"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create/Edit Aircraft Form */}
      {showForm && (
        <div className="aircrafts-form-container">
          <div className="form-header">
            <h3 className="aircrafts-form-title">
              {editingAircraft ? '✏️ Edit Aircraft' : '➕ Create New Aircraft'}
            </h3>
            <span className="form-subtitle">
              {editingAircraft ? 'Update existing aircraft details' : 'Add a new aircraft to the fleet'}
            </span>
          </div>
          <form onSubmit={editingAircraft ? handleUpdateAircraft : handleCreateAircraft}>
            <div className="aircrafts-form-group">
              <label className="aircrafts-label">
                Aircraft Model <span className="required">*</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                required
                className="aircrafts-input"
                placeholder="e.g., Boeing 737-800, Airbus A320"
                maxLength="100"
              />
              <div className="input-hint">Enter the full aircraft model name</div>
            </div>

            <div className="aircrafts-form-grid">
              <div className="aircrafts-form-group">
                <label className="aircrafts-label">
                  Passenger Capacity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                  className="aircrafts-input"
                  placeholder="e.g., 189"
                  min="1"
                  max="1000"
                  step="1"
                />
                <div className="input-hint">Number of passengers</div>
              </div>
              
              <div className="aircrafts-form-group">
                <label className="aircrafts-label">
                  Status <span className="required">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="aircrafts-select"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="input-hint">Current operational status</div>
              </div>
            </div>

            <div className="aircrafts-form-actions">
              <button 
                type="submit" 
                disabled={creating || updating}
                className={`aircrafts-btn ${editingAircraft ? 'aircrafts-btn-warning' : 'aircrafts-btn-success'}`}
              >
                {creating && <span className="btn-loading">⏳</span>}
                {updating && <span className="btn-loading">⏳</span>}
                {!creating && !updating && (editingAircraft ? '💾 Update Aircraft' : '✅ Create Aircraft')}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="aircrafts-btn aircrafts-btn-secondary"
                disabled={creating || updating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Aircrafts List */}
      <div className="table-section">
        <div className="table-header">
          <div className="table-title-container">
            <h3 className="table-title">Aircrafts</h3>
            <span className="count-badge">
              {filteredAircrafts.length} {filteredAircrafts.length === 1 ? 'aircraft' : 'aircrafts'}
              {statusFilter !== 'all' && ` (${statusFilter})`}
              {searchTerm && filteredAircrafts.length > 0 && ' found'}
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
        
        {filteredAircrafts.length === 0 ? (
          <div className="aircrafts-empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">
                {searchTerm || statusFilter !== 'all' ? '🔍' : '✈️'}
              </div>
              <h4>
                {searchTerm || statusFilter !== 'all' 
                  ? 'No matching aircrafts found' 
                  : 'No aircrafts in the fleet yet'}
              </h4>
              <p>
                {searchTerm 
                  ? `No results for "${searchTerm}". Try a different search.`
                  : statusFilter !== 'all'
                  ? `No aircrafts with status "${statusFilter}". Try changing the filter.`
                  : 'Click "Add New Aircraft" to add your first aircraft to the fleet'}
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="aircrafts-btn aircrafts-btn-secondary"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="aircrafts-table-container">
            <table className="aircrafts-table">
              <thead>
                <tr className="aircrafts-table-header">
                  <th>ID</th>
                  <th>Model</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAircrafts.map((aircraft) => (
                  <tr key={aircraft.aircraft_id} className={deletingId === aircraft.aircraft_id ? 'deleting-row' : ''}>
                    <td className="aircraft-id">
                      <span className="id-badge">#{aircraft.aircraft_id}</span>
                    </td>
                    <td className="aircraft-model">
                      <div className="model-info">
                        <span className="model-name">{aircraft.model}</span>
                      </div>
                    </td>
                    <td className="aircraft-capacity">
                      <span className="capacity-badge">
                        <span className="capacity-icon">👥</span>
                        {aircraft.capacity}
                      </span>
                    </td>
                    <td className="aircraft-status">
                      <span className={`status-badge ${getStatusBadgeClass(aircraft.status)}`}>
                        <span className="status-icon">{getStatusIcon(aircraft.status)}</span>
                        {aircraft.status}
                      </span>
                    </td>
                    <td className="aircraft-actions">
                      <div className="aircrafts-table-actions">
                        <button 
                          onClick={() => handleEditAircraft(aircraft)}
                          className="aircrafts-action-btn aircrafts-btn-warning"
                          title="Edit aircraft"
                          disabled={deletingId === aircraft.aircraft_id}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteAircraft(aircraft.aircraft_id)}
                          disabled={deletingId === aircraft.aircraft_id}
                          className={`aircrafts-action-btn aircrafts-btn-danger ${forceDelete ? 'force-delete-btn' : ''}`}
                          title={`Delete aircraft${forceDelete ? ' (force delete enabled)' : ''}`}
                        >
                          {deletingId === aircraft.aircraft_id ? (
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
        <p>Total Aircrafts: {aircrafts.length}</p>
        <p>Filtered: {filteredAircrafts.length}</p>
        <p>Editing: {editingAircraft ? editingAircraft.aircraft_id : 'None'}</p>
      </div>
    </div>
  );
};

export default CrudAircrafts;