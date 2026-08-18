import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { Institute, Program, InstructorInstitute } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/institute/signup
// @desc    Register new institute
// @access  Public
router.post('/signup', [
    body('name').trim().isLength({ min: 3 }).withMessage('Institute name must be at least 3 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('instituteType').isIn(['college', 'university', 'training_centre', 'other']).withMessage('Invalid institute type'),
    body('adminName').trim().isLength({ min: 2 }).withMessage('Admin name must be at least 2 characters'),
    body('adminEmail').isEmail().withMessage('Please enter a valid admin email')
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

        const { name, email, password, instituteType, description, adminName, adminEmail, adminPhone, contactNumber, address, website } = req.body;

        // Check if institute already exists
        const existingInstitute = await Institute.findOne({ where: { email } });
        if (existingInstitute) {
            return res.status(400).json({
                success: false,
                message: 'Institute with this email already exists'
            });
        }

        // Create new institute
        const institute = await Institute.create({
            name,
            email,
            password, // Will be hashed by the model hook
            instituteType,
            description: description || null,
            adminName,
            adminEmail,
            adminPhone: adminPhone || null,
            contactNumber: contactNumber || null,
            address: address || null,
            website: website || null,
            isVerified: false // Requires admin verification
        });

        res.status(201).json({
            success: true,
            message: 'Your institute account has been created and is pending admin verification. You will be able to login once approved.',
            pendingVerification: true,
            institute: {
                id: institute.id,
                name: institute.name,
                email: institute.email,
                instituteType: institute.instituteType
            }
        });
    } catch (error) {
        console.error('Institute signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating institute account',
            error: error.message
        });
    }
});

// @route   POST /api/institute/login
// @desc    Login institute
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        console.log('🔐 Institute login attempt:', req.body.email);
        
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find institute by email
        const institute = await Institute.findOne({ where: { email } });
        if (!institute) {
            console.log('❌ Institute not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('✓ Institute found:', institute.name);

        // Check password
        const isMatch = await institute.comparePassword(password);
        if (!isMatch) {
            console.log('❌ Password mismatch for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('✓ Password matched');

        // Check if institute is verified
        if (!institute.isVerified) {
            console.log('⚠️ Institute not verified:', email);
            return res.status(403).json({
                success: false,
                message: 'Your institute account is pending admin verification. Please wait for approval.',
                pendingVerification: true
            });
        }

        console.log('✓ Institute verified');

        // Generate JWT token
        const token = jwt.sign(
            { id: institute.id, role: 'institute', instituteId: institute.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✓ Token generated, login successful');

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: institute.id,
                name: institute.name,
                email: institute.email,
                role: 'institute',
                instituteType: institute.instituteType
            }
        });
    } catch (error) {
        console.error('❌ Institute login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// @route   GET /api/institute/profile
// @desc    Get institute profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
    try {
        // Only institutes can access their own profile
        if (req.user.role !== 'institute') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only institutes can access this resource.'
            });
        }

        const institute = await Institute.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'instituteType', 'description', 'logo', 'contactNumber', 'address', 'website', 'adminName', 'adminEmail', 'adminPhone', 'isVerified', 'createdAt']
        });

        if (!institute) {
            return res.status(404).json({
                success: false,
                message: 'Institute not found'
            });
        }

        res.json({
            success: true,
            institute
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching institute profile',
            error: error.message
        });
    }
});

// @route   PUT /api/institute/profile
// @desc    Update institute profile
// @access  Private
router.put('/profile', authenticate, [
    body('name').optional().trim().isLength({ min: 3 }),
    body('description').optional().trim(),
    body('contactNumber').optional().trim(),
    body('address').optional().trim(),
    body('website').optional().trim(),
    body('adminName').optional().trim().isLength({ min: 2 }),
    body('adminEmail').optional().isEmail()
], async (req, res) => {
    try {
        if (req.user.role !== 'institute') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only institutes can access this resource.'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, description, contactNumber, address, website, adminName, adminEmail, adminPhone } = req.body;

        const institute = await Institute.findByPk(req.user.id);
        if (!institute) {
            return res.status(404).json({
                success: false,
                message: 'Institute not found'
            });
        }

        // Update allowed fields
        if (name) institute.name = name;
        if (description) institute.description = description;
        if (contactNumber) institute.contactNumber = contactNumber;
        if (address) institute.address = address;
        if (website) institute.website = website;
        if (adminName) institute.adminName = adminName;
        if (adminEmail) institute.adminEmail = adminEmail;
        if (adminPhone) institute.adminPhone = adminPhone;

        await institute.save();

        res.json({
            success: true,
            message: 'Institute profile updated successfully',
            institute
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating institute profile',
            error: error.message
        });
    }
});

export default router;
