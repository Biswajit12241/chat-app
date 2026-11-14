import { pool } from '../../config/database';
import { User, UserRow } from './user.types';
import { ResultSetHeader } from 'mysql2';

export class UserRepository {
  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [id]
    );

    const user = rows[0];
    if (!user) {
      return null;
    }

    return {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    };
  }

  async findByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.query<UserRow[]>(
      `SELECT id, name, email, created_at FROM users WHERE id IN (${placeholders})`,
      ids
    );

    return rows.map((user) => ({
      id: Number(user.id),
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    }));
  }

  async findAll(): Promise<User[]> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, name, email, created_at FROM users ORDER BY id ASC'
    );

    return rows.map((user) => ({
      id: Number(user.id),
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    }));
  }

  async create(name: string, email: string): Promise<User> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );

    return {
      id: result.insertId,
      name,
      email,
    };
  }
}
