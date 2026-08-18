import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Building2, User, Phone, MapPin, Globe, CheckCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import ScholarPathLogo from '../components/ScholarPathLogo';

import { instituteAPI } from '../services/api';

const InstituteSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        // Institute details
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        instituteType: 'college',
        description: '',
        contactNumber: '',
        address: '',
        website: '',
        // Admin details
        adminName: '',
        adminEmail: '',
        adminPhone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingMessage, setPendingMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setPendingMessage('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const submitData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                instituteType: formData.instituteType,
                description: formData.description || null,
                contactNumber: formData.contactNumber || null,
                address: formData.address || null,
                website: formData.website || null,
                adminName: formData.adminName,
                adminEmail: formData.adminEmail,
                adminPhone: formData.adminPhone || null
            };

            const result = await instituteAPI.signup(submitData);

            if (result.success) {
                setPendingMessage(result.message);
                // Scroll to top to show message
                window.scrollTo(0, 0);
            } else {
                setError(result.message || 'Signup failed. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-3xl space-y-8 animate-fade-in">
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
                            Register Your Institution
                        </p>
                    </div>
                    <h2 className="mt-8 text-2xl font-bold text-gray-900 dark:text-white font-sans">
                        Create Institute Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">
                        "Join ScholarPath and manage your educational institution"
                    </p>
                </div>

                {/* Signup Form */}
                <div className="mt-8 card p-8">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {pendingMessage && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <span className="font-semibold">Account Created!</span>
                                </div>
                                <p className="text-sm">{pendingMessage}</p>
                                <Link
                                    to="/institute-login"
                                    className="mt-3 inline-block text-sm font-medium text-green-700 hover:text-green-800 underline"
                                >
                                    Go to Institute Login →
                                </Link>
                            </div>
                        )}

                        {/* Institute Information */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4">Institute Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Institute Name *
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            className="input pl-10"
                                            placeholder="XYZ University"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="instituteType" className="block text-sm font-medium text-gray-700 mb-2">
                                        Institute Type *
                                    </label>
                                    <select
                                        id="instituteType"
                                        className="input"
                                        value={formData.instituteType}
                                        onChange={(e) => setFormData({ ...formData, instituteType: e.target.value })}
                                    >
                                        <option value="college">College</option>
                                        <option value="university">University</option>
                                        <option value="training_centre">Training Centre</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Institute Description
                                </label>
                                <textarea
                                    id="description"
                                    className="input"
                                    rows="3"
                                    placeholder="Brief description of your institute..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                        Contact Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="contactNumber"
                                            type="tel"
                                            className="input pl-10"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={formData.contactNumber}
                                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                                        Website
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="website"
                                            type="url"
                                            className="input pl-10"
                                            placeholder="https://example.com"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                                    Address
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <textarea
                                        id="address"
                                        className="input pl-10"
                                        rows="2"
                                        placeholder="Complete address of your institute"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Admin Information */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4">Administrator Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Full Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="adminName"
                                            type="text"
                                            required
                                            className="input pl-10"
                                            placeholder="John Doe"
                                            value={formData.adminName}
                                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Email *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="adminEmail"
                                            type="email"
                                            required
                                            className="input pl-10"
                                            placeholder="admin@institute.com"
                                            value={formData.adminEmail}
                                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="adminPhone" className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Phone
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="adminPhone"
                                            type="tel"
                                            className="input pl-10"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={formData.adminPhone}
                                            onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Credentials */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4">Account Credentials</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Institute Email (Login Email) *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            className="input pl-10"
                                            placeholder="login@institute.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
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

                                <div className="md:col-span-2">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            required
                                            className="input pl-10"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Institute Account'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/institute-login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Sign in here
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

export default InstituteSignup;
