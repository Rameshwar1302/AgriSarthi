import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { router as apiRouter } from './routes/api.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[AgriSaarthi Error Handler]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

const PORT = Number(env.PORT) || 5000;

let isConnected = false;
export async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) return;
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully.');
  } catch (dbError: any) {
    console.warn(`⚠️ [MongoDB] Local/Atlas MongoDB not detected: ${dbError.message}`);
    console.log('🛡️ [Resilience Guard] Seamlessly operating in Zero-Crash In-Memory Store Mode with Maharashtra Demo Farmer pre-loaded!');
  }
}

// Auto-connect on serverless invocations (e.g. Vercel)
app.use(async (req, res, next) => {
  if (process.env.VERCEL) {
    await connectDB();
  }
  next();
});

// Resilient Server Startup
async function startServer() {
  console.log('--------------------------------------------------');
  console.log('🌾 Starting AgriSaarthi AI Backend Server...');
  console.log(`📡 Environment: ${env.NODE_ENV} | Port: ${PORT}`);
  console.log(`🤖 AI Provider: ${env.LLM_PROVIDER} (Gemini: ${env.GEMINI_API_KEY ? 'Configured' : 'Rule Fallback Mode'})`);
  console.log(`⚡ Demo Mode: ${env.DEMO_MODE ? 'ACTIVE (Resilient Seeds Enabled)' : 'OFF'}`);
  console.log('--------------------------------------------------');

  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 AgriSaarthi API listening on http://localhost:${PORT}`);
    console.log(`🩺 Health check available at: http://localhost:${PORT}/api/health`);
  });
}

export { app };
export default app;

if (!process.env.VERCEL) {
  startServer();
}

