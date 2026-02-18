import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, UserPlus } from 'lucide-react';

export default function Signup() {
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const { signup, googleLogin } = useAuth();
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        try {
            setError('');
            setLoading(true);
            await signup(data.email, data.password, data.name, data.mobile);
            navigate('/');
        } catch (err) {
            setError('Failed to create an account: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl shadow-lg mb-4" style={{
                        background: 'linear-gradient(135deg, #400763 0%, #680b56 50%, #ed0775 100%)'
                    }}>
                        <span className="text-white font-bold text-3xl">R</span>
                    </div>
                    <h2 className="text-3xl font-bold gradient-text">Create Account</h2>
                    <p className="mt-2" style={{ color: '#6b6b6b' }}>Join the Rotaract community</p>
                </div>

                {/* Signup Form */}
                <div className="glass-card">
                    {error && (
                        <div className="alert-error mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a1a1a' }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                {...register("name", { required: "Name is required" })}
                                className="glass-input"
                                placeholder="John Doe"
                            />
                            {errors.name && (
                                <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

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
                                Mobile Number
                            </label>
                            <input
                                type="tel"
                                {...register("mobile", {
                                    required: "Mobile number is required",
                                    minLength: { value: 10, message: "Must be 10 digits" }
                                })}
                                className="glass-input"
                                placeholder="1234567890"
                            />
                            {errors.mobile && (
                                <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                                    {errors.mobile.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a1a1a' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                {...register("password", {
                                    required: "Password is required",
                                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                                })}
                                className="glass-input"
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a1a1a' }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                {...register("confirmPassword", {
                                    required: "Confirm Password is required",
                                    validate: (val) => {
                                        if (watch('password') != val) {
                                            return "Your passwords do not match";
                                        }
                                    }
                                })}
                                className="glass-input"
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                                    {errors.confirmPassword.message}
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
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Sign Up
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
                                        navigate('/');
                                    }
                                } catch (err) {
                                    setError('Failed to sign up with Google: ' + err.message);
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
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold" style={{ color: '#ed0775' }}>
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
