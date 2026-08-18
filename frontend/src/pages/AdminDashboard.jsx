import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import {
    Users, GraduationCap, BookOpen, UserCheck, UserX, Shield,
    ChevronDown, ChevronUp, LogOut, BarChart3, Clock, Mail,
    AlertCircle, CheckCircle, User, Loader2, Briefcase, FileText, X, Building2
} from 'lucide-react';
import ScholarPathLogo from '../components/ScholarPathLogo';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Data states
    const [stats, setStats] = useState(null);
    const [pendingInstructors, setPendingInstructors] = useState([]);
    const [pendingInstitutes, setPendingInstitutes] = useState([]);
    const [students, setStudents] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [expandedUser, setExpandedUser] = useState(null);
    const [userDetails, setUserDetails] = useState({});
    const [actionLoading, setActionLoading] = useState(null);

    // Rejection modal state
    const [rejectModal, setRejectModal] = useState({ open: false, instructor: null, comment: '' });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
// Token retrieval removed as adminAPI handles auth headers
            
            // Fetch pending institutes
            const institutesData = await adminAPI.getPendingInstitutes();
            
            const [statsRes, pendingRes, studentsRes, instructorsRes] = await Promise.all([
                adminAPI.getStats(),
                adminAPI.getPendingInstructors(),
                adminAPI.getStudents(),
                adminAPI.getInstructors()
            ]);

            setStats(statsRes.stats);
            setPendingInstructors(pendingRes.instructors || []);
            setPendingInstitutes(institutesData.institutes || []);
            setStudents(studentsRes.students || []);
            setInstructors(instructorsRes.instructors || []);
        } catch (err) {
            console.error('Dashboard load error:', err);
            setError('Failed to load dashboard data');
        }
        setLoading(false);
    };

    const handleVerifyInstructor = async (id) => {
        setActionLoading(id);
        try {
            await adminAPI.verifyInstructor(id);
            await loadDashboardData();
        } catch (err) {
            console.error('Verify error:', err);
            setError('Failed to verify instructor');
        }
        setActionLoading(null);
    };

    const handleVerifyInstitute = async (id) => {
        setActionLoading(id);
        try {
            const response = await adminAPI.verifyInstitute(id);
            
            if (response) {
                await loadDashboardData();
            }
        } catch (err) {
            console.error('Verify institute error:', err);
            setError('Failed to verify institute');
        }
        setActionLoading(null);
    };

    const handleRejectInstitute = async (id) => {
        setActionLoading(id);
        try {
            const response = await adminAPI.rejectInstitute(id, rejectModal.comment || null);
            
            if (response) {
                await loadDashboardData();
            }
        } catch (err) {
            console.error('Reject institute error:', err);
            setError('Failed to reject institute');
        }
        setActionLoading(null);
    };

    const openRejectModal = (instructor) => {
        setRejectModal({ open: true, instructor, comment: '' });
    };

    const closeRejectModal = () => {
        setRejectModal({ open: false, instructor: null, comment: '' });
    };

    const handleRejectInstructor = async () => {
        if (!rejectModal.instructor) return;

        setActionLoading(rejectModal.instructor.id);
        try {
            await adminAPI.rejectInstructor(rejectModal.instructor.id, rejectModal.comment || null);
            closeRejectModal();
            await loadDashboardData();
        } catch (err) {
            console.error('Reject error:', err);
            setError('Failed to reject instructor');
        }
        setActionLoading(null);
    };

    const toggleUserDetails = async (userId) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
            return;
        }

        setExpandedUser(userId);
        if (!userDetails[userId]) {
            try {
                const response = await adminAPI.getUserDetails(userId);
                setUserDetails(prev => ({ ...prev, [userId]: response.user }));
            } catch (err) {
                console.error('User details error:', err);
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/admin-login');
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
                    <p className="mt-4 text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Unified Header */}
            <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between py-4 border-b border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
                                <ScholarPathLogo className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">ScholarPath Admin</h1>
                                <p className="text-xs text-gray-400">Platform Management</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 py-3 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'pending', label: 'Pending Instructors', icon: Clock, badge: pendingInstructors.length },
                            { id: 'institutes', label: 'Pending Institutes', icon: Building2, badge: pendingInstitutes.length },
                            { id: 'students', label: 'Students', icon: GraduationCap },
                            { id: 'instructors', label: 'Instructors', icon: Users }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-amber-500 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {tab.badge > 0 && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-red-500 text-white'
                                        }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {error && (
                    <div className="mb-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">×</button>
                    </div>
                )}

                {activeTab === 'overview' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={GraduationCap} label="Total Students" value={stats.totalStudents} color="blue" />
                        <StatCard icon={Users} label="Verified Instructors" value={stats.totalInstructors} color="green" />
                        <StatCard icon={Clock} label="Pending Instructors" value={stats.pendingInstructors} color="amber" />
                        <StatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses} color="purple" />
                        <StatCard icon={UserCheck} label="Total Enrollments" value={stats.totalEnrollments} color="cyan" />
                        <StatCard icon={BarChart3} label="Live Classes" value={stats.totalClasses} color="pink" />
                        <StatCard icon={BookOpen} label="Course Materials" value={stats.totalMaterials} color="indigo" />
                    </div>
                )}

                {/* Pending Verification Tab */}
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingInstructors.length === 0 ? (
                            <div className="bg-gray-800 rounded-xl p-8 text-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
                                <p className="text-gray-400">No pending instructor verifications</p>
                            </div>
                        ) : (
                            pendingInstructors.map(instructor => (
                                <InstructorVerificationCard
                                    key={instructor.id}
                                    instructor={instructor}
                                    onVerify={() => handleVerifyInstructor(instructor.id)}
                                    onReject={() => openRejectModal(instructor)}
                                    actionLoading={actionLoading}
                                    formatDate={formatDate}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* Pending Institutes Tab */}
                {activeTab === 'institutes' && (
                    <div className="space-y-4">
                        {pendingInstitutes.length === 0 ? (
                            <div className="bg-gray-800 rounded-xl p-8 text-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
                                <p className="text-gray-400">No pending institute verifications</p>
                            </div>
                        ) : (
                            pendingInstitutes.map(institute => (
                                <div key={institute.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{institute.name}</h3>
                                            <p className="text-sm text-gray-400 mt-1 capitalize">{institute.instituteType.replace('_', ' ')}</p>
                                            <p className="text-sm text-gray-400 mt-2">
                                                <Mail className="w-4 h-4 inline mr-2" />
                                                {institute.email}
                                            </p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Admin: {institute.adminName} ({institute.adminEmail})
                                            </p>
                                            {institute.description && (
                                                <p className="text-sm text-gray-400 mt-2">{institute.description}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">
                                                Registered: {formatDate(institute.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleVerifyInstitute(institute.id)}
                                                disabled={actionLoading === institute.id}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                            >
                                                {actionLoading === institute.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserCheck className="w-4 h-4" />
                                                )}
                                                <span>Verify</span>
                                            </button>
                                            <button
                                                onClick={() => handleRejectInstitute(institute.id)}
                                                disabled={actionLoading === institute.id}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                            >
                                                <UserX className="w-4 h-4" />
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div className="space-y-3">
                        {students.length === 0 ? (
                            <div className="bg-gray-800 rounded-xl p-8 text-center">
                                <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">No students registered yet</p>
                            </div>
                        ) : (
                            students.map(student => (
                                <UserCard
                                    key={student.id}
                                    user={student}
                                    role="student"
                                    expanded={expandedUser === student.id}
                                    details={userDetails[student.id]}
                                    onToggle={() => toggleUserDetails(student.id)}
                                    formatDate={formatDate}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* Instructors Tab */}
                {activeTab === 'instructors' && (
                    <div className="space-y-3">
                        {instructors.length === 0 ? (
                            <div className="bg-gray-800 rounded-xl p-8 text-center">
                                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">No verified instructors yet</p>
                            </div>
                        ) : (
                            instructors.map(instructor => (
                                <UserCard
                                    key={instructor.id}
                                    user={instructor}
                                    role="instructor"
                                    expanded={expandedUser === instructor.id}
                                    details={userDetails[instructor.id]}
                                    onToggle={() => toggleUserDetails(instructor.id)}
                                    formatDate={formatDate}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectModal.open && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Reject Instructor</h3>
                                <button onClick={closeRejectModal} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-300 mb-4">
                                You are about to reject <span className="font-semibold text-white">{rejectModal.instructor?.name}</span>.
                                This will delete their account.
                            </p>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Rejection Comment (Optional)
                            </label>
                            <textarea
                                value={rejectModal.comment}
                                onChange={(e) => setRejectModal({ ...rejectModal, comment: e.target.value })}
                                placeholder="Reason for rejection..."
                                rows="3"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="p-6 border-t border-gray-700 flex space-x-3">
                            <button
                                onClick={closeRejectModal}
                                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectInstructor}
                                disabled={actionLoading === rejectModal.instructor?.id}
                                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {actionLoading === rejectModal.instructor?.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <UserX className="w-4 h-4" />
                                        <span>Reject</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Instructor Verification Card with full profile details
const InstructorVerificationCard = ({ instructor, onVerify, onReject, actionLoading, formatDate }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{instructor.name}</h3>
                        <p className="text-gray-400 text-sm flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {instructor.email}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">Applied: {formatDate(instructor.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-1 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors"
                    >
                        {expanded ? 'Hide Details' : 'View Details'}
                    </button>
                    <button
                        onClick={onVerify}
                        disabled={actionLoading === instructor.id}
                        className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {actionLoading === instructor.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <UserCheck className="w-4 h-4" />
                        )}
                        <span>Verify</span>
                    </button>
                    <button
                        onClick={onReject}
                        disabled={actionLoading === instructor.id}
                        className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <UserX className="w-4 h-4" />
                        <span>Reject</span>
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t border-gray-700 p-4 bg-gray-850 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {instructor.qualification && (
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1 flex items-center">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                Qualification
                            </p>
                            <p className="text-gray-300 text-sm">{instructor.qualification}</p>
                        </div>
                    )}
                    {instructor.experience && (
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1 flex items-center">
                                <Briefcase className="w-3 h-3 mr-1" />
                                Experience
                            </p>
                            <p className="text-gray-300 text-sm">{instructor.experience}</p>
                        </div>
                    )}
                    {instructor.profession && (
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1 flex items-center">
                                <Briefcase className="w-3 h-3 mr-1" />
                                Current Profession
                            </p>
                            <p className="text-gray-300 text-sm">{instructor.profession}</p>
                        </div>
                    )}
                    {instructor.resumePath && (
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1 flex items-center">
                                <FileText className="w-3 h-3 mr-1" />
                                Resume
                            </p>
                            <a
                                href={`/api/${instructor.resumePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-400 hover:text-amber-300 text-sm underline"
                            >
                                Download Resume
                            </a>
                        </div>
                    )}
                    {instructor.instructorSummary && (
                        <div className="md:col-span-2">
                            <p className="text-gray-500 text-xs uppercase mb-1">Professional Summary</p>
                            <p className="text-gray-300 text-sm">{instructor.instructorSummary}</p>
                        </div>
                    )}
                    {!instructor.qualification && !instructor.experience && !instructor.profession && !instructor.instructorSummary && (
                        <div className="md:col-span-2 text-gray-500 text-sm italic">
                            No additional details provided
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        amber: 'from-amber-500 to-orange-600',
        purple: 'from-purple-500 to-purple-600',
        cyan: 'from-cyan-500 to-cyan-600',
        pink: 'from-pink-500 to-pink-600',
        indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
};

// User Card Component
const UserCard = ({ user, role, expanded, details, onToggle, formatDate }) => {
    const isStudent = role === 'student';

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors text-left"
            >
                <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isStudent ? 'bg-blue-500/20' : 'bg-green-500/20'
                        }`}>
                        {isStudent ? (
                            <GraduationCap className="w-5 h-5 text-blue-500" />
                        ) : (
                            <Users className="w-5 h-5 text-green-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-white font-medium">{user.name}</h3>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-gray-400 text-sm">
                            {isStudent
                                ? `${user.enrollmentCount || 0} courses enrolled`
                                : `${user.courseCount || 0} courses created`
                            }
                        </p>
                        <p className="text-gray-500 text-xs">Joined {formatDate(user.createdAt)}</p>
                    </div>
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-700 p-4 bg-gray-850">
                    {!details ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {user.bio && (
                                <div>
                                    <p className="text-gray-500 text-xs uppercase mb-1">Bio</p>
                                    <p className="text-gray-300 text-sm">{user.bio}</p>
                                </div>
                            )}

                            {isStudent && details.enrollments && (
                                <div>
                                    <p className="text-gray-500 text-xs uppercase mb-2">Enrolled Courses</p>
                                    {details.enrollments.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No courses enrolled</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {details.enrollments.map(enrollment => (
                                                <div key={enrollment.id} className="bg-gray-700/50 rounded-lg p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white text-sm font-medium">
                                                                {enrollment.course?.title || 'Unknown Course'}
                                                            </p>
                                                            <p className="text-gray-400 text-xs">
                                                                by {enrollment.course?.instructor?.name || 'Unknown'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                                                    style={{ width: `${enrollment.progress || 0}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-gray-400 text-xs mt-1">
                                                                {enrollment.progress || 0}% complete
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isStudent && details.courses && (
                                <div>
                                    <p className="text-gray-500 text-xs uppercase mb-2">Courses Created</p>
                                    {details.courses.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No courses created</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {details.courses.map(course => (
                                                <div key={course.id} className="bg-gray-700/50 rounded-lg p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white text-sm font-medium">{course.title}</p>
                                                            <p className="text-gray-400 text-xs">{course.category}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-cyan-400 text-sm font-medium">
                                                                {course.enrollmentCount} students
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
