import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import './config/passport.js';
import { connectDB } from './config/database.js';
import { setupSocketHandlers } from './socketHandlers.js';

// Import routes
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import classRoutes from './routes/classes.js';
import materialRoutes from './routes/materials.js';
import videoRoutes from './routes/videos.js';
import assignmentRoutes from './routes/assignments.js';
import quizRoutes from './routes/quizzes.js';
import announcementRoutes from './routes/announcements.js';
import discussionRoutes from './routes/discussions.js';
import adminRoutes from './routes/admin.js';
import instituteRoutes from './routes/institutes.js';
import programRoutes from './routes/programs.js';
import membershipRoutes from './routes/memberships.js';
import classNotesRoutes from './routes/classNotes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5174',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5174',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express session and Passport middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'scholarpath_secret_key',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

const uploadsRoot = path.join(__dirname, '../uploads');

// Backward compatibility for older material records that point to index.m3u8
app.get('/uploads/materials/hls/:folder/index.m3u8', (req, res) => {
    const playlistPath = path.join(uploadsRoot, 'materials', 'hls', req.params.folder, 'playlist.m3u8');

    if (fs.existsSync(playlistPath)) {
        return res.sendFile(playlistPath);
    }

    return res.status(404).json({
        success: false,
        message: 'HLS playlist not found'
    });
});

// Static Route for Uploads
app.use('/uploads', express.static(uploadsRoot));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/classes', classNotesRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/membership', membershipRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'ScholarPath API is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to ScholarPath API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            courses: '/api/courses',
            classes: '/api/classes',
            materials: '/api/materials',
            announcements: '/api/announcements',
            discussions: '/api/discussions',
            assignments: '/api/assignments',
            health: '/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server with port fallback if in use
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

const startServer = async () => {
    try {
        // Connect to database
        const dbConnected = await connectDB();

        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Server not started.');
            process.exit(1);
        }

        let port = DEFAULT_PORT;
        const maxAttempts = 5;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                await new Promise((resolve, reject) => {
                    const onError = (err) => {
                        httpServer.removeListener('listening', onListen);
                        reject(err);
                    };

                    const onListen = () => {
                        httpServer.removeListener('error', onError);
                        resolve();
                    };

                    httpServer.once('error', onError);
                    httpServer.once('listening', onListen);
                    httpServer.listen(port);
                });

                console.log('\n🚀 ═══════════════════════════════════════════════');
                console.log(`🎓 ScholarPath Backend Server`);
                console.log(`📡 Server running on: http://localhost:${port}`);
                console.log(`🔌 Socket.io ready for real-time connections`);
                console.log(`💾 Database: MySQL (${process.env.DB_NAME || 'learnsphere'})`);
                console.log('═══════════════════════════════════════════════\n');
                return;
            } catch (err) {
                if (err && err.code === 'EADDRINUSE') {
                    console.warn(`⚠️ Port ${port} in use, trying port ${port + 1}...`);
                    port += 1;
                    // remove any lingering listeners before retry
                    httpServer.removeAllListeners('error');
                    httpServer.removeAllListeners('listening');
                    continue;
                }
                throw err;
            }
        }

        console.error(`❌ Failed to bind to a port after ${maxAttempts} attempts. Exiting.`);
        process.exit(1);
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
