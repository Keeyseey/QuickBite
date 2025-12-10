import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { RiderContext } from "../../context/RiderContext";

const PrivateRiderRoute = ({ children }) => {
    const { role: riderRole, loading } = useContext(RiderContext) || {};

    // Wait until loading finishes
    if (loading) return null;

    // If not logged in as rider → redirect to rider login
    if (!riderRole) return <Navigate to="/rider-login" replace />;

    // Allowed
    return children;
};

export default PrivateRiderRoute;
