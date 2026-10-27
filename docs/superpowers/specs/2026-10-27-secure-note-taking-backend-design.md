# Secure Note-Taking Application Backend Design Document

**Date:** 2026-10-27  
**Status:** In Review  
**Target Architecture:** NestJS + TypeScript Clean Layered Architecture  
**Deployment Target:** Dedicated VPS via Dokploy (Dockerized)  

---

## 1. Intent & Context
Build a robust, secure, and production-grade REST API backend for a Secure Note-Taking application. The primary evaluation criteria in the technical assessment (`backend.pdf`) focus on:
1. Strict Role-Based Access Control (RBAC): User vs. Admin.
2. Clean Layered Architecture with DTOs and ViewModels.
3. MongoDB & Mongoose indexing efficiency using explicit `schema.index(...)` calls without redundant/unnecessary indexes.
4. MongoDB Aggregation Pipelines (Interests grouping and `$lookup`-based user posts).
5. Dockerized production readiness for deployment on a dedicated VPS with Dokploy.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
* **Clean Layered Separation:**
  * **Presentation Layer:** Controllers (HTTP routing, status codes, OpenAPI/Swagger docs).
  * **Validation Layer:** Inbound Data Transfer Objects (DTOs) with `class-validator` and `class-transformer`.
  * **Serialization Layer:** ViewModels / Response Serializers that explicitly shape outgoing payloads and strip sensitive/internal data (`password`, `__v`, internal metadata).
  * **Application / Domain Layer:** Services encapsulating business logic, authorization rules, and pagination helpers.
  * **Data Access / Persistence Layer:** Mongoose schemas, explicit `schema.index(...)` definitions, and Repositories.
* **Authentication & RBAC:**
  * JWT access tokens issued on login/registration.
  * Secure password hashing with `bcrypt` (work factor 10+).
  * Guards: `JwtAuthGuard` and `RolesGuard` (`@Roles('admin', 'user')`).
* **Pagination:** Standardized across all list endpoints (`page`, `limit`, returning `items`, `total`, `page`, `limit`, `totalPages`).
* **Precise Indexing:** Every index must be justified by an exact query or aggregation pipeline; zero redundant indexes.
* **Aggregation Pipelines:**
  * Scenario 1: Group users by interests in exactly one `collection.aggregate()` call.
  * Scenario 2: Retrieve posts belonging to a user using a single aggregation pipeline with a `$lookup` stage.

### Non-Goals
* Frontend design or complex UI styling (the assessment explicitly states visual style is not a priority; frontend will be addressed separately).
* Advanced multi-factor authentication (MFA) or OAuth integrations (not requested).
* Complex microservices or messaging queues (monolithic clean modular architecture fits the scope).

### Anti-Goals
* Over-indexing: Creating compound indexes where existing prefix indexes suffice, or indexing fields never queried in filters or sorts.
* Leaking database entities: Returning raw Mongoose documents directly to HTTP clients instead of mapped ViewModels.
* Blurring controller/service boundaries: Placing database queries or aggregation stages directly inside controller handlers.

---

## 3. Approaches Considered & Selected Approach

### Approach A: NestJS Enterprise Clean Architecture (Selected)
* **Design:** Modular architecture (`AuthModule`, `UsersModule`, `NotesModule`, `PostsModule`, `CommonModule`).
* **Components:** Controllers $\rightarrow$ Services $\rightarrow$ Repositories $\rightarrow$ Mongoose Schemas.
* **Strengths:** 
  * Built-in Dependency Injection and module encapsulation.
  * First-class support for `ValidationPipe` with DTOs.
  * Interceptors for ViewModel transformations.
  * Docker-ready with Dokploy on dedicated VPS.
* **Why chosen:** Aligns directly with user's selection for scalable, manageable, senior-level TypeScript architecture.

### Approach B: Express + TypeScript Minimalist Clean Architecture (Alternative)
* **Design:** Handwritten layers with manual dependency wiring.
* **Strengths:** Very low boilerplate, instantly clear to raw Express reviewers.
* **Why discarded:** User selected NestJS with TypeScript for dedicated VPS deployment.

---

## 4. System Architecture & Layers

```
[ HTTP Request ]
       │
       ▼
[ NestJS ValidationPipe ]  <── Inbound DTOs (class-validator)
       │
       ▼
[ Controllers ]            <── Route handlers, status codes, Guards (JWT, Roles)
       │
       ▼
[ Application Services ]   <── Business logic, RBAC checks, Pagination calculation
       │
       ▼
[ Repositories ]           <── Query construction, Aggregation pipelines, DB abstraction
       │
       ▼
[ Mongoose Models ]        <── Schema definition, schema.index(...)
       │
       ▼
[ MongoDB Database ]
       │
[ ViewModel / Serializer ] <── Formats outgoing payload, strips sensitive data (e.g. password)
       │
       ▼
[ HTTP Response ]
```

