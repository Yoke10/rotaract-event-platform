import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, QrCode, LogOut, ShieldCheck } from 'lucide-react';

export default function AdminNavbar() {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/admin-login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo / Brand */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-wide">
                            Admin<span className="text-indigo-400">Portal</span>
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-6">
                        <Link to="/admin/dashboard" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="hidden md:inline font-medium">Dashboard</span>
                        </Link>

                        <Link to="/admin/create-event" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                            <PlusCircle className="w-5 h-5" />
                            <span className="hidden md:inline font-medium">Create Event</span>
                        </Link>

                        <Link to="/admin/scanner" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                            <QrCode className="w-5 h-5" />
                            <span className="hidden md:inline font-medium">Scanner</span>
                        </Link>

                        <div className="h-6 w-px bg-gray-700 mx-2"></div>

                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-400 hidden md:block">
                                {currentUser?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-3 py-1.5 bg-red-600/10 text-red-400 rounded-md hover:bg-red-600 hover:text-white transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
