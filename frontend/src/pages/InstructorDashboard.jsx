import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, classAPI, membershipAPI } from '../services/api';
import CourseCard from '../components/CourseCard';
import ClassCard from '../components/ClassCard';
import { Plus, Users, BookOpen, Video, Building2, CalendarDays } from 'lucide-react';

const InstructorDashboard = () => {
    const { user } = useAuth();
    const [teachingCourses, setTeachingCourses] = useState([]);
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [myInstitutes, setMyInstitutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, classesRes, instituteRes] = await Promise.all([
                    courseAPI.getTeaching(),
                    classAPI.getAll({ upcoming: true }),
                    membershipAPI.getMyInstitutes()
                ]);

                if (coursesRes.success) {
                    setTeachingCourses(coursesRes.courses || []);
                }

                if (classesRes.success) {
                    setUpcomingClasses((classesRes.classes || []).filter(c => c.course?.instructorId === user.id));
                }

                if (instituteRes.success) {
                    setMyInstitutes(instituteRes.memberships || []);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                    <p className="text-gray-600 mt-1">Manage your courses, classes and institute memberships.</p>
                </div>
                <Link to="/courses/create" className="btn btn-primary flex items-center space-x-2 self-start">
                    <Plus className="w-5 h-5" />
                    <span>Create Course</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card p-6 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Active Courses</p>
                        <p className="text-2xl font-bold text-gray-900">{teachingCourses.length}</p>
                    </div>
                </div>

                <div className="card p-6 flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {teachingCourses.reduce((acc, course) => acc + (course.enrollments?.length || 0), 0)}
                        </p>
                    </div>
                </div>

                <div className="card p-6 flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <Video className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Upcoming Classes</p>
                        <p className="text-2xl font-bold text-gray-900">{upcomingClasses.length}</p>
                    </div>
                </div>

                <div className="card p-6 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Institutes</p>
                        <p className="text-2xl font-bold text-gray-900">{myInstitutes.length}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Upcoming Schedule</h2>
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarDays className="w-4 h-4" />
                        Live class calendar
                    </span>
                </div>

                {upcomingClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingClasses.map(cls => (
                            <ClassCard key={cls.id} classSession={cls} isInstructor={true} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No classes scheduled yet</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">My Institutes</h2>
                {myInstitutes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myInstitutes.map((membership) => (
                            <div key={membership.id} className="card p-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900">{membership.institute?.name || 'Institute'}</h3>
                                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                        {membership.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {membership.institute?.instituteType || 'Institute'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">You have not joined any institutes yet</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Created Courses</h2>

                {teachingCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {teachingCourses.map(course => (
                            <CourseCard key={course.id} course={course} isInstructor={true} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">You haven't created any courses yet</p>
                        <Link to="/courses/create" className="btn btn-primary">
                            Create Your First Course
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstructorDashboard;
