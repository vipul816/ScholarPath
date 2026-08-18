import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: '/api', // Proxied through Vite
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Let browser set multipart boundaries for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

// Auth APIs
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    // `getProfile` used by UI should return current authenticated user data.
    // Backend exposes this at `/auth/me` so point `getProfile` to that.
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data)
};

// Course APIs
export const courseAPI = {
    getAll: (params) => api.get('/courses', { params }),
    getById: (id) => api.get(`/courses/${id}`),
    create: (data) => api.post('/courses', data),
    update: (id, data) => api.put(`/courses/${id}`, data),
    delete: (id) => api.delete(`/courses/${id}`),
    enroll: (id) => api.post(`/courses/${id}/enroll`),
    getEnrolled: () => api.get('/courses/my/enrolled'),
    getTeaching: () => api.get('/courses/my/teaching'),
    updateProgress: (id, progress) => api.post(`/courses/${id}/progress`, { progress })
};

// Class APIs
export const classAPI = {
    getAll: (params) => api.get('/classes', { params }),
    getCalendar: (params) => api.get('/classes/calendar', { params }),
    getById: (id) => api.get(`/classes/${id}`),
    create: (data) => api.post('/classes', data),
    update: (id, data) => api.put(`/classes/${id}`, data),
    delete: (id) => api.delete(`/classes/${id}`),
    markAttendance: (id) => api.post(`/classes/${id}/attend`),
    saveNotes: (id, data) => api.post(`/classes/${id}/notes`, data),
    getNotes: (id) => api.get(`/classes/${id}/notes`),
    deleteNotes: (id) => api.delete(`/classes/${id}/notes`),
    updateStatus: (id, status) => api.put(`/classes/${id}/status`, { status })
};

// Material APIs
export const materialAPI = {
    getByCourse: (courseId) => api.get(`/materials/course/${courseId}`),
    create: (data) => api.post('/materials', data),
    delete: (id) => api.delete(`/materials/${id}`)
};

// Announcement APIs
export const announcementAPI = {
    getByCourse: (courseId) => api.get(`/announcements/course/${courseId}`),
    create: (data) => api.post('/announcements', data),
    delete: (id) => api.delete(`/announcements/${id}`)
};

// Discussion APIs
export const discussionAPI = {
    getByCourse: (courseId) => api.get(`/discussions/course/${courseId}`),
    create: (data) => api.post('/discussions', data),
    delete: (id) => api.delete(`/discussions/${id}`)
};

// Admin APIs
export const adminAPI = {
    login: (data) => api.post('/admin/login', data),
    getStats: () => api.get('/admin/stats'),
    getUsers: (role) => api.get('/admin/users', { params: { role } }),
    getUserDetails: (id) => api.get(`/admin/users/${id}`),
    getPendingInstructors: () => api.get('/admin/pending-instructors'),
    verifyInstructor: (id) => api.put(`/admin/verify-instructor/${id}`),
    rejectInstructor: (id, comment) => api.post(`/admin/reject-instructor/${id}`, { comment }),
    getStudents: () => api.get('/admin/students'),
    getInstructors: () => api.get('/admin/instructors'),
    getPendingInstitutes: () => api.get('/admin/pending-institutes'),
    verifyInstitute: (id) => api.put(`/admin/verify-institute/${id}`),
    rejectInstitute: (id, comment) => api.post(`/admin/reject-institute/${id}`, { comment })
};

// Assignment APIs
export const assignmentAPI = {
    getByCourse: (courseId) => api.get(`/assignments/course/${courseId}`),
    create: (data) => api.post('/assignments', data),
    submit: (id, formData) => api.post(`/assignments/${id}/submit`, formData, {
        // Axios handles FormData internally, intercepter handles cleanup
    }),
    getSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
    grade: (id, submissionId, data) => api.put(`/assignments/${id}/grade/${submissionId}`, data)
};

// Institute APIs
export const instituteAPI = {
    signup: (data) => api.post('/institute/signup', data),
    login: (data) => api.post('/institute/login', data),
    getProfile: () => api.get('/institute/profile'),
    updateProfile: (data) => api.put('/institute/profile', data)
};

// Program APIs
export const programAPI = {
    create: (data) => api.post('/programs', data),
    getAll: () => api.get('/programs'),
    update: (id, data) => api.put(`/programs/${id}`, data),
    delete: (id) => api.delete(`/programs/${id}`)
};

// Membership APIs
export const membershipAPI = {
    requestJoin: (data) => api.post('/membership/request-join', data),
    getMyInstitutes: () => api.get('/membership/my-institutes'),
    getPendingRequests: () => api.get('/membership/pending-requests'),
    approveRequest: (id) => api.put(`/membership/approve/${id}`),
    rejectRequest: (id) => api.put(`/membership/reject/${id}`),
    enrollProgram: (data) => api.post('/membership/enroll-program', data),
    getMyPrograms: () => api.get('/membership/my-programs'),
    updateProgramProgress: (enrollmentId, data) => api.put(`/membership/program-progress/${enrollmentId}`, data)
};

export default api;
