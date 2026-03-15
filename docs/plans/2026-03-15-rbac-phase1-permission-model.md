# RBAC Phase 1 — Permission Model and System Roles

## Goal

Replace the current coarse `activeContext === "staff"` authorization with a real
permission-based authorization model. After this phase, every backend operation
requires a specific named permission, system roles carry fixed permission sets,
and institution admins have a stable foundation to build custom roles on top of.

Scope enforcement (filtering data by campus / class / section) is deferred to
Phase 2. This phase is backend-only. No new frontend pages are added.

---

## Context

### What exists today

- `roles` table — `institution_admin` seeded per-institution at onboarding; no
  other roles provisioned
- `permissions` table — schema exists, zero rows in production
- `rolePermissions` join table — schema exists, zero rows
- `membershipRoles` + `membershipRoleScopes` — schema exists, partially used
  (staff slice assigns `institution_admin` role but scopes are never checked)
- Runtime check — every domain service calls
  `authService.requireOrganizationContext(session, orgId, "staff")`. This only
  verifies session + membership + `activeContextKey`. No permission slug is ever
  read.

### What is missing

- Named permission constants
- Permissions seeded in the database
- System roles defined beyond `institution_admin` with their permission sets
- A backend mechanism to check whether the current user's role(s) include a
  required permission
- Domain services using specific permissions instead of the blanket staff-context
  check

---

## Permission Taxonomy

Permissions are platform-defined and fixed. Institution admins cannot create new
permission slugs — they can only assign existing permissions to custom roles.

### Naming convention

`<resource>:<action>`

Actions: `read`, `write`, `manage`
- `read` — list and detail access, no mutations
- `write` — mutations on existing records (attendance entry, marks entry)
- `manage` — full CRUD including structural changes (create, edit, delete/archive)

### Full permission set

| Slug | What it guards |
|---|---|
| `institution:settings:read` | View institution settings and branding |
| `institution:settings:manage` | Edit institution settings, branding, theme |
| `institution:roles:manage` | Create/edit/delete custom roles |
| `institution:users:manage` | Invite staff, assign roles, deactivate accounts |
| `campus:read` | List and view campuses |
| `campus:manage` | Create and edit campuses |
| `academics:read` | View classes, sections, academic years, exam terms |
| `academics:manage` | Create/edit/archive academic structure |
| `students:read` | List and view student records |
| `students:manage` | Create, edit, enroll, and archive students |
| `guardians:read` | List and view guardian records |
| `guardians:manage` | Create, edit, and link/unlink guardians |
| `staff:read` | List and view staff records |
| `staff:manage` | Create, edit, and manage staff members |
| `attendance:read` | View attendance records and day summaries |
| `attendance:write` | Submit and correct attendance entries |
| `exams:read` | View exam terms and marks |
| `exams:manage` | Create/edit exam terms |
| `marks:write` | Enter and update marks for an exam term |
| `fees:read` | View fee structures and payment records |
| `fees:manage` | Create/edit fee structures and assign fees to students |
| `fees:collect` | Record fee payments |

---

## System Roles

System roles are global presets (`isSystem: true`). They are seeded once at app
startup (idempotent upsert), not per institution. Institution admins cannot delete
or rename them. The `isConfigurable: false` flag prevents editing their permission
sets.

Institution-scoped rows in `roles` (with a non-null `institutionId`) are still
created per institution at onboarding as today.

### Role definitions

#### `institution_admin`
Full access. The principal, trust administrator, or whoever set up the institution.

Permissions: all of the above.

#### `school_admin`
Day-to-day administrative staff. Full ERP access but cannot touch institution
settings or branding.

Permissions: all **except** `institution:settings:manage` and
`institution:roles:manage`.

#### `academic_coordinator`
Manages academic structure and oversees marks and attendance. Cannot touch fees,
staff management, or institution settings.

Permissions: `academics:manage`, `academics:read`, `students:read`,
`guardians:read`, `attendance:read`, `exams:manage`, `exams:read`, `marks:write`,
`campus:read`.

#### `finance_manager`
Manages fees only. No access to academic writes or staff management.

