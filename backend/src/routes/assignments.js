import express from 'express';
import { authenticate, isInstructor, isStudent } from '../middleware/auth.js';
import { Assignment, Submission, User, Course } from '../models/index.js';
import { body, validationResult, param } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for assignment submissions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads/submissions');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, Images, ZIP'));
    }
  }
});

/**
 * POST /api/assignments
 * Create new assignment (instructor only)
 * @access Private (Instructor)
 */
router.post('/', [
  authenticate,
  isInstructor,
  body('courseId').notEmpty().withMessage('Valid course ID required').toInt(),
  body('title').trim().notEmpty().isLength({ max: 255 }).withMessage('Title required (max 255 chars)'),
  body('description').optional().trim(),
  body('dueDate').isISO8601().withMessage('Valid due date required').toDate(),
  body('maxScore').optional().toInt().isInt({ min: 1, max: 1000 }),
  body('submissionType').optional().isIn(['file', 'text', 'url']),
  body('allowLateSubmission').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Assignment Validation Error:', errors.array());
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { courseId, title, description, dueDate, maxScore, submissionType, allowLateSubmission, rubric } = req.body;

    // Verify course ownership
    const course = await Course.findByPk(courseId);
    if (!course || course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to create assignment' });
    }

    const assignment = await Assignment.create({
      courseId,
      title,
      description,
      dueDate: new Date(dueDate),
      maxScore: maxScore || 100,
      submissionType: submissionType || 'file',
      allowLateSubmission: allowLateSubmission !== false,
      rubric: rubric || null
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore
      }
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create assignment' });
  }
});

/**
 * GET /api/assignments/course/:courseId
 * Get all assignments for a course
 * @access Public (but content hidden if not enrolled/instructor)
 */
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const assignments = await Assignment.findAll({
      where: { courseId },
      include: [
        {
          model: Submission,
          as: 'submissions',
          attributes: ['id', 'studentId', 'grade', 'submissionDate'],
          required: false
        }
      ],
      order: [['dueDate', 'ASC']]
    });

    res.json({
      success: true,
      count: assignments.length,
      assignments: assignments.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        submissionType: a.submissionType,
        allowLateSubmission: a.allowLateSubmission,
        submissionCount: a.submissions?.length || 0
      }))
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
});

/**
 * GET /api/assignments/:assignmentId/details
 * Get assignment details with submission counts
 * @access Public
 */
router.get('/:assignmentId/details', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByPk(assignmentId, {
      include: [
        {
          model: Submission,
          as: 'submissions',
          attributes: ['id', 'studentId', 'submissionDate', 'grade'],
          required: false
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const totalSubmissions = assignment.submissions?.length || 0;
    const gradedSubmissions = assignment.submissions?.filter(s => s.grade !== null)?.length || 0;

    res.json({
      success: true,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        submissionType: assignment.submissionType,
        rubric: assignment.rubric,
        stats: {
          totalSubmissions,
          gradedSubmissions,
          pendingGrading: totalSubmissions - gradedSubmissions,
          averageScore: assignment.submissions?.length ? 
            (assignment.submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / assignment.submissions.length).toFixed(2) : 
            null
        }
      }
    });
  } catch (error) {
    console.error('Get assignment details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignment details' });
  }
});

/**
 * POST /api/assignments/:assignmentId/submit
 * Submit assignment (student)
 * @access Private (Student)
 */
