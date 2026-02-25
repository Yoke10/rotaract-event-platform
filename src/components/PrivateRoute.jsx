import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, requiredRole }) {
    const { currentUser, userRole, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!currentUser) {
        // Save the page the user was trying to reach so Login can redirect back
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}
