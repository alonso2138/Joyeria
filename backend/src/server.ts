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

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/launch', executeRoutes);
app.use('/api/trigger', triggerRoutes);
app.use('/api/events', eventsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
