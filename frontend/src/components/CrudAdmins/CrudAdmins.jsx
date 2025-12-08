import React, { useState, useEffect } from 'react';
import './CrudAdmins.css';

const CrudAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fname: '',
    lname: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Base URL for API calls
  const API_BASE_URL = 'http://localhost/db-projectbackend/api/';

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm]);

  const filterAdmins = () => {
    if (!searchTerm.trim()) {
      setFilteredAdmins(admins);
      return;
    }

    const filtered = admins.filter(admin =>
      (admin.fname && admin.fname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.lname && admin.lname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.admin_id && admin.admin_id.toString().includes(searchTerm))
    );
    setFilteredAdmins(filtered);
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}getAdmins.php`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Debug log to check response structure
      console.log('API Response:', data);
      
      if (data.success) {
        // Handle both data.data and direct data response
        const adminsData = data.data || data;
        setAdmins(Array.isArray(adminsData) ? adminsData : []);
      } else {
        throw new Error(data.message || 'Failed to fetch admins');
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
      lname: ''
    });
    setEditingAdmin(null);
    setShowForm(false);
  };

  const validateForm = () => {
    if (!formData.email || !formData.fname || !formData.lname) {
      setError('Email, First Name, and Last Name are required');
      return false;
    }
    
    if (!editingAdmin && !formData.password) {
      setError('Password is required for new admin');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setCreating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}createAdmins.php`, {
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
        await fetchAdmins();
        alert(data.message || 'Admin created successfully!');
      } else {
        throw new Error(data.message || 'Failed to create admin');
      }
    } catch (err) {
      setError(err.message);
      console.error('Create admin error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email || '',
      password: '', // Don't pre-fill password for security
      fname: admin.fname || '',
      lname: admin.lname || ''
    });
    setShowForm(true);
    setError(null);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setUpdating(true);
      setError(null);

      const updateData = {
        admin_id: editingAdmin.admin_id,
        email: formData.email,
        fname: formData.fname,
        lname: formData.lname
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_BASE_URL}updateAdmins.php`, {
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
        await fetchAdmins();
        alert(data.message || 'Admin updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update admin');
      }
    } catch (err) {
      setError(err.message);
      console.error('Update admin error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?\nThis action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(adminId);
      setError(null);

      const response = await fetch(`${API_BASE_URL}deleteAdmins.php?admin_id=${adminId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log('Delete Response:', data);

      if (data.success) {
        await fetchAdmins();
        alert(data.message || 'Admin deleted successfully!');
      } else {
        throw new Error(data.message || 'Failed to delete admin');
      }
    } catch (err) {
      setError(err.message);
      console.error('Delete admin error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && admins.length === 0) {
    return (
      <div className="admins-container">
        <div className="admins-header">
          <h2 className="admins-title">Manage Administrators</h2>
        </div>
        <div className="admins-loading">
          <div className="loading-spinner"></div>
          <div>Loading administrators...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admins-container">
      <div className="admins-header">
        <h2 className="admins-title">Manage Administrators</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowForm(!showForm)}
            className={`admins-btn ${showForm ? 'admins-btn-secondary' : 'admins-btn-primary'}`}
          >
            {showForm ? 'Cancel' : '➕ Add New Admin'}
          </button>
          <button 
            onClick={fetchAdmins}
            className="admins-btn admins-btn-refresh"
            title="Refresh list"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search admins by ID, name, or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="admins-search"
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
        <div className="admins-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error: </strong> {error}
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="admins-error-close"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create/Edit Admin Form */}
      {showForm && (
        <div className="admins-form-container">
          <div className="form-header">
            <h3 className="admins-form-title">
              {editingAdmin ? '✏️ Edit Admin' : '➕ Create New Admin'}
            </h3>
            <span className="form-subtitle">
              {editingAdmin ? 'Update existing administrator details' : 'Add a new administrator to the system'}
            </span>
          </div>
          <form onSubmit={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}>
            <div className="admins-form-grid">
              <div className="admins-form-group">
                <label className="admins-label">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="fname"
                  value={formData.fname}
                  onChange={handleInputChange}
                  required
                  className="admins-input"
                  placeholder="Enter first name"
                  maxLength="50"
                />
              </div>
              <div className="admins-form-group">
                <label className="admins-label">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="lname"
                  value={formData.lname}
                  onChange={handleInputChange}
                  required
                  className="admins-input"
                  placeholder="Enter last name"
                  maxLength="50"
                />
              </div>
            </div>
            
            <div className="admins-form-group">
              <label className="admins-label">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="admins-input"
                placeholder="admin@example.com"
                maxLength="255"
              />
            </div>

            <div className="admins-form-group">
              <label className="admins-label">
                Password {editingAdmin ? '(leave blank to keep current)' : <span className="required">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingAdmin}
                className="admins-input"
                placeholder={editingAdmin ? "Leave blank to keep current" : "Enter password"}
                minLength="6"
              />
              {editingAdmin && (
                <div className="password-hint">
                  Leave blank if you don't want to change the password
                </div>
              )}
            </div>

            <div className="admins-form-actions">
              <button 
                type="submit" 
                disabled={creating || updating}
                className={`admins-btn ${editingAdmin ? 'admins-btn-warning' : 'admins-btn-success'}`}
              >
                {creating && <span className="btn-loading">⏳</span>}
                {updating && <span className="btn-loading">⏳</span>}
                {!creating && !updating && (editingAdmin ? '💾 Update Admin' : '✅ Create Admin')}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="admins-btn admins-btn-secondary"
                disabled={creating || updating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      <div className="table-section">
        <div className="table-header">
          <div className="table-title-container">
            <h3 className="table-title">Administrators</h3>
            <span className="count-badge">
              {filteredAdmins.length} {filteredAdmins.length === 1 ? 'admin' : 'admins'}
              {searchTerm && filteredAdmins.length > 0 && ' found'}
            </span>
          </div>
          {filteredAdmins.length > 0 && (
            <div className="table-summary">
              Showing {filteredAdmins.length} of {admins.length} total admins
            </div>
          )}
        </div>
        
        {filteredAdmins.length === 0 ? (
          <div className="admins-empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">
                {searchTerm ? '🔍' : '👥'}
              </div>
              <h4>{searchTerm ? 'No matching admins found' : 'No administrators yet'}</h4>
              <p>
                {searchTerm 
                  ? `No results for "${searchTerm}". Try a different search.`
                  : 'Click "Add New Admin" to create your first administrator'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="admins-btn admins-btn-secondary"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="admins-table-container">
            <table className="admins-table">
              <thead>
                <tr className="admins-table-header">
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.admin_id} className={deletingId === admin.admin_id ? 'deleting-row' : ''}>
                    <td className="admin-id">
                      <span className="id-badge">#{admin.admin_id}</span>
                    </td>
                    <td className="admin-fname">{admin.fname}</td>
                    <td className="admin-lname">{admin.lname}</td>
                    <td className="admin-email">
                      <a href={`mailto:${admin.email}`} className="email-link">
                        {admin.email}
                      </a>
                    </td>
                    <td className="admin-role">
                      <span className="role-badge">{admin.role || 'Admin'}</span>
                    </td>
                    <td className="admin-actions">
                      <div className="admins-table-actions">
                        <button 
                          onClick={() => handleEditAdmin(admin)}
                          className="admins-action-btn admins-btn-warning"
                          title="Edit admin"
                          disabled={deletingId === admin.admin_id}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteAdmin(admin.admin_id)}
                          disabled={deletingId === admin.admin_id}
                          className="admins-action-btn admins-btn-danger"
                          title="Delete admin"
                        >
                          {deletingId === admin.admin_id ? (
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

      {/* Debug info - remove in production */}
      <div className="debug-info" style={{ display: 'none' }}>
        <h4>Debug Info:</h4>
        <p>Total Admins: {admins.length}</p>
        <p>Filtered: {filteredAdmins.length}</p>
        <p>Editing: {editingAdmin ? editingAdmin.admin_id : 'None'}</p>
      </div>
    </div>
  );
};

export default CrudAdmins;