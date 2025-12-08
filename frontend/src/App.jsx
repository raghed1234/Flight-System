import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Home from "./pages/Home";
import Admin from "./pages/Admin/Admin";
import AdminList from "./components/CrudAdmins/CrudAdmins"

function App() {
  const [user, setUser] = useState(null);
@@ -16,23 +18,21 @@ function App() {
  }, []);

  return (
    <Router>
  <BrowserRouter>
      <Routes>

        {/* DEFAULT PAGE → SIGN IN */}
        <Route path="/" element={<Signin setUser={setUser} />} />

        <Route path="/signin" element={<Signin setUser={setUser} />} />
         {/* DEFAULT PAGE → SIGN IN */}
        <Route path="/" element={<Login />} />
         {/* Admin Dashboard Page */}

        <Route path="/admin" element={<Admin/>} />
        {/* Admin Management Page (when clicking on card) */}
        <Route path="/admin/manageAdmins" element={<AdminList />} />
        <Route path="/signup" element={<Signup />} />

        {/* USER DASHBOARD AFTER LOGIN */}
        <Route path="/home" element={<Home user={user} />} />

        {/* Home (optional before login or public page) */}
        <Route path="/home" element={<Home />} />

      </Routes>
    </Router>
  </BrowserRouter>
  );
}