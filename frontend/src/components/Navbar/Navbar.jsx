import React from 'react';
import './Navbar.css';
import { Link } from "react-router-dom";


function Navbar() {
return (
<nav className="nav-container">
<div className="nav-left">SkyMatrix</div>


<ul className="nav-center">
<li>Home</li>
<li>About</li>
<li>Booking</li>
<li>Contact</li>
</ul>


<div className="nav-right">      
      <Link to="/signin">
        <button className="signin-btn">Sign In</button>
      </Link>
      <Link to="/signup">
        <button className="signup-btn">Sign Up</button>
      </Link>
</div>
</nav>
);
}


export default Navbar;