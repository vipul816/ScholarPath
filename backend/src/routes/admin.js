import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User, Course, Enrollment, Class, Material, Institute, Program } from '../models/index.js';

const router = express.Router();

const getAdminCredentials = () => ({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
});

const authenticateAdmin = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No admin authentication token, access denied'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Admin token is invalid or expired'
        });
    }
};

// Admin login
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid admin email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;
        const adminCredentials = getAdminCredentials();

        if (!process.env.JWT_SECRET || !adminCredentials.email || !adminCredentials.password) {
            return res.status(500).json({
                success: false,
                message: 'Admin authentication is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD, and JWT_SECRET.'
            });
        }

        if (email.toLowerCase() === adminCredentials.email.toLowerCase() && password === adminCredentials.password) {
            const adminToken = jwt.sign(
                {
                    id: 0,
                    name: 'Administrator',
                    email: adminCredentials.email,
                    role: 'admin'
                },
                process.env.JWT_SECRET,
                { expiresIn: '12h' }
            );

            return res.json({
                success: true,
                message: 'Admin login successful',
                token: adminToken,
                user: {
                    id: 0,
                    name: 'Administrator',
                    email: adminCredentials.email,
                    role: 'admin'
                }
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid admin credentials'
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during admin login'
        });
    }
});

// Protect all admin routes except login
router.use(authenticateAdmin);

// Get platform statistics
router.get('/stats', async (req, res) => {
    try {
        const totalStudents = await User.count({ where: { role: 'student' } });
        const totalInstructors = await User.count({ where: { role: 'instructor', isVerified: true } });
        const pendingInstructors = await User.count({ where: { role: 'instructor', isVerified: false } });
        const totalCourses = await Course.count();
        const totalEnrollments = await Enrollment.count();
        const totalClasses = await Class.count();
        const totalMaterials = await Material.count();

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalInstructors,
                pendingInstructors,
                totalCourses,
                totalEnrollments,
                totalClasses,
                totalMaterials
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// Get all users with optional role filter
router.get('/users', async (req, res) => {
    try {
        const { role } = req.query;
        const where = {};

        if (role) {
            where.role = role;
        }

        const users = await User.findAll({
            where,
            attributes: ['id', 'name', 'email', 'role', 'isVerified', 'avatar', 'bio', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// Get pending (unverified) instructors
router.get('/pending-instructors', async (req, res) => {
    try {
        const instructors = await User.findAll({
            where: {
                role: 'instructor',
                isVerified: false
            },
            attributes: ['id', 'name', 'email', 'bio', 'qualification', 'experience', 'profession', 'instructorSummary', 'resumePath', 'createdAt'],
            order: [['createdAt', 'ASC']]
        });

        res.json({
            success: true,
            instructors
        });
    } catch (error) {
        console.error('Pending instructors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending instructors'
        });
    }
});

// Get user details with enrollments/courses
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'role', 'isVerified', 'avatar', 'bio', 'createdAt']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let additionalData = {};

        if (user.role === 'student') {
            // Get enrollments with course details
            const enrollments = await Enrollment.findAll({
                where: { studentId: id },
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'description'],
                    include: [{
                        model: User,
                        as: 'instructor',
                        attributes: ['id', 'name']
                    }]
                }]
            });
            additionalData.enrollments = enrollments;
        } else if (user.role === 'instructor') {
            // Get courses created by this instructor
            const courses = await Course.findAll({
                where: { instructorId: id },
                attributes: ['id', 'title', 'description', 'category', 'createdAt'],
                include: [{
                    model: Enrollment,
                    as: 'enrollments',
                    attributes: ['id']
                }]
            });

            // Add enrollment count to each course
            additionalData.courses = courses.map(course => ({
                ...course.toJSON(),
                enrollmentCount: course.enrollments?.length || 0
            }));
        }

        res.json({
            success: true,
            user: {
                ...user.toJSON(),
                ...additionalData
            }
        });
    } catch (error) {
        console.error('User details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details'
        });
    }
});

// Verify an instructor
router.put('/verify-instructor/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const instructor = await User.findOne({
            where: {
                id,
                role: 'instructor'
            }
        });

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        if (instructor.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Instructor is already verified'
            });
        }

        await instructor.update({ isVerified: true });

        res.json({
            success: true,
            message: 'Instructor verified successfully',
            instructor: {
                id: instructor.id,
                name: instructor.name,
                email: instructor.email,
                isVerified: true
            }
        });
    } catch (error) {
        console.error('Verify instructor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying instructor'
        });
    }
});

