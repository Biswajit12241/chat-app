import dotenv from 'dotenv';
import path from 'path';

// Load environment variables early
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app';
import { testDatabaseConnection } from './config/database';
import { testFirebaseConnection } from './config/firebase';

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap(): Promise<void> {
  try {
    console.log('--- Initializing Chat Application Backend ---');

    // Test MySQL Database Connection
    await testDatabaseConnection();

    // Test Firebase Firestore Connection
    await testFirebaseConnection();

    const server = app.listen(PORT, () => {
      console.log(`[Server] Backend REST API running successfully on port ${PORT}`);
      console.log(`[Server] Base URL: http://localhost:${PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

bootstrap();