### Module Breakdown
1. **Common / Core Module:**
   * Global Exception Filter (standardized error responses: `{ statusCode, message, error, timestamp }`).
   * Response Transform Interceptor (standardized success envelope and ViewModel mapping).
   * Pagination DTO (`PaginationQueryDto`: `page`, `limit`, `sortBy`, `sortOrder`).
   * Base paginated response interface (`PaginatedResponse<T>`).
2. **Auth Module:**
   * `AuthController`: Register, Login, Refresh/Profile.
   * `AuthService`: Credential verification, password hashing (`bcrypt`), JWT signing.
   * `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()` decorators.
3. **Users Module:**
   * `UsersController`:
     * Admin:
       * `POST /api/v1/users`: Add user with explicit role and initial password (implements PDF requirement: *"Admin can manage users (add, remove, update, and list all users)"*).
       * `GET /api/v1/users`: List users (paginated).
       * `GET /api/v1/users/:id`: Get user by ID.
       * `PATCH /api/v1/users/:id`: Update user role/profile.
       * `DELETE /api/v1/users/:id`: Delete user.
     * User:
       * `GET /api/v1/users/me`: Get self profile.
       * `PATCH /api/v1/users/me`: Update self profile (including `interests`).
     * Aggregation 1:
       * `GET /api/v1/users/by-interests`: Group users by interests view.
   * `UsersService` & `UsersRepository`.
4. **Notes Module:**
   * `NotesController`:
     * User:
       * `POST /api/v1/notes`: Create note.
       * `GET /api/v1/notes`: Get my notes (paginated).
       * `GET /api/v1/notes/:id`: Get note by ID (own).
       * `PATCH /api/v1/notes/:id`: Update note (own only).
       * `DELETE /api/v1/notes/:id`: Delete note (own only).
     * Admin:
       * `GET /api/v1/notes`: Can view all notes across all users (paginated, with optional `owner` filter) — strictly implements PDF requirement: *"Can view everyone's notes"*.
       * `GET /api/v1/notes/:id`: Can view any user's note.
       * **Permission boundary:** Admins CANNOT modify or delete another user's notes (`PATCH`/`DELETE` strictly enforce `note.owner == currentUserId`).
   * `NotesService` & `NotesRepository`.
5. **Posts Module:**
   * `PostsController`:
     * Create post, List public posts (paginated).
     * Aggregation 2: `GET /posts/by-user/:userId` (fetches posts for user using single aggregation with `$lookup`).
   * `PostsService` & `PostsRepository`.

---

## 5. Data Modeling & Strict Indexing Strategy

To comply with the critical constraint (**"DO NOT MAKE ANY UNNECESSARY INDEXES"**), every index is mapped directly to a specific query pattern.

### 5.1 Users Collection (`users`)
* **Fields:**
  * `email`: String (required, lowercase, trim)
  * `password`: String (required, bcrypt hash)
  * `name`: String (required, trim)
  * `role`: String (enum: `['user', 'admin']`, default: `'user'`)
  * `interests`: [String] (array of interest strings, e.g. `['chess', 'reading']`)
  * `createdAt`: Date
  * `updatedAt`: Date
* **Index Strategy:**
  1. `UserSchema.index({ email: 1 }, { unique: true })`
     * *Justification:* Supports unique login lookups (`findOne({ email })`) in $O(1)$.
  2. `UserSchema.index({ createdAt: -1 })`
     * *Justification:* Supports admin paginated list of users sorted chronologically (`find().sort({ createdAt: -1 }).skip(...).limit(...)`).
  3. `UserSchema.index({ interests: 1 })`
     * *Justification:* Supports multikey indexing for interest-based queries and accelerates the interest-grouping aggregation pipeline.
* *Note on `_id`:* MongoDB automatically creates a unique index on `_id`, which covers single user profile lookups by ID.

### 5.2 Notes Collection (`notes`)
* **Fields:**
  * `title`: String (required, trim)
  * `content`: String (required)
  * `owner`: ObjectId (ref: `User`, required)
  * `isArchived`: Boolean (default: `false`)
  * `createdAt`: Date
  * `updatedAt`: Date
* **Index Strategy:**
  1. `NoteSchema.index({ owner: 1, createdAt: -1 })`
     * *Justification:* Supports the most common query: a user listing their own notes sorted by newest first (`find({ owner: userId }).sort({ createdAt: -1 })`). Compound index adheres to the Equality-Sort-Range (ESR) rule, avoiding an in-memory sort.
  2. `NoteSchema.index({ createdAt: -1 })`
     * *Justification:* Supports admin view listing all notes across all users sorted chronologically (`find().sort({ createdAt: -1 })`).
