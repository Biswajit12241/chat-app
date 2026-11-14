import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'chat_app';

export const pool: Pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

/**
 * Executes a query with parameters using the connection pool.
 */
export async function executeQuery<T>(
  sql: string,
  params: (string | number | boolean | Date | null | Buffer)[] = []
): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

/**
 * Acquires a connection from the pool for transactions.
 */
export async function getTransactionConnection(): Promise<PoolConnection> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Tests MySQL connectivity.
 */
export async function testDatabaseConnection(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
    console.log(`[MySQL] Successfully connected to database: ${dbName} on ${dbHost}:${dbPort}`);
  } finally {
    connection.release();
  }
}
