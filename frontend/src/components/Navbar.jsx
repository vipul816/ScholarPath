import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Zap, Home } from 'lucide-react';
import ProfileIcon from './ProfileIcon';
import ThemeToggle from './ThemeToggle';
import ScholarPathLogo from './ScholarPathlogo';

const Navbar = () => {
    const { user, logout, isInstructor, isStudent, isInstitute } = useAuth();

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to={isInstructor ? '/instructor' : isInstitute ? '/institute-dashboard' : '/dashboard'} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                        <ScholarPathLogo className="w-9 h-9" />
                        <span className="text-xl font-bold text-primary-700 dark:text-primary-400 tracking-tight font-display">
                            ScholarPath
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            to={isInstructor ? '/instructor' : isInstitute ? '/institute-dashboard' : '/dashboard'}
                            className="flex items-center space-x-1 text-primary-500 hover:text-accent-600 transition-colors text-sm font-medium"
                        >
                            <Home className="w-4 h-4" />
                            <span>Dashboard</span>
                        </Link>

                        {isStudent && (
                            <>
                                <Link to="/courses" className="flex items-center space-x-1 text-primary-500 hover:text-accent-600 transition-colors text-sm font-medium">
                                    <Zap className="w-4 h-4" />
                                    <span>Explore Courses</span>
                                </Link>
                                <Link to="/dashboard" className="flex items-center space-x-1 text-primary-500 hover:text-accent-600 transition-colors text-sm font-medium">
                                    <Zap className="w-4 h-4" />
                                    <span>Programs</span>
                                </Link>
                            </>
                        )}

                        {isInstructor && (
                            <>
                                <Link to="/instructor/calendar" className="flex items-center space-x-1 text-primary-500 hover:text-accent-600 transition-colors text-sm font-medium">
                                    <Home className="w-4 h-4" />
                                    <span>Calendar</span>
                                </Link>
                                <Link to="/instructor/manage-courses" className="flex items-center space-x-1 text-primary-500 hover:text-accent-600 transition-colors text-sm font-medium">
                                    <Zap className="w-4 h-4" />
                                    <span>Manage Courses</span>
                                </Link>
                            </>
                        )}

                        {isInstitute && (
                            <>
                                <Link to="/institute-dashboard" className="flex items-center space-x-1 text-primary-500 hover:text-accent-600 transition-colors text-sm font-medium">
                                    <Home className="w-4 h-4" />
                                    <span>Calendar</span>
                                </Link>
                                <Link to="/institute-dashboard" className="flex items-center space-x-1 text-primary-500 hover:text-accent-600 transition-colors text-sm font-medium">
                                    <Zap className="w-4 h-4" />
                                    <span>Manage Programs</span>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="flex items-center space-x-6">
                        <ThemeToggle />
                        <ProfileIcon user={user} />

                        <button
                            onClick={logout}
                            className="flex items-center space-x-1 text-primary-500 hover:text-error-600 transition-colors px-3 py-2 rounded-lg hover:bg-error-50 text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden md:inline">Log out</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