Permissions: `fees:manage`, `fees:collect`, `fees:read`, `students:read`,
`campus:read`.

#### `class_teacher`
Manages their assigned class. Attendance and marks are scoped to their class/section
(scope enforcement in Phase 2, but permission check is established here).

Permissions: `students:read`, `guardians:read`, `attendance:write`,
`attendance:read`, `exams:read`, `marks:write`, `academics:read`, `campus:read`.

#### `subject_teacher`
Narrower than class teacher. Only attendance and marks for their assigned subjects
and sections.

Permissions: `attendance:write`, `attendance:read`, `marks:write`, `exams:read`,
`academics:read`, `campus:read`.

---

## Architecture

### Permission resolution at runtime

```
Request
 └── SessionAuthGuard           (session valid, user attached)
      └── TenantInstitutionGuard (tenant resolved, org attached)
           └── PermissionGuard   (NEW — checks required permission)
                └── Controller handler
                     └── Service (no longer does its own context check)
```

The `PermissionGuard` reads:
1. The required permission slug from `@RequirePermission('marks:write')` metadata
2. The current user's active memberships in the resolved institution
3. The roles attached to those memberships via `membershipRoles`
4. The permission slugs on those roles via `rolePermissions`
5. Returns 403 if none of the resolved permissions match

Permission resolution is cached on the request object so multiple guards on the
same request do not hit the database multiple times.

### `@RequirePermission()` decorator

```ts
// apps/api-erp/src/modules/auth/require-permission.decorator.ts
export const RequirePermission = (...permissions: PermissionSlug[]) =>
  SetMetadata(PERMISSION_METADATA_KEY, permissions);
```

Accepts one or more permission slugs. The guard requires **all** listed
permissions to be present (AND semantics). For OR semantics, call the guard
multiple times or use a separate decorator.

### `PermissionGuard`

```ts
// apps/api-erp/src/modules/auth/permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<PermissionSlug[]>(
      PERMISSION_METADATA_KEY,
      context.getHandler(),
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const session: AuthenticatedSession = request.authSession;
    const institution: TenantInstitution = request.tenantInstitution;

    const userPermissions = await this.authService.resolvePermissions(
      session.user.id,
      institution.id,
    );

    return required.every((p) => userPermissions.has(p));
  }
}
```

### `AuthService.resolvePermissions()`

New method. Returns `Set<PermissionSlug>` for a user within an institution:

```
1. Load memberships for user in institution where memberType = 'staff'
   and status = 'active'
2. Load membershipRoles for those memberships where validFrom <= today
   and (validTo is null or validTo >= today)
3. Load rolePermissions for those roles
4. Load permission slugs for those permission IDs
5. Return as Set<PermissionSlug>
```

Cache result on request with a WeakMap keyed to the request object.

---

## Implementation Steps

- [x] **Step 1 — Permission slug constants**

  **File:** `apps/api-erp/src/constants/permissions.ts`

  Define `PERMISSIONS` as a typed const object matching the taxonomy above.
  Export `PermissionSlug` as `typeof PERMISSIONS[keyof typeof PERMISSIONS]`.

  Add `PERMISSIONS` to the barrel export in `apps/api-erp/src/constants/index.ts`.

- [x] **Step 2 — System role constants**

  **File:** `apps/api-erp/src/constants/status.ts` (extend existing `ROLE_SLUGS`)

  Add slugs for the new system roles:
  ```ts
  export const ROLE_SLUGS = {
    INSTITUTION_ADMIN: "institution_admin",
    SCHOOL_ADMIN: "school_admin",
    ACADEMIC_COORDINATOR: "academic_coordinator",
    FINANCE_MANAGER: "finance_manager",
    CLASS_TEACHER: "class_teacher",
    SUBJECT_TEACHER: "subject_teacher",
  } as const;
  ```

