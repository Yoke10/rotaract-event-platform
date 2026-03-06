import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User } from 'lucide-react';

export default function Navbar() {
    const { currentUser, logout, userRole } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Transparent only on home page when at the top; glass everywhere else
    const isHome = location.pathname === '/';
    const onHero = isHome && !scrolled;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // ── Dynamic styles based on scroll / page ───────────────────────────────
    const navStyle = onHero
        ? {
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            borderBottom: '1px solid transparent',
            boxShadow: 'none',
        }
        : {
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(14px) saturate(180%)',
            WebkitBackdropFilter: 'blur(14px) saturate(180%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 2px 20px rgba(64, 7, 99, 0.08)',
        };

    const linkColor = onHero ? '#fff' : '#4a4a4a';
    const logoMain = onHero ? '#fff' : undefined; // gradient-text otherwise
    const logoSub = onHero ? 'rgba(255,255,255,0.85)' : '#ed0775';
    const iconColor = onHero ? '#fff' : '#400763';
    const profileBg = onHero ? 'rgba(255,255,255,0.15)' : 'rgba(64,7,99,0.05)';
    const profileBdr = onHero ? '#fff' : '#400763';

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={navStyle}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">

                    {/* Logo */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="relative w-12 h-12 flex items-center justify-center rounded-xl shadow-md"
                            style={{ background: 'linear-gradient(135deg, #400763 0%, #680b56 50%, #ed0775 100%)' }}>
                            <span className="text-white font-bold text-2xl">R</span>
                        </div>
                        <div className="flex flex-col">
                            <span
                                className={onHero ? 'text-2xl font-bold' : 'text-2xl font-bold gradient-text'}
                                style={onHero ? { color: logoMain } : undefined}
                            >
                                Rotaract
                            </span>
                            <span className="text-xs font-semibold tracking-wider" style={{ color: logoSub }}>
                                EVENTS
                            </span>
                        </div>
                    </div>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {['Home', 'Events', ...(currentUser ? ['My Tickets'] : [])].map(item => (
                            <Link
                                key={item}
                                to={item === 'Home' ? '/' : item === 'My Tickets' ? '/my-tickets' : `/${item.toLowerCase()}`}
                                className="font-medium transition-colors relative group"
                                style={{ color: linkColor }}
                            >
                                {item}
                                <span
                                    className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                                    style={{
                                        background: onHero
                                            ? 'rgba(255,255,255,0.8)'
                                            : 'linear-gradient(90deg, #400763 0%, #ed0775 100%)'
                                    }}
                                />
                            </Link>
                        ))}
                    </div>

                    {/* Right side — QR + profile / login */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* QR Scanner icon */}
                        <Link to="/scanner" className="p-2 rounded-full transition-colors hover:bg-white/20"
                            title="QR Scanner" style={{ color: iconColor }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="5" height="5" x="3" y="3" rx="1" />
                                <rect width="5" height="5" x="16" y="3" rx="1" />
                                <rect width="5" height="5" x="3" y="16" rx="1" />
                                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                                <path d="M21 21v.01" />
                                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                                <path d="M3 12h.01" /><path d="M12 3h.01" />
                                <path d="M12 16v.01" /><path d="M16 12h1" />
                                <path d="M21 12v.01" /><path d="M12 21v-1" />
                            </svg>
                        </Link>

                        {currentUser ? (
                            <Link to="/profile"
                                className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all hover:shadow-md"
                                style={{ borderColor: profileBdr, color: profileBdr, backgroundColor: profileBg }}
                                title="My Profile">
                                <User className="w-5 h-5" />
                            </Link>
                        ) : (
                            <Link to="/login"
                                className="px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
                                style={onHero
                                    ? { background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)' }
                                    : { background: 'linear-gradient(135deg,#400763,#ed0775)', color: '#fff', border: 'none' }
                                }>
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: iconColor }}>
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden py-4 border-t"
                        style={{
                            background: onHero ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            borderColor: onHero ? 'rgba(255, 255, 255, 0.2)' : 'rgba(64, 7, 99, 0.1)'
                        }}>
                        <div className="flex flex-col space-y-2">
                            {['Home', 'Events', 'Scanner', ...(currentUser ? ['My Tickets'] : [])].map(item => (
                                <Link key={item}
                                    to={item === 'Home' ? '/' : item === 'My Tickets' ? '/my-tickets' : `/${item.toLowerCase()}`}
                                    className="px-4 py-2 font-medium rounded-lg transition-colors hover:bg-white/10"
                                    style={{ color: linkColor }}
                                    onClick={() => setIsOpen(false)}>
                                    {item}
                                </Link>
                            ))}
                            {currentUser ? (
                                <>
                                    {userRole === 'admin' && (
                                        <Link to="/admin/dashboard"
                                            className="px-4 py-2 font-medium rounded-lg transition-colors hover:bg-white/10"
                                            style={{ color: linkColor }}
                                            onClick={() => setIsOpen(false)}>
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => { handleLogout(); setIsOpen(false); }}
                                        className="px-4 py-2 font-medium rounded-lg transition-colors text-left"
                                        style={{ color: '#ef4444' }}>
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="btn-primary mx-4" onClick={() => setIsOpen(false)}>
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
