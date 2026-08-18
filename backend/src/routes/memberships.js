import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { InstructorInstitute, ProgramEnrollment, Program, User, Institute } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ============= INSTRUCTOR-INSTITUTE MEMBERSHIP ROUTES =============

// @route   POST /api/membership/request-join
// @desc    Instructor requests to join an institute
// @access  Private (Instructor only)
router.post('/request-join', authenticate, [
    body('instituteId').isInt().withMessage('Valid institute ID is required')
], async (req, res) => {
    try {
        if (req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Only instructors can request to join institutes'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { instituteId } = req.body;

        // Check if institute exists
        const institute = await Institute.findByPk(instituteId);
        if (!institute) {
            return res.status(404).json({
                success: false,
                message: 'Institute not found'
            });
        }

        // Check if already a member
        const existing = await InstructorInstitute.findOne({
            where: {
                instructorId: req.user.id,
                instituteId
            }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: `You are already ${existing.status} with this institute`
            });
        }

        // Create membership request
        const membership = await InstructorInstitute.create({
            instructorId: req.user.id,
            instituteId,
            status: 'pending',
            joinedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Your request to join the institute has been sent. Waiting for approval.',
            membership
        });
    } catch (error) {
        console.error('Request join error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending join request',
            error: error.message
        });
    }
});

// @route   GET /api/membership/my-institutes
// @desc    Get institutes where instructor is member
// @access  Private (Instructor only)
router.get('/my-institutes', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Only instructors can access this resource'
            });
        }

        const memberships = await InstructorInstitute.findAll({
            where: { instructorId: req.user.id },
            include: [{
                model: Institute,
                as: 'institute',
                attributes: ['id', 'name', 'logo', 'instituteType']
            }]
        });

        res.json({
            success: true,
            memberships
        });
    } catch (error) {
        console.error('Get institutes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching institutes',
            error: error.message
        });
    }
});

// @route   GET /api/membership/pending-requests
// @desc    Get pending instructor join requests for institute
// @access  Private (Institute only)
router.get('/pending-requests', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'institute') {
            return res.status(403).json({
                success: false,
                message: 'Only institutes can access this resource'
            });
        }

        const pendingRequests = await InstructorInstitute.findAll({
            where: {
                instituteId: req.user.id,
                status: 'pending'
            },
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'email', 'avatar', 'profession', 'bio']
            }]
        });

        res.json({
            success: true,
            pendingRequests
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending requests',
            error: error.message
        });
    }
});

// @route   PUT /api/membership/approve/:id
// @desc    Approve instructor join request
// @access  Private (Institute only)
router.put('/approve/:id', authenticate, [param('id').isInt()], async (req, res) => {
    try {
        if (req.user.role !== 'institute') {
            return res.status(403).json({
                success: false,
                message: 'Only institutes can approve requests'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const membership = await InstructorInstitute.findByPk(req.params.id);
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership request not found'
            });
        }

        // Check ownership
        if (membership.instituteId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to approve this request'
            });
        }

        membership.status = 'approved';
        membership.approvedAt = new Date();
        await membership.save();

        res.json({
            success: true,
            message: 'Instructor approved successfully',
            membership
        });
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving request',
            error: error.message
        });
    }
});

// @route   PUT /api/membership/reject/:id
// @desc    Reject instructor join request
// @access  Private (Institute only)
router.put('/reject/:id', authenticate, [param('id').isInt()], async (req, res) => {
    try {
        if (req.user.role !== 'institute') {
            return res.status(403).json({
                success: false,
                message: 'Only institutes can reject requests'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const membership = await InstructorInstitute.findByPk(req.params.id);
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership request not found'
            });
        }

        // Check ownership
        if (membership.instituteId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to reject this request'
            });
        }

        await membership.destroy();

        res.json({
            success: true,
            message: 'Instructor request rejected successfully'
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting request',
            error: error.message
        });
    }
});

// ============= PROGRAM ENROLLMENT ROUTES =============

// @route   POST /api/membership/enroll-program
// @desc    Student enrolls in a program
// @access  Private (Student only)
router.post('/enroll-program', authenticate, [
    body('programId').isInt().withMessage('Valid program ID is required')
], async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can enroll in programs'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { programId } = req.body;

        // Check if program exists
        const program = await Program.findByPk(programId);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        // Check if enrollment open
        if (!program.enrollmentOpen) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment for this program is currently closed'
            });
        }

        // Check max enrollments
        if (program.maxEnrollments) {
            const currentEnrollments = await ProgramEnrollment.count({
                where: { programId }
            });
            if (currentEnrollments >= program.maxEnrollments) {
                return res.status(400).json({
                    success: false,
                    message: 'Program has reached maximum enrollment capacity'
                });
            }
        }

        // Check if already enrolled
        const existing = await ProgramEnrollment.findOne({
            where: {
                studentId: req.user.id,
                programId
            }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'You are already enrolled in this program'
            });
        }

        // Create enrollment
        const enrollment = await ProgramEnrollment.create({
            studentId: req.user.id,
            programId,
            progress: 0,
            status: 'active'
        });

        res.status(201).json({
            success: true,
            message: 'Enrolled in program successfully',
            enrollment
        });
    } catch (error) {
        console.error('Enroll program error:', error);
        res.status(500).json({
            success: false,
            message: 'Error enrolling in program',
            error: error.message
        });
    }
});

// @route   GET /api/membership/my-programs
// @desc    Get programs where student is enrolled
// @access  Private (Student only)
router.get('/my-programs', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can access this resource'
            });
        }

        const enrollments = await ProgramEnrollment.findAll({
            where: { studentId: req.user.id },
            include: [{
                model: Program,
                as: 'program',
                include: [{
                    model: Institute,
                    as: 'institute',
                    attributes: ['id', 'name', 'logo']
                }]
            }]
        });

        res.json({
            success: true,
            enrollments
        });
    } catch (error) {
        console.error('Get programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching program enrollments',
            error: error.message
        });
    }
});

// @route   PUT /api/membership/program-progress/:enrollmentId
// @desc    Update student progress in program
// @access  Private (Institute only)
router.put('/program-progress/:enrollmentId', authenticate, [
    param('enrollmentId').isInt(),
    body('progress').isInt({ min: 0, max: 100 })
], async (req, res) => {
    try {
        if (req.user.role !== 'institute') {
            return res.status(403).json({
                success: false,
                message: 'Only institutes can update progress'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { progress } = req.body;
        const enrollment = await ProgramEnrollment.findByPk(req.params.enrollmentId, {
            include: [{
                model: Program,
                as: 'program'
            }]
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        // Check if institute owns the program
        if (enrollment.program.instituteId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this enrollment'
            });
        }

        enrollment.progress = progress;
        if (progress === 100) {
            enrollment.status = 'completed';
        }
        await enrollment.save();

        res.json({
            success: true,
            message: 'Progress updated successfully',
            enrollment
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating progress',
            error: error.message
        });
    }
});

export default router;
