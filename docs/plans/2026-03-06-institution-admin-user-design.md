# Institution Admin User Creation + Remove Org Sign-up — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When creating an institution, also create an admin user and membership so the institution is immediately usable. Remove the broken org sign-up page.

**Architecture:** Extend the existing `createInstitution` server action to accept admin user fields, use Better Auth's `auth.api.signUpEmail()` to create the user (handles password hashing), then insert a `member` record. Delete the org sign-up page and its references.

**Tech Stack:** Better Auth server API, Drizzle ORM, next-safe-action, react-hook-form + zod, zod-form-data

---

### Task 1: Add admin fields to institution schema

**Files:**
- Modify: `src/server/institutions/schemas.ts`

**Step 1: Add admin fields to `createInstitutionSchema`**

In `src/server/institutions/schemas.ts`, import `V` from `@/constants` and add admin fields:

```ts
import { V } from "@/constants";
```

Extend `createInstitutionSchema`:

```ts
export const createInstitutionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: slugSchema,
  institutionType: z.string().min(1, "Institution type is required"),
  adminName: V.name,
  adminEmail: V.email,
  adminPassword: V.password,
});
```

**Step 2: Update the formData variant**

```ts
export const createInstitutionFormSchema = zfd.formData({
  name: zfd.text(createInstitutionSchema.shape.name),
  slug: zfd.text(createInstitutionSchema.shape.slug),
  institutionType: zfd.text(createInstitutionSchema.shape.institutionType),
  adminName: zfd.text(createInstitutionSchema.shape.adminName),
  adminEmail: zfd.text(createInstitutionSchema.shape.adminEmail),
  adminPassword: zfd.text(createInstitutionSchema.shape.adminPassword),
});
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: Errors in `actions.ts` and `create-institution-form.tsx` (they don't use the new fields yet). That's expected — we fix them in Tasks 2 and 3.

**Step 4: Commit**

```
feat: add admin user fields to institution creation schema
```

---

### Task 2: Update server action to create admin user + membership

**Files:**
- Modify: `src/server/institutions/actions.ts`
- Modify: `src/constants/errors.ts`

**Step 1: Add error message constant**

In `src/constants/errors.ts`, add to `ERROR_MESSAGES.INSTITUTION`:

```ts
INSTITUTION: {
  SLUG_ALREADY_EXISTS:
    "This subdomain slug is already in use. Please choose another one.",
  ADMIN_EMAIL_ALREADY_MEMBER:
    "This email is already a member of another institution with the same role.",
},
```

**Step 2: Update `createInstitution` action**

Replace the entire `createInstitution` action in `src/server/institutions/actions.ts`:

```ts
import { auth } from "@/lib/auth";
import { member } from "@/db/schema/auth";
import { ROLES, STATUS } from "@/constants";
```

The action body becomes:

```ts
export const createInstitution = superAdminAction
  .inputSchema(createInstitutionFormSchema)
  .stateAction(
    async ({
      parsedInput: {
        name,
        slug,
        institutionType,
        adminName,
        adminEmail,
        adminPassword,
      },
    }) => {
      // 1. Create the organization
      let orgId: string;
      try {
        orgId = crypto.randomUUID();
        await db.insert(organization).values({
          id: orgId,
          name,
          slug,
          institutionType,
          createdAt: new Date(),
          status: STATUS.ORG.ACTIVE,
        });
      } catch (error) {
        handleDbError(error);
        throw error; // unreachable, satisfies TS
      }

      // 2. Create the admin user (or find existing)
      let userId: string;
      const signUpResult = await auth.api.signUpEmail({
        body: { name: adminName, email: adminEmail, password: adminPassword },
      });

      if (signUpResult.user) {
        userId = signUpResult.user.id;
      } else {
        // User already exists — look them up
        const existingUser = await db.query.user.findFirst({
          where: (u, { eq }) => eq(u.email, adminEmail),
        });
        if (!existingUser) {
          throw new Error("Failed to create admin user");
        }
        userId = existingUser.id;
      }

      // 3. Create membership
      try {
        await db.insert(member).values({
          id: crypto.randomUUID(),
          organizationId: orgId,
          userId,
          role: ROLES.INSTITUTION_ADMIN,
          status: STATUS.MEMBER.ACTIVE,
          createdAt: new Date(),
        });
      } catch (error) {
        const pgError = extractPostgresError(error);
        if (pgError?.code === DB_ERROR_CODES.UNIQUE_VIOLATION) {
          returnValidationErrors(z.object({ adminEmail: z.string() }), {
            adminEmail: {
              _errors: [ERROR_MESSAGES.INSTITUTION.ADMIN_EMAIL_ALREADY_MEMBER],
            },
          });
        }
        throw error;
      }

      revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
      redirect(ROUTES.ADMIN.INSTITUTIONS);
    },
  );