- [x] **Step 3 — Platform seed service**

  **File:** `apps/api-erp/src/modules/seed/seed.service.ts` (new)
  **File:** `apps/api-erp/src/modules/seed/seed.module.ts` (new)

  A NestJS service that implements `OnApplicationBootstrap`. Runs once at startup.
  Uses upsert semantics (do nothing on conflict) so it is safe to run on every
  deploy.

  Responsibilities:
  1. Upsert all permission slugs into the `permissions` table
  2. Upsert all system roles into the `roles` table
     (`isSystem: true`, `isConfigurable: false`, `institutionId: null`,
     `roleType: 'system'`)
  3. Upsert `rolePermissions` rows linking each system role to its permission set

  All IDs are stable UUIDs derived from the slug (uuid v5 with a fixed namespace)
  so re-runs produce identical rows and never cause drift.

  Register `SeedModule` in `AppModule`. It must run after `DatabaseModule` is
  initialized.

- [x] **Step 4 — `@RequirePermission()` decorator**

  **File:** `apps/api-erp/src/modules/auth/require-permission.decorator.ts`

  Simple `SetMetadata` decorator. Define `PERMISSION_METADATA_KEY` as a constant
  in `apps/api-erp/src/constants/`.

- [x] **Step 5 — `PermissionGuard`**

  **File:** `apps/api-erp/src/modules/auth/permission.guard.ts`

  Implement as described in the Architecture section above.

  Export from `AuthModule` so it is available across all feature modules.

- [x] **Step 6 — `AuthService.resolvePermissions()`**

  Add the method to `apps/api-erp/src/modules/auth/auth.service.ts`.

  Query path:
  ```sql
  SELECT DISTINCT p.slug
  FROM membership_roles mr
  JOIN role_permissions rp ON rp.role_id = mr.role_id
  JOIN permissions p ON p.id = rp.permission_id
  JOIN member m ON m.id = mr.membership_id
  WHERE m.user_id = $userId
    AND m.organization_id = $institutionId
    AND m.member_type = 'staff'
    AND m.status != 'deleted'
    AND mr.valid_from <= CURRENT_DATE
    AND (mr.valid_to IS NULL OR mr.valid_to >= CURRENT_DATE)
  ```

  Return as `Set<PermissionSlug>`.

- [x] **Step 7 — Apply guards to controllers**

  For each ERP controller, add `PermissionGuard` and `@RequirePermission()`:

  ```ts
  // Before
  @UseGuards(SessionAuthGuard, TenantInstitutionGuard)
  @Controller('classes')
  export class ClassesController {}

  // After
  @UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
  @Controller('classes')
  export class ClassesController {}
  ```

  Per-handler permission map:

  | Controller | Method | Permission |
  |---|---|---|
  | ClassesController | GET list | `academics:read` |
  | ClassesController | GET detail | `academics:read` |
  | ClassesController | POST create | `academics:manage` |
  | ClassesController | PATCH update | `academics:manage` |
  | ClassesController | DELETE | `academics:manage` |
  | AcademicYearsController | GET list/detail | `academics:read` |
  | AcademicYearsController | POST/PATCH | `academics:manage` |
  | StudentsController | GET list/detail | `students:read` |
  | StudentsController | POST/PATCH | `students:manage` |
  | GuardiansController | GET list/detail | `guardians:read` |
  | GuardiansController | POST/PATCH | `guardians:manage` |
  | StaffController | GET list/detail | `staff:read` |
  | StaffController | POST/PATCH | `staff:manage` |
  | CampusesController | GET list/detail | `campus:read` |
  | CampusesController | POST/PATCH | `campus:manage` |
  | AttendanceController | GET | `attendance:read` |
  | AttendanceController | POST/PATCH | `attendance:write` |
  | ExamsController | GET | `exams:read` |
  | ExamsController | POST/PATCH (terms) | `exams:manage` |
  | ExamsController | POST/PATCH (marks) | `marks:write` |
  | FeesController | GET | `fees:read` |
  | FeesController | POST/PATCH (structures) | `fees:manage` |
  | FeesController | POST (payments) | `fees:collect` |

