import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

export default function HostRoute({ children }) {
    const { id } = useParams();

    // Check if the host session for this specific event exists in localStorage
    const hasHostSession = localStorage.getItem(`hostSession_${id}`) === 'true';

    if (!hasHostSession) {
        return <Navigate to="/host-login" replace />;
    }

    return <>{children}</>;
}