// Reject an instructor with optional comment
router.post('/reject-instructor/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        const instructor = await User.findOne({
            where: {
                id,
                role: 'instructor',
                isVerified: false
            }
        });

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Pending instructor not found'
            });
        }

        // Store rejection comment and mark as rejected (or delete)
        const instructorName = instructor.name;
        const instructorEmail = instructor.email;

        // Option: Delete the instructor account
        await instructor.destroy();

        res.json({
            success: true,
            message: `Instructor "${instructorName}" has been rejected`,
            rejectedInstructor: {
                name: instructorName,
                email: instructorEmail,
                rejectionComment: comment || null
            }
        });
    } catch (error) {
        console.error('Reject instructor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting instructor'
        });
    }
});

// Get all students with their enrollment details
router.get('/students', async (req, res) => {
    try {
        const students = await User.findAll({
            where: { role: 'student' },
            attributes: ['id', 'name', 'email', 'avatar', 'bio', 'createdAt'],
            include: [{
                model: Enrollment,
                as: 'enrollments',
                attributes: ['id', 'progress', 'createdAt'],
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            students: students.map(student => ({
                ...student.toJSON(),
                enrollmentCount: student.enrollments?.length || 0
            }))
        });
    } catch (error) {
        console.error('Students fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students'
        });
    }
});

// Get all verified instructors with their courses
router.get('/instructors', async (req, res) => {
    try {
        const instructors = await User.findAll({
            where: {
                role: 'instructor',
                isVerified: true
            },
            attributes: ['id', 'name', 'email', 'avatar', 'bio', 'createdAt'],
            include: [{
                model: Course,
                as: 'courses',
                attributes: ['id', 'title', 'category', 'createdAt']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            instructors: instructors.map(instructor => ({
                ...instructor.toJSON(),
                courseCount: instructor.courses?.length || 0
            }))
        });
    } catch (error) {
        console.error('Instructors fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching instructors'
        });
    }
});

// ============= INSTITUTE MANAGEMENT ENDPOINTS =============

// Get pending institutes
router.get('/pending-institutes', async (req, res) => {
    try {
        const institutes = await Institute.findAll({
            where: {
                isVerified: false
            },
            attributes: ['id', 'name', 'email', 'instituteType', 'adminName', 'adminEmail', 'description', 'contactNumber', 'createdAt'],
            order: [['createdAt', 'ASC']]
        });

        res.json({
            success: true,
            institutes
        });
    } catch (error) {
        console.error('Pending institutes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending institutes'
        });
    }
});

// Get all verified institutes
router.get('/institutes', async (req, res) => {
    try {
        const institutes = await Institute.findAll({
            where: {
                isVerified: true
            },
            attributes: ['id', 'name', 'email', 'instituteType', 'adminName', 'logo', 'createdAt'],
            include: [{
                model: Program,
                as: 'programs',
                attributes: ['id', 'title']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            institutes: institutes.map(inst => ({
                ...inst.toJSON(),
                programCount: inst.programs?.length || 0
            }))
        });
    } catch (error) {
        console.error('Institutes fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching institutes'
        });
    }
});

// Verify an institute
router.put('/verify-institute/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const institute = await Institute.findOne({
            where: {
                id,
                isVerified: false
            }
        });

        if (!institute) {
            return res.status(404).json({
                success: false,
                message: 'Pending institute not found'
            });
        }

        await institute.update({ isVerified: true });

        res.json({
            success: true,
            message: 'Institute verified successfully',
            institute: {
                id: institute.id,
                name: institute.name,
                email: institute.email,
                isVerified: true
            }
        });
    } catch (error) {
        console.error('Verify institute error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying institute'
        });
    }
});

// Reject an institute
router.post('/reject-institute/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        const institute = await Institute.findOne({
            where: {
                id,
                isVerified: false
            }
        });

        if (!institute) {
            return res.status(404).json({
                success: false,
                message: 'Pending institute not found'
            });
        }

        const instituteName = institute.name;
        const instituteEmail = institute.email;

        // Delete the institute account
        await institute.destroy();

        res.json({
            success: true,
            message: `Institute "${instituteName}" has been rejected`,
            rejectedInstitute: {
                name: instituteName,
                email: instituteEmail,
                rejectionComment: comment || null
            }
        });
    } catch (error) {
        console.error('Reject institute error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting institute'
        });
    }
});

export default router;
