import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, isInstructor } from '../middleware/auth.js';
import { transcodeToHLS, getVideoMetadata } from '../utils/transcoder.js';
import { Material, VideoMetadata, Subtitle, Course } from '../models/index.js';
import { body, validationResult } from 'express-validator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads/videos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Allowed: MP4, MOV, AVI, MKV, WEBM'));
    }
  }
});

/**
 * POST /api/videos/upload
 * Upload video (instructor only) and start HLS transcoding
 * @access Private (Instructor)
 */
router.post('/upload', [
  authenticate,
  isInstructor,
  upload.single('video'),
  body('courseId').isUUID().withMessage('Valid course ID required'),
  body('title').trim().notEmpty().withMessage('Video title required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const { courseId, title, description } = req.body;

    // Verify course ownership
    const course = await Course.findByPk(courseId);
    if (!course || course.instructorId !== req.user.id) {
      if (req.file) fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Create material record
    const material = await Material.create({
      courseId,
      title,
      description,
      type: 'video',
      filePath: req.file.path,
      fileSize: req.file.size,
      uploadedBy: req.user.id
    });

    // Get video metadata
    let videoMeta;
    try {
      videoMeta = await getVideoMetadata(req.file.path);
    } catch (err) {
      console.error('Metadata extraction error:', err);
      return res.status(500).json({ success: false, message: 'Failed to analyze video' });
    }

    // Create video metadata record
    const metadata = await VideoMetadata.create({
      videoId: material.id,
      originalFileName: req.file.originalname,
      originalFileSize: req.file.size,
      duration: Math.floor(videoMeta.duration),
      transcodeStatus: 'pending'
    });

    // Start transcoding in background
    const hlsDir = path.join(__dirname, `../../uploads/hls/${material.id}`);
    if (!fs.existsSync(hlsDir)) {
      fs.mkdirSync(hlsDir, { recursive: true });
    }

    // Async transcode (don't wait for completion)
    transcodeToHLS(req.file.path, hlsDir, async (progress) => {
      console.log(`Transcoding ${material.id}: ${progress.overall}%`);
      
      // Update progress in database
      await VideoMetadata.update(
        { transcodeProgress: progress.overall },
        { where: { videoId: material.id } }
      );
    }).then(async (result) => {
      // Update metadata with HLS URLs
      await VideoMetadata.update(
        {
          hlsPlaylistUrl: `${process.env.UPLOADS_URL || 'http://localhost:3000/uploads'}/hls/${material.id}/playlist.m3u8`,
          thumbnailUrl: `${process.env.UPLOADS_URL || 'http://localhost:3000/uploads'}/hls/${material.id}/thumbnail.jpg`,
          qualityOptions: JSON.stringify(result.qualities || ['720p', '480p', '360p']),
          transcodeStatus: 'completed'
        },
        { where: { videoId: material.id } }
      );
      console.log(`✅ HLS transcoding completed for ${material.id}`);
    }).catch(async (error) => {
      console.error(`❌ Transcoding failed for ${material.id}:`, error);
      await VideoMetadata.update(
        {
          transcodeStatus: 'failed',
          transcodeError: error.message
        },
        { where: { videoId: material.id } }
      );
    });

    res.status(201).json({
      success: true,
      message: 'Video upload initiated. Transcoding in progress...',
      video: {
        id: material.id,
        title: material.title,
        duration: metadata.duration,
        transcodeStatus: metadata.transcodeStatus,
        transcodeProgress: metadata.transcodeProgress
      }
    });
  } catch (error) {
    console.error('Video upload error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path).catch(() => {});
    }
    res.status(500).json({ success: false, message: 'Video upload failed' });
  }
});

/**
 * GET /api/videos/:id/stream
 * Get HLS master playlist for streaming
 * @access Public
 */
router.get('/:id/stream', async (req, res) => {
  try {
    const { id } = req.params;

    const metadata = await VideoMetadata.findOne({ where: { videoId: id } });
    if (!metadata) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    if (metadata.transcodeStatus !== 'completed') {
      return res.status(202).json({
        success: false,
        message: 'Video still being transcoded',
        progress: metadata.transcodeProgress,
        status: metadata.transcodeStatus
      });
    }

    res.json({
      success: true,
      video: {
        id,
        duration: metadata.duration,
        playlistUrl: metadata.hlsPlaylistUrl,
        thumbnail: metadata.thumbnailUrl,
        qualityOptions: JSON.parse(metadata.qualityOptions || '[]'),
        qualities: metadata.qualityOptions ? JSON.parse(metadata.qualityOptions) : ['720p']
      }
    });
  } catch (error) {
    console.error('Get stream error:', error);
    res.status(500).json({ success: false, message: 'Failed to get video stream' });
  }
});

/**
 * GET /api/videos/:id/metadata
 * Get complete video metadata
 * @access Public
 */
router.get('/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;

    const material = await Material.findByPk(id);
    if (!material || material.type !== 'video') {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const metadata = await VideoMetadata.findOne({ where: { videoId: id } });
    const subtitles = await Subtitle.findAll({ where: { videoId: id } });

    res.json({
      success: true,
      video: {
        id: material.id,
        title: material.title,
        description: material.description,
        duration: metadata?.duration,
        fileSize: metadata?.originalFileSize,
        playlistUrl: metadata?.hlsPlaylistUrl,
        thumbnail: metadata?.thumbnailUrl,
        qualityOptions: metadata?.qualityOptions ? JSON.parse(metadata.qualityOptions) : [],
        subtitles: subtitles.map(s => ({
          id: s.id,
          language: s.language,
          languageName: s.languageName,
          url: s.fileUrl
        })),
        transcodeStatus: metadata?.transcodeStatus
      }
    });
  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({ success: false, message: 'Failed to get metadata' });
  }
});

