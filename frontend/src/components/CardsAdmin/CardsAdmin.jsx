import React from 'react'
import { Link } from 'react-router-dom'
import Card from "../Cards/Cards"
import './CardsAdmin.css'

const CardsAdmin = () => {
  return (
    <div className="admin-wrapper">
      <Link to="managePassengers" className="card-link">
       {" "}
        <Card
          title="Manage Passengers"
          description="View, add, update and delete passengers"
          icon="👤"
          variant="passenger"
        />
      </Link>
      
      <Link to="manageCrew" className="card-link">
       {" "}
        <Card
          title="Manage Crew"
          description="View, add, update and delete crews"
          icon="👨‍✈️"
          variant="crew"
        />
      </Link>
      
      <Link to="manageAdmins" className="card-link">
       {" "}
        <Card
          title="Manage Admins"
          description="View, add, update and delete admins"
          icon="👨‍💼"
          variant="admin"
        />
      </Link>
    </div>
  )
}

export default CardsAdmin