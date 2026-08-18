import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, classAPI, assignmentAPI, membershipAPI } from '../services/api';
import CourseCard from '../components/CourseCard';
import ClassCard from '../components/ClassCard';
import { BookOpen, Calendar, TrendingUp, ClipboardList, GraduationCap, Clock3 } from 'lucide-react';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [myPrograms, setMyPrograms] = useState([]);
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [pendingAssignments, setPendingAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, classesRes, programsRes] = await Promise.all([
                    courseAPI.getEnrolled(),
                    classAPI.getAll({ upcoming: true }),
                    membershipAPI.getMyPrograms()
                ]);

                if (coursesRes.success) {
                    setEnrolledCourses(coursesRes.enrollments || []);
                }

                if (classesRes.success) {
                    setUpcomingClasses(classesRes.classes || []);
                }

                if (programsRes.success) {
                    setMyPrograms(programsRes.enrollments || []);
                }

                const resolvedAssignments = await Promise.all(
                    (coursesRes.enrollments || []).map(async (enrollment) => {
                        const courseId = enrollment.course?.id || enrollment.courseId;
                        if (!courseId) return [];

                        const assignmentsRes = await assignmentAPI.getByCourse(courseId);
                        if (!assignmentsRes.success) return [];

                        return (assignmentsRes.assignments || [])
                            .filter((assignment) => new Date(assignment.dueDate) >= new Date())
                            .slice(0, 2)
                            .map((assignment) => ({
                                ...assignment,
                                courseTitle: enrollment.course?.title || 'Course'
                            }));
                    })
                );

                const flattenedAssignments = resolvedAssignments.flat().slice(0, 6);
                setPendingAssignments(flattenedAssignments);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
                <p className="text-primary-100">
                    You have {upcomingClasses.length} upcoming class{upcomingClasses.length === 1 ? '' : 'es'} and {pendingAssignments.length} pending assignment{pendingAssignments.length === 1 ? '' : 's'} to review.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card p-6 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Enrolled Courses</p>
                        <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
                    </div>
                </div>

                <div className="card p-6 flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Upcoming Classes</p>
                        <p className="text-2xl font-bold text-gray-900">{upcomingClasses.length}</p>
                    </div>
                </div>

                <div className="card p-6 flex items-center space-x-4">
                    <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Pending Assignments</p>
                        <p className="text-2xl font-bold text-gray-900">{pendingAssignments.length}</p>
                    </div>
                </div>

                <div className="card p-6 flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Programs</p>
                        <p className="text-2xl font-bold text-gray-900">{myPrograms.length}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Upcoming Schedule</h2>
                    <Link to="/courses" className="text-primary-600 hover:text-primary-700 font-medium">
                        View Schedule
                    </Link>
                </div>

                {upcomingClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingClasses.map(cls => (
                            <ClassCard key={cls.id} classSession={cls} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No upcoming classes scheduled</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Pending Assignments</h2>
                </div>

                {pendingAssignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingAssignments.map((assignment) => (
                            <div key={assignment.id} className="card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                        {assignment.courseTitle}
                                    </span>
                                    <Clock3 className="w-4 h-4 text-gray-400" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No pending assignments</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
                    <Link to="/courses" className="text-primary-600 hover:text-primary-700 font-medium">
                        Browse More
                    </Link>
                </div>

                {enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {enrolledCourses.map(enrollment => (
                            <div key={enrollment.id} className="flex flex-col h-full space-y-2">
                                <CourseCard course={enrollment.course} isEnrolled={true} />
                                {enrollment.status === 'completed' && enrollment.certificateUrl && (
                                    <a
                                        href={`http://localhost:3000${enrollment.certificateUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn bg-green-600 hover:bg-green-700 text-white w-full text-center flex items-center justify-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        <span>Download Certificate</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet</p>
                        <Link to="/courses" className="btn btn-primary">
                            Browse Courses
                        </Link>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">My Programs</h2>
                </div>

                {myPrograms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myPrograms.map((programEnrollment) => (
                            <div key={programEnrollment.id} className="card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                        Program
                                    </span>
                                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{programEnrollment.program?.title || 'Program'}</h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    {programEnrollment.program?.institute?.name || 'Institute'}
                                </p>
                                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-primary-600 h-2 rounded-full"
                                        style={{ width: `${programEnrollment.progress || 0}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Progress: {programEnrollment.progress || 0}%</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">You are not enrolled in any programs yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
