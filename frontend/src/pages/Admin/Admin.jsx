import "./Admin.css";
import CardsAdmin from "../../components/CardsAdmin/CardsAdmin";

const Admin = () => {
  return (
    <>
      <div className="admin-super-wrapper">
        <div className="admin-header">
          <h1>Admin Board</h1>
        </div>
        
        <CardsAdmin />
      </div>
    </>
  );
};

export default Admin;