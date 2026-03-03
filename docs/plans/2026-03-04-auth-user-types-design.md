# Auth User Types Design

**Date:** 2026-03-04
**Status:** Approved
**Scope:** Authentication system — user types, roles, data model, middleware, permission resolution

---

## Summary

The platform is a multi-tenant white-label ERP. Each institution is a tenant (Better Auth "organization"). One user account can belong to multiple institutions with different roles in each. Roles are divided into three types: platform, system, and staff.

---

## Section 1: User Type Hierarchy

```
Platform Layer
└── super_admin              role_type: platform  (global flag on user record)

Institution Layer (Better Auth "organization")
│
├── System Roles             role_type: system  (is_system=true, locked, non-configurable)
│   ├── institution_admin    full org control
│   ├── student              portal access, own record only
│   └── parent               portal access, linked children only
│
└── Staff Roles              role_type: staff   (is_configurable=true, RBAC-managed)
    ├── principal            default preset
    ├── teacher              default preset
    ├── accountant           default preset
    ├── librarian            default preset
    ├── receptionist         default preset
    └── [custom roles]       institution creates / renames / clones
```

### Role type rules

| Role | role_type | is_system | is_configurable |
|---|---|---|---|
| super_admin | platform | true | false |
| institution_admin | system | true | false |
| student | system | true | false |
| parent | system | true | false |
| principal | staff | false | true |
| teacher | staff | false | true |
| accountant | staff | false | true |
| librarian | staff | false | true |
| receptionist | staff | false | true |

**Key rules:**
- System roles have portal scope enforced at the product level — no RBAC config can escalate a student or parent to staff-level access
- Staff roles are fully configurable — institutions can add, rename, clone, or restrict them
- `super_admin` is a platform-level flag, not an org membership
- One user can be a member of multiple institutions with different roles in each

---

## Section 2: Data Model

### Better Auth standard tables (managed by Better Auth)
```
users, sessions, accounts, verifications
```

### Platform extension
```sql
users
  + is_super_admin: boolean   -- platform flag, not an org role
```

### Institutions
```sql
institutions
  id, name, slug, logo
  type: 'school' | 'college'
  status: 'active' | 'suspended'
  createdAt, deleted_at

INDEX(slug)
```

### Academic years (institution-scoped, never global)
```sql
academic_years
  id, institution_id, name ('2024-25')
  start_date, end_date
  is_current: boolean
  status: 'active' | 'archived'
  createdAt, deleted_at

INDEX(institution_id)
INDEX(institution_id, is_current)

-- Constraint: only one current year per institution
UNIQUE(institution_id) WHERE is_current = true AND deleted_at IS NULL
```

### Memberships
```sql
memberships
  id, user_id, institution_id
  status: 'active' | 'inactive' | 'suspended'
  -- inactive = soft-deactivated: past student, alumni, suspended staff — no login access
  createdAt, deleted_at

UNIQUE(user_id, institution_id) WHERE deleted_at IS NULL
INDEX(user_id)
INDEX(institution_id)
```

### Roles
```sql
roles
  id, name, slug
  role_type: 'platform' | 'system' | 'staff'
  institution_id: null | fk   -- null = global preset, set = institution custom role
  is_system: boolean
  is_configurable: boolean
  createdAt, deleted_at

-- Slug uniqueness per namespace
UNIQUE(slug, institution_id)
-- institution_id=null treated as global namespace (platform + system + staff presets)

-- Seeded global presets have institution_id = null:
--   platform roles   → role_type='platform', institution_id=null
--   system roles     → role_type='system',   institution_id=null
--   staff presets    → role_type='staff',     institution_id=null
-- Institution custom roles:
--   custom roles     → role_type='staff',     institution_id=<id>
```

### Membership roles (many roles per membership, with temporal validity)
```sql
membership_roles
  id, membership_id, role_id
  valid_from: date
  valid_to: date | null          -- null = currently active
  academic_year_id: fk | null
  createdAt, deleted_at

-- Prevent duplicate active assignment per year
UNIQUE(membership_id, role_id, academic_year_id) WHERE valid_to IS NULL AND deleted_at IS NULL

INDEX(membership_id)
INDEX(role_id)
INDEX(valid_to)
```

### Membership role scopes (v1: schema ready, empty)
```sql
membership_role_scopes
  id, membership_role_id
  scope_type: 'institution' | 'department' | 'class' | 'section'
  scope_id: string               -- FK resolved at query time

-- Enables RBAC → hybrid RBAC+ABAC evolution without migration
-- Department-level, section-level, academic-year-scoped roles supported when needed
```

### Parent–student links
```sql
student_guardian_links
  id, student_membership_id, parent_membership_id
  relationship: 'father' | 'mother' | 'guardian'
  is_primary: boolean
  invited_at, accepted_at | null
  deleted_at

INDEX(student_membership_id)
INDEX(parent_membership_id)
```

### RBAC permissions
```sql
permissions
  id, slug, description          -- global action identifiers
  UNIQUE(slug)

role_permissions
  role_id, permission_id         -- institution-scoped implicitly via role_id
```

### FK strategy (all tables)
```
ON DELETE RESTRICT on every FK   -- never cascade-delete
Soft delete only via deleted_at  -- ERP data is permanent, historical reports depend on it
```

---

## Section 3: Auth Flows & Middleware

### Onboarding flows

| Actor | Flow |
|---|---|
| super_admin | Seeded manually, no self-registration |
| institution_admin | Invited by super_admin → email link → sets password + enforced 2FA |
| staff | Invited by institution_admin → email link → sets password |
| student | Created by staff → bulk import or email invite |
| parent | Email invite sent after student record is created → links account to child on first login |

