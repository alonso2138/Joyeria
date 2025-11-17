import mongoose from 'mongoose';
// FIX: Import the `process` object to provide correct TypeScript types for process.exit.
import process from 'process';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('MONGO_URI not defined in .env file');
            process.exit(1);
        }
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error('An unknown error occurred during DB connection');
        }
        process.exit(1);
    }
};

export default connectDB;
