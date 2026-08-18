import jwt from 'jsonwebtoken';
import { User, Institute } from '../models/index.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if it's an institute or user
        let user;
        if (decoded.role === 'institute') {
            user = await Institute.findByPk(decoded.id);
        } else {
            user = await User.findByPk(decoded.id);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User/Institute not found'
            });
        }

        // Attach user to request
        req.user = user;
        req.user.role = decoded.role; // Ensure role is set correctly
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token is invalid or expired'
        });
    }
};

// Check if user is an instructor
export const isInstructor = (req, res, next) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Instructor role required.'
        });
    }
    next();
};

// Check if user is a student
export const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student role required.'
        });
    }
    next();
};

// Check if user is an institute
export const isInstitute = (req, res, next) => {
    if (req.user.role !== 'institute') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Institute role required.'
        });
    }
    next();
};
