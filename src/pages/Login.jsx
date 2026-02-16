import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, LogIn } from 'lucide-react';

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        try {
            setError('');
            setLoading(true);
            const { role } = await login(data.email, data.password);
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Failed to log in: ' + err.message);
        }
        setLoading(false);
    };

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
                <div className="glass-card">
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
