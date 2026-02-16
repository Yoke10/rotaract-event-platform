import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-2xl font-bold gradient-text mb-4">Rotaract Events</h3>
                        <p className="text-gray-500 max-w-sm">
                            Connecting communities through unforgettable experiences. Join us in making a difference, one event at a time.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link></li>
                            <li><Link to="/events" className="hover:text-indigo-600 transition-colors">Events</Link></li>
                            <li><Link to="/signup" className="hover:text-indigo-600 transition-colors">Sign Up</Link></li>
                            <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Admin</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li>
                                <Link to="/login" className="flex items-center hover:text-indigo-600 transition-colors group">
                                    <Shield className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                    Admin Login
                                </Link>
                            </li>
                            <li>
                                <Link to="/scanner" className="hover:text-indigo-600 transition-colors">
                                    Scanner Portal
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Rotaract Event Platform. All rights reserved.</p>
                    <p className="flex items-center mt-2 md:mt-0">
                        Made with <Heart className="w-4 h-4 mx-1 text-red-400 fill-current" /> by Rotaract Tech Team
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