### Institution context strategy

**Subdomain-first (recommended for white-label):**
```
school-a.erp.com → resolves to institution via slug
school-b.erp.com → resolves to institution via slug
```
- No institution cookie needed in subdomain mode — subdomain itself is the tenant context
- Header fallback (`X-Institution-Id`) for API clients only
- Internally, everything uses `institution_id` after resolution

**Rate limiting:**
- Unknown subdomains: rate-limited per IP, generic 403 (no enumeration detail)

### Tenant resolution middleware (every authenticated, org-scoped request)

```
1. Extract session.userId (Better Auth)

2. Resolve institution:
     Subdomain → slug → institution_id  (web UI)
     X-Institution-Id header            (API clients)
     → org-scoped endpoint without institution context → 400

3. Validate institution:
     status != 'suspended' AND deleted_at IS NULL
     → 403 (generic — never reveal "not found" vs "suspended", prevents enumeration)

4. super_admin shortcut:
     → institution existence validated (step 3 always runs)
     → skips steps 5–9 entirely, granted full platform access
     → explicit override, not implicit

5. Validate membership:
     status = 'active' AND deleted_at IS NULL
     → 403 (generic — never reveal reason)
     [inactive memberships = no access, regardless of role history]

6. Resolve active roles:
     membership_roles where valid_to IS NULL AND deleted_at IS NULL
     → if empty → 403 (no active role = no access, explicit rule)

7. Enforce 2FA (BEFORE permission resolution — avoids unnecessary DB queries):
     if ANY resolved role has role_type='platform' OR slug='institution_admin'
       AND session 2FA not verified → 401 (redirect to 2FA challenge)
     Note: checks ANY role, not primary role (handles multi-role users)

8. Resolve current academic year:
     is_current = true AND deleted_at IS NULL
     → if none → 500 (institution misconfiguration — never silently null)

9. Resolve permissions:
     → request-scoped cache keyed by membership_id (never shared across users)
     → optional short TTL (30–60s) for hot paths, invalidate on role change
     → DEFAULT DENY: if permission not found → 403
```

### Future optimization path (not now)
- Edge cache: `subdomain → institution_id` (Redis, short TTL)
- Cache: `current academic_year per institution_id`
- Cache: `permission set per membership_id` (invalidate on role/membership change)
- Materialized permission view for high-load paths

---

## Section 4: Permission Resolution Logic

### Two distinct authorization layers

These must never be conflated:

| Layer | Question | Mechanism |
|---|---|---|
| **Permission layer** | Can this user perform this action? | RBAC — role → permission slug |
| **Data scope layer** | Which rows can this user see? | Resolver-level filters, applied after permission granted |

**Enforcement order (mandatory):**
Permission checks must execute before data queries are constructed. Scope filters are applied only after permission is granted. Never construct a scoped query as a substitute for a permission check.

### Who bypasses what

```
super_admin:
  → Bypasses permission resolution entirely
  → Institution existence still validated (cannot hit arbitrary institution IDs)
  → Never bypasses institution existence check

institution_admin:
  → Does NOT bypass permission resolution
  → Gets all permissions via seeded role_permissions (data, not code)
  → No hardcoded "if institution_admin then allow" logic — ever
  → If a permission is removed from the role, it is denied
  → Platform ≠ Institution: this boundary must never blur
```

### Permission resolution algorithm

```
checkPermission(userId, institutionId, permissionSlug):
  1. Middleware resolves roles (request context, already cached)
  2. Union all permissions across all active roles
  3. Check permissionSlug in union set
  4. → not found: DENY (default deny, no exceptions)
```

**Multi-role union rule:** permissions are additive. Teacher + Accountant = union of both sets. No role suppresses another role's permissions.

### Data scope rules (resolver level, not RBAC)

```
student:  students:read granted → query filtered to own record only
parent:   students:read granted → query filtered to linked children only
teacher:  students:read granted → v1: institution-wide; v2: class assignment scope
```

Scope filters live at the data resolver/query layer. They are never part of permission slug logic.

### Permission slug convention

```
resource:action

fees:read          fees:write         fees:delete
attendance:read    attendance:write
students:read      students:write     students:delete
grades:read        grades:write
roles:manage       members:invite     reports:export
library:read       library:write
admissions:read    admissions:write
```

### v1 preset permissions (seeded data, not hardcoded logic)

| Role | Permissions |
|---|---|
| institution_admin | all |
| principal | all except `roles:manage`, `members:invite` |
| teacher | `attendance:write`, `students:read`, `grades:read`, `grades:write` |
| accountant | `fees:read`, `fees:write`, `reports:export` |
| librarian | `library:read`, `library:write` |
| receptionist | `students:read`, `admissions:read` |
| student | `students:read` (own record via scope layer) |
| parent | `students:read`, `grades:read`, `attendance:read`, `fees:read` (children via scope layer) |

### Role inheritance

Flat in v1 — no parent/child role hierarchy. Schema supports future inheritance via `parent_role_id` on `roles` table, without migration.

### Forward compatibility: RBAC → hybrid RBAC+ABAC

The `membership_role_scopes` table (empty in v1) allows the system to evolve toward hybrid RBAC+ABAC — supporting department-level, section-level, and academic-year-scoped role assignments — without schema migration. This is enabled by the existing `membership_roles.academic_year_id` and `membership_role_scopes.scope_type/scope_id` columns.
