import React from 'react';
import './Navbar.css';
import { Link } from "react-router-dom";


function Navbar({ user, setUser }) {
return (
<nav className="nav-container">
<div className="nav-left">SkyMatrix</div>


     <ul className="nav-center">
        <li>
          <Link to="home">Home</Link>
        </li>
        <li>
          <Link to="about">About</Link>
        </li>
        <li>
          <Link to="booking">Booking</Link>
        </li>
        <li>
          <Link to="contact">Contact</Link>
        </li>
      </ul>

      <Link to="/">
        <button className="log-out">Log out</button>
      </Link>
      </nav>
);
}


export default Navbar;