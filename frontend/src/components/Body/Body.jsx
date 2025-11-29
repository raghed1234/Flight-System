import React from 'react';
import './Body.css';
import myImage from '../../img/aiplane.webp';

function Body() {
return (
<div className="body-wrapper">
<div className="body-left">
<h1>Welcome to SkyMatrix</h1>
<p>Step into SkyMatrix, where managing flights becomes effortless. From scheduling to tracking, our platform offers intuitive tools and real-time updates to keep your operations smooth and efficient. Explore the features and take your flight management experience to new heights.</p>
</div>


<div className="body-right">
<img src={myImage} alt="plane" />
</div>
</div>
);
}


export default Body;