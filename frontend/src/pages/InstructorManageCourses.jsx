import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, Plus, Settings2, ArrowRight } from 'lucide-react';
import { courseAPI } from '../services/api';

const InstructorManageCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await courseAPI.getTeaching();
                if (response.success) {
                    setCourses(response.courses || []);
                }
            } catch (error) {
                console.error('Failed to fetch instructor courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <p className="text-sm font-medium text-primary-600 uppercase tracking-wide">Instructor Workspace</p>
                    <h1 className="text-3xl font-bold text-gray-900 mt-1">Manage Courses</h1>
                </div>

                <Link to="/courses/create" className="btn btn-primary flex items-center gap-2 self-start">
                    <Plus className="w-4 h-4" />
                    <span>Create Course</span>
                </Link>
            </div>

            {courses.length === 0 ? (
                <div className="card p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No courses created yet</h2>
                    <p className="text-gray-500 mb-5">Start by creating your first course and then manage lessons, schedules, and assignments.</p>
                    <Link to="/courses/create" className="btn btn-primary">Create Your First Course</Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {courses.map((course) => (
                        <div key={course.id} className="card overflow-hidden">
                            <div className="relative h-44 overflow-hidden">
                                <img
                                    src={course.thumbnail || 'https://via.placeholder.com/800x450/1f71ed/FFFFFF?text=ScholarPath+Course'}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                <span className="absolute left-4 top-4 px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-primary-700">
                                    {course.category || 'General'}
                                </span>
                            </div>

                            <div className="p-5 flex flex-col h-[220px]">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</h2>
                                    <Settings2 className="w-4 h-4 text-gray-500 mt-1" />
                                </div>

                                <p className="text-sm text-gray-600 mt-3 line-clamp-3 flex-1">{course.description}</p>

                                <div className="mt-4 space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-primary-600" />
                                        <span>{course.enrollments?.length || 0} Students</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-primary-600" />
                                        <span>{course.classes?.length || 0} Classes scheduled</span>
                                    </div>
                                </div>

                                <div className="mt-5 flex gap-3">
                                    <Link
                                        to={`/courses/${course.id}/manage`}
                                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        Manage
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InstructorManageCourses;
