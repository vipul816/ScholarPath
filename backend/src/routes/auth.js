import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { User } from '../models/index.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
        }
    }
});

// Multer setup for avatar uploads
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only JPG/JPEG/PNG avatars allowed'));
    }
});
// defining functions till here----next are routes/endpoints
// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', upload.single('resume'), [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please enter a valid email-id'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'instructor']).withMessage('Role must be student or instructor')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, password, role, qualification, experience, profession, instructorSummary } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Prepare user data
        const userData = {
            name,
            email,
            password, // Will be hashed by the model hook
            role,
            isVerified: role === 'student' // Students are auto-verified, instructors need admin approval
        };

        // Add instructor-specific fields if role is instructor
        if (role === 'instructor') {
            userData.qualification = qualification || null;
            userData.experience = experience || null;
            userData.profession = profession || null;
            userData.instructorSummary = instructorSummary || null;
            if (req.file) {
                userData.resumePath = req.file.path;
            }
        }

        // Create new user
        const user = await User.create(userData);

        // If instructor, don't auto-login, show pending message
        if (role === 'instructor') {
            return res.status(201).json({
                success: true,
                message: 'Your instructor account has been created and is pending admin verification. You will be able to login once approved.',
                pendingVerification: true
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if instructor is verified
        if (user.role === 'instructor' && !user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Your instructor account is pending admin verification. Please wait for approval.',
                pendingVerification: true
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
import { authenticate } from '../middleware/auth.js';

router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                avatar: req.user.avatar,
                bio: req.user.bio,
                educationDetails: req.user.educationDetails,
                institutionalDetails: req.user.institutionalDetails,
                areaOfInterest: req.user.areaOfInterest,
                certificatesEarned: req.user.certificatesEarned,
                qualification: req.user.qualification,
                experience: req.user.experience,
                profession: req.user.profession,
                instructorSummary: req.user.instructorSummary,
                resumePath: req.user.resumePath
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user data'
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update current user's profile (bio, avatar, extra fields)
// @access  Private
router.put('/profile', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update allowed fields
        const { bio, educationDetails, institutionalDetails, areaOfInterest, certificatesEarned, qualification, experience, profession, instructorSummary } = req.body;

        if (bio !== undefined) user.bio = bio;
        if (educationDetails !== undefined) user.educationDetails = educationDetails;
        if (institutionalDetails !== undefined) user.institutionalDetails = institutionalDetails;
        if (areaOfInterest !== undefined) user.areaOfInterest = areaOfInterest;
        if (certificatesEarned !== undefined) user.certificatesEarned = certificatesEarned;

        // Instructor-specific
        if (qualification !== undefined) user.qualification = qualification;
        if (experience !== undefined) user.experience = experience;
        if (profession !== undefined) user.profession = profession;
        if (instructorSummary !== undefined) user.instructorSummary = instructorSummary;

        if (req.file) {
            // store path relative to server static root
            user.avatar = '/' + req.file.path.replace(/\\/g, '/');
        }

        await user.save();

        res.json({ success: true, message: 'Profile updated successfully', user: user.toJSON() });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
    }
});

import passport from 'passport';
import '../config/passport.js';

// @route   GET /api/auth/google
// @desc    Auth with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=true' }),
    (req, res) => {
        // Generate JWT token
        const token = jwt.sign(
            { id: req.user.id, role: req.user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Pass token and user info back to frontend via URL params (safe for immediate extraction)
        // Alternatively, use cookies. Here url query is simpler.
        const userObj = encodeURIComponent(JSON.stringify({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            isVerified: req.user.isVerified
        }));

        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}/oauth-callback?token=${token}&user=${userObj}`);
    }
);

export default router;
