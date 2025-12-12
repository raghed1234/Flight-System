import React, { useState, useEffect } from 'react';
import './CrudFlights.css';

const CrudFlights = () => {
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [airports, setAirports] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    origin_airport_id: '',
    destination_airport_id: '',
    departure_time: '',
    arrival_time: '',
    aircraft_id: '',
    flight_image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const API_BASE_URL = 'http://localhost/db-project/backend/api/';

  useEffect(() => {
    fetchFlights();
    fetchAirports();
    fetchAircrafts();
  }, []);

  useEffect(() => {
    filterFlights();
  }, [flights, searchTerm]);

  const filterFlights = () => {
    if (!searchTerm.trim()) {
      setFilteredFlights(flights);
      return;
    }

    const filtered = flights.filter(flight =>
      (flight.origin_code && flight.origin_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (flight.destination_code && flight.destination_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (flight.origin_city && flight.origin_city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (flight.destination_city && flight.destination_city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (flight.aircraft_model && flight.aircraft_model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (flight.flight_id && flight.flight_id.toString().includes(searchTerm))
    );
    setFilteredFlights(filtered);
  };

  const fetchFlights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}getFlights.php`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const flightsData = data.data || data;
        setFlights(Array.isArray(flightsData) ? flightsData : []);
      } else {
        throw new Error(data.message || 'Failed to fetch flights');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch flights error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAirports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}getAirports.php`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAirports(data.data || []);
        }
      }
    } catch (err) {
      console.error('Fetch airports error:', err);
    }
  };

  const fetchAircrafts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}getAircrafts.php`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAircrafts(data.data || []);
        }
      }
    } catch (err) {
      console.error('Fetch aircrafts error:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        flight_image: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setRemoveImage(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const resetForm = () => {
    setFormData({
      origin_airport_id: '',
      destination_airport_id: '',
      departure_time: '',
      arrival_time: '',
      aircraft_id: '',
      flight_image: null
    });
    setPreviewImage(null);
    setRemoveImage(false);
    setEditingFlight(null);
    setShowForm(false);
  };

  const validateForm = () => {
    if (!formData.origin_airport_id || !formData.destination_airport_id || 
        !formData.departure_time || !formData.arrival_time || !formData.aircraft_id) {
      setError('All fields are required');
      return false;
    }
    
    if (formData.origin_airport_id === formData.destination_airport_id) {
      setError('Origin and destination cannot be the same');
      return false;
    }
    
    const departure = new Date(formData.departure_time);
    const arrival = new Date(formData.arrival_time);
    
    if (arrival <= departure) {
      setError('Arrival time must be after departure time');
      return false;
    }
    
    if (formData.flight_image && formData.flight_image instanceof File) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(formData.flight_image.type)) {
        setError('Invalid image type. Allowed: JPG, PNG, GIF, WebP');
        return false;
      }
      
      if (formData.flight_image.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return false;
      }
    }
    
    return true;
  };

  const handleCreateFlight = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setCreating(true);
      setError(null);

      const formDataToSend = new FormData();
      formDataToSend.append('origin_airport_id', formData.origin_airport_id);
      formDataToSend.append('destination_airport_id', formData.destination_airport_id);
      formDataToSend.append('departure_time', formData.departure_time);
      formDataToSend.append('arrival_time', formData.arrival_time);
      formDataToSend.append('aircraft_id', formData.aircraft_id);
      
      if (formData.flight_image) {
        formDataToSend.append('flight_image', formData.flight_image);
      }

      const response = await fetch(`${API_BASE_URL}createFlights.php`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        await fetchFlights();
        alert(data.message || 'Flight created successfully!');
      } else {
        throw new Error(data.message || 'Failed to create flight');
      }
    } catch (err) {
      setError(err.message);
      console.error('Create flight error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditFlight = (flight) => {
    setEditingFlight(flight);
    setFormData({
      origin_airport_id: flight.origin_airport_id || '',
      destination_airport_id: flight.destination_airport_id || '',
      departure_time: flight.departure_time ? flight.departure_time.slice(0, 16) : '',
      arrival_time: flight.arrival_time ? flight.arrival_time.slice(0, 16) : '',
      aircraft_id: flight.aircraft_id || '',
      flight_image: null
    });
    
    if (flight.flight_image_url) {
      setPreviewImage(flight.flight_image_url);
    } else {
      setPreviewImage(null);
    }
    
    setRemoveImage(false);
    setShowForm(true);
    setError(null);
  };

  const handleUpdateFlight = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setUpdating(true);
      setError(null);

      const formDataToSend = new FormData();
      formDataToSend.append('flight_id', editingFlight.flight_id);
      formDataToSend.append('origin_airport_id', formData.origin_airport_id);
      formDataToSend.append('destination_airport_id', formData.destination_airport_id);
      formDataToSend.append('departure_time', formData.departure_time);
      formDataToSend.append('arrival_time', formData.arrival_time);
      formDataToSend.append('aircraft_id', formData.aircraft_id);
      
      if (formData.flight_image) {
        formDataToSend.append('flight_image', formData.flight_image);
      }
      
      if (removeImage) {
        formDataToSend.append('remove_image', 'true');
      }

      const response = await fetch(`${API_BASE_URL}updateFlights.php`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        await fetchFlights();
        alert(data.message || 'Flight updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update flight');
      }
    } catch (err) {
      setError(err.message);
      console.error('Update flight error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteFlight = async (flightId) => {
    if (!window.confirm('Are you sure you want to delete this flight?\nThis action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(flightId);
      setError(null);

      const response = await fetch(`${API_BASE_URL}deleteFlights.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flight_id: flightId })
      });

      const data = await response.json();

      if (data.success) {
        await fetchFlights();
        alert(data.message || 'Flight deleted successfully!');
      } else {
        throw new Error(data.message || 'Failed to delete flight');
      }
    } catch (err) {
      setError(err.message);
      console.error('Delete flight error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const removeCurrentImage = () => {
    setPreviewImage(null);
    setFormData(prev => ({ ...prev, flight_image: null }));
    setRemoveImage(true);
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return 'N/A';
    const date = new Date(datetime);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (departure, arrival) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diff = arr - dep;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading && flights.length === 0) {
    return (
      <div className="flights-container">
        <div className="flights-header">
          <h2 className="flights-title">Flights</h2>
        </div>
        <div className="flights-loading">
          <div className="loading-spinner"></div>
          <div>Loading flights...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flights-container">
      <div className="flights-header">
        <h2 className="flights-title">Flights</h2>
        <div className="header-actions">
          <button 
            onClick={() => {
              if (!showForm) {
                setEditingFlight(null);
                resetForm();
              }
              setShowForm(!showForm);
            }}
            className={`flights-btn ${showForm ? 'flights-btn-secondary' : 'flights-btn-primary'}`}
          >
            {showForm ? 'Cancel' : 'Add New Flight'}
          </button>
        </div>
      </div>

      <div className="flights-count">
        Showing {filteredFlights.length} of {flights.length} total flights
      </div>

      <hr className="divider" />

      <div className="search-container">
        <input
          type="text"
          placeholder="Search flights..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="flights-search"
        />
      </div>

      {error && (
        <div className="flights-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error: </strong> {error}
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="flights-error-close"
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <div className="flights-form-container">
          <div className="form-header">
            <h3 className="flights-form-title">
              {editingFlight ? 'Edit Flight' : 'Create New Flight'}
            </h3>
          </div>
          <form onSubmit={editingFlight ? handleUpdateFlight : handleCreateFlight}>
            <div className="flights-form-grid">
              <div className="flights-form-group">
                <label className="flights-label">
                  Origin Airport <span className="required">*</span>
                </label>
                <select
                  name="origin_airport_id"
                  value={formData.origin_airport_id}
                  onChange={handleInputChange}
                  required
                  className="flights-input"
                >
                  <option value="">Select origin airport</option>
                  {airports.map(airport => (
                    <option key={airport.airport_id} value={airport.airport_id}>
                      {airport.code} - {airport.city}, {airport.country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flights-form-group">
                <label className="flights-label">
                  Destination Airport <span className="required">*</span>
                </label>
                <select
                  name="destination_airport_id"
                  value={formData.destination_airport_id}
                  onChange={handleInputChange}
                  required
                  className="flights-input"
                >
                  <option value="">Select destination airport</option>
                  {airports.map(airport => (
                    <option key={airport.airport_id} value={airport.airport_id}>
                      {airport.code} - {airport.city}, {airport.country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flights-form-grid">
              <div className="flights-form-group">
                <label className="flights-label">
                  Departure Time <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="departure_time"
                  value={formData.departure_time}
                  onChange={handleInputChange}
                  required
                  className="flights-input"
                />
              </div>
              <div className="flights-form-group">
                <label className="flights-label">
                  Arrival Time <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="arrival_time"
                  value={formData.arrival_time}
                  onChange={handleInputChange}
                  required
                  className="flights-input"
                />
              </div>
            </div>

            <div className="flights-form-group">
              <label className="flights-label">
                Aircraft <span className="required">*</span>
              </label>
              <select
                name="aircraft_id"
                value={formData.aircraft_id}
                onChange={handleInputChange}
                required
                className="flights-input"
              >
                <option value="">Select aircraft</option>
                {aircrafts.map(aircraft => (
                  <option key={aircraft.aircraft_id} value={aircraft.aircraft_id}>
                    {aircraft.model} ({aircraft.capacity} seats)
                  </option>
                ))}
              </select>
            </div>

            <div className="flights-form-group">
              <label className="flights-label">
                Flight Image
              </label>
              <div className="image-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="image-upload-input"
                  id="flight-image-upload"
                />
                <label htmlFor="flight-image-upload" className="image-upload-label">
                  Choose Image
                </label>
                {previewImage && (
                  <div className="image-preview-container">
                    <img src={previewImage} alt="Flight preview" className="image-preview" />
                    <button 
                      type="button"
                      onClick={removeCurrentImage}
                      className="remove-image-btn"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flights-form-actions">
              <button 
                type="submit" 
                disabled={creating || updating}
                className={`flights-btn ${editingFlight ? 'flights-btn-warning' : 'flights-btn-success'}`}
              >
                {creating && <span className="btn-loading">⏳</span>}
                {updating && <span className="btn-loading">⏳</span>}
                {!creating && !updating && (editingFlight ? 'Update Flight' : 'Create Flight')}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="flights-btn flights-btn-secondary"
                disabled={creating || updating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flights-list-section">
        <div className="flights-table-header">
          <div className="table-header-item">ID</div>
          <div className="table-header-item">ROUTE</div>
          <div className="table-header-item">SCHEDULE</div>
          <div className="table-header-item">AIRCRAFT</div>
          <div className="table-header-item">IMAGE</div>
          <div className="table-header-item">ACTIONS</div>
        </div>
        
        {filteredFlights.length === 0 ? (
          <div className="flights-empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">
                {searchTerm ? '🔍' : '✈️'}
              </div>
              <h4>{searchTerm ? 'No matching flights found' : 'No flights yet'}</h4>
              <p>
                {searchTerm 
                  ? `No results for "${searchTerm}". Try a different search.`
                  : 'Click "Add New Flight" to create your first flight'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="flights-btn flights-btn-secondary"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flights-table">
            {filteredFlights.map((flight) => (
              <div key={flight.flight_id} className={`flight-row ${deletingId === flight.flight_id ? 'deleting' : ''}`}>
                <div className="flight-cell flight-id-cell">
                  <span className="flight-id">#{flight.flight_id}</span>
                </div>
                
                <div className="flight-cell flight-route-cell">
                  <div className="route-display">
                    <div className="route-origin">
                      <div className="route-code-bold">{flight.origin_code || 'KKK'}</div>
                      <div className="route-city-small">{flight.origin_city || 'hhhh'}</div>
                    </div>
                    <div className="route-arrow">→</div>
                    <div className="route-destination">
                      <div className="route-code-bold">{flight.destination_code || 'J.J.J'}</div>
                      <div className="route-city-small">{flight.destination_city || 'bierut'}</div>
                    </div>
                  </div>
                  <div className="flight-duration">
                    Duration: {getDuration(flight.departure_time, flight.arrival_time)}
                  </div>
                </div>
                
                <div className="flight-cell flight-schedule-cell">
                  <div className="schedule-departure">
                    <div className="schedule-label">Departure:</div>
                    <div className="schedule-time">{formatDateTime(flight.departure_time)}</div>
                  </div>
                  <div className="schedule-arrival">
                    <div className="schedule-label">Arrival:</div>
                    <div className="schedule-time">{formatDateTime(flight.arrival_time)}</div>
                  </div>
                </div>
                
                <div className="flight-cell flight-aircraft-cell">
                  <div className="aircraft-model">{flight.aircraft_model || '600jud'}</div>
                  <div className="aircraft-capacity">{flight.capacity || '0'} seats</div>
                </div>
                
                <div className="flight-cell flight-image-cell">
                  {flight.flight_image_url ? (
                    <div className="flight-image-container">
                      <img 
                        src={flight.flight_image_url} 
                        alt={`Flight ${flight.flight_id}`} 
                        className="flight-image"
                      />
                    </div>
                  ) : (
                    <span className="no-image">No image</span>
                  )}
                </div>
                
                <div className="flight-cell flight-actions-cell">
                  <div className="flight-actions">
                    <button 
                      onClick={() => handleEditFlight(flight)}
                      className="flights-action-btn edit-btn"
                      title="Edit flight"
                      disabled={deletingId === flight.flight_id}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteFlight(flight.flight_id)}
                      disabled={deletingId === flight.flight_id}
                      className="flights-action-btn delete-btn"
                      title="Delete flight"
                    >
                      {deletingId === flight.flight_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrudFlights;