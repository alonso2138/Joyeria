import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import jewelryRoutes from './routes/jewelryRoutes';
import authRoutes from './routes/authRoutes';
import customRequestRoutes from './routes/customRequestRoutes';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/custom-requests', customRequestRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
