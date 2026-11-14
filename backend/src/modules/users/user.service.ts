import { UserRepository } from './user.repository';
import { User } from './user.types';
import { ApiError } from '../../utils/ApiError';

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.findAll();
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw ApiError.notFound(`User with id ${id} not found`);
    }
    return user;
  }

  async validateUsersExist(userAId: number, userBId: number): Promise<{ userA: User; userB: User }> {
    const users = await this.userRepo.findByIds([userAId, userBId]);
    const userA = users.find((u) => u.id === userAId);
    const userB = users.find((u) => u.id === userBId);

    if (!userA) {
      throw ApiError.notFound(`User with id ${userAId} does not exist`);
    }
    if (!userB) {
      throw ApiError.notFound(`User with id ${userBId} does not exist`);
    }

    return { userA, userB };
  }
}
