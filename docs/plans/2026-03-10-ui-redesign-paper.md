# UI Redesign In Paper First

## Goal

Redesign the platform UI in Paper before changing implementation code. The first design pass should cover the shared visual system and the highest-value product surfaces so the engineering work can follow a validated direction instead of iterative UI patching.

## Why A Redesign Is Needed

- The current UI is functionally correct but visually generic.
- The existing screens rely heavily on default shadcn card, spacing, and palette choices.
- The product is an ERP for schools and colleges, but the interface does not yet communicate institutional trust, operational clarity, or scale.
- The authenticated shell, auth screens, and dashboard feel disconnected instead of belonging to one system.

## Design Direction

Build toward a visual language that feels:

- operational
- trustworthy
- structured
- calm
- premium without looking like consumer SaaS

Reference qualities:

- strong information hierarchy
- denser but readable layouts
- clearer section framing
- better contrast between navigation, workspace, and data modules
- restrained motion and decoration

Avoid:

- default purple-on-white SaaS styling
- oversized empty cards
- generic centered auth forms with no product character
- overuse of rounded containers for every surface

## Proposed Visual System

### Tone

- Use a more editorial and institutional look than the current default shadcn appearance.
- Favor warm neutrals or slate-driven surfaces with one disciplined accent color.
- Make dashboards feel like operational control rooms, not marketing sites.

### Layout

- Strong left navigation rail
- Compact top workspace bar
- Centered content width for reading-heavy screens
- Modular panel system for metrics, activity, and tables

### Typography

- Use a more expressive heading face and a practical UI body face
- Keep headings compact and high-contrast
- Use smaller, cleaner metadata styles for counts, helper text, and table chrome

### Components To Rework

- auth split layouts
- sidebar header, nav groups, active states, footer identity block
- top bar search and profile controls
- metric cards
- tables and filter bars
- empty states
- page headers and action rows

## Screens To Design First

### 1. Platform Admin Sign In

Purpose:
- Establish the new visual language immediately

Requirements:
- branded split-screen or asymmetrical layout
- stronger hierarchy than the current centered card
- clear distinction between platform admin and institution sign-in contexts

### 2. Org Sign In

Purpose:
- adapt the same design system to institution-branded access

Requirements:
- institution branding slot
- consistent form treatment with platform auth
- more polished left branding panel

### 3. Org Dashboard

Purpose:
- define the main ERP workspace shell

Requirements:
- redesigned sidebar
- redesigned top bar
- metric section
- activity or operations section
- upcoming tasks / academic overview section

### 4. Platform Admin Dashboard

Purpose:
- define the super admin control surface

Requirements:
- institution health metrics
- setup / action shortcuts
- recent institution activity area

### 5. Institutions List

Purpose:
- establish the table, filter, and admin list pattern

Requirements:
- stronger page header
- filter/search bar treatment
- denser but cleaner data table
- empty/loading state direction

## Deliverables In Paper

Create these artboards first:

- Platform Sign In Desktop
- Org Sign In Desktop
- Org Dashboard Desktop
- Platform Dashboard Desktop
- Institutions List Desktop
- Org Dashboard Mobile

If time permits after the first pass:

- Create Institution form
- Members list
- Settings overview

## Execution Sequence

1. Open or create a Paper file
2. Create the desktop artboards
3. Establish the shared tokens visually inside the first auth screen
4. Reuse that system across dashboards and table views
5. Review the design direction before implementation work starts

## Notes For Implementation Later

- Preserve the existing app architecture and route structure
- Keep the current sidebar and top bar component boundaries if possible
- Prefer design changes that can be mapped cleanly onto the current Next.js and shadcn component structure
- Do not start code changes until the Paper pass is approved
