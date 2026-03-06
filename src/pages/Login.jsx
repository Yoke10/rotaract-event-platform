import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, LogIn } from 'lucide-react';

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login, googleLogin, currentUser } = useAuth();
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    // Where to go after login — either where user was trying to go, or home
    const from = location.state?.from?.pathname || '/';

    const onSubmit = async (data) => {
        try {
            setError('');
            setLoading(true);
            const { role } = await login(data.email, data.password);
            console.log("Login successful. Detected role:", role);

            if (role === 'admin') {
                console.log('Redirecting to Admin Dashboard');
                navigate('/admin/dashboard');
            } else {
                console.log('Redirecting to:', from);
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError('Failed to log in: ' + err.message);
        }
        setLoading(false);
    };

    // Already logged in — show a friendly message instead of the form
    if (currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f9f0ff 0%,#fff0f8 100%)' }}>
                <div className="text-center bg-white rounded-2xl shadow-lg px-10 py-12 max-w-sm w-full mx-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'linear-gradient(135deg,#400763,#ed0775)' }}>
                        <span className="text-3xl">👤</span>
                    </div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: '#1a1a1a' }}>Already Logged In</h2>
                    <p className="text-sm mb-6" style={{ color: '#6b6b6b' }}>You are already signed in as<br /><strong>{currentUser.email}</strong></p>
                    <div className="flex flex-col gap-3">
                        <Link to="/" className="btn-primary text-center">Go to Home</Link>
                        <Link to="/profile" className="btn-secondary text-center text-sm">My Profile</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl shadow-lg mb-4" style={{
                        background: 'linear-gradient(135deg, #400763 0%, #680b56 50%, #ed0775 100%)'
                    }}>
                        <span className="text-white font-bold text-3xl">R</span>
                    </div>
                    <h2 className="text-3xl font-bold gradient-text">Welcome Back</h2>
                    <p className="mt-2" style={{ color: '#6b6b6b' }}>Login to your account</p>
                </div>

                {/* Login Form */}
                <div className="glass-card shadow-xl rounded-2xl p-6 sm:p-8 border border-white/50">
                    {error && (
                        <div className="alert-error mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a1a1a' }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                {...register("email", { required: "Email is required" })}
                                className="glass-input"
                                placeholder="you@example.com"
                            />
                            {errors.email && (
                                <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a1a1a' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                {...register("password", { required: "Password is required" })}
                                className="glass-input"
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 mr-2" />
                                    Login
                                </>
                            )}
                        </button>

                        <div className="relative flex items-center justify-center my-4">
                            <span className="absolute px-2 bg-white text-gray-500 text-sm">Or continue with</span>
                            <div className="w-full border-t border-gray-200"></div>
                        </div>

                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    const { role } = await googleLogin();
                                    if (role === 'admin') {
                                        navigate('/admin/dashboard');
                                    } else {
                                        navigate(from, { replace: true });
                                    }
                                } catch (err) {
                                    setError('Failed to log in with Google: ' + err.message);
                                }
                                setLoading(false);
                            }}
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-full shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="h-5 w-5 mr-2" aria-hidden="true" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Sign in with Google
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p style={{ color: '#6b6b6b' }}>
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-semibold" style={{ color: '#ed0775' }}>
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
