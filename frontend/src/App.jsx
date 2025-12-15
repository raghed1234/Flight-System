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
import Flight_Crewlist from "./components/CrudFlights_Crews/CrudFlights_Crews"
import Crew from "./pages/Crew/Crew"
import AssignmentList from "./components/AssignmentList/AssignmentList"
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
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
        
        <Route path="/admin" element={<ProtectedRoute requiredRole={"admin"}><Admin/></ProtectedRoute>} />
        {/* Admin Management Page (when clicking on card) */}
        <Route path="/admin/manageAdmins" element={<ProtectedRoute requiredRole={"admin"}><AdminList /></ProtectedRoute>} />
        <Route path="/admin/managePassengers" element={<ProtectedRoute requiredRole={"admin"}><PassengersList/></ProtectedRoute>} />
        <Route path="/admin/manageCrews" element={<ProtectedRoute requiredRole={"admin"}><CrewsList/></ProtectedRoute>} />
        <Route path="/admin/manageFlights" element={<ProtectedRoute requiredRole={"admin"}><FlightList/></ProtectedRoute>} />
        <Route path="/admin/manageAirports" element={<ProtectedRoute requiredRole={"admin"}><AirportList/></ProtectedRoute>} />
        <Route path="/admin/manageAircrafts" element={<ProtectedRoute requiredRole={"admin"}><AircraftList/></ProtectedRoute>} />
        <Route path="/admin/manageFlights_Crews" element={<ProtectedRoute requiredRole={"admin"}><Flight_Crewlist/></ProtectedRoute>} />



        <Route path="/crew" element={<Crew/>} />
        <Route path="/crew/assignmentList" element={<AssignmentList/>} />


        <Route path="/booking" element={<Booking />} />
        <Route path="/signup" element={<Signup />} />

        {/* USER DASHBOARD AFTER LOGIN */}
        <Route path="/home" element={<Home user={user} />} />
      </Routes>
  </BrowserRouter>
  );
}

export default App;