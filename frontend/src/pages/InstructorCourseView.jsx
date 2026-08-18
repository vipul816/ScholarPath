import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, classAPI, materialAPI, announcementAPI, discussionAPI, assignmentAPI } from '../services/api';
import ScheduleClassModal from '../components/ScheduleClassModal';
import UploadMaterialModal from '../components/UploadMaterialModal';
import EditCourseModal from '../components/EditCourseModal';
import VideoPlayer from '../components/VideoPlayer';
import {
    ArrowLeft, Calendar, FileText, Users, Plus,
    Video, File, Link as LinkIcon, Trash2, Clock,
    BookOpen, Edit2, Lock, Unlock, Megaphone, MessageCircle, Send, Play, ClipboardList, CheckCircle
} from 'lucide-react';

const InstructorCourseView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [classes, setClasses] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [discussions, setDiscussions] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('schedule');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [error, setError] = useState('');
    const [togglingEnrollment, setTogglingEnrollment] = useState(false);

    // Announcement form
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementContent, setAnnouncementContent] = useState('');
    const [postingAnnouncement, setPostingAnnouncement] = useState(false);

    // Discussion reply form
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [postingReply, setPostingReply] = useState(false);

    // Video player state
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [showVideoPlayer, setShowVideoPlayer] = useState(false);

    // Assignment states
    const [showCreateAssignment, setShowCreateAssignment] = useState(false);
    const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', dueDate: '', maxScore: 100 });
    const [creatingAssignment, setCreatingAssignment] = useState(false);
    const [expandedAssignment, setExpandedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState({});
    const [loadingSubmissions, setLoadingSubmissions] = useState({});
    const [gradingForm, setGradingForm] = useState({ score: '', feedback: '' });
    const [gradingSubmissionId, setGradingSubmissionId] = useState(null);

    // Separate videos from other materials
    const videoMaterials = useMemo(() =>
        materials.filter(m => m.type === 'video'),
        [materials]
    );
    const nonVideoMaterials = useMemo(() =>
        materials.filter(m => m.type !== 'video'),
        [materials]
    );

    useEffect(() => {
        fetchCourseData();
    }, [id]);

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            setError('');
            
            const [courseRes, materialsRes, announcementsRes, discussionsRes, assignmentsRes] = await Promise.all([
                courseAPI.getById(id).catch(err => {
                    console.error('Course fetch error:', err);
                    return { success: false, error: err.message || 'Failed to load course' };
                }),
                materialAPI.getByCourse(id).catch(err => {
                    console.error('Materials fetch error:', err);
                    return { success: false, error: err.message || 'Failed to load materials' };
                }),
                announcementAPI.getByCourse(id).catch(err => {
                    console.error('Announcements fetch error:', err);
                    return { success: false, error: err.message || 'Failed to load announcements' };
                }),
                discussionAPI.getByCourse(id).catch(err => {
                    console.error('Discussions fetch error:', err);
                    return { success: false, error: err.message || 'Failed to load discussions' };
                }),
                assignmentAPI.getByCourse(id).catch(err => {
                    console.error('Assignments fetch error:', err);
                    return { success: false, error: err.message || 'Failed to load assignments' };
                })
            ]);

            console.log('Course Response:', courseRes);
            console.log('Materials Response:', materialsRes);
            console.log('Discussions Response:', discussionsRes);
            console.log('Assignments Response:', assignmentsRes);

            if (!courseRes.success) {
                setError('Failed to load course: ' + (courseRes.error || 'Unknown error'));
                return;
            }

            if (courseRes.course.instructorId !== user.id) {
                navigate('/instructor');
                return;
            }

            setCourse(courseRes.course);
            setClasses(courseRes.course.classes || []);

            if (materialsRes.success) setMaterials(materialsRes.materials || []);
            if (announcementsRes.success) setAnnouncements(announcementsRes.announcements || []);
            if (discussionsRes.success) setDiscussions(discussionsRes.discussions || []);
            if (assignmentsRes?.success) setAssignments(assignmentsRes.assignments || []);
        } catch (error) {
            console.error('Error fetching course:', error);
            setError('Failed to load course data: ' + (error.message || JSON.stringify(error)));
        } finally {
            setLoading(false);
        }
    };

    const handleClassCreated = (newClass) => {
        setClasses(prev => [...prev, newClass]);
        setShowScheduleModal(false);
    };

    const handleMaterialUploaded = (newMaterial) => {
        setMaterials(prev => [newMaterial, ...prev]);
        setShowMaterialModal(false);
    };

    const handleCourseUpdated = (updatedCourse) => {
        setCourse(updatedCourse);
        setShowEditModal(false);
    };

    const handleDeleteClass = async (classId) => {
        if (!confirm('Are you sure you want to delete this class?')) return;
        try {
            const response = await classAPI.delete(classId);
            if (response.success) {
                setClasses(prev => prev.filter(c => c.id !== classId));
            }
        } catch (error) {
            console.error('Error deleting class:', error);
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        if (!confirm('Are you sure you want to delete this material?')) return;
        try {
            const response = await materialAPI.delete(materialId);
            if (response.success) {
                setMaterials(prev => prev.filter(m => m.id !== materialId));
                if (selectedVideo && selectedVideo.id === materialId) {
                    setShowVideoPlayer(false);
                    setSelectedVideo(null);
                }
            }
        } catch (error) {
            console.error('Error deleting material:', error);
        }
    };

    const handleToggleEnrollment = async () => {
        setTogglingEnrollment(true);
        try {
            const response = await courseAPI.update(id, {
                enrollmentOpen: !course.enrollmentOpen
            });
            if (response.success) {
                setCourse(prev => ({
                    ...prev,
                    enrollmentOpen: !prev.enrollmentOpen
                }));
            }
        } catch (error) {
            console.error('Error toggling enrollment:', error);
        } finally {
            setTogglingEnrollment(false);
        }
    };

    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementTitle.trim() || !announcementContent.trim()) return;

        setPostingAnnouncement(true);
        try {
            const response = await announcementAPI.create({
                courseId: parseInt(id),
                title: announcementTitle,
                content: announcementContent
            });
            if (response.success) {
                setAnnouncements(prev => [response.announcement, ...prev]);
                setAnnouncementTitle('');
                setAnnouncementContent('');
            }
        } catch (error) {
            console.error('Error posting announcement:', error);
        } finally {
            setPostingAnnouncement(false);
        }
    };

    const handleDeleteAnnouncement = async (announcementId) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            const response = await announcementAPI.delete(announcementId);
            if (response.success) {
                setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        setCreatingAssignment(true);
        try {
            const data = { ...assignmentForm, courseId: parseInt(id) };
            if (!data.maxScore) data.maxScore = 100;
            
            const response = await assignmentAPI.create(data);
            if (response.success || response.assignment) {
                setAssignments(prev => [response.assignment || response, ...prev]);
                setShowCreateAssignment(false);
                setAssignmentForm({ title: '', description: '', dueDate: '', maxScore: 100 });
            } else {
                alert(response.message || 'Failed to create assignment');
            }
        } catch (error) {
            console.error('Error creating assignment:', error);
            alert(error.message || 'An error occurred creating assignment');
        } finally {
            setCreatingAssignment(false);
        }
    };

    const handleViewSubmissions = async (assignmentId) => {
        if (expandedAssignment === assignmentId) {
            setExpandedAssignment(null);
            return;
        }
        setExpandedAssignment(assignmentId);
        
        if (!submissions[assignmentId]) {
            setLoadingSubmissions(prev => ({ ...prev, [assignmentId]: true }));
            try {
                const response = await assignmentAPI.getSubmissions(assignmentId);
                setSubmissions(prev => ({ ...prev, [assignmentId]: response.submissions || response || [] }));
            } catch (error) {
                console.error('Error fetching submissions:', error);
            } finally {
                setLoadingSubmissions(prev => ({ ...prev, [assignmentId]: false }));
            }
        }
    };

    const handleGradeSubmission = async (assignmentId, submissionId) => {
        try {
            const data = { score: parseInt(gradingForm.score), feedback: gradingForm.feedback };
            const response = await assignmentAPI.grade(assignmentId, submissionId, data);
            if (response.success || response.submission) {
                setSubmissions(prev => ({
                    ...prev,
                    [assignmentId]: prev[assignmentId].map(sub => 
                        sub.id === submissionId ? { ...sub, score: data.score, feedback: data.feedback, status: 'graded' } : sub
                    )
                }));
                setGradingSubmissionId(null);
                setGradingForm({ score: '', feedback: '' });
            }
        } catch (error) {
            console.error('Error grading:', error);
        }
    };

    const handlePostReply = async (discussionId) => {
        if (!replyContent.trim()) return;

        setPostingReply(true);
        try {
            const response = await discussionAPI.create({
                courseId: parseInt(id),
                parentId: discussionId,
                content: replyContent
            });
            if (response.success) {
                // Add reply to the discussion
                setDiscussions(prev => prev.map(d => {
                    if (d.id === discussionId) {
                        return {
                            ...d,
                            replies: [...(d.replies || []), response.discussion]
                        };
                    }
                    return d;
                }));
                setReplyContent('');
                setReplyingTo(null);
            }
        } catch (error) {
            console.error('Error posting reply:', error);
        } finally {
            setPostingReply(false);
        }
    };

    const getMaterialIcon = (type) => {
        switch (type) {
            case 'video': return <Video className="w-5 h-5 text-red-500" />;
            case 'pdf': return <FileText className="w-5 h-5 text-orange-500" />;
            case 'document': return <File className="w-5 h-5 text-blue-500" />;
            case 'link': return <LinkIcon className="w-5 h-5 text-green-500" />;
            default: return <File className="w-5 h-5 text-gray-500" />;
        }
    };

    const getClassStatus = (scheduledAt) => {
        const now = new Date();
        const classTime = new Date(scheduledAt);
        const diffMs = classTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffMs < 0) return { label: 'Completed', color: 'bg-gray-100 text-gray-700' };
        if (diffHours <= 1) return { label: 'Starting Soon', color: 'bg-green-100 text-green-700' };
        if (diffHours <= 24) return { label: 'Today', color: 'bg-blue-100 text-blue-700' };
        return { label: 'Upcoming', color: 'bg-purple-100 text-purple-700' };
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <p className="text-red-600">{error || 'Course not found'}</p>
                <button onClick={() => navigate('/instructor')} className="btn btn-primary mt-4">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/instructor')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{course.title}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full">
                                    {course.category}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {course.enrollments?.length || 0} students enrolled
                                </span>
                                <button
                                    onClick={handleToggleEnrollment}
                                    disabled={togglingEnrollment}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full transition-colors ${course.enrollmentOpen !== false
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                >
                                    {togglingEnrollment ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : course.enrollmentOpen !== false ? (
                                        <>
                                            <Unlock className="w-3.5 h-3.5" />
                                            Enrollment Open
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-3.5 h-3.5" />
                                            Enrollment Closed
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowEditModal(true)}
                        className="btn btn-outline flex items-center space-x-2">
                        <Edit2 className="w-4 h-4" />
                        <span>Edit Course</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                <nav className="flex space-x-6">
                    {[
                        { id: 'schedule', label: 'Schedule', icon: Calendar },
                        { id: 'videos', label: 'Videos', icon: Video },
                        { id: 'materials', label: 'Materials', icon: FileText },
                        { id: 'assignments', label: 'Assignments', icon: ClipboardList },
                        { id: 'announcements', label: 'Announcements', icon: Megaphone },
                        { id: 'discussions', label: 'Discussions', icon: MessageCircle },
                        { id: 'students', label: 'Students', icon: Users }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">Class Schedule</h2>
                        <button onClick={() => setShowScheduleModal(true)} className="btn btn-primary flex items-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Schedule Class</span>
                        </button>
                    </div>

                    {classes.length > 0 ? (
                        <div className="space-y-4">
                            {classes.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)).map((cls, index) => {
                                const status = getClassStatus(cls.scheduledAt);
                                return (
                                    <div key={cls.id} className="card p-5 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4">
                                                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{cls.title}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{cls.description || 'No description'}</p>
                                                    <div className="flex items-center space-x-4 mt-2">
                                                        <span className="flex items-center text-sm text-gray-500">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            {new Date(cls.scheduledAt).toLocaleDateString()}
                                                        </span>
                                                        <span className="flex items-center text-sm text-gray-500">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            {new Date(cls.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="text-sm text-gray-500">{cls.duration} mins</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.label}</span>
                                                <button onClick={() => navigate(`/class/${cls.id}`)} className="btn btn-outline text-sm py-1.5">Start Class</button>
                                                <button onClick={() => handleDeleteClass(cls.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes scheduled</h3>
                            <p className="text-gray-500 mb-4">Schedule your first class to get started</p>
                            <button onClick={() => setShowScheduleModal(true)} className="btn btn-primary">Schedule Class</button>
                        </div>
                    )}
                </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">Course Videos</h2>
                        <button onClick={() => setShowMaterialModal(true)} className="btn btn-primary flex items-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Add Video</span>
                        </button>
                    </div>

                    {videoMaterials.length > 0 ? (
                        <div className="space-y-3">
                            {videoMaterials.map((video, index) => (
                                <div
                                    key={video.id}
                                    className="card p-4 hover:shadow-lg transition-all cursor-pointer group"
                                    onClick={() => {
                                        setSelectedVideo(video);
                                        setShowVideoPlayer(true);
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                                    {video.title}
                                                </h4>
                                                {video.description && (
                                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                                                        {video.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play className="w-4 h-4" />
                                                <span className="text-sm font-medium">Play</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMaterial(video.id);
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos uploaded</h3>
                            <p className="text-gray-500 mb-4">Upload YouTube video links for your students</p>
                            <button onClick={() => setShowMaterialModal(true)} className="btn btn-primary">
                                Add Video
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Materials Tab */}
            {activeTab === 'materials' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">Course Materials</h2>
                        <button onClick={() => setShowMaterialModal(true)} className="btn btn-primary flex items-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Upload Material</span>
                        </button>
                    </div>

                    {nonVideoMaterials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {nonVideoMaterials.map(material => (
                                <div key={material.id} className="card p-4 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                {getMaterialIcon(material.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate">{material.title}</h4>
                                                <p className="text-sm text-gray-500 capitalize">{material.type}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteMaterial(material.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {material.description && <p className="text-sm text-gray-500 mt-3 line-clamp-2">{material.description}</p>}
                                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">
                                        View Material →
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials uploaded</h3>
                            <p className="text-gray-500 mb-4">Upload PDFs or documents for your students</p>
                            <button onClick={() => setShowMaterialModal(true)} className="btn btn-primary">Upload Material</button>
                        </div>
                    )}
                </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>
                        <button onClick={() => setShowCreateAssignment(!showCreateAssignment)} className="btn btn-primary flex items-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Create Assignment</span>
                        </button>
                    </div>

                    {showCreateAssignment && (
                        <form onSubmit={handleCreateAssignment} className="card p-6 border-2 border-primary-100 mb-6">
                            <h3 className="font-medium text-gray-900 mb-4">New Assignment</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input type="text" value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} className="input min-w-full" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea value={assignmentForm.description} onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} className="input min-w-full min-h-[100px]" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                        <input type="datetime-local" value={assignmentForm.dueDate} onChange={e => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} className="input min-w-full" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                                        <input type="number" value={assignmentForm.maxScore} onChange={e => setAssignmentForm({...assignmentForm, maxScore: parseInt(e.target.value) || 0})} className="input min-w-full" min="1" required />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-4">
                                    <button type="button" onClick={() => setShowCreateAssignment(false)} className="btn btn-outline">Cancel</button>
                                    <button type="submit" disabled={creatingAssignment} className="btn btn-primary">
                                        {creatingAssignment ? 'Creating...' : 'Publish Assignment'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {assignments?.length > 0 ? (
                        <div className="space-y-4">
                            {assignments.map(assignment => (
                                <div key={assignment.id} className="card p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900">{assignment.title}</h3>
                                            <div className="flex items-center gap-4 mt-2 mb-3">
                                                <span className="text-sm px-2 py-1 bg-gray-100 rounded-md text-gray-600">
                                                    Due: {formatDate(assignment.dueDate)}
                                                </span>
                                                <span className="text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                                                    Max Score: {assignment.maxScore}
                                                </span>
                                            </div>
                                            <p className="text-gray-600">{assignment.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleViewSubmissions(assignment.id)} 
                                            className={`btn ${expandedAssignment === assignment.id ? 'btn-primary' : 'btn-outline'} text-sm whitespace-nowrap`}
                                        >
                                            {expandedAssignment === assignment.id ? 'Hide Submissions' : 'View Submissions'}
                                        </button>
                                    </div>

                                    {/* Submissions Section */}
                                    {expandedAssignment === assignment.id && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <h4 className="font-medium text-gray-900 mb-4">Student Submissions</h4>
                                            
                                            {loadingSubmissions[assignment.id] ? (
                                                <div className="text-center py-4 text-gray-500">Loading submissions...</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {(!submissions[assignment.id] || submissions[assignment.id].length === 0) ? (
                                                        <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500 border border-gray-200">
                                                            No submissions yet for this assignment
                                                        </div>
                                                    ) : (
                                                        <div className="grid gap-4">
                                                            {submissions[assignment.id].map(sub => (
                                                                <div key={sub.id} className="flex flex-col md:flex-row md:items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                                    <div className="mb-4 md:mb-0">
                                                                        <div className="font-medium text-gray-900">{sub.user?.name || 'Student User'}</div>
                                                                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm hover:text-primary-700 font-medium flex items-center gap-1 mt-2">
                                                                            <FileText className="w-4 h-4" /> View Submission File
                                                                        </a>
                                                                        {sub.comments && <p className="text-sm text-gray-600 mt-2 bg-white p-3 rounded border border-gray-100">"{sub.comments}"</p>}
                                                                    </div>
                                                                    
                                                                    <div className="flex flex-col items-end min-w-[280px]">
                                                                        {sub.status === 'graded' ? (
                                                                            <div className="text-right w-full bg-white p-3 rounded-lg border border-green-100">
                                                                                <div className="flex items-center justify-end gap-1 text-green-600 font-medium mb-2">
                                                                                    <CheckCircle className="w-4 h-4" /> Graded: {sub.score} / {assignment.maxScore}
                                                                                </div>
                                                                                {sub.feedback && <p className="text-sm text-gray-600 text-left">Feedback: {sub.feedback}</p>}
                                                                            </div>
                                                                        ) : gradingSubmissionId === sub.id ? (
                                                                            <div className="w-full bg-white p-3 rounded-lg shadow-sm border border-gray-200 space-y-3">
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Score (Out of {assignment.maxScore})</label>
                                                                                    <input 
                                                                                        type="number" 
                                                                                        value={gradingForm.score}
                                                                                        onChange={e => setGradingForm({...gradingForm, score: e.target.value})}
                                                                                        className="input py-1.5 text-sm w-full"
                                                                                        max={assignment.maxScore}
                                                                                        min="0"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Feedback</label>
                                                                                    <textarea 
                                                                                        placeholder="Optional feedback..."
                                                                                        value={gradingForm.feedback}
                                                                                        onChange={e => setGradingForm({...gradingForm, feedback: e.target.value})}
                                                                                        className="input py-1.5 text-sm w-full min-h-[60px]"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex gap-2 justify-end pt-1">
                                                                                    <button onClick={() => setGradingSubmissionId(null)} className="btn btn-outline text-xs py-1.5 px-3">Cancel</button>
                                                                                    <button onClick={() => handleGradeSubmission(assignment.id, sub.id)} className="btn btn-primary text-xs py-1.5 px-3 whitespace-nowrap">Submit Grade</button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <button onClick={() => {
                                                                                setGradingSubmissionId(sub.id);
                                                                                setGradingForm({ score: sub.score || '', feedback: sub.feedback || '' });
                                                                            }} className="btn btn-outline text-sm py-1.5 bg-white">
                                                                                Grade Submission
                                                                            </button>
                                                                        )}
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
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments created</h3>
                            <p className="text-gray-500 mb-4">Create your first assignment to evaluate students</p>
                            <button onClick={() => setShowCreateAssignment(true)} className="btn btn-primary">
                                Create Assignment
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>

                    {/* Post Announcement Form */}
                    <form onSubmit={handlePostAnnouncement} className="card p-6">
                        <h3 className="font-medium text-gray-900 mb-4">Post New Announcement</h3>
                        <input
                            type="text"
                            placeholder="Announcement title"
                            value={announcementTitle}
                            onChange={(e) => setAnnouncementTitle(e.target.value)}
                            className="input mb-3"
                            required
                        />
                        <textarea
                            placeholder="Write your announcement..."
                            value={announcementContent}
                            onChange={(e) => setAnnouncementContent(e.target.value)}
                            className="input min-h-[100px]"
                            required
                        />
                        <div className="flex justify-end mt-4">
                            <button type="submit" disabled={postingAnnouncement} className="btn btn-primary">
                                {postingAnnouncement ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </div>
                    </form>

                    {/* Announcements List */}
                    {announcements.length > 0 ? (
                        <div className="space-y-4">
                            {announcements.map(announcement => (
                                <div key={announcement.id} className="card p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{formatDate(announcement.createdAt)}</p>
                                        </div>
                                        <button onClick={() => handleDeleteAnnouncement(announcement.id)} className="p-2 text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-gray-600 mt-3 whitespace-pre-wrap">{announcement.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
                            <p className="text-gray-500">Post your first announcement to notify students</p>
                        </div>
                    )}
                </div>
            )}

            {/* Discussions Tab */}
            {activeTab === 'discussions' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Student Discussions</h2>

                    {discussions.length > 0 ? (
                        <div className="space-y-6">
                            {discussions.map(discussion => (
                                <div key={discussion.id} className="card p-5">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                                            {discussion.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{discussion.user?.name}</span>
                                                <span className="text-sm text-gray-500">{formatDate(discussion.createdAt)}</span>
                                            </div>
                                            <p className="text-gray-600 mt-2">{discussion.content}</p>

                                            {/* Replies */}
                                            {discussion.replies?.length > 0 && (
                                                <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-4">
                                                    {discussion.replies.map(reply => (
                                                        <div key={reply.id} className="flex items-start space-x-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${reply.isInstructor ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {reply.isInstructor ? 'I' : reply.user?.name?.charAt(0)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    {reply.isInstructor ? (
                                                                        <span className="font-bold text-yellow-700">Course Instructor</span>
                                                                    ) : (
                                                                        <span className="font-medium text-gray-900">{reply.user?.name}</span>
                                                                    )}
                                                                    <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                                                </div>
                                                                <p className="text-gray-600 text-sm mt-1">{reply.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reply Form */}
                                            {replyingTo === discussion.id ? (
                                                <div className="mt-4 flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Type your reply..."
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        className="input flex-1"
                                                    />
                                                    <button onClick={() => handlePostReply(discussion.id)} disabled={postingReply} className="btn btn-primary">
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => { setReplyingTo(null); setReplyContent(''); }} className="btn btn-outline">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setReplyingTo(discussion.id)} className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">
                                                    Reply
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
                            <p className="text-gray-500">Student queries and discussions will appear here</p>
                        </div>
                    )}
                </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Enrolled Students ({course.enrollments?.length || 0})</h2>

                    {course.enrollments?.length > 0 ? (
                        <div className="card overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled On</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {course.enrollments.map(enrollment => (
                                        <tr key={enrollment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                                                        {enrollment.student?.name?.charAt(0) || 'S'}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{enrollment.student?.name || 'Student'}</div>
                                                        <div className="text-sm text-gray-500">{enrollment.student?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(enrollment.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${enrollment.progress || 0}%` }}></div>
                                                    </div>
                                                    <span className="ml-2 text-sm text-gray-500">{enrollment.progress || 0}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled yet</h3>
                            <p className="text-gray-500">Students will appear here once they enroll in your course</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showScheduleModal && (
                <ScheduleClassModal courseId={id} onClose={() => setShowScheduleModal(false)} onClassCreated={handleClassCreated} />
            )}

            {showMaterialModal && (
                <UploadMaterialModal courseId={id} onClose={() => setShowMaterialModal(false)} onMaterialUploaded={handleMaterialUploaded} />
            )}

            {showEditModal && course && (
                <EditCourseModal course={course} onClose={() => setShowEditModal(false)} onCourseUpdated={handleCourseUpdated} />
            )}

            {showVideoPlayer && selectedVideo && (
                <VideoPlayer
                    videos={videoMaterials}
                    initialVideo={selectedVideo}
                    onClose={() => {
                        setShowVideoPlayer(false);
                        setSelectedVideo(null);
                    }}
                    canDelete={true}
                    onDelete={handleDeleteMaterial}
                />
            )}
        </div>
    );
};

export default InstructorCourseView;