/**
 * GET /api/videos/:id/subtitle/:language
 * Get subtitle file for specific language
 * @access Public
 */
router.get('/:id/subtitle/:language', async (req, res) => {
  try {
    const { id, language } = req.params;

    const subtitle = await Subtitle.findOne({
      where: { videoId: id, language }
    });

    if (!subtitle) {
      return res.status(404).json({ success: false, message: 'Subtitle not found' });
    }

    res.json({
      success: true,
      subtitle: {
        id: subtitle.id,
        language: subtitle.language,
        url: subtitle.fileUrl,
        format: subtitle.format
      }
    });
  } catch (error) {
    console.error('Get subtitle error:', error);
    res.status(500).json({ success: false, message: 'Failed to get subtitle' });
  }
});

/**
 * POST /api/videos/:id/subtitle/upload
 * Upload subtitle file (instructor only)
 * @access Private (Instructor)
 */
router.post('/:id/subtitle/upload', [
  authenticate,
  isInstructor
], async (req, res) => {
  try {
    const { id } = req.params;
    const { language, languageName, fileUrl, format } = req.body;

    if (!language || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Language and fileUrl required'
      });
    }

    // Verify video ownership (indirectly through course)
    const material = await Material.findByPk(id);
    const course = await Course.findByPk(material.courseId);
    
    if (!course || course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if subtitle already exists for this language
    const existing = await Subtitle.findOne({
      where: { videoId: id, language }
    });

    if (existing) {
      // Update existing
      await existing.update({
        fileUrl,
        format: format || 'vtt'
      });
      return res.json({
        success: true,
        message: 'Subtitle updated',
        subtitle: { id: existing.id, language }
      });
    }

    // Create new subtitle
    const subtitle = await Subtitle.create({
      videoId: id,
      language,
      languageName: languageName || language,
      fileUrl,
      format: format || 'vtt'
    });

    res.status(201).json({
      success: true,
      message: 'Subtitle uploaded',
      subtitle: { id: subtitle.id, language }
    });
  } catch (error) {
    console.error('Upload subtitle error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload subtitle' });
  }
});

/**
 * GET /api/videos/:id/subtitles
 * Get all available subtitles for a video
 * @access Public
 */
router.get('/:id/subtitles', async (req, res) => {
  try {
    const { id } = req.params;

    const subtitles = await Subtitle.findAll({
      where: { videoId: id }
    });

    res.json({
      success: true,
      subtitles: subtitles.map(s => ({
        id: s.id,
        language: s.language,
        languageName: s.languageName,
        format: s.format,
        url: s.fileUrl
      }))
    });
  } catch (error) {
    console.error('Get subtitles error:', error);
    res.status(500).json({ success: false, message: 'Failed to get subtitles' });
  }
});

/**
 * DELETE /api/videos/:id/subtitle/:language
 * Delete subtitle for specific language (instructor only)
 * @access Private (Instructor)
 */
router.delete('/:id/subtitle/:language', [
  authenticate,
  isInstructor
], async (req, res) => {
  try {
    const { id, language } = req.params;

    // Verify course ownership
    const material = await Material.findByPk(id);
    const course = await Course.findByPk(material.courseId);
    
    if (!course || course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const subtitle = await Subtitle.findOne({
      where: { videoId: id, language }
    });

    if (!subtitle) {
      return res.status(404).json({ success: false, message: 'Subtitle not found' });
    }

    await subtitle.destroy();

    res.json({ success: true, message: 'Subtitle deleted' });
  } catch (error) {
    console.error('Delete subtitle error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subtitle' });
  }
});

export default router;
