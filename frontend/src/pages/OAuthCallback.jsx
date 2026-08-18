import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithOAuthToken } = useAuth(); // need to implement this in AuthContext

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        const userStr = queryParams.get('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));
                
                // Save to local storage
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                // Update context and redirect
                // Since context loads from localStorage on mount, we can simply reload or update state
                window.location.href = user.role === 'instructor' ? '/instructor' : '/dashboard';
            } catch (err) {
                console.error("Error parsing user from OAuth callback", err);
                navigate('/login?error=OAuthFailed');
            }
        } else {
            navigate('/login?error=OAuthFailed');
        }
    }, [navigate, location]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Completing Sign In...</h2>
            </div>
        </div>
    );
};

export default OAuthCallback;
