import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import prisma from './config/database';
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import {
  transactionRoutes,
  reservationRoutes,
  fineRoutes,
  memberRoutes,
  dashboardRoutes,
  authorRoutes,
  categoryRoutes,
  publisherRoutes,
  notificationRoutes,
  settingsRoutes,
  reportRoutes,
} from './routes/index';

const app = express();

// Trust proxy — required when running behind Render/Vercel/Nginx reverse proxies
// Without this, express-rate-limit sees the proxy IP instead of the client IP
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — in production, CLIENT_URL is the Vercel deployment URL
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later', error: 'TOO_MANY_REQUESTS' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts', error: 'TOO_MANY_REQUESTS' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging — use 'combined' format in production for full access logs, 'dev' for development
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/publishers', publisherRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);

// Health check — also verifies DB connectivity for hosting platform monitoring
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'Server is running',
      database: 'connected',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Server is running but database is unreachable',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', error: 'NOT_FOUND' });
});

// Start server
app.listen(config.port, () => {
  console.log(`\n🚀 Server running on port ${config.port}`);
  console.log(`📚 Library Management System API`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📡 Client URL: ${config.clientUrl}\n`);
});

export default app;

