import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';

export default function HostLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear all host sessions simply by clearing local storage, or targeting keys
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('hostSession_')) {
                localStorage.removeItem(key);
            }
        });
        navigate('/host-login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="fixed top-0 left-0 right-0 z-50 shadow-md text-white"
                style={{ background: '#400763' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-wide">
                                Event<span className="text-pink-200">Host</span>
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-white/70 hidden md:block">
                                Host Access Mode
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 text-white rounded-md hover:bg-white/20 transition-all font-medium text-sm border border-white/20"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="flex-grow pt-16">
                <Outlet />
            </div>
        </div>
    );
}
