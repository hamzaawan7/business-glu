# Project Overview — Business Glu

## Vision

Business Glu is an all-in-one workforce management platform designed for **deskless and frontline workers**. The goal is to replace the patchwork of disconnected tools (scheduling apps, time trackers, chat apps, HR systems) with a single, cohesive platform that managers and employees actually enjoy using.

**Target users:** Small-to-medium businesses with field, retail, hospitality, healthcare, construction, cleaning, and other on-the-go teams.

## Goals

- **Unified Platform** — One app for operations, communication, and HR
- **Mobile-First** — Built for employees who work on their feet, not at a desk
- **Simple Admin Experience** — Powerful web dashboard that doesn't require training to use
- **Compliance Ready** — Built-in tools for labor law compliance, audit trails, and document management
- **Scalable Architecture** — Support single-location shops to multi-location enterprises

## Platform Architecture

The platform is organized into **3 hubs + cross-cutting infrastructure**:

```
┌──────────────────────────────────────────────────────────┐
│                     BUSINESS GLU                         │
├──────────────┬──────────────────┬────────────────────────┤
│  🔧 OPERATIONS  │  💬 COMMUNICATIONS  │  👥 HR & PEOPLE       │
│              │                  │                        │
│  Time Clock  │  Team Chat       │  Courses & Quizzes     │
│  Scheduling  │  Updates Feed    │  Documents             │
│  Forms       │  Directory       │  Time Off              │
│  Quick Tasks │  Knowledge Base  │  Recognition & Rewards │
│              │  Surveys & Polls │  Employee Timeline     │
│              │  Events          │  Org Chart             │
│              │  Help Desk       │  Digital ID            │
├──────────────┴──────────────────┴────────────────────────┤
│              CROSS-CUTTING INFRASTRUCTURE                │
│  Auth & RBAC · Multi-Tenancy (stancl/tenancy)            │
│  Admin Dashboard · Mobile App · REST API · Webhooks      │
│  Security & Compliance · Analytics & Reporting            │
└──────────────────────────────────────────────────────────┘
```

---

## Current Status

> **Last updated:** June 2025

### What's Built & Working ✅

**Authentication & User Management**
- Email/password registration & login (Laravel Breeze)
- Password reset, email verification, profile management
- 5-tier RBAC: `super_admin` → `owner` → `admin` → `manager` → `member`
- `EnsureAdminAccess` middleware protecting `/admin/*` routes
- `EnsureOnboarded` middleware redirecting new users to company setup

**Multi-Tenancy**
- stancl/tenancy v3.9 with database-per-tenant isolation
- `Tenant` model (name, slug, plan, is_active, data JSON)
- Auto-provisioning lifecycle via TenancyServiceProvider

**Onboarding Flow**
- Registration → Company creation flow (name, industry, team size)
- Auto-assigns registering user as `owner` role
- Creates tenant and associates user

**Admin Dashboard (Web)**
- Full sidebar layout (`AdminLayout.tsx`) with collapsible navigation
- Nav sections: Operations, Communication, HR & People, Admin
- Dashboard page with team member count (live from DB)
- Team page with real member list from database
- Settings page showing tenant data (read-only)
- 15 module stub pages scaffolded (TimeClock, Scheduling, Tasks, Forms, Chat, Updates, Directory, KnowledgeBase, Surveys, Events, HelpDesk, Courses, Documents, TimeOff, Recognition)

**User/Employee View**
- Separate sidebar layout (`UserLayout.tsx`)
- Nav sections: My Work, Communication, HR & Info, Account
- 13 user-facing stub pages scaffolded
- Session-based Admin ↔ User view switching (for admin+ roles)

**Branding & UI**
- Brand colors: Primary #495B67, Secondary #515151, Accent #71858E, White #FFFFFF
- Typography: Montserrat Bold (headings), Lato Regular (body)
- Logo assets extracted from brand PDF (3 PNGs)
- SVG icons throughout UI (no emoji)

**Developer Experience**
- `npm start` runs both Laravel + Vite servers via concurrently
- SQLite database for development
- Database seeder: demo tenant + 3 test users

### What's NOT Built Yet 🔲

