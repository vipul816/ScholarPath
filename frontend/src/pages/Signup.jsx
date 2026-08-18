import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, AlertCircle, GraduationCap, Users, CheckCircle, Briefcase, FileText, Upload } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import ScholarPathLogo from '../components/ScholarPathLogo';

const API_BASE = '/api';

const Signup = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        // Instructor-specific fields
        qualification: '',
        experience: '',
        profession: '',
        instructorSummary: ''
    });
    const [resume, setResume] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingMessage, setPendingMessage] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                setError('Please upload a PDF, DOC, or DOCX file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setResume(file);
            setError('');
        }
    };

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
            // Use FormData for file upload
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('password', formData.password);
            submitData.append('role', formData.role);

            if (formData.role === 'instructor') {
                submitData.append('qualification', formData.qualification);
                submitData.append('experience', formData.experience);
                submitData.append('profession', formData.profession);
                submitData.append('instructorSummary', formData.instructorSummary);
                if (resume) {
                    submitData.append('resume', resume);
                }
            }

            const response = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                body: submitData
            });

            const result = await response.json();

            if (result.success) {
                if (result.pendingVerification) {
                    setPendingMessage(result.message);
                } else {
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    navigate(result.user.role === 'instructor' ? '/instructor' : '/dashboard');
                }
            } else {
                setError(result.message || 'Signup failed. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className={`w-full space-y-8 animate-fade-in ${formData.role === 'instructor' ? 'max-w-2xl' : 'max-w-md'}`}>
                {/* Logo & Header */}
                <div className="text-center">
                    <div className="flex justify-center flex-col items-center gap-2">
                        <div className="w-16 h-16 bg-[#0A192F] rounded-2xl flex items-center justify-center shadow-lg">
                            <ScholarPathLogo className="w-16 h-16" />
                        </div>
                        <h1 className="text-3xl font-serif text-[#E8E1C2] tracking-tight bg-[#0A192F] px-6 py-2 rounded-lg mt-2 shadow-sm border border-gray-800">
                            ScholarPath
                        </h1>
                        <p className="text-xs font-semibold tracking-[0.2em] text-primary-600 dark:text-[#CEC6A8] uppercase mt-2">
                            EFFECTIVE LEARNING
                        </p>
                    </div>
                    <h2 className="mt-8 text-2xl font-bold text-gray-900 dark:text-white font-sans">
                        Enroll Today
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">
                        {formData.role === 'instructor' ? '"Inspire the next generation."' : '"Empower your mind, forge your future."'}
                    </p>
                </div>

                {/* Signup Form */}
                <div className="mt-8 card p-8">
                    {/* Google OAuth Button */}
                    <div className="mb-6">
                        <a 
                            href="http://localhost:3000/api/auth/google" 
                            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                <path fill="none" d="M1 1h22v22H1z" />
                            </svg>
                            <span>Continue with Google</span>
                        </a>
                    </div>
                    
                    <div className="flex items-center mb-6">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-4 text-sm text-gray-500">or sign up with email</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

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
                                to="/login"
                                className="mt-3 inline-block text-sm font-medium text-green-700 hover:text-green-800 underline"
                            >
                                Go to Login Page →
                            </Link>
                        </div>
                    )}

                    <div className={`space-y-4 ${formData.role === 'instructor' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
                        {/* Name */}
                        <div className={formData.role === 'instructor' ? '' : ''}>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    className="input pl-10"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    className="input pl-10"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Role Selection - Full width */}
                        <div className={formData.role === 'instructor' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                I want to join as
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'student' })}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'student'
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <GraduationCap className={`w-8 h-8 mx-auto mb-2 ${formData.role === 'student' ? 'text-primary-600' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-medium ${formData.role === 'student' ? 'text-primary-600' : 'text-gray-700'}`}>
                                        Student
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'instructor' })}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'instructor'
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Users className={`w-8 h-8 mx-auto mb-2 ${formData.role === 'instructor' ? 'text-primary-600' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-medium ${formData.role === 'instructor' ? 'text-primary-600' : 'text-gray-700'}`}>
                                        Instructor
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Instructor-specific fields */}
                        {formData.role === 'instructor' && (
                            <>
                                {/* Qualification */}
                                <div>
                                    <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-2">
                                        Educational Qualification
                                    </label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="qualification"
                                            type="text"
                                            className="input pl-10"
                                            placeholder="e.g., M.Tech in Computer Science"
                                            value={formData.qualification}
                                            onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Experience */}
                                <div>
                                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                                        Teaching Experience
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="experience"
                                            type="text"
                                            className="input pl-10"
                                            placeholder="e.g., 5 years"
                                            value={formData.experience}
                                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Profession */}
                                <div>
                                    <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Profession
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="profession"
                                            type="text"
                                            className="input pl-10"
                                            placeholder="e.g., Senior Software Engineer"
                                            value={formData.profession}
                                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Resume Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Resume (PDF, DOC, DOCX)
                                    </label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        {resume ? (
                                            <div className="flex items-center justify-center space-x-2 text-primary-600">
                                                <FileText className="w-5 h-5" />
                                                <span className="text-sm font-medium">{resume.name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-500">
                                                <Upload className="w-6 h-6 mb-1" />
                                                <span className="text-sm">Click to upload</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary - Full width */}
                                <div className="md:col-span-2">
                                    <label htmlFor="instructorSummary" className="block text-sm font-medium text-gray-700 mb-2">
                                        Professional Summary
                                    </label>
                                    <textarea
                                        id="instructorSummary"
                                        rows="3"
                                        className="input"
                                        placeholder="Brief description of your expertise and teaching philosophy..."
                                        value={formData.instructorSummary}
                                        onChange={(e) => setFormData({ ...formData, instructorSummary: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        {/* Password */}
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

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                Sign in
                            </Link>
                        </p>
                        <p className="mt-4 text-sm">
                            <Link to="/admin-login" className="font-bold text-gray-800 hover:text-primary-600 transition-colors">
                                Admin Login
                            </Link>
                        </p>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
