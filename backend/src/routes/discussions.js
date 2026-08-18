import express from 'express';
import { authenticate, isInstructor } from '../middleware/auth.js';
import { DiscussionBoard, ForumPost, ForumReply, User, Course, Enrollment } from '../models/index.js';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';

const router = express.Router();

/**
 * POST /api/discussions/boards
 * Create discussion board for course (instructor only)
 * @access Private (Instructor)
 */
router.post('/boards', [
  authenticate,
  isInstructor,
  body('courseId').isUUID().withMessage('Valid course ID required'),
  body('title').trim().notEmpty().isLength({ max: 255 }).withMessage('Title required'),
  body('description').optional().trim(),
  body('boardType').optional().isIn(['general', 'questions', 'announcements'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { courseId, title, description, boardType } = req.body;

    // Verify course ownership
    const course = await Course.findByPk(courseId);
    if (!course || course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const board = await DiscussionBoard.create({
      courseId,
      title,
      description,
      boardType: boardType || 'general'
    });

    res.status(201).json({
      success: true,
      message: 'Discussion board created',
      board: {
        id: board.id,
        title: board.title,
        boardType: board.boardType
      }
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ success: false, message: 'Failed to create board' });
  }
});

/**
 * GET /api/discussions/course/:courseId
 * Get all discussion boards for a course
 * @access Public (but content filtered by enrollment)
 */
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const boards = await DiscussionBoard.findAll({
      where: { courseId },
      include: [
        {
          model: ForumPost,
          as: 'posts',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: boards.length,
      discussions: boards.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description,
        boardType: b.boardType,
        isLocked: b.isLocked,
        postCount: b.posts?.length || 0,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch boards' });
  }
});

/**
 * GET /api/discussions/board/:boardId
 * Get board details with post count and statistics
 * @access Public
 */
router.get('/board/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await DiscussionBoard.findByPk(boardId, {
      include: [
        {
          model: ForumPost,
          as: 'posts',
          attributes: ['id', 'title', 'createdAt'],
          required: false
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'instructorId']
        }
      ]
    });

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    res.json({
      success: true,
      board: {
        id: board.id,
        title: board.title,
        description: board.description,
        boardType: board.boardType,
        isLocked: board.isLocked,
        postCount: board.posts?.length || 0,
        courseName: board.course?.title,
        createdAt: board.createdAt
      }
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch board' });
  }
});

/**
 * POST /api/discussions/:boardId/post
 * Create post in discussion board
 * @access Private (Authenticated)
 */
