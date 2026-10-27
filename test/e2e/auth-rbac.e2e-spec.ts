import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/register - should reject registration with role field (forbidNonWhitelisted prevents privilege escalation)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `escalate_${Date.now()}@test.com`,
        password: 'Password123!',
        name: 'Attacker',
        role: 'admin', // Non-whitelisted field
      })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  it('POST /api/v1/auth/register - should successfully register a regular user without role field', async () => {
    const uniqueEmail = `valid_user_${Date.now()}@test.com`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail,
        password: 'Password123!',
        name: 'Regular User',
        interests: ['coding', 'music'],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(uniqueEmail);
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.data.user.password).toBeUndefined(); // Never leak password hash
    expect(res.body.data.access_token).toBeDefined();

    userToken = res.body.data.access_token;
  });

  it('POST /api/v1/auth/login - should authenticate admin seeded on startup', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@notetaking.local',
        password: 'AdminSecurePassword123!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.access_token).toBeDefined();

    adminToken = res.body.data.access_token;
  });

  it('GET /api/v1/users/me - should allow authenticated regular user to fetch own profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.interests).toContain('coding');
  });

  it('GET /api/v1/users - should forbid regular user from listing all users (403)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('GET /api/v1/users - should allow admin to list all users paginated (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(10);
  });
});
