import express from 'express';
import { Announcement, Course, User } from '../models/index.js';
import { authenticate, isInstructor } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// @route   GET /api/announcements/course/:courseId
// @desc    Get all announcements for a course
// @access  Private
router.get('/course/:courseId', authenticate, async (req, res) => {
    try {
        const announcements = await Announcement.findAll({
            where: { courseId: req.params.courseId },
            include: [
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: announcements.length,
            announcements
        });
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching announcements'
        });
    }
});

// @route   POST /api/announcements
// @desc    Create a new announcement
// @access  Private (Instructor only)
router.post('/', [
    authenticate,
    isInstructor,
    body('courseId').isInt().withMessage('Course ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { courseId, title, content } = req.body;

        // Verify the instructor owns the course
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (course.instructorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only post announcements for your own courses'
            });
        }

        const announcement = await Announcement.create({
            courseId,
            instructorId: req.user.id,
            title,
            content
        });

        // Fetch the announcement with instructor info
        const fullAnnouncement = await Announcement.findByPk(announcement.id, {
            include: [
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            announcement: fullAnnouncement
        });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating announcement'
        });
    }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
// @access  Private (Instructor only)
router.delete('/:id', [authenticate, isInstructor], async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        if (announcement.instructorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own announcements'
            });
        }

        await announcement.destroy();

        res.json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting announcement'
        });
    }
});

export default router;
