import { Link } from 'react-router-dom';
import { Clock, Zap, User, Settings } from 'lucide-react';

const CourseCard = ({ course, isEnrolled = false, isInstructor = false }) => {
    // Determine the link based on role
    const getLink = () => {
        if (isInstructor) {
            return `/courses/${course.id}/manage`;
        } else if (isEnrolled) {
            return `/courses/${course.id}/learn`;
        }
        return `/courses/${course.id}`;
    };

    const getButtonText = () => {
        if (isInstructor) {
            return 'Manage Course';
        } else if (isEnrolled) {
            return 'Continue Learning';
        }
        return 'View Details';
    };

    return (
        <div className="bg-white rounded-google border border-gray-200 group overflow-hidden flex flex-col h-full shadow-google-sm hover:shadow-google transition-shadow duration-200">
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-accent-100 to-accent-200">
                <img
                    src={course.thumbnail || 'https://via.placeholder.com/400x225/1f71ed/FFFFFF?text=ScholarPath+Course'}
                    alt={course.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/95 backdrop-blur-sm shadow-google-sm rounded-full text-xs font-medium text-primary-600">
                        {course.category}
                    </span>
                </div>
                {isInstructor && (
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-warning-500 text-white text-xs font-medium rounded-full flex items-center shadow-google-sm">
                            <Settings className="w-3 h-3 mr-1" />
                            Instructor
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-base font-semibold text-primary-700 mb-2 line-clamp-2 group-hover:text-accent-600 transition-colors">
                    {course.title}
                </h3>

                <p className="text-sm text-primary-500 mb-4 line-clamp-2 flex-grow">
                    {course.description}
                </p>

                <div className="flex items-center justify-between text-xs text-primary-400 mb-4 space-x-2">
                    {!isInstructor && (
                        <div className="flex items-center space-x-1 flex-shrink-0">
                            <User className="w-3 h-3" />
                            <span className="truncate">{course.instructor?.name || 'Instructor'}</span>
                        </div>
                    )}
                    {isInstructor && (
                        <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{course.enrollments?.length || 0} students</span>
                        </div>
                    )}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration || 'Self-paced'}</span>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <Link
                        to={getLink()}
                        className={`w-full px-4 py-2 rounded-google text-center text-sm font-medium transition-all duration-200 ${isInstructor
                                ? 'bg-warning-500 hover:bg-warning-600 text-white shadow-google-sm hover:shadow-google'
                                : isEnrolled
                                    ? 'bg-primary-100 text-accent-600 hover:bg-primary-200'
                                    : 'bg-accent-500 hover:bg-accent-600 text-white shadow-google-sm hover:shadow-google'
                            }`}
                    >
                        {getButtonText()}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;

