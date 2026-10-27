# Secure Note-Taking Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, scalable, production-grade REST API for a Secure Note-Taking application with clean layered architecture, strict RBAC, explicit Mongoose indexing, and MongoDB aggregation pipelines.

**Architecture:** NestJS enterprise clean layered architecture separating HTTP routing (Controllers), validation (Inbound DTOs with `class-validator`), outbound formatting (ViewModels/Serializers), business logic & RBAC (Services), and database operations (Repositories over Mongoose models).

**Tech Stack:** Node.js, TypeScript, NestJS, Mongoose, MongoDB, Passport-JWT, bcrypt, Jest, Supertest, Docker.

**Spec:** [docs/superpowers/specs/2026-10-27-secure-note-taking-backend-design.md](file:///home/mhcybroot/Projects/NoteTaking/docs/superpowers/specs/2026-10-27-secure-note-taking-backend-design.md)

## Global Constraints

- Must define all database indexes using Mongoose's explicit `schema.index(...)` calls.
- Strict indexing efficiency: Zero redundant or unused indexes.
- Standardized pagination required on all list endpoints (`page`, `limit`, returning items, total, page, limit, totalPages).
- Scenario 1 (group by interests) must execute in exactly one `collection.aggregate()` call.
- Scenario 2 (user posts) must use a single aggregation pipeline with a `$lookup` stage.
- Public registration (`POST /auth/register`) must never allow self-assigning `role: 'admin'`.
- Admins can view all notes across users, but note edits (`PATCH`) and deletes (`DELETE`) strictly enforce ownership (`note.owner == currentUserId`).
- Containerized for seamless deployment to Dokploy on a dedicated VPS.

## Review Focus

1. **Privilege Escalation via Registration:** An attacker submits `{ "role": "admin" }` to `POST /api/v1/auth/register`; the API must strip or reject it, always defaulting the user to `'user'`.
2. **Note Ownership Enforcement:** User A submits `PATCH /api/v1/notes/:id` or `DELETE /api/v1/notes/:id` targeting User B's note; service must return `403 Forbidden` (and Admin must also be forbidden from altering/deleting foreign notes).
3. **Compound Index Usage on Paginated Notes:** User queries `GET /api/v1/notes?page=1&limit=10`; MongoDB must utilize `NoteSchema.index({ owner: 1, createdAt: -1 })` with zero in-memory sort stage.
4. **Aggregation Single-Call Integrity:** Endpoint `GET /api/v1/users/by-interests` executes exactly one `aggregate()` pipeline and properly handles users with empty or missing interest arrays.
5. **ViewModel Data Leaks:** Outbound responses on user or auth endpoints must never leak `password` hash, internal salt, or Mongoose `__v`.

---

## Tasks

### Task 1: Project Scaffolding & Core Infrastructure (Config, Validation, Global Filters)

**Files:**
- Create: `package.json`, `tsconfig.json`, `nest-cli.json`, `.env.example`, `.env`
- Create: `src/main.ts`
- Create: `src/app.module.ts`
- Create: `src/common/dto/pagination-query.dto.ts`
- Create: `src/common/interfaces/paginated-response.interface.ts`
- Create: `src/common/filters/all-exceptions.filter.ts`
- Create: `src/common/interceptors/transform.interceptor.ts`
- Test: `test/common/all-exceptions.filter.spec.ts`

**Interfaces:**
- Produces: `PaginationQueryDto` (`page: number`, `limit: number`, `sortBy?: string`, `sortOrder?: 'asc' | 'desc'`)
- Produces: `PaginatedResponse<T>` (`items: T[]`, `total: number`, `page: number`, `limit: number`, `totalPages: number`)
- Produces: `AllExceptionsFilter` (`catch(exception, host)`) standardizing error responses: `{ statusCode, message, error, timestamp }`

- [ ] **Step 1: Write the failing test for `AllExceptionsFilter`**

```typescript
// test/common/all-exceptions.filter.spec.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  it('should format HttpExceptions into standardized JSON response', () => {
    const filter = new AllExceptionsFilter();
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/test' }),
      }),
    } as any;

    filter.catch(new HttpException('Forbidden', HttpStatus.FORBIDDEN), mockHost);
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Forbidden',
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test test/common/all-exceptions.filter.spec.ts`  
Expected: FAIL ("Cannot find module .../all-exceptions.filter")

- [ ] **Step 3: Implement dependencies, project setup, and common filters**

Initialize `package.json` with `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/mongoose`, `mongoose`, `@nestjs/config`, `class-validator`, `class-transformer`, `bcrypt`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`.  
Implement `AllExceptionsFilter`, `TransformInterceptor`, `PaginationQueryDto`, `PaginatedResponse`, and bootstrap `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in `main.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test test/common/all-exceptions.filter.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json nest-cli.json src/ test/ .env.example
git commit -m "feat(core): scaffold project, global exception filter, and pagination dto"
```

---

### Task 2: Users Module Data Layer & Strict Indexing Strategy

**Files:**
- Create: `src/users/schemas/user.schema.ts`
- Create: `src/users/dto/create-user.dto.ts`
- Create: `src/users/dto/update-user.dto.ts`
- Create: `src/users/view-models/user.view-model.ts`
- Create: `src/users/repositories/users.repository.ts`
- Test: `test/users/user.schema.spec.ts`

**Interfaces:**
- Consumes: `PaginationQueryDto`, `PaginatedResponse`
- Produces: `UserSchema` with explicit `UserSchema.index({ email: 1 }, { unique: true })`, `UserSchema.index({ createdAt: -1 })`, `UserSchema.index({ interests: 1 })`
- Produces: `UsersRepository` (`create`, `findByEmail`, `findById`, `findAllPaginated`, `updateById`, `deleteById`)
- Produces: `UserViewModel` (`toViewModel(userDoc): UserResponse`)

- [ ] **Step 1: Write failing test verifying exact Mongoose indexes on UserSchema**

```typescript
// test/users/user.schema.spec.ts
import { UserSchema } from '../../src/users/schemas/user.schema';

describe('UserSchema Indexing Strategy', () => {
  it('should define exactly the required indexes with schema.index()', () => {
    const indexes = UserSchema.indexes();
    const indexFields = indexes.map(([spec]) => spec);

    // Verify email unique index
    expect(indexFields).toContainEqual({ email: 1 });
    // Verify createdAt chronological sort index
    expect(indexFields).toContainEqual({ createdAt: -1 });
    // Verify interests multikey index
    expect(indexFields).toContainEqual({ interests: 1 });
    // Ensure no redundant compound or unnecessary indexes exist
    expect(indexes.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test test/users/user.schema.spec.ts`  
Expected: FAIL ("Cannot find module .../user.schema")

- [ ] **Step 3: Implement `UserSchema`, DTOs, ViewModel, and `UsersRepository`**

Define `User` class with `@Prop()` for `email`, `password`, `name`, `role` (`'user' | 'admin'`), and `interests: string[]`.  
Register indexes explicitly with `UserSchema.index({ email: 1 }, { unique: true })`, `UserSchema.index({ createdAt: -1 })`, and `UserSchema.index({ interests: 1 })`.  
Implement `UsersRepository` with Mongoose query execution and `UserViewModel` mapping that omits `password`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test test/users/user.schema.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/users/ test/users/
git commit -m "feat(users): define user schema with verified explicit indexes, DTOs, and repository"
```

---

### Task 3: Auth Module, RBAC Guards & Startup Admin Seeder

**Files:**
- Create: `src/auth/auth.module.ts`
- Create: `src/auth/auth.service.ts`
- Create: `src/auth/auth.controller.ts`
- Create: `src/auth/dto/register.dto.ts`
- Create: `src/auth/dto/login.dto.ts`
- Create: `src/auth/strategies/jwt.strategy.ts`
- Create: `src/auth/guards/jwt-auth.guard.ts`
- Create: `src/auth/guards/roles.guard.ts`
- Create: `src/auth/decorators/roles.decorator.ts`
- Create: `src/auth/decorators/current-user.decorator.ts`
- Create: `src/auth/services/bootstrap.service.ts`
- Test: `test/auth/auth.service.spec.ts`
- Test: `test/auth/roles.guard.spec.ts`

**Interfaces:**
- Consumes: `UsersRepository`, `UserViewModel`
- Produces: `AuthService.register(dto: RegisterDto): Promise<AuthResult>` (forces `role: 'user'`)
- Produces: `AuthService.login(dto: LoginDto): Promise<AuthResult>` (verifies `bcrypt.compare`)
- Produces: `RolesGuard` checking `@Roles('admin' | 'user')` against `req.user.role`
- Produces: `BootstrapService.onApplicationBootstrap()` seeding admin from `.env` if none exists

- [ ] **Step 1: Write failing test verifying role escalation prevention in `AuthService.register`**

```typescript
// test/auth/auth.service.spec.ts
import { AuthService } from '../../src/auth/auth.service';

describe('AuthService Registration', () => {
  it('should ignore or forbid role in register payload and default role to user', async () => {
    const mockUsersRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: 'mockId' })),
    };
    const mockJwtService = { sign: jest.fn().mockReturnValue('mockToken') };
    const authService = new AuthService(mockUsersRepo as any, mockJwtService as any);

    const payload: any = {
      email: 'attacker@test.com',
      password: 'password123',
      name: 'Attacker',
      role: 'admin', // Malicious attempt to self-promote
    };

    await authService.register(payload);
    expect(mockUsersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'attacker@test.com',
        role: 'user', // MUST be 'user'
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test test/auth/auth.service.spec.ts`  
Expected: FAIL ("Cannot find module .../auth.service")

- [ ] **Step 3: Implement Auth module, JWT strategy, RBAC guards, and `BootstrapService`**

Implement `bcrypt.hash` (10 rounds), `bcrypt.compare`, JWT issuing (`access_token`), `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, and `BootstrapService` that seeds `admin` user on boot.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test test/auth/auth.service.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/auth/ test/auth/
git commit -m "feat(auth): implement JWT auth, RBAC guards, admin bootstrap, and registration hardening"
```

---

### Task 4: Users Management & Scenario 1 Aggregation (Group by Interests)

**Files:**
- Create: `src/users/users.module.ts`
- Create: `src/users/users.service.ts`
- Create: `src/users/users.controller.ts`
- Create: `src/users/dto/create-user-by-admin.dto.ts`
- Modify: `src/users/repositories/users.repository.ts` (add `groupByInterests` aggregation)
- Test: `test/users/users.aggregation.spec.ts`

**Interfaces:**
- Consumes: `UsersRepository`, `RolesGuard`, `JwtAuthGuard`
- Produces: `GET /api/v1/users/by-interests` (Single `collection.aggregate()` call)
- Produces: `POST /api/v1/users` (Admin: add user with explicit role)
- Produces: `GET /api/v1/users` (Admin: paginated users list)
- Produces: `GET /api/v1/users/me` and `PATCH /api/v1/users/me` (User self profile)

- [ ] **Step 1: Write failing test verifying Scenario 1 single aggregation pipeline**

```typescript
// test/users/users.aggregation.spec.ts
import { UsersRepository } from '../../src/users/repositories/users.repository';

describe('UsersRepository - Scenario 1 Aggregation', () => {
  it('should call aggregate exactly once with the match, unwind, group, sort, project pipeline', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { interest: 'chess', count: 2, users: [{ id: '1', name: 'Alice' }] },
    ]);
    const mockUserModel = { aggregate: mockAggregate };
    const repo = new UsersRepository(mockUserModel as any);

    const result = await repo.groupByInterests();

    expect(mockAggregate).toHaveBeenCalledTimes(1);
    const pipeline = mockAggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual({ $match: { 'interests.0': { $exists: true } } });
    expect(pipeline[1]).toEqual({ $unwind: '$interests' });
    expect(pipeline[2]).toHaveProperty('$group');
    expect(pipeline[3]).toHaveProperty('$sort');
    expect(pipeline[4]).toHaveProperty('$project');
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test test/users/users.aggregation.spec.ts`  
Expected: FAIL ("repo.groupByInterests is not a function")

- [ ] **Step 3: Implement `groupByInterests` aggregation pipeline in `UsersRepository`, `UsersService`, and `UsersController`**

Add single `aggregate()` pipeline in `UsersRepository`. Add Admin user management endpoints (`POST /api/v1/users`, `GET /api/v1/users`, `GET /api/v1/users/:id`, `PATCH /api/v1/users/:id`, `DELETE /api/v1/users/:id`) and User profile endpoints (`GET /api/v1/users/me`, `PATCH /api/v1/users/me`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test test/users/users.aggregation.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/users/ test/users/
git commit -m "feat(users): implement admin user management and scenario 1 interest grouping aggregation"
```

---

### Task 5: Notes Module & Note Ownership RBAC Enforcement

**Files:**
- Create: `src/notes/schemas/note.schema.ts`
- Create: `src/notes/dto/create-note.dto.ts`
- Create: `src/notes/dto/update-note.dto.ts`
- Create: `src/notes/dto/note-query.dto.ts`
- Create: `src/notes/view-models/note.view-model.ts`
- Create: `src/notes/repositories/notes.repository.ts`
- Create: `src/notes/notes.service.ts`
- Create: `src/notes/notes.controller.ts`
- Create: `src/notes/notes.module.ts`
- Test: `test/notes/note.schema.spec.ts`
- Test: `test/notes/notes.service.spec.ts`

**Interfaces:**
- Produces: `NoteSchema.index({ owner: 1, createdAt: -1 })` and `NoteSchema.index({ createdAt: -1 })`
- Produces: `NotesService.findUserNotes(userId, pagination)`
- Produces: `NotesService.findAllNotes(pagination, filterOwner?)` (Admin only)
- Produces: `NotesService.updateNote(noteId, userId, updateDto)` (Enforces `note.owner == userId`)
- Produces: `NotesService.deleteNote(noteId, userId)` (Enforces `note.owner == userId`)

- [ ] **Step 1: Write failing test for NoteSchema indexing and Note ownership authorization**

```typescript
// test/notes/notes.service.spec.ts
import { ForbiddenException } from '@nestjs/common';
import { NotesService } from '../../src/notes/notes.service';

describe('NotesService Ownership Enforcement', () => {
  it('should throw 403 Forbidden when a user attempts to update a note owned by another user', async () => {
    const mockNotesRepo = {
      findById: jest.fn().mockResolvedValue({
        _id: 'note123',
        title: 'Original Title',
        owner: { toString: () => 'ownerUser456' },
      }),
    };
    const service = new NotesService(mockNotesRepo as any);

    await expect(
      service.updateNote('note123', 'differentUser789', { title: 'Hacked' })
    ).rejects.toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test test/notes/notes.service.spec.ts`  
Expected: FAIL ("Cannot find module .../notes.service")

- [ ] **Step 3: Implement NoteSchema, compound indexing, DTOs, Repository, Service, and Controller**

Define `NoteSchema` with:
- `NoteSchema.index({ owner: 1, createdAt: -1 })`
- `NoteSchema.index({ createdAt: -1 })`
In `NotesService`, verify ownership on `updateNote` and `deleteNote` throwing `ForbiddenException` if `owner.toString() !== userId`. In `NotesController`, allow Admin to query all notes with `GET /api/v1/notes` and regular users to list their own notes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test test/notes/notes.service.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/notes/ test/notes/
git commit -m "feat(notes): implement note schema with compound indexing, CRUD, and strict ownership checks"
```

---

### Task 6: Posts Module & Scenario 2 Aggregation ($lookup Pipeline)

**Files:**
- Create: `src/posts/schemas/post.schema.ts`
- Create: `src/posts/dto/create-post.dto.ts`
- Create: `src/posts/dto/post-query.dto.ts`
- Create: `src/posts/view-models/post.view-model.ts`
- Create: `src/posts/repositories/posts.repository.ts`
- Create: `src/posts/posts.service.ts`
- Create: `src/posts/posts.controller.ts`
- Create: `src/posts/posts.module.ts`
- Test: `test/posts/post.schema.spec.ts`
- Test: `test/posts/posts.aggregation.spec.ts`

**Interfaces:**
- Produces: `PostSchema.index({ author: 1, createdAt: -1 })` and `PostSchema.index({ createdAt: -1 })`
- Produces: `PostsRepository.findByUserWithLookup(userId: string)` (Single aggregation pipeline with `$lookup`)
- Produces: `GET /api/v1/posts/user/:userId`

- [ ] **Step 1: Write failing test verifying Scenario 2 single aggregation with $lookup**

```typescript
// test/posts/posts.aggregation.spec.ts
import { Types } from 'mongoose';
import { PostsRepository } from '../../src/posts/repositories/posts.repository';

describe('PostsRepository - Scenario 2 Aggregation', () => {
  it('should execute a single aggregation pipeline using $lookup stage', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      {
        _id: 'post1',
        title: 'First Post',
        author: { _id: 'user1', name: 'John Doe', email: 'john@test.com' },
      },
    ]);
    const mockPostModel = { aggregate: mockAggregate };
    const repo = new PostsRepository(mockPostModel as any);

    const targetUserId = new Types.ObjectId().toString();
    const result = await repo.findByUserWithLookup(targetUserId);

    expect(mockAggregate).toHaveBeenCalledTimes(1);
    const pipeline = mockAggregate.mock.calls[0][0];
    expect(pipeline[0]).toHaveProperty('$match');
    expect(pipeline[1]).toHaveProperty('$sort');
    expect(pipeline[2]).toHaveProperty('$lookup');
    expect(pipeline[2].$lookup).toEqual(
      expect.objectContaining({
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
      })
    );
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test test/posts/posts.aggregation.spec.ts`  
Expected: FAIL ("repo.findByUserWithLookup is not a function")

- [ ] **Step 3: Implement PostSchema, compound index, DTOs, Repository, Service, and Controller**

Define `PostSchema` with `PostSchema.index({ author: 1, createdAt: -1 })` and `PostSchema.index({ createdAt: -1 })`.  
Implement `findByUserWithLookup` with `$match`, `$sort`, `$lookup`, `$unwind`, and `$project`. Expose `GET /api/v1/posts/user/:userId`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test test/posts/posts.aggregation.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/posts/ test/posts/
git commit -m "feat(posts): implement post schema, public feed, and scenario 2 $lookup aggregation"
```

---

### Task 7: Production Dockerization, Dokploy Configuration & E2E Verification Suite

**Files:**
- Create: `Dockerfile` (Multi-stage build)
- Create: `docker-compose.yml` (App + MongoDB 7)
- Create: `.dockerignore`
- Create: `test/e2e/auth-rbac.e2e-spec.ts`
- Create: `test/e2e/notes-ownership.e2e-spec.ts`
- Create: `test/e2e/aggregations.e2e-spec.ts`
- Create: `scripts/verify-indexes.ts`

**Interfaces:**
- Produces: Docker build producing lean production image for Dokploy VPS deployment.
- Produces: `npm run test:e2e` exercising complete API flows.
- Produces: `npm run verify:indexes` printing index lists for `users`, `notes`, `posts`.

- [ ] **Step 1: Write E2E test verifying RBAC note access isolation**

```typescript
// test/e2e/notes-ownership.e2e-spec.ts
import * as request from 'supertest';
// E2E test suite connecting to test app:
// 1. Register User A and User B
// 2. User A creates a note
// 3. User B attempts to GET/PATCH/DELETE User A's note -> 403 Forbidden
// 4. Admin GETs User A's note -> 200 OK
// 5. Admin attempts PATCH User A's note -> 403 Forbidden
```

- [ ] **Step 2: Run E2E test to verify it executes against the application**

Run: `npm run test:e2e test/e2e/notes-ownership.e2e-spec.ts`  
Expected: PASS (or FAIL until test database is configured)

- [ ] **Step 3: Create multi-stage `Dockerfile` and `docker-compose.yml` for Dokploy**

Write multi-stage `Dockerfile`:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```
Configure `docker-compose.yml` with health checks, environment variables, and persistent MongoDB volumes.

- [ ] **Step 4: Execute full test suite and index verification**

Run: `npm run test`  
Run: `npm run build`  
Expected: All tests pass, build succeeds with zero TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore test/e2e/ scripts/
git commit -m "chore(deploy): add multi-stage Dockerfile, Dokploy docker-compose, and full E2E test suite"
```
