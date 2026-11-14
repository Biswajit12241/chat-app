import { apiClient } from './api';
import type { User, UserListResponse, SingleUserResponse } from '../types/user.types';

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const res = await apiClient.get<UserListResponse>('/users');
    return res.data.users;
  },

  async getUserById(id: number): Promise<User> {
    const res = await apiClient.get<SingleUserResponse>(`/users/${id}`);
    return res.data.user;
  },
};
