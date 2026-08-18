import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to appropriate login page
        if (requireRole === 'admin') {
            return <Navigate to="/admin-login" replace />;
        } else if (requireRole === 'institute') {
            return <Navigate to="/institute-login" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    if (requireRole && user.role !== requireRole) {
        // Redirect based on actual role
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        } else if (user.role === 'institute') {
            return <Navigate to="/institute-dashboard" replace />;
        }
        return <Navigate to={user.role === 'instructor' ? '/instructor' : '/dashboard'} replace />;
    }

    return children;
};

export default ProtectedRoute;

