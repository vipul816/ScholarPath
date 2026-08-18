import express from 'express';
import { Op } from 'sequelize';
import { Course, User, Enrollment, Class, Material } from '../models/index.js';
import { authenticate, isInstructor, isStudent } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { generateCertificate } from '../utils/certificateGenerator.js';

const router = express.Router();

// IMPORTANT: Place specific routes BEFORE parameterized routes to avoid :id matching /my/*

// @route   GET /api/courses/my/enrolled
// @desc    Get user's enrolled courses
// @access  Private (Student only)
router.get('/my/enrolled', [
    authenticate,
    isStudent
], async (req, res) => {
    try {
        const enrollments = await Enrollment.findAll({
            where: { studentId: req.user.id },
            include: [
                {
                    model: Course,
                    as: 'course',
                    include: [
                        {
                            model: User,
                            as: 'instructor',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: enrollments.length,
            enrollments
        });
    } catch (error) {
        console.error('Get enrolled courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching enrolled courses'
        });
    }
});

// @route   GET /api/courses/my/teaching
// @desc    Get instructor's courses
// @access  Private (Instructor only)
router.get('/my/teaching', [
    authenticate,
    isInstructor
], async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { instructorId: req.user.id },
            include: [
                {
                    model: Enrollment,
                    as: 'enrollments',
                    attributes: ['id', 'studentId']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error('Get teaching courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teaching courses'
        });
    }
});

// @route   GET /api/courses
// @desc    Get all courses (with optional filters)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, level, search } = req.query;
        const where = { isPublished: true };

        if (category) where.category = category;
        if (level) where.level = level;
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const courses = await Course.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching courses'
        });
    }
});

// @route   GET /api/courses/:id
// @desc    Get single course details
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'email', 'bio']
                },
                {
                    model: Class,
                    as: 'classes',
                    order: [['scheduledAt', 'ASC']]
                },
                {
                    model: Material,
                    as: 'materials',
                    order: [['createdAt', 'DESC']]
                },
                {
                    model: Enrollment,
                    as: 'enrollments',
                    include: [
                        {
                            model: User,
                            as: 'student',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            course
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching course details'
        });
    }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Instructor only)
router.post('/', [
    authenticate,
    isInstructor,
    body('title').trim().notEmpty().withMessage('Course title is required'),
    body('description').trim().notEmpty().withMessage('Course description is required'),
    body('category').trim().notEmpty().withMessage('Category is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { title, description, category, duration, level, thumbnail } = req.body;

        const course = await Course.create({
            title,
            description,
            category,
            duration,
            level: level || 'Beginner',
            thumbnail,
            instructorId: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating course'
        });
    }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Instructor only - own courses)
router.put('/:id', [
    authenticate,
    isInstructor
], async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is the course instructor
        if (course.instructorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own courses'
            });
        }

        const { title, description, category, duration, level, thumbnail, isPublished, enrollmentOpen } = req.body;

        await course.update({
            title: title || course.title,
            description: description || course.description,
            category: category || course.category,
            duration: duration || course.duration,
            level: level || course.level,
            thumbnail: thumbnail || course.thumbnail,
            isPublished: isPublished !== undefined ? isPublished : course.isPublished,
            enrollmentOpen: enrollmentOpen !== undefined ? enrollmentOpen : course.enrollmentOpen
        });

        res.json({
            success: true,
            message: 'Course updated successfully',
            course
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating course'
        });
    }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Instructor only - own courses)
router.delete('/:id', [
    authenticate,
    isInstructor
], async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is the course instructor
        if (course.instructorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own courses'
            });
        }

        await course.destroy();

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting course'
        });
    }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private (Student only)
router.post('/:id/enroll', [
    authenticate,
    isStudent
], async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if enrollment is open
        if (!course.enrollmentOpen) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment is closed for this course'
            });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            where: {
                studentId: req.user.id,
                courseId: course.id
            }
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'You are already enrolled in this course'
            });
        }

        const enrollment = await Enrollment.create({
            studentId: req.user.id,
            courseId: course.id
        });

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in course',
            enrollment
        });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error enrolling in course'
        });
    }
});



// @route   POST /api/courses/:id/progress
// @desc    Update course progress and map completion to a certificate
// @access  Private (Student only)
router.post('/:id/progress', [
    authenticate,
    isStudent
], async (req, res) => {
    try {
        const { id } = req.params;
        let { progress } = req.body;

        const course = await Course.findByPk(id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const enrollment = await Enrollment.findOne({
            where: {
                studentId: req.user.id,
                courseId: course.id
            }
        });

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        // Parse progress if provided or default to marking completion 
        progress = progress !== undefined ? Math.min(Math.max(parseInt(progress, 10), 0), 100) : enrollment.progress;
        
        enrollment.progress = progress;

        // If progress hits 100, trigger completion & certificate logic
        if (progress === 100 && enrollment.status !== 'completed') {
            enrollment.status = 'completed';
            
            try {
                const destPath = `uploads/certificates/${enrollment.id}.pdf`;
                await generateCertificate(req.user.name, course.title, new Date(), destPath);
                // Save the path to reference it later
                enrollment.certificateUrl = `/${destPath}`;
            } catch (certError) {
                console.error("Certificate generation error:", certError);
                // Still allow progress to be set even if cert generation fails, or handle differently
            }
        }

        await enrollment.save();

        res.json({
            success: true,
            message: 'Progress updated',
            enrollment
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating progress'
        });
    }
});

export default router;