* *Note on single note retrieval:* Handled by `_id` lookup (native primary index) combined with service-level authorization (verifying `note.owner.equals(user._id)` or `user.role === 'admin'`).

### 5.3 Posts Collection (`posts`)
* **Fields:**
  * `title`: String (required, trim)
  * `content`: String (required)
  * `author`: ObjectId (ref: `User`, required)
  * `createdAt`: Date
  * `updatedAt`: Date
* **Index Strategy:**
  1. `PostSchema.index({ author: 1, createdAt: -1 })`
     * *Justification:* Accelerates Scenario 2 aggregation (`$match: { author: userId }` or `$lookup` joining on `posts.author`) and paginated listing of a user's posts.
  2. `PostSchema.index({ createdAt: -1 })`
     * *Justification:* Supports public feed pagination sorted by newest posts.

---

## 6. Aggregation Pipeline Specifications

### Scenario 1: Group Users by Interests
* **Endpoint:** `GET /api/v1/users/by-interests`
* **Constraint:** Exactly one `collection.aggregate()` call.
* **Pipeline:**
  ```typescript
  [
    // 1. Match only users who have at least one interest (utilizes UserSchema.index({ interests: 1 }))
    { $match: { 'interests.0': { $exists: true } } },
    // 2. Deconstruct the interests array so each interest is an independent document
    { $unwind: '$interests' },
    // 3. Group users by interest
    {
      $group: {
        _id: '$interests',
        count: { $sum: 1 },
        users: {
          $push: {
            id: '$_id',
            name: '$name',
            email: '$email',
            role: '$role'
          }
        }
      }
    },
    // 4. Sort alphabetically by interest name
    { $sort: { _id: 1 } },
    // 5. Project into clean response ViewModel
    {
      $project: {
        _id: 0,
        interest: '$_id',
        count: 1,
        users: 1
      }
    }
  ]
  ```

### Scenario 2: Retrieve All Posts Belonging to a Particular User ($lookup)
* **Endpoint:** `GET /api/v1/posts/user/:userId`
* **Constraint:** Single aggregation pipeline with a `$lookup` stage.
* **Pipeline (Querying Posts collection with index { author: 1, createdAt: -1 }):**
  ```typescript
  [
    // 1. Filter directly on author using compound index { author: 1, createdAt: -1 }
    { $match: { author: new Types.ObjectId(userId) } },
    // 2. Sort chronologically
    { $sort: { createdAt: -1 } },
    // 3. Single $lookup stage to populate author details
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1
            }
          }
        ]
      }
    },
    // 4. Flatten the single author array element
    { $unwind: '$author' },
    // 5. Shape into clean PostViewModel
    {
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        author: 1,
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]
  ```

---

## 7. Security, Admin Bootstrapping & Environment Configuration

* **Admin Account Bootstrapping:**
  * Public registration `POST /auth/register` strictly forbids setting `role: 'admin'` (prevents privilege escalation).
  * On application startup, `BootstrapService` checks if an admin exists; if not, it automatically seeds an initial Admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.
  * Standalone CLI script `npm run seed:admin` also provided for manual initialization.
* **Password Hashing:** `bcrypt` with work factor 10.
* **JWT Configuration:** `JWT_SECRET`, `JWT_EXPIRES_IN` (e.g. `1d`).
* **Environment Validation:** `@nestjs/config` with Joi or class-validator for type-safe `.env` parsing.
* **Security Middleware:** `helmet`, CORS configuration, and global `ValidationPipe` with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.
* **Containerization:** Production multi-stage `Dockerfile` (build stage $\rightarrow$ lean node alpine runtime stage) and `docker-compose.yml` for local dev (including MongoDB container) and Dokploy VPS deployment.

---

## 8. Verification & Test Plan

1. **Unit / Integration Tests:**
   * Auth flow: Register, login, token generation, password verification.
   * RBAC verification: Regular user cannot view/modify another user's notes or access admin user management; Admin can access all notes and manage users.
   * DTO validation: Reject invalid email formats, short passwords, missing fields.
   * ViewModels: Verify `password` hash and Mongoose `__v` are never present in output.
2. **Database Index Verification:**
   * Script to execute `db.collection.getIndexes()` on `users`, `notes`, and `posts` verifying only the intended indexes exist.
   * Run `explain('executionStats')` on paginated queries to confirm `IXSCAN` (Index Scan) is utilized without `COLLSCAN` or `SORT` stages.
3. **Aggregation Pipeline Verification:**
   * Execute test data against Scenario 1 and Scenario 2 pipelines verifying exact single-call execution and expected schema output.
