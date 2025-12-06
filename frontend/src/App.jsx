import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
// New pages
import About from "./pages/About";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";

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
    <Router>
      <Routes>

        {/* DEFAULT PAGE → SIGN IN */}
          <Route
          path="/"
           element={user ? <Navigate to="/home" /> : <Signin setUser={setUser} />}
          />

        <Route path="/signin" element={<Signin setUser={setUser} />} />
        <Route path="/signup" element={<Signup />} />

        {/* USER DASHBOARD AFTER LOGIN */}
        <Route path="/home" element={<Home user={user} />} />

        {/* Home (optional before login or public page) */}
        <Route path="/home" element={<Home />} />

              {/* NEW ROUTES */}
        <Route path="/about" element={<About />} />        {/* About page */}
        <Route path="/booking" element={<Booking />} />    {/* Booking page */}
        <Route path="/contact" element={<Contact />} />    {/* Contact page */}


      </Routes>
    </Router>
  );
}

export default App;
