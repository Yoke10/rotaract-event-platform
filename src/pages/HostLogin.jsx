import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { eventService } from '../services/eventService';

export default function HostLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!username.trim() || !password.trim()) {
                throw new Error("Please enter both username and password.");
            }

            const events = await eventService.getAllEvents();
            const matchedEvent = events.find(
                ev => ev.hostUsername === username.trim() && ev.hostPassword === password.trim()
            );

            if (matchedEvent) {
                localStorage.setItem(`hostSession_${matchedEvent.id}`, 'true');
                navigate(`/host/event/${matchedEvent.id}`);
            } else {
                setError('Invalid host credentials. Please check your username and password.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-50">

            {/* Subtle background tint */}
            <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at top left, rgba(64,7,99,0.06) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(64,7,99,0.04) 0%, transparent 60%)' }} />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">

                {/* Logo */}
                <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ background: '#400763' }}>
                    <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-center text-3xl font-extrabold tracking-tight" style={{ color: '#400763' }}>
                    Event Host Portal
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Sign in to view your specific event's live dashboard
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white py-8 px-4 shadow-xl shadow-purple-100/40 sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-5" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#400763' }}>
                                Host Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:border-transparent transition"
                                    style={{ '--tw-ring-color': '#400763' }}
                                    placeholder="Enter your assigned username"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#400763' }}>
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:border-transparent transition"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            style={{ background: '#400763', boxShadow: '0 4px 14px rgba(64,7,99,0.25)' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#5a0a8a'}
                            onMouseLeave={e => e.currentTarget.style.background = '#400763'}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                'Access Dashboard →'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