router.post('/:assignmentId/submit', [
  authenticate,
  isStudent,
  upload.single('file'),
  body('assignmentId').isUUID()
], async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content, submissionUrl } = req.body;

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      where: { assignmentId, studentId: req.user.id }
    });

    if (existingSubmission && new Date() > assignment.dueDate && !assignment.allowLateSubmission) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Assignment deadline passed' });
    }

    const submissionData = {
      assignmentId,
      studentId: req.user.id,
      submissionDate: new Date(),
      isLate: new Date() > assignment.dueDate
    };

    if (assignment.submissionType === 'file' && req.file) {
      submissionData.fileUrl = `/uploads/submissions/${req.file.filename}`;
    } else if (assignment.submissionType === 'text' && content) {
      submissionData.content = content;
    } else if (assignment.submissionType === 'url' && submissionUrl) {
      submissionData.content = submissionUrl;
    }

    let submission;
    if (existingSubmission) {
      await existingSubmission.update(submissionData);
      submission = existingSubmission;
    } else {
      submission = await Submission.create(submissionData);
    }

    res.status(201).json({
      success: true,
      message: existingSubmission ? 'Submission updated' : 'Submission created',
      submission: {
        id: submission.id,
        submissionDate: submission.submissionDate,
        isLate: submission.isLate
      }
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path).catch(() => {});
    }
    res.status(500).json({ success: false, message: 'Failed to submit assignment' });
  }
});

/**
 * GET /api/assignments/:assignmentId/submissions
 * Get all submissions for an assignment (instructor only)
 * @access Private (Instructor)
 */
router.get('/:assignmentId/submissions', authenticate, isInstructor, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByPk(assignmentId, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'instructorId']
        }
      ]
    });

    if (!assignment || assignment.course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['submissionDate', 'DESC']]
    });

    res.json({
      success: true,
      count: submissions.length,
      submissions: submissions.map(s => ({
        id: s.id,
        studentId: s.studentId,
        studentName: s.student.name,
        studentEmail: s.student.email,
        submissionDate: s.submissionDate,
        isLate: s.isLate,
        grade: s.grade,
        feedback: s.feedback,
        hasFile: !!s.fileUrl,
        hasContent: !!s.content
      }))
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
});

/**
 * GET /api/assignments/:assignmentId/submissions/:submissionId
 * Get specific submission details
 * @access Private (Student can view own, instructor can view all)
 */
router.get('/:assignmentId/submissions/:submissionId', authenticate, async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['maxScore', 'rubric']
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check authorization
    if (req.user.id !== submission.studentId && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({
      success: true,
      submission: {
        id: submission.id,
        studentName: submission.student.name,
        submissionDate: submission.submissionDate,
        isLate: submission.isLate,
        ...submission.dataValues,
        student: undefined // Remove to avoid duplication
      }
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submission' });
  }
});

/**
 * PATCH /api/assignments/:assignmentId/submissions/:submissionId/grade
 * Grade a submission (instructor only)
 * @access Private (Instructor)
 */
router.patch('/:assignmentId/submissions/:submissionId/grade', [
  authenticate,
  isInstructor,
  body('grade').isInt({ min: 0, max: 1000 }).withMessage('Grade must be between 0 and 1000'),
  body('feedback').optional().trim(),
  body('rubricScores').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { assignmentId, submissionId } = req.params;
    const { grade, feedback, rubricScores } = req.body;

    const submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [{ model: Course, as: 'course' }]
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Verify instructor owns the course
    if (submission.assignment.course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await submission.update({
      grade,
      feedback,
      rubricScores: rubricScores || null,
      gradedBy: req.user.id,
      gradedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Submission graded',
      submission: {
        id: submission.id,
        grade: submission.grade,
        feedback: submission.feedback,
        gradedAt: submission.gradedAt
      }
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to grade submission' });
  }
});

/**
 * GET /api/assignments/:assignmentId/submissions/:submissionId/download
 * Download submission file
 * @access Private
 */
router.get('/:assignmentId/submissions/:submissionId/download', authenticate, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId);
    if (!submission || !submission.fileUrl) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check authorization
    if (req.user.id !== submission.studentId && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const filePath = path.join(process.cwd(), submission.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Download submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
});

/**
 * DELETE /api/assignments/:assignmentId/submissions/:submissionId
 * Delete submission (student can delete own, instructor can delete any)
 * @access Private
 */
router.delete('/:assignmentId/submissions/:submissionId', authenticate, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check authorization
    if (req.user.id !== submission.studentId && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete file if exists
    if (submission.fileUrl) {
      const filePath = path.join(process.cwd(), submission.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await submission.destroy();

    res.json({ success: true, message: 'Submission deleted' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete submission' });
  }
});

export default router;
