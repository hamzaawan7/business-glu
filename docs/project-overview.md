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
│  Auth & RBAC · Multi-Tenancy · Admin Dashboard           │
│  Mobile App · REST API · Webhooks · Integrations         │
│  Security & Compliance · Analytics & Reporting           │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1 — Foundation (MVP)

Set up the core platform infrastructure that all other features depend on.

| Module | What It Includes |
|--------|-----------------|
| **Auth & User Management** | Registration, login, RBAC (Admin / Manager / Employee), multi-tenancy, user profiles, Smart Groups & Tags |
| **Admin Dashboard** | Web panel, company settings, branding, activity log |
| **Mobile App Shell** | iOS & Android app with push notifications |

### Phase 2 — Operations Hub

The day-to-day tools managers and employees use every shift.

| Module | What It Includes |
|--------|-----------------|
| **Employee Time Clock** | Clock in/out (app/web/kiosk), GPS tracking, geofencing, digital timesheets, approval workflow, break management, overtime rules (daily/weekly/holiday/consecutive/partial day/pay-period), jobs & sub-jobs, shift attachments, payroll integrations, conflict detection, reporting & auto-reports, notifications & reminders |
| **Employee Scheduling** | Drag & drop builder, shift templates, recurring/duplicate shifts, AI auto-scheduling, open shifts, multi-location, shift info (times/zones/colors/layers/notes/tasks), availability & preferred hours, shift swap with admin approval, Smart Groups, compliance & conflict detection, labor cost view, import/export, calendar sync, mobile editing |
| **Quick Tasks** | Single & batch task creation, task details (location/time/description/files/subtasks), recurring tasks (daily/weekly/monthly with series editing & unlinking), permissions config (who can create/delegate), status management (single & bulk mark done, revert), draft mode, default due date, week-start config, mobile creation |
| **Forms & Checklists** | 12+ field types (text/number/dropdown/yes-no/image/scanner/file/signature/location/video/date), AI form creation from file/prompt, conditional logic, sections & folders, bulk field management, required fields & proof of completion, multiple selection & uploads, form assignment to users/groups/shifts, form permissions (asset admins), real-time submission feed (table/inbox views, group by), manager fields (sign-off/status/notes/tags), sharing (internal/external), PDF & bulk export, auto-reminders, auto-reports, anonymous forms, entry limits, mobile preview |

### Phase 3 — Communications Hub

Internal communication suite to keep everyone connected and informed.

| Module | What It Includes |
|--------|-----------------|
| **Team Chat** | 1:1 & group chat, company-wide channels, media sharing (images/video/files/GIFs/links), read receipts, scheduled messages (work-hours only), admin controls & moderation, cross-feature chat (from time clock/scheduling/tasks), push notifications, search |
| **Updates Feed** | Company feed with topics (CEO Updates, HR News, etc.), rich attachments (images/video/GIFs/YouTube/files/location with Maps/links/polls/shortcuts), reactions & comments, read tracking, targeted distribution, scheduled publishing, **recurring updates** (daily/weekly/monthly with series management), **pop-up updates** (forced display on app open, customizable confirmation button, "Remind Me Later", auto-expire 1–30 days, confirmation tracking & reminders, cancel/stop pop-up), **auto-translation** (device-language detection, "See Translation" button), shortcuts/deep links to any platform feature, update templates, scheduled removal, SMS fallback, mobile creation |
| **Employee Directory** | Profiles with custom fields, search & filter (name/department/role/location), external contacts (clients/suppliers/vendors), direct contact actions (call/message/email), access control |
| **Knowledge Base** | Content management (articles/policies/handbooks/SOPs), categories & folders, rich media (images/videos/PDFs/links), mobile access, full-text search, access permissions by role/team, version control |
| **Surveys & Polls** | Survey builder (multiple choice/rating/free text/etc.), live polls with instant results, anonymous responses, targeted distribution, results dashboard with analytics, completion tracking & reminders, export to CSV/Excel |
| **Events** | Event creation (date/time/location/description), RSVP management, targeted invitations, attendee tracking, push notification reminders |
| **Help Desk** | Internal ticketing system, auto-assignment to available reps, ticket lifecycle (Open → In Progress → Resolved → Closed), manager dashboard with SLA monitoring, multiple desks/categories, ticket history & audit trail |

### Phase 4 — HR & People Management

Complete HR platform for training, compliance, and employee lifecycle.

