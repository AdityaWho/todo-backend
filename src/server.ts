import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import todoRoutes from './routes/todos';
import welcomeRoutes from './routes/welcome';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo-app';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

let isConnected = false;

// Middleware - CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin === 'http://localhost:4200') {
      return callback(null, true);
    }

    // Allow all Cloudflare Pages domains
    if (origin.endsWith('.pages.dev')) {
      return callback(null, true);
    }

    // Allow custom domain
    if (origin === 'https://aditya.rtxsecured.com' || origin === 'http://aditya.rtxsecured.com') {
      return callback(null, true);
    }

    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', authRoutes);
app.use('/api', todoRoutes);
app.use('/api', welcomeRoutes);

// Health check with MongoDB status
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    mongodb: isConnected ? 'connected' : 'disconnected'
  });
});

// MongoDB connection with retry logic
async function connectWithRetry(retries = 0): Promise<void> {
  try {
    console.log(`Attempting to connect to MongoDB... (attempt ${retries + 1}/${MAX_RETRIES})`);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('✓ Connected to MongoDB successfully');

  } catch (error) {
    isConnected = false;
    console.error(`✗ MongoDB connection error (attempt ${retries + 1}/${MAX_RETRIES}):`, error instanceof Error ? error.message : error);

    if (retries < MAX_RETRIES - 1) {
      console.log(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
      setTimeout(() => connectWithRetry(retries + 1), RETRY_INTERVAL);
    } else {
      console.error('\n❌ Failed to connect to MongoDB after maximum retries');
      console.error('Please check:');
      console.error('1. MongoDB Atlas IP whitelist includes Render IPs (or use 0.0.0.0/0 for all IPs)');
      console.error('2. MongoDB URI is correct in environment variables');
      console.error('3. MongoDB Atlas cluster is running');
      console.error('\nServer will continue running, but database operations will fail.\n');
    }
  }
}

// Handle MongoDB disconnection
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry(0);
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('MongoDB connection error:', err);
});

// Start server immediately and connect to MongoDB in background
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\nAttempting to connect to MongoDB...\n`);

  // Start MongoDB connection
  connectWithRetry(0);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