- [x] **Step 8 — Remove `requireOrganizationContext` from domain services**

  After `PermissionGuard` is wired on all controllers, the imperative
  `authService.requireOrganizationContext(...)` calls inside each service method
  become redundant for the permission part. Remove those calls from domain services.

  The session and tenant are still resolved by `SessionAuthGuard` and
  `TenantInstitutionGuard` — those remain. The service methods should accept the
  session and institution from the controller via `@CurrentSession()` and
  `@CurrentInstitution()` decorators and use them for scoping queries, not for
  re-checking authorization.

  Keep `AuthService.requireOrganizationContext()` for now but mark it as internal
  to the auth module. It may be fully removed after service cleanup is complete.

- [x] **Step 9 — Update onboarding to reference system `institution_admin` role**

  The existing onboarding seed creates an `institution_admin` role per institution.
  After the seed service runs, system roles are globally seeded. Adjust onboarding
  to look up the system `institution_admin` role by slug instead of inserting a
  new one per institution.

---

## File Inventory

### New files

```
apps/api-erp/src/constants/permissions.ts
apps/api-erp/src/modules/auth/require-permission.decorator.ts
apps/api-erp/src/modules/auth/permission.guard.ts
apps/api-erp/src/modules/seed/seed.service.ts
apps/api-erp/src/modules/seed/seed.module.ts
```

### Modified files

```
apps/api-erp/src/constants/status.ts          — add new ROLE_SLUGS entries
apps/api-erp/src/constants/index.ts           — export PERMISSIONS and PERMISSION_METADATA_KEY
apps/api-erp/src/modules/auth/auth.service.ts — add resolvePermissions()
apps/api-erp/src/modules/auth/auth.module.ts  — export PermissionGuard
apps/api-erp/src/app.module.ts                — import SeedModule
apps/api-erp/src/modules/onboarding/onboarding.service.ts — fix institution_admin role lookup
apps/api-erp/src/modules/classes/classes.controller.ts
apps/api-erp/src/modules/classes/classes.service.ts
apps/api-erp/src/modules/academic-years/academic-years.controller.ts
apps/api-erp/src/modules/academic-years/academic-years.service.ts
apps/api-erp/src/modules/students/students.controller.ts
apps/api-erp/src/modules/students/students.service.ts
apps/api-erp/src/modules/guardians/guardians.controller.ts
apps/api-erp/src/modules/guardians/guardians.service.ts
apps/api-erp/src/modules/staff/staff.controller.ts
apps/api-erp/src/modules/staff/staff.service.ts
apps/api-erp/src/modules/campuses/campuses.controller.ts
apps/api-erp/src/modules/campuses/campuses.service.ts
apps/api-erp/src/modules/attendance/attendance.controller.ts
apps/api-erp/src/modules/attendance/attendance.service.ts
apps/api-erp/src/modules/exams/exams.controller.ts
apps/api-erp/src/modules/exams/exams.service.ts
apps/api-erp/src/modules/fees/fees.controller.ts
apps/api-erp/src/modules/fees/fees.service.ts
```

---

## Definition of Done

- [x] All permission slugs defined in `PERMISSIONS` constants and exported
- [x] All system roles defined in `ROLE_SLUGS` constants
- [x] `SeedService` upserts permissions and system roles on app startup; running
      it twice produces no duplicate rows
- [x] `@RequirePermission()` decorator exists and sets metadata
- [x] `PermissionGuard` reads metadata and resolves permissions from the database
- [x] `AuthService.resolvePermissions()` returns correct permissions for a user
      in an institution
- [x] Every ERP controller method has a `@RequirePermission()` annotation
- [x] `PermissionGuard` is applied globally to all ERP controllers
- [x] Institution admin user (seeded at onboarding) can access all endpoints
- [x] A user with no membership in the institution gets 403
- [x] A user with `staff` membership but a role that lacks the required permission
      gets 403
- [x] Typecheck passes (`bun run typecheck` from repo root)
- [x] `bun run --cwd apps/api-erp openapi:export` succeeds

---

## What This Phase Does Not Include

- Frontend role management pages (Phase 3)
- Staff role assignment UI (Phase 4)
- Scope enforcement — filtering query results by campus/class/section based on
  `membershipRoleScopes` (Phase 2)
- Custom role creation APIs
- `GET /me` capabilities response for frontend capability-driven rendering
- Permission checks for parent/student contexts (different model, deferred)
