import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/repositories/users.repository';
import { UserViewModel } from '../users/view-models/user.view-model';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthResult {
  user: any;
  access_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersRepository.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // CRITICAL: Force role to 'user' on public registration to eliminate privilege escalation
    const createdUser = await this.usersRepository.create({
      email: registerDto.email.toLowerCase().trim(),
      password: hashedPassword,
      name: registerDto.name.trim(),
      role: 'user',
      interests: registerDto.interests || [],
    });

    const token = this.generateToken(createdUser);
    return {
      user: UserViewModel.toViewModel(createdUser),
      access_token: token,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const user = await this.usersRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);
    return {
      user: UserViewModel.toViewModel(user),
      access_token: token,
    };
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user._id?.toString() || user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
