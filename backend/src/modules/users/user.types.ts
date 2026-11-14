import { RowDataPacket } from 'mysql2';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: Date | string;
}

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}
