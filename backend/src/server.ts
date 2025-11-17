import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import jewelryRoutes from './routes/jewelryRoutes';
import authRoutes from './routes/authRoutes';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Trust the proxy in case of hosting platforms behind proxies, like Render/Vercel
app.set('trust proxy', true);

// Simple request logger
app.use((req, _res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads in development only (local FS)
if (process.env.NODE_ENV === 'development') {
    app.use('/uploads', express.static('uploads'));
}

// Healthcheck
app.get('/ping', (_req, res) => res.json({ status: 'ok' }));

// API Routes
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/hashtags', jewelryRoutes);

// Catch-all 404
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
