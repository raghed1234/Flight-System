import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
=======
>>>>>>> b213e072053933016d0d27e352ba8f5e5702d806
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
<<<<<<< HEAD
    <Router>
  <BrowserRouter>
      <Routes>

        {/* DEFAULT PAGE → SIGN IN */}
        <Route path="/" element={<Signin setUser={setUser} />} />

        <Route path="/signin" element={<Signin setUser={setUser} />} />
         {/* DEFAULT PAGE → SIGN IN */}
        <Route path="/" element={<Login />} />
         {/* Admin Dashboard Page */}

=======
  <BrowserRouter>
      <Routes>
         {/* DEFAULT PAGE → SIGN IN */}
        <Route path="/" element={<Login />} />
         {/* Admin Dashboard Page */}
        
>>>>>>> b213e072053933016d0d27e352ba8f5e5702d806
        <Route path="/admin" element={<Admin/>} />
        {/* Admin Management Page (when clicking on card) */}
        <Route path="/admin/manageAdmins" element={<AdminList />} />
        <Route path="/signup" element={<Signup />} />

        {/* USER DASHBOARD AFTER LOGIN */}
        <Route path="/home" element={<Home user={user} />} />
      </Routes>
<<<<<<< HEAD
    </Router>
=======
>>>>>>> b213e072053933016d0d27e352ba8f5e5702d806
  </BrowserRouter>
  );
}
