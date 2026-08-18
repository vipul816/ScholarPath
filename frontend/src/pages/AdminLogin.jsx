import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import ScholarPathLogo from '../components/ScholarPathLogo';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { adminLogin } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await adminLogin(formData.email, formData.password);

        if (result.success) {
            navigate('/admin');
        } else {
            setError(result.message || 'Invalid admin credentials');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="max-w-md w-full space-y-8 animate-fade-in">
                {/* Logo & Header */}
                <div className="text-center">
                    <div className="flex justify-center flex-col items-center gap-2">
                        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg border border-gray-700">
                            <ScholarPathLogo className="w-12 h-12" />
                        </div>
                        <h1 className="text-3xl font-display font-medium text-white tracking-tight">
                            Scholar<span className="font-light text-cyan-500">Path</span>
                        </h1>
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-white font-serif">
                        Admin Portal
                    </h2>
                    <p className="mt-2 text-sm text-gray-400 italic">
                        "Secure Administration Console"
                    </p>
                </div>

                {/* Login Form */}
                <form className="mt-8 space-y-6 bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                                    placeholder="admin@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
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
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 rounded-lg text-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>

                    <div className="text-center">
                        <Link to="/signup" className="text-sm text-gray-400 hover:text-white transition-colors">
                            ← Back to User Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
