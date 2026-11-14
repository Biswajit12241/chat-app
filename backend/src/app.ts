import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import chatRoutes from './modules/chat/chat.routes';
import userRoutes from './modules/users/user.routes';
import { errorHandler } from './middleware/error.middleware';
import { ApiError } from './utils/ApiError';

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/chat', chatRoutes);
app.use('/user', userRoutes);
app.use('/users', userRoutes);

// 404 Route Handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Global Error Handler
app.use(errorHandler);

export default app;
