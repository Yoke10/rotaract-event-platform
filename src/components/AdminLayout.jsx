import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';

const AdminLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <AdminNavbar />
            <div className="flex-grow pt-16"> {/* Add padding-top to account for fixed navbar */}
                <Outlet />
            </div>
            {/* No Footer for Admin Layout as requested */}
        </div>
    );
};

export default AdminLayout;
