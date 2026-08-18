import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, adminAPI, instituteAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });

            if (response.success) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                setUser(response.user);
                return { success: true, user: response.user };
            }
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    const adminLogin = async (email, password) => {
        try {
            const response = await adminAPI.login({ email, password });

            if (response.success) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                setUser(response.user);
                return { success: true, user: response.user };
            }
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message || 'Admin login failed' };
        }
    };

    const loginInstitute = async (email, password) => {
        try {
            console.log('📞 Calling institute login API');
            const response = await instituteAPI.login({ email, password });

            console.log('📦 API Response data:', response);

            if (response.success) {
                console.log('✓ Login successful, storing in context and localStorage');
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                setUser(response.user);
                return { success: true, user: response.user };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('❌ Institute login error:', error);
            return { success: false, message: error.message || 'Institute login failed' };
        }
    };

    const signup = async (name, email, password, role) => {
        try {
            const response = await authAPI.signup({ name, email, password, role });

            if (response.success) {
                // If instructor, they can't login yet (pending verification)
                if (response.pendingVerification) {
                    return {
                        success: true,
                        pendingVerification: true,
                        message: response.message
                    };
                }
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                setUser(response.user);
                return { success: true, user: response.user };
            }
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message || 'Signup failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    const value = {
        user,
        loading,
        login,
        adminLogin,
        loginInstitute,
        signup,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isInstructor: user?.role === 'instructor',
        isStudent: user?.role === 'student',
        isInstitute: user?.role === 'institute'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

