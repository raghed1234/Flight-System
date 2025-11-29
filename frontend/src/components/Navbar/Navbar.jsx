import React from 'react';
import './Navbar.css';


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
<button className="btn signin">Sign In</button>
<button className="btn signup">Sign Up</button>
</div>
</nav>
);
}


export default Navbar;