import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { Program, Institute, ProgramEnrollment, User, InstructorInstitute } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Ensure upload directory exists
const thumbnailsDir = path.join(process.cwd(), 'backend', 'uploads', 'program-thumbnails');
fs.mkdirSync(thumbnailsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, thumbnailsDir);
    },
    filename: function (req, file, cb) {
        const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, safeName);
    }
});

const imageFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed for thumbnails'), false);
    } else {
        cb(null, true);
    }
};

const upload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Middleware to check institute ownership
const checkInstituteOwnership = async (req, res, next) => {
    try {
        if (req.user.role !== 'institute') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only institutes can access this resource.'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error checking authorization' });
    }
};

// @route   POST /api/programs
// @desc    Create a new program
// @access  Private (Institute only)
router.post('/', authenticate, checkInstituteOwnership, upload.single('thumbnail'), [
    body('title').trim().isLength({ min: 3 }).withMessage('Program title must be at least 3 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('duration').trim().notEmpty().withMessage('Duration is required'),
    body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { 
            title, 
            description, 
            category, 
            duration, 
            level, 
            maxEnrollments,
            coordinator,
            instructors,
            syllabus,
            schedule,
            enrollmentOpen
        } = req.body;

        // If a file was uploaded, construct thumbnail URL
        let thumbnailPath = null;
        if (req.file) {
            // Public URL served from /uploads
            thumbnailPath = `/uploads/program-thumbnails/${req.file.filename}`;
        }

        console.log('📚 Creating program:', { title, coordinator, instructorsCount: instructors?.length });

        const program = await Program.create({
            title,
            description,
            category,
            duration,
            level,
            thumbnail: thumbnailPath || req.body.thumbnail || 'https://via.placeholder.com/400x225/6366F1/FFFFFF?text=Program',
            maxEnrollments: maxEnrollments || null,
            coordinator: coordinator || null,
            instructors: (instructors && instructors.length > 0) ? instructors : null,
            syllabus: syllabus || null,
            schedule: schedule || null,
            enrollmentOpen: enrollmentOpen !== undefined ? enrollmentOpen : true,
            instituteId: req.user.id
        });

        console.log('✅ Program created successfully:', program.id);

        res.status(201).json({
            success: true,
            message: 'Program created successfully',
            program
        });
    } catch (error) {
        console.error('❌ Create program error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating program',
            error: error.message
        });
    }
});

// @route   GET /api/programs
// @desc    Get programs (all if admin, by institute if institute, by enrollment if student)
// @access  Public/Private
router.get('/', authenticate, async (req, res) => {
    try {
        let programs = [];

        if (req.user.role === 'institute') {
            // Get all programs of the institute
            programs = await Program.findAll({
                where: { instituteId: req.user.id },
                include: [{
                    model: Institute,
                    as: 'institute',
                    attributes: ['id', 'name', 'logo']
                }, {
                    model: ProgramEnrollment,
                    as: 'enrollments',
                    attributes: ['id']
                }],
                order: [['createdAt', 'DESC']]
            });
        } else if (req.user.role === 'admin') {
            // Get all programs
            programs = await Program.findAll({
                include: [{
                    model: Institute,
                    as: 'institute',
                    attributes: ['id', 'name', 'logo']
                }, {
                    model: ProgramEnrollment,
                    as: 'enrollments',
                    attributes: ['id']
                }],
                order: [['createdAt', 'DESC']]
            });
        } else {
            // Get all published programs for students
            programs = await Program.findAll({
                where: { isPublished: true },
                include: [{
                    model: Institute,
                    as: 'institute',
                    attributes: ['id', 'name', 'logo']
                }],
                order: [['createdAt', 'DESC']]
            });
        }

        // Add enrollment count
        programs = programs.map(p => ({
            ...p.toJSON(),
            enrollmentCount: p.enrollments?.length || 0
        }));

        res.json({
            success: true,
            programs
        });
    } catch (error) {
        console.error('Get programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching programs',
            error: error.message
        });
    }
});

// @route   GET /api/programs/:id
// @desc    Get program details
// @access  Public
router.get('/:id', [param('id').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const program = await Program.findByPk(req.params.id, {
            include: [{
                model: Institute,
                as: 'institute',
                attributes: ['id', 'name', 'logo', 'description']
            }, {
                model: ProgramEnrollment,
                as: 'enrollments',
                attributes: ['id', 'studentId', 'progress']
            }]
        });

        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        res.json({
            success: true,
            program: {
                ...program.toJSON(),
                enrollmentCount: program.enrollments?.length || 0
            }
        });
    } catch (error) {
        console.error('Get program error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching program',
            error: error.message
        });
    }
});

// @route   PUT /api/programs/:id
// @desc    Update program
// @access  Private (Institute only)
router.put('/:id', authenticate, checkInstituteOwnership, upload.single('thumbnail'), [param('id').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const program = await Program.findByPk(req.params.id);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        // Check ownership
        if (program.instituteId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this program'
            });
        }

        const { title, description, category, duration, level, isPublished, enrollmentOpen, maxEnrollments } = req.body;

        if (title) program.title = title;
        if (description) program.description = description;
        if (category) program.category = category;
        if (duration) program.duration = duration;
        if (level) program.level = level;
        // If a new file was uploaded, use its path
        if (req.file) {
            program.thumbnail = `/uploads/program-thumbnails/${req.file.filename}`;
        } else if (req.body.thumbnail) {
            program.thumbnail = req.body.thumbnail;
        }
        if (isPublished !== undefined) program.isPublished = isPublished;
        if (enrollmentOpen !== undefined) program.enrollmentOpen = enrollmentOpen;
        if (maxEnrollments !== undefined) program.maxEnrollments = maxEnrollments;

        await program.save();

        res.json({
            success: true,
            message: 'Program updated successfully',
            program
        });
    } catch (error) {
        console.error('Update program error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating program',
            error: error.message
        });
    }
});

// @route   DELETE /api/programs/:id
// @desc    Delete program
// @access  Private (Institute only)
router.delete('/:id', authenticate, checkInstituteOwnership, [param('id').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const program = await Program.findByPk(req.params.id);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        // Check ownership
        if (program.instituteId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this program'
            });
        }

        await program.destroy();

        res.json({
            success: true,
            message: 'Program deleted successfully'
        });
    } catch (error) {
        console.error('Delete program error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting program',
            error: error.message
        });
    }
});

export default router;
