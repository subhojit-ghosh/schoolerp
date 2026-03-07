# Dashboard Visual Refresh + Navigation Expansion

**Goal:** Restyle the existing dashboard shell to match modern SaaS aesthetics (Linear, Stripe, GitHub) and expand the navigation structure for a growing ERP system. No architectural changes — same shadcn Sidebar, role filtering, mobile sheet, DataTable, and auth guards.

---

## Navigation Structure

Expand from 3 to 6 nav groups. Each item has icon + label + permission.

| Group | Label | Items |
|-------|-------|-------|
| CORE | Core | Dashboard |
| ACADEMICS | Academics | Students, Classes, Teachers |
| OPERATIONS | Operations | Attendance, Exams, Admissions |
| FINANCE | Finance | Fees, Invoices, Reports |
| COMMUNICATION | Communication | Messages, Announcements |
| ADMIN | Administration | Members, Roles, Settings |

New items: Classes, Teachers, Exams, Invoices, Messages, Announcements, Settings.
Each gets a route constant, permission constant, and placeholder page.

---

## Sidebar Styling

- **Active item:** Subtle 2px left border accent + light background tint (no full background fill)
- **Group labels:** Uppercase, 10px-equivalent (`text-[0.625rem]`), letterspacing, muted color
- **Item spacing:** Reduce gap from `gap-1` to `gap-0.5`
- **Header:** Institution initial + name, no chevron
- **Footer:** Avatar + name, dropdown on click, simpler layout
- **Collapsed icon mode:** Must still work — icons required on all items

---

## Top Bar

- Height: `h-12` (48px, down from 64px)
- Remove vertical separator between sidebar trigger and content
- Add global search input placeholder (Command+K style, non-functional)
- Keep: sidebar trigger, mode toggle, profile dropdown

---

## Page Layout

- Remove page descriptions under titles
- Title row: `<h1>` left + primary action button right
- Filter/search bar below title row
- Content max-width: `max-w-6xl` (1152px), centered with `mx-auto`
- Consistent 24px vertical rhythm (`space-y-6`)
- Page padding: 24px (`p-6`)

---

## Data Tables

- Header height: `h-9` (down from `h-10`)
- Header text: `text-xs font-medium text-muted-foreground uppercase tracking-wider`
- Cell padding: `px-3 py-2`
- Row hover: `hover:bg-muted/30` (subtler)
- Border wrapper: `border-border/50` (subtler borders)

---

## Files Changed

### Constants
- `src/constants/nav.ts` — Add CORE, OPERATIONS, COMMUNICATION groups + labels + order
- `src/constants/routes.ts` — Add classes, teachers, exams, invoices, messages, announcements, settings routes
- `src/constants/permissions.ts` — Add exams, classes, teachers, communication, settings permissions

### Navigation
- `src/lib/nav.ts` — Add new NavItem entries with lucide icons

### Sidebar Components
- `src/components/org/app-sidebar.tsx` — Visual refinements (active style, spacing, header/footer)
- `src/components/platform/admin-sidebar.tsx` — Same refinements for consistency

### Layout Files
- `src/app/admin/(protected)/layout.tsx` — Compact top bar, search placeholder, remove separator
- `src/app/(org)/(protected)/layout.tsx` — Same refinements

### UI Components
- `src/components/ui/table.tsx` — Compact headers, subtler borders, uppercase header text

### Page Components
- `src/components/platform/institution-list.tsx` — Remove description, tighten layout

### New Placeholder Pages
- `src/app/(org)/(protected)/classes/page.tsx`
- `src/app/(org)/(protected)/teachers/page.tsx`
- `src/app/(org)/(protected)/exams/page.tsx`
- `src/app/(org)/(protected)/invoices/page.tsx`
- `src/app/(org)/(protected)/messages/page.tsx`
- `src/app/(org)/(protected)/announcements/page.tsx`
- `src/app/(org)/(protected)/settings/page.tsx`

---

## Unchanged

- `src/components/ui/sidebar.tsx` — base component untouched
- `SidebarProvider` / `SidebarInset` architecture
- `filterNavItems()` permission filtering
- `DataTable` logic (pagination, sorting, search debounce, nuqs)
- Mobile sheet behavior
- Auth flow and layout guards
