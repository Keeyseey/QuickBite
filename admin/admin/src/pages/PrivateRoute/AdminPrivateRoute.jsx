import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";

const AdminPrivateRoute = ({ children }) => {
  const { adminToken } = useContext(AdminContext);

  if (!adminToken) return <Navigate to="/login" replace />;

  return children;
};

export default AdminPrivateRoute;