- **Zero business-domain database tables** (no time_entries, shifts, tasks, messages, etc.)
- **All 15 admin module pages are stubs** (no forms, no CRUD, no real data)
- **All 13 user pages are stubs** (static mockup content only)
- **Team invitation system** (team page is read-only)
- **Settings save functionality** (displays data but can't edit)
- **Dashboard stats** (hardcoded to 0 except team count)
- **No API routes** for future mobile app
- **No file upload infrastructure**
- **No notification system**
- **No tests**

---

## Implementation Plan

### Phase 1 — Foundation (MVP) — ✅ Mostly Complete

Set up the core platform infrastructure that all other features depend on.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Auth & User Management** | Registration, login, RBAC, multi-tenancy, user profiles | ✅ Complete |
| **Onboarding Flow** | Registration → company creation → dashboard | ✅ Complete |
| **Admin Dashboard** | Web panel with sidebar, team list, settings | ✅ Scaffolded (stubs need wiring) |
| **User Dashboard** | Employee view with sidebar layout | ✅ Scaffolded (stubs need wiring) |
| **View Switching** | Admin ↔ User toggle for admin+ roles | ✅ Complete |
| **Team Management** | Invite members, edit roles, remove | 🟡 Read-only (needs invite/edit/remove) |
| **Company Settings** | Save company info, toggle modules | 🟡 Display-only (needs save functionality) |
| **Mobile App Shell** | iOS & Android app with push notifications | ⬜ Planned |

### Phase 2 — Operations Hub — ⬜ Next Up

The day-to-day tools managers and employees use every shift.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Employee Time Clock** | Clock in/out, digital timesheets, break management, overtime rules, approval workflow, notifications | ⬜ Stub page only |
| **Employee Scheduling** | Drag & drop builder, shift templates, availability, publish/notify, conflict detection | ⬜ Stub page only |
| **Quick Tasks** | Create, assign, track tasks with subtasks, reminders, permissions | ⬜ Stub page only |
| **Forms & Checklists** | Form builder, submissions, templates, assignment, reporting | ⬜ Stub page only |

### Phase 3 — Communications Hub — ⬜ Planned

Internal communication suite to keep everyone connected and informed.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Team Chat** | 1:1 & group chat, channels, media sharing, read receipts, admin controls | ⬜ Stub page only |
| **Updates Feed** | Company feed, rich attachments, reactions, comments, read tracking | ⬜ Stub page only |
| **Employee Directory** | Profiles, search & filter, external contacts, contact actions | ⬜ Stub page only |
| **Knowledge Base** | Articles, categories, rich media, search, access permissions | ⬜ Stub page only |
| **Surveys & Polls** | Survey builder, live polls, analytics, distribution | ⬜ Stub page only |
| **Events** | Event creation, RSVP, attendee tracking, notifications | ⬜ Stub page only |
| **Help Desk** | Ticketing system, auto-assignment, SLA monitoring | ⬜ Stub page only |

### Phase 4 — HR & People Management — ⬜ Planned

Complete HR platform for training, compliance, and employee lifecycle.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Courses & Training** | Course builder, AI generation, progress tracking, certificates | ⬜ Stub page only |
| **Quizzes** | Quiz builder, scoring, randomization, statistics | ⬜ Not started |
| **Document Management** | Upload, expiration alerts, compliance dashboard | ⬜ Stub page only |
| **Time Off Management** | Leave requests, approval workflow, balance tracking | ⬜ Stub page only |
| **Recognition & Rewards** | Badges, points, gift cards, recognition feed | ⬜ Stub page only |
| **Employee Timeline** | Milestone tracking, history view | ⬜ Not started |
| **Org Chart** | Auto-generated visual hierarchy | ⬜ Not started |
| **Digital Employee ID** | Mobile ID card | ⬜ Not started |
| **Employee Timeline** | Milestone tracking (hire date/promotions/role changes/salary raises/reviews), file attachments per event, upcoming milestones view, full chronological history |
| **Org Chart** | Auto-generated visual hierarchy from reporting structure, interactive navigation to profiles, department/location filter views |
| **Digital Employee ID** | Mobile ID card (photo/name/role/company), custom fields, instant issuance without physical production |

### Phase 5 — Integrations & Polish — ⬜ Planned

Third-party integrations, advanced features, and platform hardening.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Payroll Integrations** | Gusto, QuickBooks, Xero, Paychex, ADP | ⬜ Not started |
| **API & Webhooks** | Public REST API, real-time webhooks | ⬜ Not started |
| **Zapier Integration** | Connect with 5,000+ external apps | ⬜ Not started |
| **Calendar Sync** | Google Calendar, Apple Calendar, Outlook | ⬜ Not started |
| **Kiosk Mode** | Shared-device clock-in station | ⬜ Not started |
| **AI Auto-Scheduling** | Smart schedule generation | ⬜ Not started |
| **Offline Support** | Basic offline + sync | ⬜ Not started |
| **Advanced Analytics** | Cross-feature dashboards | ⬜ Not started |
| **Security & Compliance** | Encryption, GDPR, SOC 2, audit trails | ⬜ Not started |

---

## Scope Summary

| Metric | Count |
|--------|-------|
| **Phases** | 5 |
| **Modules** | ~20 |
| **Total Features** | 200+ |

---

## Tech Stack

| Layer | Choice | Details |
|-------|--------|---------|
| **Backend** | Laravel 12 (PHP 8.2) | Elegant MVC framework, built-in auth, queues, events, broadcasting |
| **Frontend** | React + TypeScript via Inertia.js | Server-driven SPA — Laravel routes render React pages directly |
| **Build Tool** | Vite | Fast HMR, Laravel Vite plugin for asset bundling |
| **Styling** | Tailwind CSS | Utility-first, brand colors/fonts configured in `tailwind.config.js` |
| **Auth** | Laravel Breeze (Inertia/React stack) | Registration, login, password reset, email verification, profile management |
| **Multi-Tenancy** | stancl/tenancy v3.9 | Database-per-tenant isolation, auto-provisioning, domain/subdomain identification |
| **Database** | SQLite (dev) → PostgreSQL (prod) | Eloquent ORM, migrations, seeders, central + tenant DB architecture |
| **Real-Time** | Laravel Broadcasting + Reverb | WebSocket server for chat, live updates, notifications |
| **File Storage** | Laravel Storage (local dev) → AWS S3 (prod) | Documents, images, training media |
| **Mobile (future)** | React Native (Expo) | Shared React/TS knowledge; Laravel API routes for mobile clients |
| **Deployment** | Laravel Forge / Railway → AWS | Start simple, scale when needed |

### Project Structure

```
business-glu/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/                     → Breeze auth controllers
│   │   │   ├── OnboardingController.php  → Company creation after registration
│   │   │   ├── ProfileController.php     → User profile CRUD
│   │   │   └── ViewSwitchController.php  → Admin ↔ User view toggle
│   │   └── Middleware/
│   │       ├── EnsureAdminAccess.php     → Blocks non-admins from /admin/*
│   │       ├── EnsureOnboarded.php       → Redirects users without tenant to /onboarding
│   │       └── HandleInertiaRequests.php → Shares auth, activeView, canSwitchView
│   ├── Models/
│   │   ├── User.php                      → Roles (super_admin/owner/admin/manager/member), tenant_id
│   │   └── Tenant.php                    → Custom stancl/tenancy model (name, slug, plan)
│   ├── Providers/
│   │   └── TenancyServiceProvider.php    → Multi-tenancy event lifecycle
│   └── Services/                         → Business logic (future)
├── bootstrap/
│   └── app.php                           → Middleware stack & aliases
├── config/
│   └── tenancy.php                       → Multi-tenancy configuration
├── database/
│   ├── migrations/
│   │   ├── *_create_users_table.php      → Users + role + tenant_id
│   │   ├── *_create_tenants_table.php    → Tenants (name, slug, plan)
│   │   ├── *_create_domains_table.php    → Tenant domain mappings
│   │   └── *_add_tenant_foreign_key.php  → FK: users → tenants
│   ├── migrations/tenant/                → Tenant-scoped database schema
│   └── seeders/
│       └── DatabaseSeeder.php            → Demo tenant + 3 test users
├── resources/
│   ├── js/
│   │   ├── Components/                   → ApplicationLogo, ViewSwitcher, ModulePage, etc.
│   │   ├── Layouts/
│   │   │   ├── AdminLayout.tsx           → Admin sidebar + top bar
│   │   │   ├── UserLayout.tsx            → Employee sidebar + top bar
│   │   │   └── GuestLayout.tsx           → Centered card for auth pages
│   │   └── Pages/
│   │       ├── Admin/                    → Team.tsx, Settings.tsx
│   │       ├── Auth/                     → Login, Register, ForgotPassword, etc.
│   │       ├── Communication/            → Chat, Updates, Directory, etc. (stubs)
│   │       ├── Dashboard.tsx             → Admin dashboard with stats
│   │       ├── HR/                       → Courses, Documents, TimeOff, Recognition (stubs)
│   │       ├── Onboarding/              → CreateCompany.tsx
│   │       ├── Operations/              → TimeClock, Scheduling, Tasks, Forms (stubs)
│   │       ├── Profile/                 → Edit.tsx + partials
│   │       ├── User/                    → Home, MyTimeClock, MySchedule, etc. (stubs)
│   │       └── Welcome.tsx              → Public landing page
│   └── css/app.css                      → Tailwind + Google Fonts imports
├── routes/
│   ├── web.php                          → All routes: admin/*, app/*, onboarding, etc.
│   ├── auth.php                         → Breeze authentication routes
│   └── tenant.php                       → Tenant-scoped routes (future)
├── public/images/                       → Logo assets (3 PNGs from brand PDF)
├── docs/                                → Project documentation
│   ├── project-overview.md              → This file
│   ├── feature-breakdown.md             → 200+ features by phase
│   └── brand-guidelines.md              → Colors, typography, voice, logo
├── tailwind.config.js                   → Brand colors & typography theme
└── vite.config.js                       → Vite build configuration
```

## Key Documents

| Document | Path |
|----------|------|
| Feature Breakdown | [`docs/feature-breakdown.md`](./feature-breakdown.md) |
| Brand Guidelines | [`docs/brand-guidelines.md`](./brand-guidelines.md) |
| Project Overview | This file |

---

> This document will be updated as architecture decisions evolve.
