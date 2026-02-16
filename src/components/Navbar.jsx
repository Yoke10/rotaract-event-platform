import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
    const { currentUser, logout, userRole } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Logo Section */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="relative w-12 h-12 flex items-center justify-center rounded-xl shadow-md" style={{
                            background: 'linear-gradient(135deg, #400763 0%, #680b56 50%, #ed0775 100%)'
                        }}>
                            <span className="text-white font-bold text-2xl">R</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold gradient-text">
                                Rotaract
                            </span>
                            <span className="text-xs font-semibold tracking-wider" style={{ color: '#ed0775' }}>EVENTS</span>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {['Home', 'Events'].map((item) => (
                            <Link
                                key={item}
                                to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                                className="font-medium transition-colors relative group"
                                style={{ color: '#4a4a4a' }}
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{
                                    background: 'linear-gradient(90deg, #400763 0%, #ed0775 100%)'
                                }}></span>
                            </Link>
                        ))}
                    </div>

                    {/* User Profile / Login */}
                    <div className="hidden md:flex items-center space-x-4">
                        {currentUser ? (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-2 px-4 py-2 rounded-full border-2 transition-all hover:shadow-md"
                                    style={{ borderColor: '#400763', color: '#400763' }}
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">{currentUser.email?.split('@')[0]}</span>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2">
                                        {userRole === 'admin' && (
                                            <Link
                                                to="/admin/dashboard"
                                                className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                                                style={{ color: '#4a4a4a' }}
                                            >
                                                <LayoutDashboard className="w-5 h-5 mr-3" style={{ color: '#400763' }} />
                                                <span>Admin Dashboard</span>
                                            </Link>
                                        )}
                                        <Link
                                            to="/my-tickets"
                                            className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                                            style={{ color: '#4a4a4a' }}
                                        >
                                            <User className="w-5 h-5 mr-3" style={{ color: '#400763' }} />
                                            <span>My Tickets</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                            style={{ color: '#ef4444' }}
                                        >
                                            <LogOut className="w-5 h-5 mr-3" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link
                                    to="/login"
                                    className="px-6 py-2 font-semibold rounded-full transition-all"
                                    style={{ color: '#400763' }}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="btn-primary"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: '#400763' }}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200">
                        <div className="flex flex-col space-y-3">
                            {['Home', 'Events'].map((item) => (
                                <Link
                                    key={item}
                                    to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                                    className="px-4 py-2 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                    style={{ color: '#4a4a4a' }}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item}
                                </Link>
                            ))}
                            {currentUser ? (
                                <>
                                    <Link
                                        to="/my-tickets"
                                        className="px-4 py-2 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                        style={{ color: '#4a4a4a' }}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        My Tickets
                                    </Link>
                                    {userRole === 'admin' && (
                                        <Link
                                            to="/admin/dashboard"
                                            className="px-4 py-2 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                            style={{ color: '#4a4a4a' }}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => { handleLogout(); setIsOpen(false); }}
                                        className="px-4 py-2 font-medium rounded-lg hover:bg-gray-50 transition-colors text-left"
                                        style={{ color: '#ef4444' }}
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                        style={{ color: '#4a4a4a' }}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="btn-primary mx-4"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
