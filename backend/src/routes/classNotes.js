import express from 'express';
import { authenticate, isInstructor } from '../middleware/auth.js';
import { Class, ClassNotes, User } from '../models/index.js';

const router = express.Router();

// Save or update class notes
router.post('/:classId/notes', authenticate, isInstructor, async (req, res) => {
    try {
        const { classId } = req.params;
        const { noteContent, whiteboardData, summary } = req.body;
        const instructorId = req.user.id;

        // Verify the class belongs to this instructor
        const classRecord = await Class.findByPk(classId);
        if (!classRecord) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Verify instructor owns this class's course
        const instructorCourse = await classRecord.getCourse();
        if (instructorCourse.instructorId !== instructorId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You do not own this class'
            });
        }

        // Find or create ClassNotes record
        let notes = await ClassNotes.findOne({
            where: { classId }
        });

        if (notes) {
            // Update existing notes
            notes.noteContent = noteContent || notes.noteContent;
            notes.whiteboardData = whiteboardData || notes.whiteboardData;
            notes.summary = summary || notes.summary;
            await notes.save();
        } else {
            // Create new notes record
            notes = await ClassNotes.create({
                classId,
                instructorId,
                noteContent,
                whiteboardData,
                summary
            });
        }

        return res.json({
            success: true,
            message: 'Class notes saved successfully',
            item: notes
        });
    } catch (error) {
        console.error('Error saving class notes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save class notes',
            error: error.message
        });
    }
});

// Get class notes
router.get('/:classId/notes', authenticate, async (req, res) => {
    try {
        const { classId } = req.params;

        const notes = await ClassNotes.findOne({
            where: { classId },
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'title', 'scheduledAt']
                },
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        if (!notes) {
            return res.status(404).json({
                success: false,
                message: 'No notes found for this class'
            });
        }

        return res.json({
            success: true,
            item: notes
        });
    } catch (error) {
        console.error('Error retrieving class notes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve class notes',
            error: error.message
        });
    }
});

// Delete class notes
router.delete('/:classId/notes', authenticate, isInstructor, async (req, res) => {
    try {
        const { classId } = req.params;
        const instructorId = req.user.id;

        // Verify the class belongs to this instructor
        const classRecord = await Class.findByPk(classId);
        if (!classRecord) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Verify instructor owns this class's course
        const instructorCourse = await classRecord.getCourse();
        if (instructorCourse.instructorId !== instructorId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You do not own this class'
            });
        }

        const notes = await ClassNotes.findOne({
            where: { classId }
        });

        if (!notes) {
            return res.status(404).json({
                success: false,
                message: 'No notes found for this class'
            });
        }

        await notes.destroy();

        return res.json({
            success: true,
            message: 'Class notes deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting class notes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete class notes',
            error: error.message
        });
    }
});

export default router;
