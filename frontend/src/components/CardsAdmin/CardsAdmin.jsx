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
          icon="🧑‍🤝‍🧑"
          variant="passenger"
        />
      </Link>
      
      <Link to="manageCrews" className="card-link">
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
      <Link to="manageFlights" className="card-link">
       {" "}
        <Card
          title="Manage Flights"
          description="View, add, update and delete flights"
          icon="✈️"
          variant="flight"
        />
      </Link>
      <Link to="manageAirports" className="card-link">
       {" "}
        <Card
          title="Manage Airports"
          description="View, add, update and delete airports"
          icon="🏢"
          variant="airport"
        />
      </Link>
      <Link to="manageAircrafts" className="card-link">
       {" "}
        <Card
          title="Manage Aircrafts"
          description="View, add, update and delete aircrafts"
          icon="🛫"
          variant="aircraft"
        />
      </Link>
      <Link to="manageFlights_Crews" className="card-link">
       {" "}
        <Card
          title="Manage Flights_Crews"
          description="View, add, update and delete flights_crews"
          icon="🛫"
          variant="flights_Crews"
        />
      </Link>
    </div>
  )
}

export default CardsAdmin