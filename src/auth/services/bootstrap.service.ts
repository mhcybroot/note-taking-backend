import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../../users/repositories/users.repository';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository
  ) {}

  async onApplicationBootstrap() {
    await this.seedInitialAdmin();
  }

  async seedInitialAdmin(): Promise<void> {
    const adminEmail = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@notetaking.local'
    );
    const adminPassword = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'AdminSecurePassword123!'
    );

    const existingAdmin = await this.usersRepository.findByEmail(adminEmail);
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await this.usersRepository.create({
        email: adminEmail.toLowerCase().trim(),
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
        interests: ['system', 'administration', 'security'],
      });
      this.logger.log(`Default administrator seeded successfully: ${adminEmail}`);
    } else {
      this.logger.log(`Administrator already present: ${adminEmail}`);
    }
  }
}
