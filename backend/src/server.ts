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

// Simple request logger + timing
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[Request] ${req.method} ${req.url} - incoming`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[Request] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });

    next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static('uploads'));

// Healthcheck endpoint for diagnostics
app.get('/ping', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/auth', authRoutes);
// A simple route for getting all unique hashtags
app.use('/api/hashtags', jewelryRoutes);


// Global error handling for unhandled exceptions (safer for production to exit and let process manager restart)
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION', err);
    // Optionally exit the process to let the host restart it
    // process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION', reason);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
