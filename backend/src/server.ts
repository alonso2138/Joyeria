// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import jewelryRoutes from './routes/jewelryRoutes';
import authRoutes from './routes/authRoutes';
import executeRoutes from './routes/executeRoutes';
import triggerRoutes from './routes/triggerRoutes'
import eventsRoutes from './routes/eventsRoutes'
import configRoutes from './routes/configRoutes'
import widgetRoutes from './routes/widgetRoutes';
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
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/launch', executeRoutes);
app.use('/api/trigger', triggerRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/widget', widgetLimiter, widgetRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
