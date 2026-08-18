import express from 'express';
import { Class, Course, Attendance, User, Enrollment, ClassNotes } from '../models/index.js';
import { authenticate, isInstructor, isStudent } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';

const router = express.Router();

// @route   GET /api/classes
// @desc    Get all classes or filter by course
// @access  Private
router.get('/', authenticate, async (req, res) => {
    try {
        const { courseId, upcoming } = req.query;
        const where = {};

        if (courseId) where.courseId = courseId;
        if (upcoming === 'true') {
            where.scheduledAt = { [Op.gte]: new Date() };
            where.status = 'scheduled';
        }

        const classes = await Class.findAll({
            where,
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'instructorId']
                }
            ],
            order: [['scheduledAt', 'ASC']]
        });

        res.json({
            success: true,
            count: classes.length,
            classes
        });
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching classes'
        });
    }
});

// @route   GET /api/classes/calendar
// @desc    Get calendar events, tasks and reminders for the authenticated instructor
// @access  Private
router.get('/calendar', authenticate, async (req, res) => {
    try {
        const { from, to } = req.query;
        const start = from ? new Date(from) : new Date();
        const end = to ? new Date(to) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 120);

        const classes = await Class.findAll({
            where: {
                scheduledAt: {
                    [Op.gte]: start,
                    [Op.lte]: end
                }
            },
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'instructorId']
                }
            ],
            order: [['scheduledAt', 'ASC']]
        });

        const instructorClasses = classes.filter(classItem => classItem.course && classItem.course.instructorId === req.user.id);

        const events = instructorClasses.map(classItem => ({
            id: `event-${classItem.id}`,
            type: 'event',
            title: classItem.title,
            description: classItem.description || 'Live class session',
            start: classItem.scheduledAt,
            end: new Date(new Date(classItem.scheduledAt).getTime() + (Number(classItem.duration || 60) * 60000)),
            courseId: classItem.courseId,
            courseTitle: classItem.course?.title || 'Course',
            allDay: false,
            status: classItem.status || 'scheduled'
        }));

        const tasks = instructorClasses.slice(0, 5).map(classItem => ({
            id: `task-${classItem.id}`,
            type: 'task',
            title: `Prepare ${classItem.title}`,
            description: `Review materials and planning notes for ${classItem.course?.title || 'this course'}`,
            date: new Date(classItem.scheduledAt),
            priority: 'medium',
            courseTitle: classItem.course?.title || 'Course'
        }));

        const reminders = instructorClasses.slice(0, 4).map(classItem => ({
            id: `reminder-${classItem.id}`,
            type: 'reminder',
            title: `Reminder: ${classItem.title}`,
            description: 'Class is approaching. Share the agenda and confirm the room setup.',
            date: new Date(new Date(classItem.scheduledAt).getTime() - 60 * 60 * 1000),
            courseTitle: classItem.course?.title || 'Course'
        }));

        res.json({
            success: true,
            events,
            tasks,
            reminders,
            count: events.length
        });
    } catch (error) {
        console.error('Get instructor calendar error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching instructor calendar'
        });
    }
});

// @route   GET /api/classes/:id
// @desc    Get single class details
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
    try {
        const classDetails = await Class.findByPk(req.params.id, {
            include: [
                {
                    model: Course,
                    as: 'course',
                    include: [
                        {
                            model: User,
                            as: 'instructor',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                },
                {
                    model: Attendance,
                    as: 'attendances',
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

        if (!classDetails) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.json({
            success: true,
            class: classDetails
        });
    } catch (error) {
        console.error('Get class error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching class details'
        });
    }
});

// @route   POST /api/classes
// @desc    Schedule new class
// @access  Private (Instructor only)
router.post('/', [
    authenticate,
    isInstructor,
    body('courseId').isInt().withMessage('Valid course ID is required'),
    body('title').trim().notEmpty().withMessage('Class title is required'),
    body('scheduledAt').isISO8601().withMessage('Valid date/time is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { courseId, title, description, scheduledAt, duration } = req.body;

        // Verify course exists and belongs to instructor
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
                message: 'You can only schedule classes for your own courses'
            });
        }

        // Generate meeting link (room ID)
        const meetingLink = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newClass = await Class.create({
            courseId,
            title,
            description,
            scheduledAt: new Date(scheduledAt),
            duration: duration || 60,
            meetingLink,
            status: 'scheduled'
        });

        res.status(201).json({
            success: true,
            message: 'Class scheduled successfully',
            class: newClass
        });
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({
            success: false,
            message: 'Error scheduling class'
        });
    }
});

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private (Instructor only - own courses)
router.put('/:id', [
    authenticate,
    isInstructor
], async (req, res) => {
    try {
        const classToUpdate = await Class.findByPk(req.params.id, {
            include: [
                {
                    model: Course,
                    as: 'course'
                }
            ]
        });

        if (!classToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check if user is the course instructor
        if (classToUpdate.course.instructorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update classes for your own courses'
            });
        }

        const { title, description, scheduledAt, duration, status } = req.body;

        await classToUpdate.update({
            title: title || classToUpdate.title,
            description: description !== undefined ? description : classToUpdate.description,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : classToUpdate.scheduledAt,
            duration: duration || classToUpdate.duration,
            status: status || classToUpdate.status
        });

        res.json({
            success: true,
            message: 'Class updated successfully',
            class: classToUpdate
        });
    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating class'
        });
    }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private (Instructor only - own courses)
