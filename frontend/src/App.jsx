import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

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
        <Route path="/" element={<Signin setUser={setUser} />} />

        <Route path="/signin" element={<Signin setUser={setUser} />} />
        <Route path="/signup" element={<Signup />} />

        {/* USER DASHBOARD AFTER LOGIN */}
        <Route path="/home" element={<Home user={user} />} />

        {/* Home (optional before login or public page) */}
        <Route path="/home" element={<Home />} />

      </Routes>
    </Router>
  );
}

export default App;
