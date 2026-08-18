import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import InstituteLogin from './pages/InstituteLogin';
import InstituteSignup from './pages/InstituteSignup';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import InstituteDashboard from './pages/InstituteDashboard';
import CourseBrowser from './pages/CourseBrowser';
import CourseDetails from './pages/CourseDetails';
import LiveClass from './pages/LiveClass';
import CreateCourse from './pages/CreateCourse';
import InstructorManageCourses from './pages/InstructorManageCourses';
import InstructorCalendarPage from './pages/InstructorCalendarPage';
import InstructorCourseView from './pages/InstructorCourseView';
import StudentCourseView from './pages/StudentCourseView';
import OAuthCallback from './pages/OAuthCallback';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import WelcomePage from './pages/WelcomePage';
//This file deals with route mapping

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen bg-gray-50">
                    <Routes>
                        {/* Public Routes */}
                        
                        <Route path="/" element={<WelcomePage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/institute-login" element={<InstituteLogin />} />
                        <Route path="/institute-signup" element={<InstituteSignup />} />
                        <Route path="/oauth-callback" element={<OAuthCallback />} />
                        <Route path="/admin-login" element={<AdminLogin />} />

                        {/* Admin Routes */}
                       
                        <Route path="/admin" element={
                            <ProtectedRoute requireRole="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />

                        {/* Protected Routes */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Navbar />
                                <div className="pt-4">
                                    <Navigate to="/dashboard" replace />
                                </div>
                            </ProtectedRoute>
                        } />

                        {/* Profile Routes */}
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Navbar />
                                <Profile />
                            </ProtectedRoute>
                        } />
                        <Route path="/profile/edit" element={
                            <ProtectedRoute>
                                <Navbar />
                                <EditProfile />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard" element={
                            <ProtectedRoute requireRole="student">
                                <Navbar />
                                <StudentDashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/instructor" element={
                            <ProtectedRoute requireRole="instructor">
                                <Navbar />
                                <InstructorDashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/instructor/calendar" element={
                            <ProtectedRoute requireRole="instructor">
                                <Navbar />
                                <InstructorCalendarPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/instructor/manage-courses" element={
                            <ProtectedRoute requireRole="instructor">
                                <Navbar />
                                <InstructorManageCourses />
                            </ProtectedRoute>
                        } />

                        <Route path="/institute-dashboard" element={
                            <ProtectedRoute requireRole="institute">
                                <Navbar />
                                <InstituteDashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/courses/create" element={
                            <ProtectedRoute requireRole="instructor">
                                <Navbar />
                                <CreateCourse />
                            </ProtectedRoute>
                        } />

                        <Route path="/courses" element={
                            <ProtectedRoute>
                                <Navbar />
                                <CourseBrowser />
                            </ProtectedRoute>
                        } />

                        <Route path="/courses/:id" element={
                            <ProtectedRoute>
                                <Navbar />
                                <CourseDetails />
                            </ProtectedRoute>
                        } />

                        <Route path="/class/:id" element={
                            <ProtectedRoute>
                                <LiveClass />
                            </ProtectedRoute>
                        } />

                        {/* Instructor Course Management */}
                        <Route path="/courses/:id/manage" element={
                            <ProtectedRoute requireRole="instructor">
                                <Navbar />
                                <InstructorCourseView />
                            </ProtectedRoute>
                        } />

                        {/* Student Course Learning */}
                        <Route path="/courses/:id/learn" element={
                            <ProtectedRoute requireRole="student">
                                <Navbar />
                                <StudentCourseView />
                            </ProtectedRoute>
                        } />

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
