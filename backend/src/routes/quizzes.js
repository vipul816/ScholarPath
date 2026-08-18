import express from 'express';
import { authenticate, isInstructor, isStudent } from '../middleware/auth.js';
import { Quiz, QuizQuestion, Submission, User, Course, Enrollment } from '../models/index.js';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/quizzes
 * Create new quiz (instructor only)
 * @access Private (Instructor)
 */
router.post('/', [
  authenticate,
  isInstructor,
  body('courseId').isUUID(),
  body('title').trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim(),
  body('autoGrade').optional().isBoolean(),
  body('passingScore').optional().isInt({ min: 0, max: 100 }),
  body('timeLimit').optional().isInt({ min: 1 }),
  body('attempts').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { courseId, title, description, autoGrade, passingScore, timeLimit, attempts, shuffleQuestions, showAnswers } = req.body;

    // Verify course ownership
    const course = await Course.findByPk(courseId);
    if (!course || course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.create({
      courseId,
      title,
      description,
      autoGrade: autoGrade !== false,
      passingScore: passingScore || 70,
      timeLimit: timeLimit || null,
      shuffleQuestions: shuffleQuestions || false,
      showAnswers: showAnswers !== false,
      attempts: attempts || 1
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz: {
        id: quiz.id,
        title: quiz.title,
        courseId: quiz.courseId
      }
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to create quiz' });
  }
});

/**
 * GET /api/quizzes/:courseId
 * Get all quizzes for a course
 * @access Public
 */
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const quizzes = await Quiz.findAll({
      where: { courseId },
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: quizzes.length,
      quizzes: quizzes.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        autoGrade: q.autoGrade,
        passingScore: q.passingScore,
        timeLimit: q.timeLimit,
        attempts: q.attempts,
        questionCount: q.questions?.length || 0
      }))
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes' });
  }
});

/**
 * GET /api/quizzes/:quizId/questions
 * Get all questions for a quiz
 * @access Public (but don't show answers to students until submitted)
 */
router.get('/:quizId/questions', async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByPk(quizId, {
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          order: [['order', 'ASC']]
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Don't send correct answers to students (they'll get them after submission if enabled)
    const questions = quiz.questions.map(q => {
      const questionData = q.dataValues;
      
      // Only include critical info
      return {
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        options: q.options,
        points: q.points,
        order: q.order
        // Exclude : correctAnswer, explanation until they submit
      };
    });

    if (quiz.shuffleQuestions) {
      questions.sort(() => Math.random() - 0.5);
    }

    res.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        shortDescription: quiz.description?.substring(0, 200),
        timeLimit: quiz.timeLimit,
        totalQuestions: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0)
      },
      questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
});

/**
 * POST /api/quizzes/:quizId/questions
 * Add question to quiz (instructor only)
 * @access Private (Instructor)
 */
router.post('/:quizId/questions', [
  authenticate,
  isInstructor,
  body('question').trim().notEmpty(),
  body('questionType').isIn(['mcq', 'short_answer', 'essay', 'true_false']),
  body('correctAnswer').trim().notEmpty(),
  body('points').optional().isInt({ min: 1 }),
  body('order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { quizId } = req.params;
    const { question, questionType, options, correctAnswer, explanation, points, order } = req.body;

    const quiz = await Quiz.findByPk(quizId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Verify instructor owns course
    if (quiz.course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const questionObj = await QuizQuestion.create({
      quizId,
      question,
      questionType,
      options: questionType === 'mcq' ? options : null,
      correctAnswer,
      explanation: explanation || null,
      points: points || 1,
      order: order || null
    });

    res.status(201).json({
      success: true,
      message: 'Question added',
      question: {
        id: questionObj.id,
        question: questionObj.question,
        questionType: questionObj.questionType,
        points: questionObj.points
      }
    });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ success: false, message: 'Failed to add question' });
  }
});

/**
 * POST /api/quizzes/:quizId/submit
 * Submit quiz answers and get auto-grade (if enabled)
 * @access Private (Student)
 */
