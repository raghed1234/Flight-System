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
      <Link to="/logout">
        <button className="signin-btn">Log out</button>
      </Link>
    
</div>
</nav>
);
}


export default Navbar;