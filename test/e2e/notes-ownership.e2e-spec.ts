import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

describe('Notes Ownership & RBAC (e2e)', () => {
  let app: INestApplication;
  let userAToken: string;
  let userBToken: string;
  let adminToken: string;
  let noteAId: string;

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

    // Register User A
    const resA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `usera_${Date.now()}@test.com`,
        password: 'Password123!',
        name: 'User A',
      });
    userAToken = resA.body.data.access_token;

    // Register User B
    const resB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `userb_${Date.now()}@test.com`,
        password: 'Password123!',
        name: 'User B',
      });
    userBToken = resB.body.data.access_token;

    // Login Admin
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@notetaking.local',
        password: 'AdminSecurePassword123!',
      });
    adminToken = resAdmin.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Step 1: User A creates a note', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: "User A's Secret Note",
        content: 'Confidential thoughts and plans',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("User A's Secret Note");
    noteAId = res.body.data.id;
  });

  it("Step 2: User B tries to view User A's note -> 403 Forbidden", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(403);
  });

  it("Step 3: User B tries to edit User A's note -> 403 Forbidden", async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ title: 'Hacked by User B' })
      .expect(403);
  });

  it("Step 4: User B tries to delete User A's note -> 403 Forbidden", async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(403);
  });

  it("Step 5: Admin can view User A's note (PDF: Admin can view everyone's notes) -> 200 OK", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("User A's Secret Note");
  });

  it("Step 6: Admin CANNOT modify User A's note (Strict ownership enforcement) -> 403 Forbidden", async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Modified by Admin' })
      .expect(403);
  });

  it("Step 7: User A successfully updates their own note -> 200 OK", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Updated Title by User A' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Title by User A');
  });

  it("Step 8: User A successfully deletes their own note -> 200 OK", async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);
  });
});
