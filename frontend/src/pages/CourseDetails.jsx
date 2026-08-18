import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { Clock, User, BookOpen, CheckCircle, AlertCircle, FileText, Video, Lock, XCircle } from 'lucide-react';

const CourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isStudent } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [error, setError] = useState('');
    const [isEnrolled, setIsEnrolled] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await courseAPI.getById(id);
                if (response.success) {
                    setCourse(response.course);

                    // Check if current user is enrolled
                    if (user && response.course.enrollments) {
                        const enrolled = response.course.enrollments.some(
                            enrollment => enrollment.student?.id === user.id || enrollment.studentId === user.id
                        );
                        setIsEnrolled(enrolled);
                    }
                }
            } catch (error) {
                console.error('Error fetching course:', error);
                setError('Failed to load course details');
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id, user]);

    const handleEnroll = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setEnrolling(true);
        setError('');
        try {
            const response = await courseAPI.enroll(id);
            if (response.success) {
                setIsEnrolled(true);
                // Redirect to student course view
                navigate(`/courses/${id}/learn`);
            }
        } catch (error) {
            setError(error.message || 'Failed to enroll');
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
                <button onClick={() => navigate('/courses')} className="btn btn-primary mt-4">
                    Back to Courses
                </button>
            </div>
        );
    }

    const enrollmentClosed = course.enrollmentOpen === false;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="relative h-64 md:h-96">
                    <img
                        src={course.thumbnail || 'https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=Course+Banner'}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
                        <div className="p-8 text-white w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="badge bg-primary-500 text-white border-none">
                                    {course.category}
                                </span>
                                {enrollmentClosed && (
                                    <span className="badge bg-red-500 text-white border-none flex items-center gap-1">
                                        <Lock className="w-3 h-3" />
                                        Enrollment Closed
                                    </span>
                                )}
                                {isEnrolled && (
                                    <span className="badge bg-green-500 text-white border-none flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Enrolled
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                            <div className="flex flex-wrap items-center gap-6 text-sm md:text-base">
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
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About this course</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {course.description}
                            </p>
                        </section>

                        {/* Syllabus / Classes */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Schedule</h2>
                            <div className="space-y-4">
                                {course.classes?.length > 0 ? (
                                    course.classes.map((cls, index) => (
                                        <div key={cls.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{cls.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {new Date(cls.scheduledAt).toLocaleString()} • {cls.duration} mins
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No classes scheduled yet.</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="card p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Course Materials</h3>
                            <div className="space-y-3 mb-6">
                                {course.materials?.length > 0 ? (
                                    isEnrolled ? (
                                        course.materials.map(material => (
                                            <div key={material.id} className="flex items-center space-x-3 text-sm text-gray-600">
                                                {material.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                <span className="truncate">{material.title}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm">Enroll to access {course.materials.length} materials</p>
                                        </div>
                                    )
                                ) : (
                                    <p className="text-sm text-gray-500">No materials uploaded yet.</p>
                                )}
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center space-x-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {isStudent && (
                                <>
                                    {isEnrolled ? (
                                        <button
                                            onClick={() => navigate(`/courses/${id}/learn`)}
                                            className="w-full btn btn-primary py-3 text-lg font-semibold flex items-center justify-center space-x-2"
                                        >
                                            <BookOpen className="w-5 h-5" />
                                            <span>Continue Learning</span>
                                        </button>
                                    ) : enrollmentClosed ? (
                                        <button
                                            disabled
                                            className="w-full btn bg-gray-300 text-gray-600 py-3 text-lg font-semibold flex items-center justify-center space-x-2 cursor-not-allowed"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            <span>Enrollment Closed</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleEnroll}
                                            disabled={enrolling}
                                            className="w-full btn btn-primary py-3 text-lg font-semibold flex items-center justify-center space-x-2"
                                        >
                                            {enrolling ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span>Enroll Now</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;

