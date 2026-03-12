# Next Backend Priorities

## Goal

Define the next implementation sequence for the ERP foundation while keeping the frontend replaceable. The immediate priority is not UI polish. The immediate priority is to finish the auth and tenant boundary so later ERP modules are built on stable backend rules.

## Working Rules

- Backend owns business logic, validation, authorization, tenant resolution, and session behavior.
- Frontend owns rendering, form wiring, view state, route composition, and API consumption.
- Frontend business logic should live in stable feature modules that are separate from presentation so the current UI can be deleted and rebuilt without rewriting auth and domain behavior.
- Do not add new domain rules directly inside route components or presentational components in `apps/erp`.
- Prefer shared constants and contracts over inline strings for routes, statuses, roles, permissions, cookie names, and query parameters.

## Recommendation

Build the next work in this order:

1. Complete the auth lifecycle.
2. Audit and harden tenant/session enforcement.
3. Polish onboarding as a production-style provisioning flow.
4. Lock the authorization primitives and shared constants.
5. Build the first full tenant-scoped ERP domain slice.

This sequence reduces the risk of rework. If tenant resolution, recovery, and authorization stay soft, every later module will encode assumptions that will need to be pulled back out.

## Phase 1: Complete Auth Lifecycle

### Outcome

The platform supports sign-in, sign-out, session retrieval, password recovery, and password reset without introducing username-based auth.

### Scope

- Add forgot-password request flow.
- Add password reset completion flow.
- Support account recovery using mobile or email depending on what exists on the user.
- Keep mobile as canonical user identity and email as secondary login/recovery identifier.
- Add clear backend errors for unknown account, invalid reset token, expired reset token, and blocked reset attempt.

### Backend tasks

- Create dedicated auth recovery DTOs, schemas, controller routes, and service methods in `apps/api-erp/src/modules/auth`.
- Add reset token persistence to `packages/database` using explicit expiry and single-use semantics.
- Normalize identifiers in one backend place only.
- Define shared auth error constants and response shapes.

### Frontend tasks

- Add a dedicated auth feature module for recovery flows under `apps/erp/src/features/auth`.
- Keep API hooks, schemas, and error mapping separate from route components.
- Keep route components thin so they can be replaced later without moving business logic again.

### Definition of done

- A user can request a reset using mobile or email.
- A user can successfully reset the password with a valid token.
- Old or reused tokens are rejected.
- Typecheck passes.

## Phase 2: Audit Tenant And Session Enforcement

### Outcome

Every authenticated request resolves the tenant from the hostname and verifies that the signed-in user can access that tenant before returning tenant-scoped data.

### Scope

- Review current session creation and tenant selection behavior.
- Make tenant mismatch behavior explicit and predictable.
- Ensure campus selection cannot escape the active tenant.
- Ensure routes that require tenant scope fail closed.

### Backend tasks

- Audit `tenant-context` and auth module integration.
- Add tests around:
  - sign-in on root host with one membership
  - sign-in on tenant host with matching membership
  - sign-in on tenant host with no membership
  - multi-membership user without tenant context
  - campus switch across tenant boundary
- Centralize tenant access checks in backend services and guards.

### Frontend tasks

- Keep tenant detection and redirect helpers in infrastructure modules only.
- Do not reproduce membership or authorization logic in route guards beyond UX convenience.

### Definition of done

- Tenant resolution rules are documented and enforced in code.
- Unauthorized tenant access fails consistently.
- Campus switching is tenant-safe.
- Tests cover the main tenant entry paths.

## Phase 3: Productionize Onboarding

### Outcome

Institution signup reliably provisions a usable tenant with a first admin and a default campus, then lands the user in the correct tenant-scoped session.

### Scope

- Validate slug collisions and identity collisions cleanly.
- Ensure the created admin gets the correct membership and active context.
- Ensure branding bootstrap and tenant redirect are consistent after signup.
- Keep onboarding isolated as provisioning logic, not mixed into generic auth flows.

### Backend tasks

- Review transaction boundaries in onboarding.
- Confirm all provisioning defaults use shared constants.
- Add tests for duplicate institution slug, duplicate user identity, and successful first-login context.

### Frontend tasks

- Keep onboarding form schema, API mutation, and post-submit navigation in feature modules.
- Do not bind onboarding behavior to the current page layout.

### Definition of done

- Successful signup creates institution, campus, admin user, membership, and session.
- Failure cases return deterministic API errors.
- Redirect lands on the correct tenant dashboard host.

## Phase 4: Lock Authorization Primitives

### Outcome

The project has stable shared constants and backend authorization primitives before more ERP domains are added.

### Scope

- Define role keys, member types, status values, permission keys, and route segments in shared constants.
- Establish the first permission-check pattern in Nest guards/services.
- Keep the frontend as a consumer of capability data, not the source of authorization truth.

### Backend tasks

- Centralize constants now if they still exist as scattered literals.
- Define the minimal authorization API shape for current user context and capability-driven UI.
- Add tests for role and membership-based access checks.

### Frontend tasks

- Consume capability/context data through feature hooks and stores.
- Do not encode permission logic directly in components except for simple conditional rendering based on API-provided context.

### Definition of done

- Core auth and membership constants are shared and imported.
- Authorization checks are backend-owned.
- Frontend capability checks stay thin and replaceable.

## Phase 5: First Full ERP Slice

### Outcome

Ship one complete tenant-scoped domain to validate the architecture end-to-end.

### Recommended first slice

Students + guardians + campus assignment.

### Why this slice first

- It exercises the single-user identity model.
- It tests guardian-to-student relationships.
- It validates tenant ownership and campus scoping.
- It forces clean API, schema, and form boundaries.

### Scope

- Student create/list/detail.
- Guardian link to one or more students.
- Multi-guardian support for a student.
- Campus assignment inside the active tenant.

### Definition of done

- One working vertical slice exists across database, Nest module, contracts, and frontend feature modules.
- The frontend implementation can be redesigned later without moving the domain rules.

## Frontend Disposable Structure

While the UI is temporary, keep this structure discipline in `apps/erp`:

- `src/features/<domain>/api` for API hooks and request mapping.
- `src/features/<domain>/model` for form schemas, feature types, stores, and UI-agnostic client logic.
- `src/features/<domain>/ui` for thin reusable feature-level UI wrappers only where useful.
- `src/routes` for page composition only.

This keeps the current frontend disposable while preserving the business-facing client layer.

## Immediate Execution Order

1. Auth recovery data model and API.
2. Auth recovery frontend feature modules.
3. Tenant/session enforcement audit and tests.
4. Onboarding hardening and tests.
5. Authorization constants cleanup.
6. Student and guardian domain design plan.

## Success Criteria

- The backend is the clear source of truth for identity, sessions, tenant scope, and authorization.
- The frontend can be rebuilt without pulling business rules back out of page components.
- The next ERP module is added on top of stable auth and tenant primitives instead of provisional scaffolding.
