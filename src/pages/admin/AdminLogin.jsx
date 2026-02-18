import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
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
                setError('Access Denied: You do not have administrator privileges.');
                // Optionally logout the user if they are not admin
            }
        } catch (err) {
            setError('Failed to log in: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl shadow-lg mb-4" style={{
                        background: 'linear-gradient(135deg, #400763 0%, #680b56 50%, #ed0775 100%)'
                    }}>
                        <ShieldCheck className="text-white w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold gradient-text">Admin Portal</h2>
                    <p className="mt-2" style={{ color: '#6b6b6b' }}>Authorized Personnel Only</p>
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
                                Admin Email
                            </label>
                            <input
                                type="email"
                                {...register("email", { required: "Email is required" })}
                                className="glass-input"
                                placeholder="admin@rotaract.com"
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
                                    Verifying Access...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-5 h-5 mr-2" />
                                    Admin Login
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