router.post('/:boardId/post', [
  authenticate,
  body('title').trim().notEmpty().isLength({ max: 255 }).withMessage('Title required'),
  body('content').trim().notEmpty().withMessage('Content required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { boardId } = req.params;
    const { title, content } = req.body;

    const board = await DiscussionBoard.findByPk(boardId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    if (board.isLocked) {
      return res.status(403).json({ success: false, message: 'This board is locked' });
    }

    // Verify enrollment or instructor
    if (req.user.role !== 'instructor' || board.course.instructorId !== req.user.id) {
      const enrollment = await Enrollment.findOne({
        where: { studentId: req.user.id, courseId: board.courseId }
      });

      if (!enrollment) {
        return res.status(403).json({ success: false, message: 'Not enrolled in course' });
      }
    }

    const post = await ForumPost.create({
      boardId,
      authorId: req.user.id,
      title,
      content
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

/**
 * GET /api/discussions/:boardId/posts
 * Get all posts in a board (paginated)
 * @access Public
 */
router.get('/:boardId/posts', async (req, res) => {
  try {
    const { boardId } = req.params;
    const { page = 1, limit = 20, sort = 'recent' } = req.query;

    const offset = (page - 1) * limit;

    const board = await DiscussionBoard.findByPk(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    let orderBy = [['createdAt', 'DESC']];
    if (sort === 'popular') {
      orderBy = [['upvotes', 'DESC']];
    }

    const { count, rows: posts } = await ForumPost.findAndCountAll({
      where: { boardId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ForumReply,
          as: 'replies',
          attributes: ['id'],
          required: false
        }
      ],
      order: orderBy,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalPosts: count
      },
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content.substring(0, 200) + (p.content.length > 200 ? '...' : ''),
        author: p.author.name,
        authorId: p.author.id,
        createdAt: p.createdAt,
        isPinned: p.isPinned,
        isLocked: p.isLocked,
        views: p.views,
        upvotes: p.upvotes,
        replyCount: p.replies?.length || 0
      }))
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

/**
 * GET /api/discussions/post/:postId
 * Get single post with all replies
 * @access Public
 */
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ForumPost.findByPk(postId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ForumReply,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'email']
            }
          ],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Increment view count
    await post.increment('views');

    res.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        author: post.author.name,
        authorId: post.author.id,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        views: post.views + 1,
        upvotes: post.upvotes,
        replies: post.replies.map(r => ({
          id: r.id,
          content: r.content,
          author: r.author.name,
          authorId: r.author.id,
          createdAt: r.createdAt,
          isMarkedAsAnswer: r.isMarkedAsAnswer,
          upvotes: r.upvotes
        }))
      }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
});

/**
 * POST /api/discussions/:postId/reply
 * Reply to a post
 * @access Private (Authenticated)
 */
router.post('/:postId/reply', [
  authenticate,
  body('content').trim().notEmpty().withMessage('Reply content required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { postId } = req.params;
    const { content } = req.body;

    const post = await ForumPost.findByPk(postId, {
      include: [
        {
          model: DiscussionBoard,
          as: 'board',
          include: [{ model: Course, as: 'course' }]
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.isLocked) {
      return res.status(403).json({ success: false, message: 'This post is locked' });
    }

    // Verify enrollment or instructor
    if (req.user.role !== 'instructor' || post.board.course.instructorId !== req.user.id) {
      const enrollment = await Enrollment.findOne({
        where: { studentId: req.user.id, courseId: post.board.courseId }
      });

      if (!enrollment) {
        return res.status(403).json({ success: false, message: 'Not enrolled in course' });
      }
    }

    const reply = await ForumReply.create({
      postId,
      authorId: req.user.id,
      content
    });

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      reply: {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt
      }
    });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ success: false, message: 'Failed to post reply' });
  }
});

/**
 * PATCH /api/discussions/:boardId/pin/:postId
 * Pin/unpin post (instructor only)
 * @access Private (Instructor)
 */
router.patch('/:boardId/pin/:postId', authenticate, isInstructor, async (req, res) => {
  try {
    const { boardId, postId } = req.params;
    const { pinned } = req.body;

    const board = await DiscussionBoard.findByPk(boardId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!board || board.course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const post = await ForumPost.findByPk(postId);
    if (!post || post.boardId !== boardId) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await post.update({ isPinned: pinned == true });

    res.json({
      success: true,
      message: pinned ? 'Post pinned' : 'Post unpinned',
      post: { id: post.id, isPinned: post.isPinned }
    });
  } catch (error) {
    console.error('Pin post error:', error);
    res.status(500).json({ success: false, message: 'Failed to pin post' });
  }
});

/**
 * PATCH /api/discussions/:boardId/lock/:postId
 * Lock/unlock post (instructor only - prevents replies)
 * @access Private (Instructor)
 */
router.patch('/:boardId/lock/:postId', authenticate, isInstructor, async (req, res) => {
  try {
    const { boardId, postId } = req.params;
    const { locked } = req.body;

    const board = await DiscussionBoard.findByPk(boardId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!board || board.course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const post = await ForumPost.findByPk(postId);
    if (!post || post.boardId !== boardId) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await post.update({ isLocked: locked == true });

    res.json({
      success: true,
      message: locked ? 'Post locked' : 'Post unlocked',
      post: { id: post.id, isLocked: post.isLocked }
    });
  } catch (error) {
    console.error('Lock post error:', error);
    res.status(500).json({ success: false, message: 'Failed to lock post' });
  }
});

/**
 * POST /api/discussions/:postId/upvote
 * Upvote a post
 * @access Private (Authenticated)
 */
router.post('/:postId/upvote', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ForumPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await post.increment('upvotes');

    res.json({
      success: true,
      message: 'Post upvoted',
      upvotes: post.upvotes + 1
    });
  } catch (error) {
    console.error('Upvote post error:', error);
    res.status(500).json({ success: false, message: 'Failed to upvote post' });
  }
});

/**
 * POST /api/discussions/:postId/reply/:replyId/mark-answer
 * Mark reply as answer (instructor only)
 * @access Private (Instructor)
 */
router.post('/:postId/reply/:replyId/mark-answer', authenticate, isInstructor, async (req, res) => {
  try {
    const { postId, replyId } = req.params;

    const post = await ForumPost.findByPk(postId, {
      include: [
        {
          model: DiscussionBoard,
          as: 'board',
          include: [{ model: Course, as: 'course' }]
        }
      ]
    });

    if (!post || post.board.course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const reply = await ForumReply.findByPk(replyId);
    if (!reply || reply.postId !== postId) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    // Unmark all other answers first
    await ForumReply.update(
      { isMarkedAsAnswer: false },
      { where: { postId } }
    );

    // Mark this one
    await reply.update({ isMarkedAsAnswer: true });

    res.json({
      success: true,
      message: 'Reply marked as answer',
      reply: { id: reply.id, isMarkedAsAnswer: reply.isMarkedAsAnswer }
    });
  } catch (error) {
    console.error('Mark answer error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark answer' });
  }
});

/**
 * PATCH /api/discussions/post/:postId
 * Edit own post
 * @access Private (Post author)
 */
router.patch('/post/:postId', [
  authenticate,
  body('title').optional().trim(),
  body('content').optional().trim()
], async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;

    const post = await ForumPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.authorId !== req.user.id && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Can only edit own posts' });
    }

    await post.update({
      title: title || post.title,
      content: content || post.content
    });

    res.json({
      success: true,
      message: 'Post updated',
      post: { id: post.id, title: post.title }
    });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ success: false, message: 'Failed to edit post' });
  }
});

