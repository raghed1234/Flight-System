import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";

function App() {
  return (
    <Router>
      <Routes>
        {/* Home page route */}
        <Route path="/" element={<Home />} />

        {/* Sign In page route */}
        <Route path="/signin" element={<Signin />} />
      </Routes>
      <Routes>
        {/* Home page route */}
        <Route path="/" element={<Home />} />

        {/* Sign Up page route */}
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>

  );
}

export default App;
