import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Settings, Users, BookOpen, Building2, AlertCircle, X, Loader2, Edit2, Save } from 'lucide-react';
import Navbar from '../components/Navbar';
import { instituteAPI, programAPI, membershipAPI } from '../services/api';

const InstituteDashboard = () => {
    const navigate = useNavigate();
    const [institute, setInstitute] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [pendingInstructors, setPendingInstructors] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [showProgramModal, setShowProgramModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [editingProgramId, setEditingProgramId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Program form state
    const [programForm, setProgramForm] = useState({
        title: '',
        description: '',
        coordinator: '',
        instructors: [],
        syllabus: '',
        schedule: '',
        duration: '',
        level: 'Beginner',
        category: '',
        enrollmentOpen: true,
        thumbnail: null
    });

    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: '',
        description: '',
        contactNumber: '',
        address: '',
        website: '',
        adminName: '',
        adminEmail: ''
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');

        if (!token || user.role !== 'institute') {
            navigate('/institute-login');
            return;
        }

        fetchInstituteData();
    }, [navigate]);

    const fetchInstituteData = async () => {
        try {
            // Fetch institute profile
            const profileData = await instituteAPI.getProfile();
            
            if (profileData.success) {
                setInstitute(profileData.institute);
                setProfileForm({
                    name: profileData.institute.name,
                    description: profileData.institute.description || '',
                    contactNumber: profileData.institute.contactNumber || '',
                    address: profileData.institute.address || '',
                    website: profileData.institute.website || '',
                    adminName: profileData.institute.adminName,
                    adminEmail: profileData.institute.adminEmail
                });
            }

            // Fetch programs
            const programsData = await programAPI.getAll();
            
            if (programsData.success) {
                setPrograms(programsData.programs);
            }

            // Fetch pending instructor requests
            const requestsData = await membershipAPI.getPendingRequests();
            
            if (requestsData.success) {
                setPendingInstructors(requestsData.pendingRequests);
            }

            setLoading(false);
        } catch (err) {
            setError('Failed to load institute data');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/institute-login');
    };

    const approveInstructor = async (membershipId) => {
        try {
            const data = await membershipAPI.approveRequest(membershipId);
            if (data.success) {
                fetchInstituteData();
            }
        } catch (err) {
            console.error('Error approving instructor:', err);
        }
    };

    const rejectInstructor = async (membershipId) => {
        try {
            const data = await membershipAPI.rejectRequest(membershipId);
            if (data.success) {
                fetchInstituteData();
            }
        } catch (err) {
            console.error('Error rejecting instructor:', err);
        }
    };

    const handleEditProgram = (program) => {
        console.log('📝 Editing program:', program);
        setProgramForm({
            title: program.title,
            description: program.description,
            coordinator: program.coordinator || '',
            instructors: program.instructors || [],
            syllabus: program.syllabus || '',
            schedule: program.schedule || '',
            duration: program.duration,
            level: program.level,
            category: program.category,
            enrollmentOpen: program.enrollmentOpen,
            thumbnail: null
        });
        setThumbnailPreview(program.thumbnail || null);
        setEditingProgramId(program.id);
        setShowProgramModal(true);
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('📸 Thumbnail selected:', file.name);
            setProgramForm({ ...programForm, thumbnail: file });
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteProgram = async (programId) => {
        if (!window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
            return;
        }

        try {
            console.log('🗑️ Deleting program:', programId);
            const data = await programAPI.delete(programId);

            if (data.success) {
                console.log('✅ Program deleted successfully');
                fetchInstituteData();
            } else {
                console.log('❌ Delete error:', data.message);
                setError(data.message || 'Failed to delete program');
            }
        } catch (err) {
            console.error('❌ Program deletion error:', err);
            setError('Error deleting program: ' + (err.message || 'Unknown error'));
        }
    };

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        // Client-side validation
        if (!programForm.title.trim()) {
            setError('Program title is required');
            setSubmitting(false);
            return;
        }

        if (!programForm.description.trim()) {
            setError('Description is required (minimum 10 characters)');
            setSubmitting(false);
            return;
        }

        if (programForm.description.trim().length < 10) {
            setError('Description must be at least 10 characters');
            setSubmitting(false);
            return;
        }

        if (!programForm.duration.trim()) {
            setError('Duration is required');
            setSubmitting(false);
            return;
        }

        if (!programForm.category.trim()) {
            setError('Category is required');
            setSubmitting(false);
            return;
        }

        try {
            const isEditing = !!editingProgramId;
            console.log(isEditing ? '✏️ Updating program:' : '📝 Creating program:', programForm);
            
            // Prepare form data if thumbnail exists
            let requestBody;

            if (programForm.thumbnail && typeof programForm.thumbnail === 'object') {
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('title', programForm.title);
                formData.append('description', programForm.description);
                formData.append('category', programForm.category);
                formData.append('duration', programForm.duration);
                formData.append('level', programForm.level);
                formData.append('coordinator', programForm.coordinator);
                formData.append('instructors', JSON.stringify(programForm.instructors));
                formData.append('syllabus', programForm.syllabus);
                formData.append('schedule', programForm.schedule);
                formData.append('enrollmentOpen', programForm.enrollmentOpen);
                formData.append('thumbnail', programForm.thumbnail);
                
                requestBody = formData;
            } else {
                requestBody = programForm;
            }

            const data = isEditing
                ? await programAPI.update(editingProgramId, requestBody)
                : await programAPI.create(requestBody);

            console.log('📦 Response data:', data);

            if (data.success) {
                console.log(isEditing ? '✅ Program updated successfully' : '✅ Program created successfully');
                setError('');
                setShowProgramModal(false);
                setEditingProgramId(null);
                setThumbnailPreview(null);
                setProgramForm({
                    title: '',
                    description: '',
                    coordinator: '',
                    instructors: [],
                    syllabus: '',
                    schedule: '',
                    duration: '',
                    level: 'Beginner',
                    category: '',
                    enrollmentOpen: true,
                    thumbnail: null
                });
                fetchInstituteData();
            } else {
                // Handle validation errors
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
                    console.log('❌ Validation errors:', errorMessages);
                    setError('Validation error: ' + errorMessages);
                } else {
                    console.log('❌ API returned error:', data.message);
                    setError(data.message || (isEditing ? 'Failed to update program' : 'Failed to create program'));
                }
            }
        } catch (err) {
            console.error('❌ Program error:', err);
            setError('Error: ' + (err.message || 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const data = await instituteAPI.updateProfile(profileForm);

            if (data.success) {
                setError('');
                setEditingProfile(false);
                setInstitute(data.institute);
                fetchInstituteData();
            } else {
                setError(data.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('Error updating profile');
            console.error('Error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Loading institute dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                <Building2 className="w-8 h-8 text-indigo-100" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">
                                    Welcome back, {institute?.adminName || institute?.name || 'Institute'}!
                                </h1>
                                <p className="text-indigo-100 mt-1">
                                    {institute?.name || 'Institute Dashboard'} • {institute?.instituteType?.replace('_', ' ').toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                            activeTab === 'overview'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('programs')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                            activeTab === 'programs'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Programs</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('instructors')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                            activeTab === 'instructors'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Instructors</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                            activeTab === 'settings'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </button>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Programs</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {programs.length}
                                    </p>
                                </div>
                                <BookOpen className="w-12 h-12 text-indigo-100 dark:text-indigo-900" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Approved Instructors</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        0
                                    </p>
                                </div>
                                <Users className="w-12 h-12 text-green-100 dark:text-green-900" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {pendingInstructors.length}
                                    </p>
                                </div>
                                <AlertCircle className="w-12 h-12 text-yellow-100 dark:text-yellow-900" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Programs Tab */}
                {activeTab === 'programs' && (
                    <div>
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Programs</h2>
                            <button 
                                onClick={() => setShowProgramModal(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create Program</span>
                            </button>
                        </div>

                        {programs.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No programs created yet</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Start by creating your first program</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {programs.map(program => (
                                    <div key={program.id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                                        <img
                                            src={program.thumbnail}
                                            alt={program.title}
                                            className="w-full h-40 object-cover"
                                        />
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                {program.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {program.category}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                {program.enrollmentCount || 0} students
                                            </p>
                                            <div className="flex space-x-2 mt-4">
                                                <button
                                                    onClick={() => handleEditProgram(program)}
                                                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProgram(program.id)}
                                                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Instructors Tab */}
                {activeTab === 'instructors' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Instructor Requests</h2>

                        {pendingInstructors.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No pending requests</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingInstructors.map(request => (
                                    <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {request.instructor.avatar && (
                                                <img
                                                    src={request.instructor.avatar}
                                                    alt={request.instructor.name}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {request.instructor.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {request.instructor.email}
                                                </p>
                                                {request.instructor.profession && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                        {request.instructor.profession}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => approveInstructor(request.id)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => rejectInstructor(request.id)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Profile</h2>
                            <button
                                onClick={() => setEditingProfile(!editingProfile)}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                                <span>{editingProfile ? 'Cancel' : 'Edit'}</span>
                            </button>
                        </div>
                        
                        {editingProfile ? (
                            // Edit Form
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Institute Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Contact Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileForm.contactNumber}
                                            onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={profileForm.description}
                                        onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                                        rows="4"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.address}
                                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={profileForm.website}
                                            onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Admin Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.adminName}
                                            onChange={(e) => setProfileForm({ ...profileForm, adminName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Admin Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profileForm.adminEmail}
                                            onChange={(e) => setProfileForm({ ...profileForm, adminEmail: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </form>
                        ) : (
                            // View Mode
                            institute && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Institute Name
                                            </label>
                                            <p className="text-gray-900 dark:text-white font-semibold">{institute.name}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Email
                                            </label>
                                            <p className="text-gray-900 dark:text-white">{institute.email}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Type
                                        </label>
                                        <p className="text-gray-900 dark:text-white capitalize">
                                            {institute.instituteType?.replace('_', ' ')}
                                        </p>
                                    </div>

                                    {institute.description && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Description
                                            </label>
                                            <p className="text-gray-900 dark:text-white">{institute.description}</p>
                                        </div>
                                    )}

                                    {institute.contactNumber && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Contact Number
                                            </label>
                                            <p className="text-gray-900 dark:text-white">{institute.contactNumber}</p>
                                        </div>
                                    )}

                                    {institute.address && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Address
                                            </label>
                                            <p className="text-gray-900 dark:text-white">{institute.address}</p>
                                        </div>
                                    )}

                                    {institute.website && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Website
                                            </label>
                                            <p className="text-gray-900 dark:text-white">
                                                <a href={institute.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">
                                                    {institute.website}
                                                </a>
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Admin Name
                                            </label>
                                            <p className="text-gray-900 dark:text-white">{institute.adminName}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Admin Email
                                            </label>
                                            <p className="text-gray-900 dark:text-white">{institute.adminEmail}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Create Program Modal */}
            {showProgramModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingProgramId ? 'Edit Program' : 'Create New Program'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowProgramModal(false);
                                    setEditingProgramId(null);
                                    setError('');
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProgram} className="p-6 space-y-6">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Program Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={programForm.title}
                                        onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., Advanced Python Development"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={programForm.category}
                                        onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })}
                                        placeholder="e.g., Business, Technology"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={programForm.description}
                                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                                    rows="3"
                                    placeholder="Provide a detailed description of the program (minimum 10 characters)..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {programForm.description.length}/10 minimum characters
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Level
                                    </label>
                                    <select
                                        value={programForm.level}
                                        onChange={(e) => setProgramForm({ ...programForm, level: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Duration <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={programForm.duration}
                                        onChange={(e) => setProgramForm({ ...programForm, duration: e.target.value })}
                                        placeholder="e.g., 12 weeks"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Program Coordinator
                                    </label>
                                    <input
                                        type="text"
                                        value={programForm.coordinator}
                                        onChange={(e) => setProgramForm({ ...programForm, coordinator: e.target.value })}
                                        placeholder="Instructor name"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Instructors (comma-separated)
                                </label>
                                <textarea
                                    value={programForm.instructors.join(', ')}
                                    onChange={(e) => setProgramForm({ ...programForm, instructors: e.target.value.split(',').map(i => i.trim()) })}
                                    rows="2"
                                    placeholder="instructor1@email.com, instructor2@email.com"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Syllabus
                                </label>
                                <textarea
                                    value={programForm.syllabus}
                                    onChange={(e) => setProgramForm({ ...programForm, syllabus: e.target.value })}
                                    rows="3"
                                    placeholder="Program syllabus and course outline..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Schedule
                                </label>
                                <textarea
                                    value={programForm.schedule}
                                    onChange={(e) => setProgramForm({ ...programForm, schedule: e.target.value })}
                                    rows="3"
                                    placeholder="Program schedule details (days, times, etc.)..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={programForm.enrollmentOpen}
                                        onChange={(e) => setProgramForm({ ...programForm, enrollmentOpen: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Open for Enrollment
                                    </span>
                                </label>
                            </div>

                            {/* Thumbnail upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Program Thumbnail
                                </label>
                                <div className="flex items-center space-x-4">
                                    <div className="w-28 h-20 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                        {thumbnailPreview ? (
                                            <img src={thumbnailPreview} alt="thumbnail preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">No thumbnail</span>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThumbnailChange}
                                            className="text-sm text-gray-700"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recommended: 1280x720 or similar landscape image</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProgramModal(false);
                                        setEditingProgramId(null);
                                        setError('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                                >
                                    {editingProgramId ? (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>{submitting ? 'Updating...' : 'Update Program'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            <span>{submitting ? 'Creating...' : 'Create Program'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstituteDashboard;