```

Note: `auth.api.signUpEmail()` may throw if the email already exists (Better Auth behavior). Wrap in try/catch — if it throws with a "user already exists" type error, fall back to the DB lookup.

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: Form component errors remain (Task 3). Action should be clean.

**Step 4: Commit**

```
feat: create admin user and membership on institution creation
```

---

### Task 3: Update the create-institution form with admin fields

**Files:**
- Modify: `src/components/platform/create-institution-form.tsx`

**Step 1: Update the form**

Add `V` to imports:
```ts
import { ROUTES, V } from "@/constants";
```

Update the form type and defaults — the `CreateInstitutionInput` type already includes the new fields from Task 1, so update `defaultValues`:

```ts
defaultValues: { name: "", slug: "", institutionType: "", adminName: "", adminEmail: "", adminPassword: "" },
```

Update `serverError` to also check `adminEmail`:
```ts
const serverError =
  state?.serverError ??
  state?.validationErrors?.slug?._errors?.[0] ??
  state?.validationErrors?.adminEmail?._errors?.[0];
```

Add three new `Controller` fields after the institution type Select, with a visual separator:

```tsx
<div className="border-t pt-5 mt-1">
  <h3 className="text-sm font-medium mb-4">Admin account</h3>
  <div className="flex flex-col gap-5">
    <Controller
      control={control}
      name="adminName"
      render={({ field }) => (
        <Field>
          <FieldLabel>Admin name</FieldLabel>
          <Input {...field} name="adminName" placeholder="Jane Smith" />
          <FieldError>{errors.adminName?.message}</FieldError>
        </Field>
      )}
    />

    <Controller
      control={control}
      name="adminEmail"
      render={({ field }) => (
        <Field>
          <FieldLabel>Admin email</FieldLabel>
          <Input {...field} name="adminEmail" type="email" placeholder="admin@school.edu" />
          <FieldError>{errors.adminEmail?.message}</FieldError>
        </Field>
      )}
    />

    <Controller
      control={control}
      name="adminPassword"
      render={({ field }) => (
        <Field>
          <FieldLabel>Admin password</FieldLabel>
          <Input {...field} name="adminPassword" type="password" placeholder="••••••••" />
          <FieldError>{errors.adminPassword?.message}</FieldError>
        </Field>
      )}
    />
  </div>
</div>
```

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```
feat: add admin user fields to create-institution form
```

---

### Task 4: Remove org sign-up page and references

**Files:**
- Delete: `src/app/(org)/auth/sign-up/page.tsx`
- Modify: `src/app/(org)/auth/sign-in/page.tsx`
- Modify: `src/constants/routes.ts`

**Step 1: Delete the sign-up page**

```bash
rm src/app/\(org\)/auth/sign-up/page.tsx
rmdir src/app/\(org\)/auth/sign-up
```

**Step 2: Remove `SIGN_UP` from routes constant**

In `src/constants/routes.ts`, remove the `SIGN_UP` line from `AUTH`:

```ts
AUTH: {
  PREFIX: "/auth",
  SIGN_IN: "/auth/sign-in",
  TWO_FA: "/auth/2fa",
},
```

**Step 3: Remove sign-up link from sign-in page**

In `src/app/(org)/auth/sign-in/page.tsx`, remove the entire paragraph block at the bottom:

```tsx
      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href={ROUTES.AUTH.SIGN_UP} className="text-foreground underline underline-offset-4">
          Sign up
        </a>
      </p>
```

**Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: PASS — no other files reference `ROUTES.AUTH.SIGN_UP`.

**Step 5: Commit**

```
refactor: remove org sign-up page (users added via admin)
```

---

### Task 5: Manual verification

**Step 1: Start the dev server**

Run: `bun dev`

**Step 2: Test institution creation**

1. Navigate to `localhost:3000/admin/institutions/new`
2. Fill in institution details + admin name/email/password
3. Submit — should redirect to institutions list

**Step 3: Test admin login**

1. Navigate to `<slug>.localhost:3000/auth/sign-in`
2. Log in with the admin email/password set in step 2
3. Should reach the dashboard

**Step 4: Verify sign-up removed**

1. Navigate to `<slug>.localhost:3000/auth/sign-up`
2. Should show 404
3. Sign-in page should not have "Don't have an account?" link

**Step 5: Commit (if any fixes needed)**

```
fix: address issues found during manual verification
```
