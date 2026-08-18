import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, materialAPI, announcementAPI, discussionAPI, assignmentAPI } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import {
    ArrowLeft, Calendar, Clock, User, BookOpen,
    Video, FileText, File, Link as LinkIcon,
    Play, Download, CheckCircle, Megaphone, MessageCircle, Send, ClipboardList, Upload
} from 'lucide-react';

const StudentCourseView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [discussions, setDiscussions] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState('');
    const [showVideoPlayer, setShowVideoPlayer] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);

    // Discussion form
    const [newQuery, setNewQuery] = useState('');
    const [postingQuery, setPostingQuery] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [postingReply, setPostingReply] = useState(false);

    // Assignment submission form
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submissionComments, setSubmissionComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCourseData();
    }, [id]);

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            const [courseRes, materialsRes, announcementsRes, discussionsRes, assignmentsRes] = await Promise.all([
                courseAPI.getById(id),
                materialAPI.getByCourse(id),
                announcementAPI.getByCourse(id),
                discussionAPI.getByCourse(id),
                assignmentAPI.getByCourse(id)
            ]);

            if (courseRes.success) setCourse(courseRes.course);
            if (materialsRes.success) setMaterials(materialsRes.materials);
            if (announcementsRes.success) setAnnouncements(announcementsRes.announcements);
            if (discussionsRes.success) setDiscussions(discussionsRes.discussions);
            if (assignmentsRes.success) setAssignments(assignmentsRes.assignments);
        } catch (error) {
            console.error('Error fetching course:', error);
            setError('Failed to load course data');
        } finally {
            setLoading(false);
        }
    };

    const handlePostQuery = async (e) => {
        e.preventDefault();
        if (!newQuery.trim()) return;

        setPostingQuery(true);
        try {
            const response = await discussionAPI.create({
                courseId: parseInt(id),
                content: newQuery
            });
            if (response.success) {
                setDiscussions(prev => [response.discussion, ...prev]);
                setNewQuery('');
            }
        } catch (error) {
            console.error('Error posting query:', error);
        } finally {
            setPostingQuery(false);
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
                setDiscussions(prev => prev.map(d => {
                    if (d.id === discussionId) {
                        return { ...d, replies: [...(d.replies || []), response.discussion] };
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

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        if (!selectedAssignment || !submissionFile) return;

        const formData = new FormData();
        formData.append('file', submissionFile);
        formData.append('comments', submissionComments);

        setSubmitting(true);
        try {
            const response = await assignmentAPI.submit(selectedAssignment.id, formData);
            if (response.success) {
                // Update assignment in state to show it's submitted
                setAssignments(prev => prev.map(a => {
                    if (a.id === selectedAssignment.id) {
                        return { 
                            ...a, 
                            Submissions: [...(a.Submissions || []), response.submission] 
                        };
                    }
                    return a;
                }));
                setSelectedAssignment(null);
                setSubmissionFile(null);
                setSubmissionComments('');
            }
        } catch (error) {
            console.error('Error submitting assignment:', error);
            setError(error.message || 'Failed to submit assignment');
        } finally {
            setSubmitting(false);
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

    const getMaterialsByType = (type) => materials.filter(m => m.type === type);

    const getClassStatus = (scheduledAt) => {
        const now = new Date();
        const classTime = new Date(scheduledAt);
        const diffMs = classTime - now;
        const diffMins = diffMs / (1000 * 60);

        if (diffMs < 0) return { label: 'Completed', color: 'bg-gray-100 text-gray-700', canJoin: false, statusText: 'Class completed' };
        if (diffMins <= 15 && diffMins > 0) return { label: 'Live Now', color: 'bg-green-100 text-green-700', canJoin: true, statusText: 'Class is live!' };
        if (diffMins <= 30 && diffMins > 0) return { label: 'Starting Soon', color: 'bg-yellow-100 text-yellow-700', canJoin: true, statusText: 'Class is starting soon' };
        
        const hoursUntil = diffMins / 60;
        if (hoursUntil <= 24) {
            return { 
                label: 'Upcoming', 
                color: 'bg-blue-100 text-blue-700', 
                canJoin: false, 
                statusText: `Will be live in ${Math.round(hoursUntil)} hour${Math.round(hoursUntil) !== 1 ? 's' : ''}` 
            };
        }
        
        return { 
            label: 'Scheduled', 
            color: 'bg-blue-100 text-blue-700', 
            canJoin: false, 
            statusText: `Will be live on ${new Date(scheduledAt).toLocaleDateString()} at ${new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
        };
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const upcomingClasses = course?.classes?.filter(c => new Date(c.scheduledAt) > new Date()) || [];
    const pastClasses = course?.classes?.filter(c => new Date(c.scheduledAt) <= new Date()) || [];

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
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-4">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>

                {/* Course Hero */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div>
                            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-4">{course.category}</span>
                            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
                            <div className="flex flex-wrap items-center gap-6 text-primary-100">
                                <div className="flex items-center space-x-2">
                                    <User className="w-5 h-5" />
                                    <span>{course.instructor?.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{course.duration || 'Self-paced'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <BookOpen className="w-5 h-5" />
                                    <span>{course.level}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="text-center">
                                <div className="text-4xl font-bold">{course.classes?.length || 0}</div>
                                <div className="text-primary-200">Classes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                <nav className="flex space-x-6">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'schedule', label: 'Class Schedule' },
                        { id: 'materials', label: 'Materials' },
                        { id: 'announcements', label: 'Announcements' },
                        { id: 'assignments', label: 'Assignments' },
                        { id: 'discussions', label: 'Discussions' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">About this course</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                        </div>

                        {upcomingClasses.length > 0 && (
                            <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Class</h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{upcomingClasses[0].title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{new Date(upcomingClasses[0].scheduledAt).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => navigate(`/class/${upcomingClasses[0].id}`)} className="btn btn-primary">
                                        <Play className="w-4 h-4 mr-2" />Join Class
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Recent Announcements Preview */}
                        {announcements.length > 0 && (
                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <Megaphone className="w-5 h-5 text-yellow-500 mr-2" />
                                        Latest Announcement
                                    </h3>
                                    <button onClick={() => setActiveTab('announcements')} className="text-sm text-primary-600 hover:text-primary-700">
                                        View all →
                                    </button>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                    <h4 className="font-medium text-gray-900">{announcements[0].title}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{formatDate(announcements[0].createdAt)}</p>
                                    <p className="text-gray-600 mt-2 line-clamp-3">{announcements[0].content}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor</h3>
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                    {course.instructor?.name?.charAt(0) || 'I'}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{course.instructor?.name}</h4>
                                    <p className="text-sm text-gray-500">{course.instructor?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Videos</span>
                                    <span className="font-medium">{getMaterialsByType('video').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Documents</span>
                                    <span className="font-medium">{getMaterialsByType('pdf').length + getMaterialsByType('document').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total Classes</span>
                                    <span className="font-medium">{course.classes?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Classes</h2>
                        {upcomingClasses.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingClasses.map((cls, index) => {
                                    const status = getClassStatus(cls.scheduledAt);
                                    return (
                                        <div key={cls.id} className="card p-5 hover:shadow-lg transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-4 flex-grow">
                                                    <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold">{index + 1}</div>
                                                    <div className="flex-grow">
                                                        <h3 className="font-semibold text-gray-900">{cls.title}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">{cls.description || 'No description'}</p>
                                                        <div className="flex items-center space-x-4 mt-2 flex-wrap">
                                                            <span className="flex items-center text-sm text-gray-500">
                                                                <Calendar className="w-4 h-4 mr-1" />{new Date(cls.scheduledAt).toLocaleDateString()}
                                                            </span>
                                                            <span className="flex items-center text-sm text-gray-500">
                                                                <Clock className="w-4 h-4 mr-1" />{new Date(cls.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className="text-sm text-gray-500">{cls.duration} mins</span>
                                                        </div>
                                                        <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                                            <p className="text-sm text-blue-700 font-medium">{status.statusText}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3 ml-4">
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.label}</span>
                                                    <button onClick={() => navigate(`/class/${cls.id}`)} className={`btn ${status.canJoin ? 'btn-primary' : 'btn-outline'} text-sm`}>
                                                        <Play className="w-4 h-4 mr-1" />{status.canJoin ? 'Join Now' : 'View Details'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No upcoming classes scheduled</p>
                            </div>
                        )}
                    </div>

                    {pastClasses.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Classes</h2>
                            <div className="space-y-3">
                                {pastClasses.map(cls => (
                                    <div key={cls.id} className="card p-4 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                <div>
                                                    <h4 className="font-medium text-gray-700">{cls.title}</h4>
                                                    <p className="text-sm text-gray-500">{new Date(cls.scheduledAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            {cls.recordingUrl && (
                                                <a href={cls.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                                    Watch Recording
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Materials Tab */}
            {activeTab === 'materials' && (
                <div className="space-y-8">
                    {getMaterialsByType('video').length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <Video className="w-5 h-5 text-red-500 mr-2" />Videos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getMaterialsByType('video').map(material => (
                                    <button 
                                        key={material.id} 
                                        onClick={() => { setSelectedVideo(material); setShowVideoPlayer(true); }} 
                                        className="text-left w-full card p-4 hover:shadow-lg transition-all group"
                                    >
                                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                            <Play className="w-12 h-12 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                        </div>
                                        <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{material.title}</h4>
                                        {material.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{material.description}</p>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {(getMaterialsByType('pdf').length > 0 || getMaterialsByType('document').length > 0) && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 text-orange-500 mr-2" />Documents & PDFs
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...getMaterialsByType('pdf'), ...getMaterialsByType('document')].map(material => (
                                    <a key={material.id} href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="card p-4 hover:shadow-lg transition-shadow flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">{getMaterialIcon(material.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate">{material.title}</h4>
                                            {material.description && <p className="text-sm text-gray-500 truncate">{material.description}</p>}
                                        </div>
                                        <Download className="w-5 h-5 text-gray-400" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {(getMaterialsByType('link').length > 0 || getMaterialsByType('other').length > 0) && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <LinkIcon className="w-5 h-5 text-green-500 mr-2" />Resources & Links
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...getMaterialsByType('link'), ...getMaterialsByType('other')].map(material => (
                                    <a key={material.id} href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="card p-4 hover:shadow-lg transition-shadow flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">{getMaterialIcon(material.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate">{material.title}</h4>
                                            {material.description && <p className="text-sm text-gray-500 truncate">{material.description}</p>}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {materials.length === 0 && (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials available yet</h3>
                            <p className="text-gray-500">The instructor hasn't uploaded any materials for this course</p>
                        </div>
                    )}
                </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Course Announcements</h2>

                    {announcements.length > 0 ? (
                        <div className="space-y-4">
                            {announcements.map(announcement => (
                                <div key={announcement.id} className="card p-5 border-l-4 border-yellow-400">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                <Megaphone className="w-5 h-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                                                <p className="text-sm text-gray-500">Posted on {formatDate(announcement.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mt-4 whitespace-pre-wrap">{announcement.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
                            <p className="text-gray-500">The instructor hasn't posted any announcements</p>
                        </div>
                    )}
                </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>

                    {assignments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {assignments.map(assignment => {
                                const isSubmitted = assignment.Submissions?.some(s => s.studentId === user.id);
                                return (
                                    <div key={assignment.id} className="card p-6 border border-gray-100 hover:border-primary-100 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                    <ClipboardList className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                        {assignment.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${isSubmitted 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {isSubmitted ? 'Submitted' : 'Pending'}
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                                                Due: {formatDate(assignment.dueDate)}
                                            </div>
                                            <div className="flex items-center">
                                                <CheckCircle className="w-4 h-4 mr-1.5 text-gray-400" />
                                                Max Points: {assignment.totalMarks || 100}
                                            </div>
                                        </div>

                                        {assignment.fileUrl && (
                                            <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-primary-600 hover:text-primary-700 mb-4 inline-flex">
                                                <FileText className="w-4 h-4 mr-1" /> View Resource File
                                            </a>
                                        )}

                                        <div className="pt-4 border-t border-gray-100">
                                            {isSubmitted ? (
                                                <div className="text-center p-3 bg-green-50 rounded-lg text-green-700 font-medium text-sm flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 mr-2" /> You have submitted this assignment
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAssignment(assignment);
                                                        setSubmissionFile(null);
                                                        setSubmissionComments('');
                                                    }}
                                                    className="w-full btn btn-primary"
                                                >
                                                    <Upload className="w-4 h-4 mr-2" /> Submit Assignment
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                            <p className="text-gray-500">The instructor hasn't posted any assignments</p>
                        </div>
                    )}
                </div>
            )}

            {/* Submission Modal */}
            {selectedAssignment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Assignment</h2>
                        <p className="text-gray-600 mb-6">{selectedAssignment.title}</p>
                        
                        <form onSubmit={handleSubmitAssignment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Upload File
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Comments (Optional)
                                </label>
                                <textarea
                                    value={submissionComments}
                                    onChange={(e) => setSubmissionComments(e.target.value)}
                                    className="input h-24 resize-none w-full"
                                    placeholder="Add any comments for the instructor..."
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedAssignment(null)} 
                                    className="btn btn-outline flex-1"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary flex-1" 
                                    disabled={!submissionFile || submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Discussions Tab */}
            {activeTab === 'discussions' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Discussion Forum</h2>

                    {/* Post New Query */}
                    <form onSubmit={handlePostQuery} className="card p-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    placeholder="Ask a question or start a discussion..."
                                    value={newQuery}
                                    onChange={(e) => setNewQuery(e.target.value)}
                                    className="input min-h-[80px] resize-none"
                                    required
                                />
                                <div className="flex justify-end mt-2">
                                    <button type="submit" disabled={postingQuery} className="btn btn-primary">
                                        {postingQuery ? 'Posting...' : 'Post Question'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Discussions List */}
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
                            <p className="text-gray-500">Be the first to start a discussion!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Video Player Modal */}
            {showVideoPlayer && (
                <VideoPlayer
                    videos={getMaterialsByType('video')}
                    initialVideo={selectedVideo}
                    onClose={() => setShowVideoPlayer(false)}
                    courseId={course.id}
                />
            )}
        </div>
    );
};

export default StudentCourseView;
