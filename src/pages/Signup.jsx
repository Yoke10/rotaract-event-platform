import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, UserPlus } from 'lucide-react';

export default function Signup() {
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const { signup } = useAuth();
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
