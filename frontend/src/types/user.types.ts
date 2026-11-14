export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface UserListResponse {
  success: boolean;
  users: User[];
}

export interface SingleUserResponse {
  success: boolean;
  user: User;
}
