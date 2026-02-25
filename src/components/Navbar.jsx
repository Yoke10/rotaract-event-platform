import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, User } from 'lucide-react';

export default function Navbar() {
    const { currentUser, logout, userRole } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

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
                        {['Home', 'Events', ...(currentUser ? ['My Tickets'] : [])].map((item) => (
                            <Link
                                key={item}
                                to={item === 'Home' ? '/' : item === 'My Tickets' ? '/my-tickets' : `/${item.toLowerCase()}`}
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
                        <Link
                            to="/scanner"
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title="QR Scanner"
                            style={{ color: '#400763' }}
                        >
                            <svg data-id="25" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-qr-code w-6 h-6"><rect width="5" height="5" x="3" y="3" rx="1"></rect><rect width="5" height="5" x="16" y="3" rx="1"></rect><rect width="5" height="5" x="3" y="16" rx="1"></rect><path d="M21 16h-3a2 2 0 0 0-2 2v3"></path><path d="M21 21v.01"></path><path d="M12 7v3a2 2 0 0 1-2 2H7"></path><path d="M3 12h.01"></path><path d="M12 3h.01"></path><path d="M12 16v.01"></path><path d="M16 12h1"></path><path d="M21 12v.01"></path><path d="M12 21v-1"></path></svg>
                        </Link>

                        {currentUser ? (
                            <Link
                                to="/profile"
                                className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all hover:shadow-md"
                                style={{ borderColor: '#400763', color: '#400763', backgroundColor: 'rgba(64,7,99,0.05)' }}
                                title="My Profile"
                            >
                                <User className="w-5 h-5" />
                            </Link>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link
                                    to="/login"
                                    className="btn-primary"
                                >
                                    Login
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
                            {['Home', 'Events', ...(currentUser ? ['My Tickets'] : [])].map((item) => (
                                <Link
                                    key={item}
                                    to={item === 'Home' ? '/' : item === 'My Tickets' ? '/my-tickets' : `/${item.toLowerCase()}`}
                                    className="px-4 py-2 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                    style={{ color: '#4a4a4a' }}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item}
                                </Link>
                            ))}
                            {currentUser ? (
                                <>
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
                                        className="btn-primary mx-4"
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
