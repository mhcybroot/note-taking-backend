# API Testing Design: Swagger UI & HTTP Request Collection

**Date:** 2026-10-27  
**Scope:** Small Feature (Documentation & Manual Testing Suite)  
**Status:** Approved  

---

## 1. Intent & Purpose
Enable seamless, interactive testing and live demonstration of all REST API endpoints for both local development and VPS Dokploy deployment, allowing interview evaluators to easily verify:
1. Authentication & JWT Bearer token generation.
2. Role-Based Access Control (User vs. Admin boundaries).
3. Note Ownership restrictions (403 on foreign note edit/delete).
4. Scenario 1 (`GET /api/v1/users/by-interests`) and Scenario 2 (`GET /api/v1/posts/user/:userId`) aggregations.
5. Chronological pagination (`page`, `limit`).

---

## 2. Deliverables & Components

### 2.1 Swagger / OpenAPI Interactive Documentation (`/api/docs`)
* **Libraries:** `@nestjs/swagger`, `swagger-ui-express`.
* **Path:** Mounted at `http://localhost:3000/api/docs`.
* **Authentication:** Configured with `.addBearerAuth()` so evaluators can paste their JWT access token once and execute authorized requests across all endpoints.
* **Metadata:**
  * Tagged by resource: `Authentication`, `Users & Scenario 1`, `Notes & Permissions`, `Posts & Scenario 2`.
  * Detailed DTO field definitions and expected HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`).

### 2.2 Executable HTTP Client File (`api-requests.http`)
* Standard VS Code REST Client / JetBrains HTTP Client format.
* Sequences requests into logical execution order with dynamic variable capture:
  1. **Step 1: Admin & User Login/Registration** (captures `@adminToken`, `@userToken`, `@userBToken`).
  2. **Step 2: Note Operations & Ownership Verification** (creates note, attempts foreign access, tests admin read-only access).
  3. **Step 3: User Management (Admin only)**.
  4. **Step 4: Aggregation Demonstrations** (Scenario 1 interest grouping, Scenario 2 user posts with `$lookup`).
  5. **Step 5: Paginated List Operations**.

---

## 3. Verification & Safety
* All existing 33 automated unit and E2E tests must remain green (`npm test && npm run test:e2e`).
* Production Docker build must include Swagger UI (`npm run build`).
