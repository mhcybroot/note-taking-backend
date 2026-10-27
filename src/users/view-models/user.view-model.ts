import { UserDocument } from '../schemas/user.schema';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  interests: string[];
  createdAt?: string;
  updatedAt?: string;
}

export class UserViewModel {
  static toViewModel(user: UserDocument | any): UserResponse {
    if (!user) return null;
    return {
      id: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      interests: user.interests || [],
      createdAt: user.createdAt?.toISOString ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt?.toISOString ? user.updatedAt.toISOString() : user.updatedAt,
    };
  }

  static toViewModelList(users: (UserDocument | any)[]): UserResponse[] {
    return users.map((user) => this.toViewModel(user));
  }
}
