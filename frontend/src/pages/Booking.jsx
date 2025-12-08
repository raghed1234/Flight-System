import React, { useState, useEffect } from 'react';
import './Booking.css';

function Booking() {
    const [flights, setFlights] = useState([]);
    const [filteredFlights, setFilteredFlights] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('flights');
    const [loading, setLoading] = useState(false);
    
    // Search form state
    const [searchParams, setSearchParams] = useState({
        origin: '',
        destination: '',
        passengers: 1,
        departureDate: '',
        returnDate: ''
    });

    // Fetch all flights on component mount
    useEffect(() => {
        fetchFlights();
        fetchMyBookings();
    }, []);

    const fetchFlights = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost/db-project/backend/api/booking.php?action=getFlights');
            const data = await response.json();
            if (data.success) {
                setFlights(data.data);
                setFilteredFlights(data.data);
            }
        } catch (error) {
            console.error('Error fetching flights:', error);
        }
        setLoading(false);
    };

    const fetchMyBookings = async () => {
        try {
            // Assuming user_id is stored in localStorage or context
            const userId = localStorage.getItem('user_id') || 1;
            const response = await fetch(`http://localhost/db-project/backend/api/booking.php?action=getBookings&user_id=${userId}`);
            const data = await response.json();
            if (data.success) {
                setMyBookings(data.data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Filter flights based on search parameters
        const filtered = flights.filter(flight => {
            const matchesOrigin = !searchParams.origin || 
                flight.origin_code.toLowerCase().includes(searchParams.origin.toLowerCase()) ||
                flight.origin_city.toLowerCase().includes(searchParams.origin.toLowerCase());
            
            const matchesDestination = !searchParams.destination ||
                flight.destination_code.toLowerCase().includes(searchParams.destination.toLowerCase()) ||
                flight.destination_city.toLowerCase().includes(searchParams.destination.toLowerCase());
            
            const matchesDate = !searchParams.departureDate || 
                new Date(flight.departure_time).toISOString().split('T')[0] === searchParams.departureDate;
            
            return matchesOrigin && matchesDestination && matchesDate;
        });
        
        setFilteredFlights(filtered);
        setLoading(false);
    };

 const handleBookFlight = async (flightId) => {
    try {
        const userId = 1; // Hardcode for testing
        const seatNumber = `${Math.floor(Math.random() * 30) + 1}${'ABCDEF'[Math.floor(Math.random() * 6)]}`;
        
        console.log('Attempting to book flight:', flightId, 'Seat:', seatNumber);
        
        // Use FormData - PHP handles this better
        const formData = new FormData();
        formData.append('action', 'bookFlight');
        formData.append('user_id', userId.toString());
        formData.append('flight_id', flightId.toString());
        formData.append('seat_number', seatNumber);
        
        const response = await fetch('http://localhost/db-project/backend/api/booking.php', {
            method: 'POST',
            // NO headers for FormData - browser sets them automatically
            body: formData
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            alert(`Booked! Seat: ${seatNumber}, Booking ID: ${data.booking_id}`);
            fetchMyBookings();
        } else {
            alert('Failed: ' + data.message);
        }
        
    } catch (error) {
        console.error('Full error:', error);
        alert('Network error. Check console.');
    }
};

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="booking-container">
            {/* Header */}
            <header className="booking-header">
                <h1>Your Experience Start Here!</h1>
            </header>

            {/* Navigation Tabs */}
            <div className="nav-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'flights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('flights')}
                >
                    ✈️ Flights
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bookings')}
                >
                    📋 My Bookings
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
                    onClick={() => setActiveTab('status')}
                >
                    📊 Flight Status
                </button>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <input 
                    type="text" 
                    placeholder="Type here to search flights..." 
                    className="search-input"
                />
            </div>

            {/* Main Content */}
            <main className="main-content">
                {activeTab === 'flights' && (
                    <>
                        <h2>Flights</h2>
                        <form className="flight-search-form" onSubmit={handleSearch}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Origin</label>
                                    <input 
                                        type="text" 
                                        name="origin"
                                        value={searchParams.origin}
                                        onChange={handleInputChange}
                                        placeholder="City or Airport Code"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Destination</label>
                                    <input 
                                        type="text" 
                                        name="destination"
                                        value={searchParams.destination}
                                        onChange={handleInputChange}
                                        placeholder="City or Airport Code"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Number Of Passengers</label>
                                    <select 
                                        name="passengers"
                                        value={searchParams.passengers}
                                        onChange={handleInputChange}
                                    >
                                        {[1,2,3,4,5,6].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Departure</label>
                                    <input 
                                        type="date" 
                                        name="departureDate"
                                        value={searchParams.departureDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Return</label>
                                    <input 
                                        type="date" 
                                        name="returnDate"
                                        value={searchParams.returnDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <button type="submit" className="submit-btn">
                                        Search Flights
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Flight Results */}
                        <div className="flight-results">
                            {loading ? (
                                <div className="loading">Loading flights...</div>
                            ) : filteredFlights.length > 0 ? (
                                filteredFlights.map(flight => (
                                    <div key={flight.flight_id} className="flight-card">
                                        <div className="flight-info">
                                            <div className="route">
                                                <span className="airport-code">{flight.origin_code}</span>
                                                <span className="arrow">→</span>
                                                <span className="airport-code">{flight.destination_code}</span>
                                            </div>
                                            <div className="cities">
                                                {flight.origin_city} to {flight.destination_city}
                                            </div>
                                            <div className="times">
                                                <div>Departure: {new Date(flight.departure_time).toLocaleString()}</div>
                                                <div>Arrival: {new Date(flight.arrival_time).toLocaleString()}</div>
                                            </div>
                                            <div className="aircraft">
                                                Aircraft: {flight.aircraft_model} (Capacity: {flight.capacity})
                                            </div>
                                        </div>
                                        <button 
                                            className="book-btn"
                                            onClick={() => handleBookFlight(flight.flight_id)}
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="no-flights">No flights found. Try different search criteria.</div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'bookings' && (
                    <>
                        <h2>My Bookings</h2>
                        <div className="bookings-list">
                            {myBookings.length > 0 ? (
                                myBookings.map(booking => (
                                    <div key={booking.booking_id} className="booking-card">
                                        <div className="booking-header">
                                            <h3>Booking #{booking.booking_id}</h3>
                                            <span className="seat">Seat: {booking.seat_number}</span>
                                        </div>
                                        <div className="booking-details">
                                            <div className="passenger">
                                                Passenger: {booking.passenger_fname} {booking.passenger_lname}
                                            </div>
                                            <div className="flight">
                                                Flight: {booking.origin} → {booking.destination}
                                            </div>
                                            <div className="dates">
                                                <div>Booking Date: {new Date(booking.booking_date).toLocaleString()}</div>
                                                <div>Departure: {new Date(booking.departure_time).toLocaleString()}</div>
                                                <div>Arrival: {new Date(booking.arrival_time).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-bookings">No bookings found.</div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'status' && (
                    <>
                        <h2>Flight Status</h2>
                        <div className="status-info">
                            <p>Check your flight status by entering your flight number or booking reference.</p>
                            <div className="status-search">
                                <input type="text" placeholder="Enter flight number or booking ID" />
                                <button className="status-btn">Check Status</button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default Booking;