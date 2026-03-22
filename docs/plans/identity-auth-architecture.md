# Identity and Auth Architecture

## Context

This plan locks decisions made after reviewing the current global identity model and its practical
problems for a multi-tenant Indian school ERP. It supersedes the earlier "one user per human
identity" decision in CLAUDE.md.

---

## Decision: Per-Tenant User Records

Each institution has its own completely isolated set of users. The `user` table is scoped to an
institution. Mobile uniqueness is enforced **per institution**, not globally.

Same person at two schools = two separate user records, two separate passwords. This is
intentional and acceptable. Schools serve local geographic areas. Parent overlap across
institutions on the same platform is a rare edge case, not the common path.

### What this solves

- **Name conflict** — Admin types any name they want. It is scoped to their institution. No
  conflict with any other institution's records.
- **"How does it know?"** — No frontend lookup needed. No autofill. Admin fills the form,
  submits, done. The system has no awareness of other institutions' data.
- **Clean isolation** — Each school's data is entirely their own. Custom domain + per-tenant
  users = the platform is invisible to the school and their users.

### Schema changes on `user` table

**Add:**
- `institutionId` — not null, foreign key to `institutions`
- `mustChangePassword` — boolean, not null, default `false`

**Change:**
- Mobile unique constraint: from global unique to composite unique on `(institutionId, mobile)`
- Email unique constraint: from global unique to composite unique on `(institutionId, email)`
  (email is nullable; PostgreSQL does not treat NULLs as duplicates so no partial index needed)

**Keep:** `id`, `mobile`, `name`, `email`, `passwordHash`, `preferredContextKey`,
`mobileVerifiedAt`, `emailVerifiedAt`, `createdAt`, `updatedAt`

`preferredContextKey` (staff/parent/student) stays on `user`. With per-tenant users it correctly
reflects which context this person defaults to within this institution. It is still useful for
routing the user to the right dashboard on login.

### `mustChangePassword` — two creation paths

| Creation path | `mustChangePassword` |
|---|---|
| Self-serve school signup (admin sets their own password) | `false` |
| Admin adds guardian or staff (default password = mobile number) | `true` |

Force password change on first login only when `mustChangePassword = true`. Self-serve signup
admin goes straight to the dashboard.

### Impact on `member` table

The `member` table continues to link users to their role within the institution (staff, guardian,
student). No structural change needed — `userId` still references `user.id`.

`member.userId` is nullable by design and must stay that way. Students who have no login account
have a `member` record but no `user` record. Do not make `userId` not null as part of this
migration.

Note: `user.institutionId` and `member.organizationId` will always be the same value. This is
intentional denormalization — do not remove `member.organizationId`. Both columns must be kept
consistent on write.

### "Already exists in same institution" during data entry

When admin adds a guardian or staff member and the mobile already exists for a user in this
institution:

**Different role (e.g. existing guardian being added as staff):**
- Do **not** overwrite the existing user's name or email
- Simply create a new `member` record for the new role
- The admin can update the person's name from the profile edit screen if needed

**Same role (e.g. adding a guardian who is already a guardian in this institution):**
- Do **not** let this hit the DB unique constraint
- Backend must check for an existing active `member` record with the same `(userId, organizationId, memberType)` before insert
- Return a clear error: `"A guardian with this mobile number already exists in this institution"`

---

## Platform Admin

Platform admins are completely outside the tenant user model. They have their own separate table:

**New table: `platform_admins`**
- `id`, `email` (globally unique), `passwordHash`, `totpSecret`, `createdAt`, `updatedAt`

Platform admin auth is a separate NestJS Passport strategy (`platform-local`) that queries
`platform_admins`, not `user`. It uses a separate guard and has no overlap with school-facing
auth. Platform admins never access school subdomains or custom domains — they access a
dedicated internal route.

---

## Remove Invite Columns

The `studentGuardianLinks` table currently has `invitedAt` and `acceptedAt`. These are artifacts
of an invite-based flow that is not being built. Admin-led entry means guardians are linked
directly — there is no invitation concept.

**Remove from `studentGuardianLinks`:**
- `invitedAt`
- `acceptedAt`

`deletedAt` stays — it is audit metadata, not invite-related.

No other invite columns exist elsewhere in the schema.

---

## Login Per User Type

### Guardian

- **Identifier:** Mobile number
- **Auth:** Mobile + Password
- **Why mobile:** Every parent in India knows their mobile number. Email is unreliable for
  non-tech users. Mobile is the de facto digital identity in India (banking, UPI, Aadhaar).

### Staff / School Admin

- **Primary identifier:** Mobile number
- **Alternative identifier:** Email (for tech-savvy staff who prefer it)
- **Auth:** Identifier + Password

### Student

**Deferred.** Everything a student would see — attendance, marks, timetable, notices, fees — is
already visible to their guardian. There is no core ERP workflow that requires the student
themselves to be logged in. Student auth will be added later as a dedicated feature when there
is actual school demand for it.

The student portal UI can remain as-is. Do not build student auth now.

### Platform Admin

- **Identifier:** Email
- **Auth:** Email + Password + TOTP (2FA)
- Queries `platform_admins` table, not `user`
- Completely separate Passport strategy and guard

---

## Auth Flows

### When admin adds a guardian or staff member

1. Backend creates user scoped to this institution (`institutionId`, mobile, name, email,
   default password = mobile number, `mustChangePassword = true`)
