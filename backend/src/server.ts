// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import jewelryRoutes from './routes/jewelryRoutes';
import authRoutes from './routes/authRoutes';
import executeRoutes from './routes/executeRoutes';
import triggerRoutes from './routes/triggerRoutes';
import eventsRoutes from './routes/eventsRoutes';
import configRoutes from './routes/configRoutes';
import widgetRoutes from './routes/widgetRoutes';
import aiRoutes from './routes/aiRoutes';
import customRequestRoutes from './routes/customRequestRoutes';
import rateLimit from 'express-rate-limit';

// Connect to database
connectDB();

const app = express();

// Rate limiting for widget API (100 requests per 15 minutes per IP)
const widgetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.set('trust proxy', 1);

// CORS Configuration - STRICT Whitelist
const CACHE_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://visualizalo.es',
    'https://www.visualizalo.es',
    'https://api.visualizalo.es'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        // also allow 'null' origin for files opened directly from disk in browsers
        if (!origin || origin === 'null') return callback(null, true);
        if (CACHE_ALLOWED_ORIGINS.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json({ limit: '50mb' })); // Increased limit for large base64 images from phones/samples
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global Public API Limiter
const publicApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // 50 requests per 15 min per IP
    message: { message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// API Routes
app.use('/api/ai', publicApiLimiter, aiRoutes); // Protected by rate limit
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/launch', executeRoutes);
app.use('/api/trigger', triggerRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/widget', widgetLimiter, widgetRoutes);
app.use('/api/custom-requests', customRequestRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