router.post('/:quizId/submit', [
  authenticate,
  isStudent,
  body('answers').isArray({ min: 1 }).withMessage('Answers array required'),
  body('timeSpent').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { quizId } = req.params;
    const { answers, timeSpent } = req.body;

    const quiz = await Quiz.findByPk(quizId, {
      include: [
        {
          model: QuizQuestion,
          as: 'questions'
        },
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      where: { studentId: req.user.id, courseId: quiz.courseId }
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in course' });
    }

    // Auto-grade if enabled
    let totalScore = 0;
    let maxScore = 0;
    const gradeDetails = [];

    if (quiz.autoGrade) {
      const answerMap = {};
      answers.forEach(a => {
        answerMap[a.questionId] = a.answer;
      });

      quiz.questions.forEach(question => {
        maxScore += question.points;
        const studentAnswer = answerMap[question.id];

        if (!studentAnswer) {
          gradeDetails.push({
            questionId: question.id,
            points: 0,
            maxPoints: question.points
          });
          return;
        }

        let isCorrect = false;

        if (question.questionType === 'mcq' || question.questionType === 'true_false') {
          // Exact match for multiple choice
          isCorrect = studentAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        } else if (question.questionType === 'short_answer') {
          // Fuzzy match for short answers (contains check)
          const keywords = question.correctAnswer.toLowerCase().split('|');
          isCorrect = keywords.some(keyword => 
            studentAnswer.toLowerCase().includes(keyword.trim())
          );
        }
        // Essay questions always get 0 (instructor grades manually)

        const earnedPoints = isCorrect ? question.points : 0;
        totalScore += earnedPoints;

        gradeDetails.push({
          questionId: question.id,
          studentAnswer,
          correct: isCorrect,
          points: earnedPoints,
          maxPoints: question.points
        });
      });
    } else {
      // Just record submissions without grading
      maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    }

    // Create submission record
    const submission = await Submission.create({
      assignmentId: quizId, // Using assignmentId to use Submission model
      studentId: req.user.id,
      content: JSON.stringify({ answers, gradeDetails }),
      grade: quiz.autoGrade ? Math.round(totalScore) : null,
      feedback: null,
      submissionDate: new Date()
    });

    // Calculate percentage
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    const response = {
      success: true,
      message: quiz.autoGrade ? 'Quiz submitted and graded' : 'Quiz submitted',
      submission: {
        id: submission.id,
        submittedAt: submission.submissionDate
      }
    };

    if (quiz.autoGrade) {
      response.grade = {
        score: totalScore,
        maxScore: maxScore,
        percentage: percentage,
        passed: passed,
        message: passed ? `Passed! (${percentage}%)` : `Did not pass. Minimum required: ${quiz.passingScore}%`
      };

      if (quiz.showAnswers) {
        response.answers = gradeDetails;
      }
    } else {
      response.message += ' - Will be graded by instructor';
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz' });
  }
});

/**
 * GET /api/quizzes/:quizId/results
 * Get quiz results for all students (instructor only)
 * @access Private (Instructor)
 */
router.get('/:quizId/results', authenticate, isInstructor, async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByPk(quizId, {
      include: [
        {
          model: Course,
          as: 'course'
        },
        {
          model: Submission,
          as: 'submissions',
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Verify instructor owns course
    if (quiz.course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const results = quiz.submissions.map(sub => ({
      submissionId: sub.id,
      studentId: sub.studentId,
      studentName: sub.user.name,
      studentEmail: sub.user.email,
      submittedAt: sub.submissionDate,
      grade: sub.grade,
      percentage: sub.grade ? Math.round((sub.grade / quiz.totalPoints) * 100) : null,
      feedback: sub.feedback
    }));

    const stats = {
      totalSubmissions: results.length,
      averageScore: results.length > 0 
        ? (results.reduce((sum, r) => sum + (r.grade || 0), 0) / results.length).toFixed(2)
        : 0,
      highestScore: Math.max(...results.map(r => r.grade || 0)),
      lowestScore: Math.min(...results.map(r => r.grade || 0)),
      passedCount: results.filter(r => (r.percentage || 0) >= quiz.passingScore).length
    };

    res.json({
      success: true,
      quiz: { id: quiz.id, title: quiz.title },
      stats,
      results
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch results' });
  }
});

/**
 * GET /api/quizzes/:quizId/submissions/:submissionId
 * Get specific quiz submission (student can view own, instructor can view all)
 * @access Private
 */
router.get('/:quizId/submissions/:submissionId', authenticate, async (req, res) => {
  try {
    const { quizId, submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name'] }
      ]
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Authorization check
    if (req.user.id !== submission.studentId && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const content = JSON.parse(submission.content || '{}');
    const percentage = submission.grade ? Math.round((submission.grade / quiz.totalPoints || 1) * 100) : null;

    res.json({
      success: true,
      submission: {
        id: submission.id,
        studentName: submission.student?.name,
        submittedAt: submission.submissionDate,
        grade: submission.grade,
        percentage: percentage,
        feedback: submission.feedback,
        gradeDetails: content.gradeDetails || []
      }
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submission' });
  }
});

export default router;