router.delete('/:id', [
    authenticate,
    isInstructor
], async (req, res) => {
    try {
        const classToDelete = await Class.findByPk(req.params.id, {
            include: [
                {
                    model: Course,
                    as: 'course'
                }
            ]
        });

        if (!classToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check if user is the course instructor
        if (classToDelete.course.instructorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete classes for your own courses'
            });
        }

        await classToDelete.destroy();

        res.json({
            success: true,
            message: 'Class deleted successfully'
        });
    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting class'
        });
    }
});

// @route   POST /api/classes/:id/attend
// @desc    Mark attendance for a class
// @access  Private (Student only)
router.post('/:id/attend', [authenticate, isStudent], async (req, res) => {
    try {
        const classToAttend = await Class.findByPk(req.params.id);

        if (!classToAttend) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Only enrolled students should be able to mark attendance.
        const enrollment = await Enrollment.findOne({
            where: {
                studentId: req.user.id,
                courseId: classToAttend.courseId,
                status: {
                    [Op.ne]: 'dropped'
                }
            }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course to mark attendance'
            });
        }

        // Check if already marked attendance
        const existingAttendance = await Attendance.findOne({
            where: {
                classId: classToAttend.id,
                studentId: req.user.id
            }
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this class'
            });
        }

        const attendance = await Attendance.create({
            classId: classToAttend.id,
            studentId: req.user.id,
            joinedAt: new Date(),
            status: 'present'
        });

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            attendance
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking attendance'
        });
    }
});

// @route   POST /api/classes/:id/notes
// @desc    Save class notes and whiteboard
// @access  Private (Instructor only)
router.post('/:id/notes', [authenticate, isInstructor], async (req, res) => {
    try {
        const { noteContent, whiteboardData, summary } = req.body;
        
        const classRecord = await Class.findByPk(req.params.id, {
            include: [{ model: Course, as: 'course' }]
        });

        if (!classRecord) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        if (classRecord.course.instructorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only save notes for your own classes'
            });
        }

        // Check if notes already exist for this class
        let classNotes = await ClassNotes.findOne({
            where: { classId: req.params.id }
        });

        if (classNotes) {
            // Update existing notes
            await classNotes.update({
                noteContent: noteContent || classNotes.noteContent,
                whiteboardData: whiteboardData || classNotes.whiteboardData,
                summary: summary || classNotes.summary
            });
        } else {
            // Create new notes
            classNotes = await ClassNotes.create({
                classId: req.params.id,
                instructorId: req.user.id,
                noteContent,
                whiteboardData,
                summary
            });
        }

        res.json({
            success: true,
            message: 'Class notes saved successfully',
            notes: classNotes
        });
    } catch (error) {
        console.error('Save notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving class notes'
        });
    }
});

// @route   GET /api/classes/:id/notes
// @desc    Get class notes and whiteboard
// @access  Private
router.get('/:id/notes', authenticate, async (req, res) => {
    try {
        const classNotes = await ClassNotes.findOne({
            where: { classId: req.params.id },
            include: [
                { model: Class, as: 'class' },
                { model: User, as: 'instructor', attributes: ['id', 'name'] }
            ]
        });

        if (!classNotes) {
            return res.status(404).json({
                success: false,
                message: 'No notes found for this class'
            });
        }

        res.json({
            success: true,
            notes: classNotes
        });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving class notes'
        });
    }
});

// @route   PUT /api/classes/:id/status
// @desc    Update class status (scheduled, ongoing, completed, cancelled)
// @access  Private (Instructor only)
router.put('/:id/status', [authenticate, isInstructor], async (req, res) => {
    try {
        const { status } = req.body;

        if (!['scheduled', 'ongoing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const classRecord = await Class.findByPk(req.params.id, {
            include: [{ model: Course, as: 'course' }]
        });

        if (!classRecord) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        if (classRecord.course.instructorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update status for your own classes'
            });
        }

        await classRecord.update({ status });

        res.json({
            success: true,
            message: `Class status updated to ${status}`,
            class: classRecord
        });
    } catch (error) {
        console.error('Update class status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating class status'
        });
    }
});

export default router;
