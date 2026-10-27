import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

describe('MongoDB Aggregations (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let userId: string;

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

    // Register User with interests
    const resUser = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `agg_user_${Date.now()}@test.com`,
        password: 'Password123!',
        name: 'Agg User',
        interests: ['chess', 'reading'],
      });

    userToken = resUser.body.data.access_token;
    userId = resUser.body.data.user.id;

    // Create posts for this user
    await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Post 1: Learning MongoDB Aggregations',
        content: 'Deep dive into $lookup and $group stages',
      });

    await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Post 2: Indexing Strategy in Production',
        content: 'Why ESR rule matters for compound indexes',
      });
  });

  afterAll(async () => {
    await app.close();
  });

  it('Scenario 1: GET /api/v1/users/by-interests - groups users by interests in single aggregate call', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/by-interests')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);

    const chessGroup = res.body.data.find((g: any) => g.interest === 'chess');
    expect(chessGroup).toBeDefined();
    expect(chessGroup.count).toBeGreaterThanOrEqual(1);
    expect(chessGroup.users).toBeInstanceOf(Array);
  });

  it('Scenario 2: GET /api/v1/posts/user/:userId - retrieves user posts using single aggregation with $lookup', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/posts/user/${userId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const firstPost = res.body.data[0];
    expect(firstPost).toHaveProperty('title');
    expect(firstPost).toHaveProperty('content');
    expect(firstPost).toHaveProperty('author');
    expect(firstPost.author).toHaveProperty('name', 'Agg User');
    expect(firstPost.author).toHaveProperty('email');
  });
});
