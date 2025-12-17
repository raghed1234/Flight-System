import React from 'react'
import { Link } from 'react-router-dom'
import Card from "../Cards/Cards"
import './CardsCrew.css'

const CardsCrew = () => {
  return (
    <div className="admin-wrapper">
      <Link to="assignmentList" className="card-link">
       {" "}
        <Card
          title="AssigmentList"
          description="View assigments"
          icon="🧑‍🤝‍🧑"
          variant="assigments"
        />
      </Link>
      
      <Link to="crewProfile" className="card-link">
       {" "}
        <Card
          title="my Profile"
          description="my email,password,name .."
          icon="👨‍✈️"
          variant="profile"
        />
      </Link>
      </div>
  )
}
export default CardsCrew;
      