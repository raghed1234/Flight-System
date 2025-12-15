import "./Crew.css";
import { Link } from "react-router-dom"; // Import Link
import CardsCrew from "../../components/CardsCrew/CardsCrew";

const Crew = () => {
  return (
    <>
      <div className="admin-super-wrapper">
        <div className="admin-header">
          <h1>Crew Page</h1>
          <Link to="/">
            <button className="log-out-btn">Log out</button>
          </Link>
        </div>
        
        <CardsCrew />
      </div>
    </>
  );
};

export default Crew;