/**
 * DELETE /api/discussions/post/:postId
 * Delete post (author or instructor)
 * @access Private
 */
router.delete('/post/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ForumPost.findByPk(postId, {
      include: [
        {
          model: DiscussionBoard,
          as: 'board',
          include: [{ model: Course, as: 'course' }]
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check authorization: author or course instructor
    const isAuthor = post.authorId === req.user.id;
    const isInstructor = post.board.course.instructorId === req.user.id;

    if (!isAuthor && !isInstructor) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete' });
    }

    // Delete all replies first
    await ForumReply.destroy({ where: { postId } });

    // Delete post
    await post.destroy();

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

/**
 * DELETE /api/discussions/reply/:replyId
 * Delete reply (author or instructor)
 * @access Private
 */
router.delete('/reply/:replyId', authenticate, async (req, res) => {
  try {
    const { replyId } = req.params;

    const reply = await ForumReply.findByPk(replyId, {
      include: [
        {
          model: ForumPost,
          as: 'post',
          include: [
            {
              model: DiscussionBoard,
              as: 'board',
              include: [{ model: Course, as: 'course' }]
            }
          ]
        }
      ]
    });

    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    // Check authorization: author or course instructor
    const isAuthor = reply.authorId === req.user.id;
    const isInstructor = reply.post.board.course.instructorId === req.user.id;

    if (!isAuthor && !isInstructor) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete' });
    }

    await reply.destroy();

    res.json({ success: true, message: 'Reply deleted' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete reply' });
  }
});

/**
 * PATCH /api/discussions/board/:boardId/lock
 * Lock/unlock board (instructor only)
 * @access Private (Instructor)
 */
router.patch('/board/:boardId/lock', [
  authenticate,
  isInstructor,
  body('locked').isBoolean()
], async (req, res) => {
  try {
    const { boardId } = req.params;
    const { locked } = req.body;

    const board = await DiscussionBoard.findByPk(boardId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!board || board.course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await board.update({ isLocked: locked });

    res.json({
      success: true,
      message: locked ? 'Board locked' : 'Board unlocked',
      board: { id: board.id, isLocked: board.isLocked }
    });
  } catch (error) {
    console.error('Lock board error:', error);
    res.status(500).json({ success: false, message: 'Failed to lock board' });
  }
});

/**
 * GET /api/discussions/search/:query
 * Search posts across all boards
 * @access Public
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    if (query.length < 2) {
      return res.status(400).json({ success: false, message: 'Search term too short' });
    }

    const posts = await ForumPost.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${query}%` } },
          { content: { [Op.like]: `%${query}%` } }
        ]
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name']
        }
      ],
      limit: 50
    });

    res.json({
      success: true,
      count: posts.length,
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        author: p.author.name,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Failed to search' });
  }
});

export default router;
