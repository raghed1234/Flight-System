import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Home from "./pages/Home";
import Admin from "./pages/Admin/Admin";
import Booking from "./pages/Booking";
import AdminList from "./components/CrudAdmins/CrudAdmins"
import PassengersList from "./components/CrudPassengers/CrudPassengers"
import CrewsList from "./components/CrudCrews/CrudCrews"
import FlightList from "./components/CrudFlights/CrudFlights"
import AirportList from "./components/CrudAirports/CrudAirports"
import AircraftList from "./components/CrudAircrafts/CrudAircrafts"

function App() {
  const [user, setUser] = useState(null);

  // Load user from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
  <BrowserRouter>
      <Routes>
         {/* DEFAULT PAGE → SIGN IN */}
        <Route path="/" element={<Login />} />
         {/* Admin Dashboard Page */}
        
        <Route path="/admin" element={<Admin/>} />
        {/* Admin Management Page (when clicking on card) */}
        <Route path="/admin/manageAdmins" element={<AdminList />} />
        <Route path="/admin/managePassengers" element={<PassengersList/>} />
        <Route path="/admin/manageCrews" element={<CrewsList/>} />
        <Route path="/admin/manageFlights" element={<FlightList/>} />
        <Route path="/admin/manageAirports" element={<AirportList/>} />
        <Route path="/admin/manageAircrafts" element={<AircraftList/>} />


        <Route path="/booking" element={<Booking />} />
        <Route path="/signup" element={<Signup />} />

        {/* USER DASHBOARD AFTER LOGIN */}
        <Route path="/home" element={<Home user={user} />} />
      </Routes>
  </BrowserRouter>
  );
}

export default App;