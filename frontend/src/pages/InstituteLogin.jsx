import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Building2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import ScholarPathLogo from '../components/ScholarPathLogo';
import { useAuth } from '../context/AuthContext';

const InstituteLogin = () => {
    const navigate = useNavigate();
    const { loginInstitute } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('🔐 Attempting institute login with:', formData.email);
            const result = await loginInstitute(formData.email, formData.password);
            console.log('📨 Login response:', result);

            if (result.success) {
                console.log('✓ Login successful, navigating to dashboard');
                navigate('/institute-dashboard');
            } else {
                console.log('❌ Login failed:', result.message);
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="max-w-md w-full space-y-8 animate-fade-in shadow-xl bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700">
                {/* Logo & Header */}
                <div className="text-center">
                    <div className="flex justify-center flex-col items-center gap-2">
                        <div className="w-16 h-16 bg-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-serif text-white tracking-tight bg-indigo-700 px-6 py-2 rounded-lg mt-2 shadow-sm border border-indigo-800">
                            Institute Portal
                        </h1>
                        <p className="text-xs font-semibold tracking-[0.2em] text-indigo-600 dark:text-indigo-300 uppercase mt-2">
                            Manage Your Institute
                        </p>
                    </div>
                    <h2 className="mt-8 text-2xl font-bold text-gray-900 dark:text-white font-sans">
                        Institute Login
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">
                        "Manage programs and instructors"
                    </p>
                </div>

                {/* Login Form */}
                <div className="card p-8">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Institute Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="input pl-10"
                                        placeholder="institute@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        className="input pl-10"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/institute-signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Sign up now
                            </Link>
                        </p>
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                                ← Back to Student/Instructor Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstituteLogin;
