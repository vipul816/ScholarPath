import express from 'express';
import { Material, Course } from '../models/index.js';
import { authenticate, isInstructor } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { uploadVideo } from '../middleware/upload.js';
import { transcodeToHLS } from '../utils/transcoder.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = express.Router();

// @route   GET /api/materials/course/:courseId
// @desc    Get all materials for a course
// @access  Private
router.get('/course/:courseId', authenticate, async (req, res) => {
    try {
        const materials = await Material.findAll({
            where: { courseId: req.params.courseId },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: materials.length,
            materials
        });
    } catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching materials'
        });
    }
});

// @route   POST /api/materials
// @desc    Upload course material (supports direct HLS transcoding)
// @access  Private (Instructor only)
router.post('/', [
    authenticate,
    isInstructor,
    uploadVideo.single('file'), // Using 'file' as the field name
    body('courseId').notEmpty().withMessage('Course ID is required').toInt(),
    body('title').trim().notEmpty().withMessage('Material title is required'),
    body('type').isIn(['pdf', 'video', 'document', 'link', 'other']).withMessage('Valid type is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { courseId, title, type, description, fileSize } = req.body;
        let finalFileUrl = req.body.fileUrl; // Fallback to provided URL

        // Validate that either a payload file or a URL was provided
        if (!req.file && (!finalFileUrl || finalFileUrl.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'A file or URL must be provided'
            });
        }

        // Verify course exists and belongs to instructor
        const course = await Course.findByPk(courseId);
        if (!course) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (course.instructorId !== req.user.id) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({
                success: false,
                message: 'You can only upload materials for your own courses'
            });
        }

        // Handle uploaded video transcoding to HLS
        if (req.file) {
            try {
                // Validate the type is video when uploading a video via file
                if (type !== 'video') {
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Uploaded files must be of type video.' 
                    });
                }

                const uniqueId = uuidv4();
                const hlsFolder = `uploads/materials/hls/${uniqueId}`;

                console.log('Starting HLS transcoding for:', req.file.path);
                
                // Attempt transcode
                await transcodeToHLS(req.file.path, hlsFolder);
                
                console.log('HLS transcoding completed');
                
                // Delete temp MP4
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

                // Generate HLS URL
                finalFileUrl = `/${hlsFolder}/playlist.m3u8`;
            } catch (transcodeError) {
                console.error('Transcoding error:', transcodeError);
                // Create a direct video link instead of HLS if transcoding fails
                const videoFileName = req.file.filename || `video_${Date.now()}`;
                finalFileUrl = `/uploads/videos/${videoFileName}`;
            }
        }

        const material = await Material.create({
            courseId,
            title,
            type,
            fileUrl: finalFileUrl,
            description,
            fileSize: req.file ? req.file.size.toString() : (fileSize || null)
        });

        res.status(201).json({
            success: true,
            message: 'Material uploaded successfully',
            material
        });
    } catch (error) {
        // Cleanup on fail
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        console.error('Upload material error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading material'
        });
    }
});

// @route   DELETE /api/materials/:id
// @desc    Delete course material
// @access  Private (Instructor only - own courses)
router.delete('/:id', [
    authenticate,
    isInstructor
], async (req, res) => {
    try {
        const material = await Material.findByPk(req.params.id, {
            include: [
                {
                    model: Course,
                    as: 'course'
                }
            ]
        });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Check if user is the course instructor
        if (material.course.instructorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete materials from your own courses'
            });
        }

        await material.destroy();

        res.json({
            success: true,
            message: 'Material deleted successfully'
        });
    } catch (error) {
        console.error('Delete material error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting material'
        });
    }
});

export default router;
