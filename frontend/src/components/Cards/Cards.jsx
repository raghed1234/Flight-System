// src/components/Card/Card.jsx
import React from 'react';
import "./Cards.css";

const Card = ({ 
    title, 
    description, 
    onClick, 
    icon, 
    variant = 'default' 
}) => {
    return (
        <div 
            className={`card card-${variant}`}
            onClick={onClick}
        >
            {icon && <div className="card-icon">{icon}</div>}
            <div className="card-content">
                <h3 className="card-title">{title}</h3>
                {description && <p className="card-description">{description}</p>}
            </div>
            <div className="card-arrow">→</div>
        </div>
    );
};

export default Card;