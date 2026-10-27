# Swagger UI & HTTP Request Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an interactive Swagger UI (`/api/docs`) and an executable `api-requests.http` test suite for live manual and automated verification of all REST endpoints, RBAC permissions, and MongoDB aggregations.

**Architecture:** Integrate `@nestjs/swagger` into the NestJS pipeline with Bearer authentication and OpenAPI metadata on controllers/DTOs, plus an executable `.http` client file supporting environment variables and sequential testing workflows.

**Tech Stack:** `@nestjs/swagger`, `swagger-ui-express`, REST Client (`.http`).

**Spec:** [docs/superpowers/specs/2026-10-27-api-testing-swagger-http-design.md](file:///home/mhcybroot/Projects/NoteTaking/docs/superpowers/specs/2026-10-27-api-testing-swagger-http-design.md)

## Global Constraints
- Swagger documentation must be accessible at `/api/docs`.
- Swagger must support JWT Bearer authorization (`Authorize` modal).
- Must preserve zero regressions across all 33 existing unit and E2E tests (`npm test && npm run test:e2e`).
- `api-requests.http` must demonstrate every requirement from `backend.pdf` (Auth, RBAC, Note ownership, Scenario 1 & 2 aggregations, pagination).

## Review Focus
1. Bearer Token Authorization: Swagger documentation allows setting the JWT token and passing `Authorization: Bearer <token>` to protected endpoints.
2. Ownership Error Cases in HTTP file: Requests demonstrate that User B editing User A's note receives HTTP 403 Forbidden.
3. Scenario 1 Aggregation in HTTP file: Demonstrates `GET /api/v1/users/by-interests` grouping users by interest.
4. Scenario 2 Aggregation in HTTP file: Demonstrates `GET /api/v1/posts/user/:userId` looking up author with single `$lookup`.
5. Non-regression of existing test suite: All tests remain green.

---

## Tasks

### Task 1: Install Swagger Dependencies & Configure OpenAPI in `main.ts`

**Files:**
- Modify: `package.json`
- Modify: `src/main.ts`
- Test: `test/common/swagger.spec.ts`

**Interfaces:**
- Produces: Swagger document mounted at `/api/docs` with `addBearerAuth()` configuration.

- [ ] **Step 1: Write test verifying Swagger document builder configuration**

```typescript
// test/common/swagger.spec.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('Swagger Configuration', () => {
  it('should build OpenAPI document with Bearer auth and API metadata', () => {
    const config = new DocumentBuilder()
      .setTitle('Secure Note-Taking API')
      .setDescription('Production REST API with Clean Layered Architecture')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    expect(config.info.title).toBe('Secure Note-Taking API');
    expect(config.components?.securitySchemes).toHaveProperty('bearer');
  });
});
```

- [ ] **Step 2: Run test to verify it fails before installing packages**

Run: `npm test test/common/swagger.spec.ts`  
Expected: FAIL ("Cannot find module '@nestjs/swagger'")

- [ ] **Step 3: Install `@nestjs/swagger` and `swagger-ui-express` and configure in `src/main.ts`**

Run: `npm install @nestjs/swagger swagger-ui-express`  
Update `src/main.ts` with `SwaggerModule.setup('api/docs', app, document)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test test/common/swagger.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/main.ts test/common/swagger.spec.ts
git commit -m "feat(docs): install @nestjs/swagger and mount Swagger UI on /api/docs"
```

---

### Task 2: Annotate Controllers & DTOs with OpenAPI Metadata

**Files:**
- Modify: `src/auth/auth.controller.ts`
- Modify: `src/users/users.controller.ts`
- Modify: `src/notes/notes.controller.ts`
- Modify: `src/posts/posts.controller.ts`
- Modify: DTOs in `src/auth/dto/`, `src/users/dto/`, `src/notes/dto/`, `src/posts/dto/`

**Interfaces:**
- Produces: Tagged and typed OpenAPI endpoint definitions with response schemas.

- [ ] **Step 1: Annotate Controllers with `@ApiTags()`, `@ApiOperation()`, `@ApiBearerAuth()` and DTOs with `@ApiProperty()`**

Decorate `AuthController`, `UsersController`, `NotesController`, `PostsController` with Swagger metadata.

- [ ] **Step 2: Run unit and E2E test suites to verify zero regressions**

Run: `npm test && npm run test:e2e`  
Expected: All tests pass.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npm run build`  
Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat(docs): add OpenAPI schema annotations to controllers and DTOs"
```

---

### Task 3: Create Executable `api-requests.http` Testing File

**Files:**
- Create: `api-requests.http`

**Interfaces:**
- Produces: Executable HTTP testing workbook covering:
  - Base URL configuration (`@baseUrl = http://localhost:3000/api/v1`)
  - Admin login & token capture
  - User A & User B registration & token capture
  - Note creation, pagination, and ownership verification (403 on foreign note edit/delete)
  - Admin view of all notes
  - Scenario 1 Aggregation (`/users/by-interests`)
  - Post creation and Scenario 2 Aggregation (`/posts/user/:userId`)

- [ ] **Step 1: Write `api-requests.http` with complete end-to-end testing workflows**

- [ ] **Step 2: Commit**

```bash
git add api-requests.http
git commit -m "test: add comprehensive api-requests.http test client workbook"
```