| Module | What It Includes |
|--------|-----------------|
| **Courses** | Course builder with sections & objects (text/documents/videos/quizzes/forms/images), **AI course generation** from text prompts, course segments/grouping by role/team, course categories, draft → publish workflow with user/group assignment, shareable course links, **object timing** (schedule when content unlocks), admin permissions |
| **Quizzes** | Multiple-choice builder (text or image answers, single correct), pass/fail scoring (1–100), feedback settings (show score/per-question feedback/correct answers), **question randomization**, attempt limits & due dates, quiz-in-courses with object timing for daily recurring, mobile preview, **quiz statistics & insights** (filter by result/entries/date, per-question breakdown), one-time pass rule, assignment to Smart Groups or users |
| **Document Management** | Centralized upload & storage, employee self-upload from mobile, **expiration dates & auto-alerts**, document categories (licenses/contracts/certs), compliance dashboard (missing/expired/expiring), role-based access control, bulk upload |
| **Time Off Management** | Leave request submission via app, one-click approval workflow, configurable leave policies (vacation/sick/parental/etc.), balance tracking & auto-calculation, accrual rules, calendar view, compliance notifications, team availability view |
| **Recognition & Rewards** | Public recognition (company feed spotlight), private recognition messages, custom digital badges, reward points/tokens, gift card redemption, milestone celebrations (birthdays/anniversaries), recognition wall/feed |
| **Employee Timeline** | Milestone tracking (hire date/promotions/role changes/salary raises/reviews), file attachments per event, upcoming milestones view, full chronological history |
| **Org Chart** | Auto-generated visual hierarchy from reporting structure, interactive navigation to profiles, department/location filter views |
| **Digital Employee ID** | Mobile ID card (photo/name/role/company), custom fields, instant issuance without physical production |

### Phase 5 — Integrations & Polish

Third-party integrations, advanced features, and platform hardening.

| Module | What It Includes |
|--------|-----------------|
| **Payroll Integrations** | Gusto, QuickBooks, Xero, Paychex, ADP |
| **API & Webhooks** | Public REST API (users/timesheets/shifts/forms/etc.), real-time webhooks |
| **Zapier Integration** | Connect with 5,000+ external apps |
| **Calendar Sync** | Google Calendar, Apple Calendar, Outlook |
| **Kiosk Mode** | Shared-device clock-in station with PIN/selfie verification, auto clock-out |
| **AI Auto-Scheduling** | AI-powered schedule generation considering availability, roles, fairness, and conflicts |
| **Offline Support** | Basic functionality offline; sync when reconnected |
| **Advanced Analytics** | Cross-feature analytics (attendance, engagement, training, etc.) |
| **Security & Compliance** | Data encryption (at rest + in transit), GDPR compliance, SOC 2 alignment, immutable audit trails, backup & point-in-time recovery |

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
| **Database** | SQLite (dev) → PostgreSQL (prod) | Eloquent ORM, migrations, seeders |
| **Real-Time** | Laravel Broadcasting + Reverb | WebSocket server for chat, live updates, notifications |
| **File Storage** | Laravel Storage (local dev) → AWS S3 (prod) | Documents, images, training media |
| **Mobile (future)** | React Native (Expo) | Shared React/TS knowledge; Laravel API routes for mobile clients |
| **Deployment** | Laravel Forge / Railway → AWS | Start simple, scale when needed |

### Project Structure

```
business-glu/
├── app/                  → Laravel application (Models, Controllers, Services, etc.)
│   ├── Http/Controllers/ → Route controllers
│   ├── Models/           → Eloquent models
│   └── Services/         → Business logic
├── database/
│   ├── migrations/       → Database schema migrations
│   └── seeders/          → Test data seeders
├── resources/
│   ├── js/               → React frontend (Inertia pages, components, layouts)
│   │   ├── components/   → Reusable React components
│   │   ├── layouts/      → AuthenticatedLayout, GuestLayout
│   │   └── pages/        → Inertia pages (Auth/, Dashboard, Profile/)
│   └── css/              → Tailwind CSS with brand theme
├── routes/
│   ├── web.php           → Inertia page routes
│   └── api.php           → JSON API routes (for future mobile app)
├── docs/                 → Project documentation
├── tailwind.config.js    → Brand colors & typography
└── vite.config.js        → Vite build configuration
```

## Key Documents

| Document | Path |
|----------|------|
| Feature Breakdown | [`docs/feature-breakdown.md`](./feature-breakdown.md) |
| Brand Guidelines | [`docs/brand-guidelines.md`](./brand-guidelines.md) |
| Project Overview | This file |

---

> This document will be updated as architecture decisions evolve.