2. Backend creates the `member` record linked to this user
3. School admin communicates credentials verbally or via printed slip at admission/orientation

### When that guardian or staff member first logs in

1. They submit mobile + password (which is their mobile number)
2. Credentials validate successfully
3. Backend checks `mustChangePassword` — it is `true`
4. Return a response that forces the frontend to the change-password screen before issuing a
   full session
5. After password change: set `mustChangePassword = false`, issue session, proceed to dashboard

### Self-serve school signup

1. Admin fills signup form with their name, mobile, and chosen password
2. Backend creates institution, creates user with chosen password, `mustChangePassword = false`
3. Admin goes directly to dashboard — no forced change

### Password reset (current, no OTP)

- Admin resets any member's password from ERP (sets a new temp password, sets
  `mustChangePassword = true` again)
- No self-service reset until OTP/SMS is available

### OTP — deferred, architecture must keep the door open

DLT (Distributed Ledger Technology) template approval from TRAI/telecom operators takes 2–3
weeks. Not worth blocking development on now.

**What to keep open:**
- Auth module must have a clean OTP service interface (abstraction only, no implementation)
- Password reset flow must support switching from admin-driven to OTP-to-mobile without
  structural rewrites
- `mobileVerifiedAt` already exists on `user` for when OTP verification is added

**Is DLT worth it for production?**
Yes. OTP is what Indian users expect from banking, UPI, and every consumer app. Guardians with
forgotten passwords have no self-service path without it. DLT is a one-time registration. SMS
cost at school scale is negligible (₹0.10–0.50/SMS). Complete it before the first paid school
goes live.

---

## Guardian and Staff Data Entry (Admin-Led)

Invite-based flows do not work for this market. Admin-led entry is correct.

### Flow

1. Admin fills: name, mobile (required), email (optional), relationship/designation
2. On submit, backend:
   - Looks up user by `(institutionId, mobile)`
   - If found + same role already active: return error — `"A [role] with this mobile number already exists"`
   - If found + different role: create new `member` record only. Do not touch the existing user record.
   - If not found: create user (`institutionId`, mobile, name, email, default password =
     mobile, `mustChangePassword = true`), then create `member` record
3. No frontend lookup. No "user found" message. Admin fills the form, submits, done.

---

## Custom Domains

Schools can point their own subdomain at the platform. The portal looks entirely like their own
application — no visible reference to the underlying platform.

**Example:** `portal.greenvalleyschool.com` → CNAME → `app.erp.test`

### Schema

Add `customDomain` (text, nullable, globally unique) to `institutions` table.

### Tenant resolution

Extend current slug-based resolution to check custom domain first:
1. Check if request hostname matches any `institutions.customDomain`
2. If yes: resolve that institution as the tenant
3. If no: fall back to slug extraction from `*.erp.test`

### SSL

Caddy provisions TLS automatically for any hostname that hits it. No manual certificate
management needed.

### Cookie domain

Cookies must be scoped to the **exact request hostname**, not a wildcard domain.

- Request from `demo.erp.test` → cookie domain `demo.erp.test`
- Request from `portal.greenvalleyschool.com` → cookie domain `portal.greenvalleyschool.com`

This means a session cookie issued at `school1.erp.test` is never sent by the browser to
`school2.erp.test`. Tenant session isolation is enforced at the browser level, not just in
backend checks.

The NestJS cookie configuration must derive the domain from the incoming request hostname
dynamically. Do not use a static `.erp.test` wildcard domain. This applies to both the auth
cookie and any session cookie.

---

## Implementation Sequence

### Step 1 — Lock decisions in CLAUDE.md
Update product decision rules. No schema changes yet.

### Step 2 — Schema migration
- Add `institutionId` (not null, FK) to `user` table
- Add `mustChangePassword` (boolean, not null, default false) to `user` table
- Change mobile unique → composite unique `(institutionId, mobile)`
- Change email unique → composite unique `(institutionId, email)`
- Remove `invitedAt`, `acceptedAt` from `studentGuardianLinks`
- Add `customDomain` (nullable, unique) to `institutions` table
- Create `platform_admins` table
- Run `bun run db:generate` — do not write migration files manually

### Step 3 — Backend updates
- Update all user lookup queries to scope by `institutionId`
- Update Passport local strategy to resolve institution from request hostname before user lookup
- **Add session tenant-match check:** On every authenticated request, after deserialising the
  session user, verify `user.institutionId === resolvedTenant.id`. If they do not match, reject
  the request as unauthenticated. Exact-hostname cookie scoping already prevents cross-tenant
  cookie leakage at the browser level — this check is defense-in-depth for crafted or replayed
  requests.
- Update staff and guardian create flows for institution-scoped user creation
- Update tenant resolution middleware to check `customDomain` before slug fallback
- Add admin password-reset endpoint
- Add platform admin Passport strategy (`platform-local`) querying `platform_admins`

### Step 4 — Auth flow updates
- Default password = mobile number on guardian/staff user creation
- Force password change on first login when `mustChangePassword = true`
- Skip forced change for self-serve signup path
- Add OTP service interface stub (abstraction point, no implementation)

### Step 5 — Student login
Deferred. No auth work needed for students in this phase.

---

## What This Does Not Change

- HTTP-only cookie auth — unchanged
- NestJS Passport strategy structure — data sources update, strategy shape stays
- RBAC and permission model — unchanged
- Multi-campus model — unchanged
- All existing ERP module business logic — no functional change
