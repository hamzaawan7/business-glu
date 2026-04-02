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

> **Last updated:** April 2026

### What's Built & Working ✅

**Authentication & User Management**
- Email/password registration & login (Laravel Breeze)
- Password reset, email verification, profile management
- 5-tier RBAC: `super_admin` → `owner` → `admin` → `manager` → `member`
- `EnsureAdminAccess` middleware protecting `/admin/*` routes
- `EnsureOnboarded` middleware redirecting new users to company setup

**Multi-Tenancy**
- stancl/tenancy v3.9 with database-per-tenant isolation
- `Tenant` model (name, slug, plan, is_active, data JSON, modules JSON)
- Auto-provisioning lifecycle via TenancyServiceProvider

**Onboarding Flow**
- Registration → Company creation flow (name, industry, team size)
- Auto-assigns registering user as `owner` role
- Creates tenant and associates user

**Team Management**
- Invite members via email with role selection (sends invitation link)
- Edit member roles (owner/admin/manager/member)
- Remove members with confirmation dialog
- Cancel pending invitations
- Accept invitation flow (existing users + new user registration)
- `TeamInvitation` model with token-based invitations, expiration (7 days)
- `TeamController` with full CRUD + invitation lifecycle

**Company Settings**
- Save company name (owner-only, PATCH request)
- Toggle 15 feature modules on/off per tenant
- `modules` JSON column on `tenants` table with defaults
- `SettingsController` with `updateCompany` + `toggleModule` actions

**Activity Log / Audit Trail**
- Filterable activity log with event types, user tracking, date ranges
- Immutable audit records for compliance
- `ActivityLog` model with relationships to users and subjects
- `ActivityLogController` with filtering and pagination

**Employee Time Clock**
- Clock in / clock out with timestamps
- Break management (start/end breaks, paid/unpaid types)
- GPS coordinate capture at clock-in/out
- Notes on clock-in/out
- Auto-calculated total minutes and break minutes
- Admin view: team overview with stats cards, date picker, active/completed entries
- User view: live timer (HH:MM:SS), big clock-in button, break controls, weekly summary
- Status tracking: active → completed → edited → approved
- Approval workflow fields (approved_by, approved_at)

**Employee Scheduling**
- Schedule builder with drag & drop shift creation
- Shift templates and recurring schedules
- Employee availability management
- Publish/notify workflow
- Conflict detection for overlapping shifts
- Admin and user views with calendar interface

**Forms & Checklists**
- Dynamic form builder with multiple field types
- Form templates for reuse
- Submission tracking and assignment
- Reporting and analytics on submissions
- Admin builder interface and user submission view

**Quick Tasks**
- Task creation with priorities, due dates, and assignments
- Sub-task support for complex work items
- Status management (pending, in-progress, completed)
- Admin task overview and user personal task list

**Team Chat**
- 1:1 and group conversations
- Channel-based communication
- File sharing within conversations
- Real-time messaging with read receipts
- Admin channel management

**Updates Feed (Enhanced)**
- Rich post builder with cover images, multi-photo gallery (up to 10), file attachments, YouTube embeds
- Reusable post templates system (create, apply, save-as-template from existing posts)
- Targeted audience distribution (everyone, by department, by role, specific users)
- Scheduling & auto-expiry with optional reminders
- Interaction controls (enable/disable comments and reactions per post)
- Per-post analytics dashboard (read rate, reactions breakdown, comments, unread members)
- Pop-up alerts for critical updates
- Category tagging and filtering
- Reactions (emoji) and threaded comments
- Read tracking with who-read / who-hasn't lists
- Pin-to-top functionality
- Image lightbox and responsive gallery layouts on employee feed
- Admin and employee views

**Unified Feed (Social Timeline)**
- Aggregated feed combining Updates + Events into a single social-media-style timeline
- FeedController with home() (dashboard stats) and index() (full feed) endpoints
- Filter tabs: All / Updates / Events with counts
- Pinned updates section always at top
- Update cards: avatar, type/category badges, unread indicators, cover images, YouTube embeds, image gallery with lightbox, file attachments, reactions bar with emoji picker, threaded comments
- Event cards: date blocks (month/day), timing badges (Today/Tomorrow/In N days), location, RSVP buttons (Attending/Maybe/Decline), attendance counts
- Pop-up overlay for must-acknowledge updates
- Home page dashboard with real data: welcome greeting, clock-in CTA, stats grid (shifts/tasks/messages), upcoming events preview, recent updates preview
- Replaced "Updates" nav item with "Feed" in user sidebar
- Seeded demo data: 10 updates + 6 events per tenant with comments, reactions, RSVPs

**Employee Directory**
- Employee profiles with department and role info
- Search and filter by department, role, status
- Contact actions (email, phone)
- Admin and user views

**Knowledge Base**
- Article management with rich content editor
- Category organization
- Search functionality
- Access permissions per article/category

**Surveys & Polls**
- Survey builder with multiple question types
- Anonymous response support
- Analytics and result visualization
- Distribution management

**Events**
- Event creation with date, time, location
- RSVP tracking and attendee management
- Event notifications
- Calendar integration view

**Help Desk**
- Ticketing system with priorities
- Ticket assignment and status tracking
- SLA monitoring
- Admin queue management and user ticket views

**Courses & Training**
- Course builder with sections and lessons
- Content management with multiple media types
- Student enrollment and progress tracking
- Certificate generation on completion

**Quizzes**
- Quiz builder with multiple question types
- Question banks and randomization
- Scoring with pass/fail thresholds
- Retake management and statistics

**Document Management**
- Document upload with categorization
- Expiration date tracking and alerts
- Compliance dashboard for document status
- Version control and access management

**Time Off Management**
- Leave request submission and approval workflow
- Policy management with different leave types
- Balance tracking and accrual rules
- Admin overview and user request views

**Recognition & Rewards**
- Badge creation and awarding
- Points system with accumulation
- Gift card rewards catalog
- Recognition feed and leaderboards

**Employee Timeline**
- Chronological milestone tracking
- Hire date, promotions, role changes, reviews
- Timeline view with event details
- Admin and user perspectives

**Org Chart**
- Visual organizational hierarchy
- Reporting line visualization
- Interactive navigation to employee profiles
- Department and location views

**Digital Employee ID**
- Mobile-optimized ID card display
- QR code generation for identification
- Employee photo, name, role, department
- Custom fields per organization

**Analytics & Reporting**
- Cross-module analytics dashboard
- Attendance trends and patterns
- Engagement metrics
- Training completion statistics
- Team performance overviews

**Admin Dashboard (Web)**
- Full sidebar layout (`AdminLayout.tsx`) with collapsible navigation
- Nav sections: Operations, Communication, HR & People, Admin
- Dashboard page with live stats: team members, clocked-in, open tasks, unread messages
- Flash message system via `HandleInertiaRequests` middleware
- All module pages fully functional

**User/Employee View**
- Separate sidebar layout (`UserLayout.tsx`)
- Nav sections: My Work, Communication, HR & Info, Account
- All module pages fully functional
- Session-based Admin ↔ User view switching (for admin+ roles)

**Branding & UI**
- Brand colors: Primary #495B67, Secondary #515151, Accent #71858E, White #FFFFFF
- Typography: Montserrat Bold (headings), Lato Regular (body)
- Logo assets extracted from brand PDF (3 PNGs)
- SVG icons throughout UI (no emoji)
- Consistent design: `rounded-xl` cards, `rounded-2xl` modals, shadow-sm surfaces

**Developer Experience**
- `npm start` runs both Laravel + Vite servers via concurrently
- SQLite database for development
- Database seeder: demo tenant + 3 test users

### What's NOT Built Yet 🔲

- **Employee Time Clock — advanced** (geofencing, digital timesheets, overtime rules, payroll export)
- **REST API & Webhooks** for third-party integrations and mobile app
- **Payroll Integrations** (Gusto, QuickBooks, Xero, ADP)
- **Zapier Integration** (external app connections)
- **Calendar Sync** (Google Calendar, Apple Calendar, Outlook)
- **Kiosk Mode** (shared-device clock-in for job sites)
- **AI / Auto-Scheduling** (smart schedule generation)
- **Offline Support** (basic mobile functionality when offline)
- **Security & Compliance enhancements** (encryption at rest, GDPR tools, SOC 2 alignment)
- **Mobile App** (React Native / Expo)

---

## Implementation Plan

### Phase 1 — Foundation (MVP) — ✅ Complete

Set up the core platform infrastructure that all other features depend on.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Auth & User Management** | Registration, login, RBAC, multi-tenancy, user profiles | ✅ Complete |
| **Onboarding Flow** | Registration → company creation → dashboard | ✅ Complete |
| **Admin Dashboard** | Web panel with sidebar, stats, navigation to all modules | ✅ Complete |
| **User Dashboard** | Employee view with sidebar layout, all modules accessible | ✅ Complete |
| **View Switching** | Admin ↔ User toggle for admin+ roles | ✅ Complete |
| **Team Management** | Invite members, edit roles, remove | ✅ Complete |
| **Company Settings** | Save company info, toggle modules | ✅ Complete |
| **Activity Log** | Audit trail with filterable events, user/action tracking | ✅ Complete |
| **Mobile App Shell** | iOS & Android app with push notifications | ⬜ Planned |

### Phase 2 — Operations Hub — ✅ Complete

The day-to-day tools managers and employees use every shift.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Employee Time Clock** | Clock in/out, GPS, break management, live timer, admin team view, approval fields | ✅ Core functional |
| **Employee Scheduling** | Schedule builder, shift templates, availability, publish/notify, conflict detection | ✅ Complete |
| **Quick Tasks** | Create, assign, track tasks with subtasks, priorities, due dates, status management | ✅ Complete |
| **Forms & Checklists** | Form builder, field types, submissions, templates, assignment, reporting | ✅ Complete |

### Phase 3 — Communications Hub — ✅ Complete

Internal communication suite to keep everyone connected and informed.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Team Chat** | 1:1 & group conversations, channels, file sharing, real-time messaging, read receipts | ✅ Complete |
| **Updates Feed** | Rich post builder, templates, audience targeting, media uploads (cover/gallery/files/YouTube), scheduling & expiry, per-post analytics, reminders, pop-up alerts, reactions, comments, read tracking | ✅ Enhanced |
| **Unified Feed** | Social-media-style timeline aggregating Updates + Events; filter tabs, pinned posts, RSVP, reaction picker, comments, popup alerts, home dashboard with real data | ✅ Complete |
| **Employee Directory** | Profiles, search & filter, departments, contact actions | ✅ Complete |
| **Knowledge Base** | Articles, categories, rich content, search, access permissions | ✅ Complete |
| **Surveys & Polls** | Survey builder, question types, analytics, distribution, anonymous responses | ✅ Complete |
| **Events** | Event creation, RSVP, attendee tracking, notifications | ✅ Complete |
| **Help Desk** | Ticketing system, priorities, assignments, status tracking, SLA | ✅ Complete |

### Phase 4 — HR & People Management — ✅ Complete

Complete HR platform for training, compliance, and employee lifecycle.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Courses & Training** | Course builder, sections & lessons, progress tracking, certificates, enrollment | ✅ Complete |
| **Quizzes** | Quiz builder, question types, scoring, randomization, pass/fail, retakes, statistics | ✅ Complete |
| **Document Management** | Upload, categorization, expiration alerts, compliance dashboard, version control | ✅ Complete |
| **Time Off Management** | Leave requests, approval workflow, policy management, balance tracking, accrual | ✅ Complete |
| **Recognition & Rewards** | Badges, points system, gift cards, recognition feed, leaderboards | ✅ Complete |
| **Employee Timeline** | Milestone tracking, hire/promotion/role change history, chronological view | ✅ Complete |
| **Org Chart** | Visual hierarchy, reporting lines, interactive navigation, department views | ✅ Complete |
| **Digital Employee ID** | Mobile badge, QR code, photo, custom fields, role/department display | ✅ Complete |

### Phase 5 — Integrations & Polish — 🟡 In Progress

Third-party integrations, advanced features, and platform hardening.

| Module | What It Includes | Status |
|--------|-----------------|--------|
| **Advanced Analytics** | Cross-module dashboards, attendance trends, engagement, training completion | ✅ Complete |
| **Audit Trail** | Immutable activity logs, filterable, data change tracking | ✅ Complete |
| **Payroll Integrations** | Gusto, QuickBooks, Xero, Paychex, ADP | ⬜ Not started |
| **API & Webhooks** | Public REST API, real-time webhooks | ⬜ Not started |
| **Zapier Integration** | Connect with 5,000+ external apps | ⬜ Not started |
| **Calendar Sync** | Google Calendar, Apple Calendar, Outlook | ⬜ Not started |
| **Kiosk Mode** | Shared-device clock-in station | ⬜ Not started |
| **AI Auto-Scheduling** | Smart schedule generation | ⬜ Not started |
| **Offline Support** | Basic offline + sync | ⬜ Not started |
| **Security & Compliance** | Encryption, GDPR, SOC 2 | ⬜ Not started |

---

## Scope Summary

| Metric | Count |
|--------|-------|
| **Phases** | 5 |
| **Modules** | ~25 |
| **Total Features** | 200+ |
| **Controllers** | 27 |
| **Models** | 48 |
| **Migrations** | 28 |
| **Frontend Pages** | 68 |

---

## Tech Stack

| Layer | Choice | Details |
|-------|--------|---------|
| **Backend** | Laravel 12 (PHP 8.2) | Elegant MVC framework, built-in auth, queues, events, broadcasting |
| **Frontend** | React 19 + TypeScript via Inertia.js | Server-driven SPA — Laravel routes render React pages directly |
| **Build Tool** | Vite | Fast HMR, Laravel Vite plugin for asset bundling |
| **Styling** | Tailwind CSS | Utility-first, brand colors/fonts configured in `tailwind.config.js` |
| **Auth** | Laravel Breeze (Inertia/React stack) | Registration, login, password reset, email verification, profile management |
| **Multi-Tenancy** | stancl/tenancy v3.9 | Database-per-tenant isolation, auto-provisioning, domain/subdomain identification |
| **Database** | SQLite (dev) → MySQL 8.0 (prod) | Eloquent ORM, migrations, seeders, central + tenant DB architecture |
| **Real-Time** | Laravel Broadcasting + Reverb | WebSocket server for chat, live updates, notifications |
| **File Storage** | Laravel Storage (local dev) → AWS S3 (prod) | Documents, images, training media |
| **Mobile (future)** | React Native (Expo) | Shared React/TS knowledge; Laravel API routes for mobile clients |
| **Deployment** | Ubuntu 24.04, Nginx, PHP 8.2, MySQL 8.0 | Production server at 64.225.5.237 |

### Project Structure

```
business-glu/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/                          → Breeze auth controllers
│   │   │   ├── ActivityLogController.php      → Audit trail with filtering
│   │   │   ├── AnalyticsController.php        → Cross-module analytics dashboards
│   │   │   ├── ChatController.php             → Team chat (1:1, group, channels)
│   │   │   ├── CourseController.php           → Courses & training management
│   │   │   ├── DirectoryController.php        → Employee directory
│   │   │   ├── DocumentController.php         → Document management & compliance
│   │   │   ├── EmployeeIdController.php       → Digital employee ID cards
│   │   │   ├── EventController.php            → Events & RSVP
│   │   │   ├── FeedController.php             → Unified feed (aggregates Updates + Events)
│   │   │   ├── FormController.php             → Forms & checklists builder
│   │   │   ├── KnowledgeBaseController.php    → Knowledge base articles
│   │   │   ├── OnboardingController.php       → Company creation after registration
│   │   │   ├── OrgChartController.php         → Organizational chart
│   │   │   ├── ProfileController.php          → User profile CRUD
│   │   │   ├── QuizController.php             → Quiz management & scoring
│   │   │   ├── RecognitionController.php      → Recognition & rewards
│   │   │   ├── SchedulingController.php       → Employee scheduling
│   │   │   ├── SettingsController.php         → Company settings + module toggles
│   │   │   ├── SurveyController.php           → Surveys & polls
│   │   │   ├── TaskController.php             → Quick tasks management
│   │   │   ├── TeamController.php             → Team CRUD + invitation lifecycle
│   │   │   ├── TicketController.php           → Help desk ticketing
│   │   │   ├── TimeClockController.php        → Clock in/out, breaks
│   │   │   ├── TimeOffController.php          → Time off requests & policies
│   │   │   ├── TimelineController.php         → Employee timeline
│   │   │   ├── UpdateController.php           → Updates feed
│   │   │   └── ViewSwitchController.php       → Admin ↔ User view toggle
│   │   └── Middleware/
│   │       ├── EnsureAdminAccess.php          → Blocks non-admins from /admin/*
│   │       ├── EnsureOnboarded.php            → Redirects users without tenant
│   │       └── HandleInertiaRequests.php      → Shares auth, flash, activeView
│   ├── Models/                                → 50 Eloquent models
│   │   ├── User.php                           → Roles, tenant_id, relationships
│   │   ├── Tenant.php                         → Multi-tenancy (name, slug, plan, modules)
│   │   ├── TeamInvitation.php                 → Token-based team invitations
│   │   ├── ActivityLog.php                    → Audit trail entries
│   │   ├── TimeEntry.php / TimeEntryBreak.php → Time clock records
│   │   ├── Shift.php / ShiftTemplate.php      → Scheduling
│   │   ├── Task.php / SubTask.php             → Quick tasks
│   │   ├── Form.php / FormField.php / FormSubmission.php → Forms & checklists
│   │   ├── Conversation.php / Message.php / Channel.php  → Team chat
│   │   ├── Update.php / Comment.php / Reaction.php        → Updates feed
│   │   ├── UpdateTemplate.php / UpdateAudience.php / UpdateRead.php → Updates templates & targeting
│   │   ├── Article.php / ArticleCategory.php              → Knowledge base
│   │   ├── Survey.php / SurveyQuestion.php / SurveyResponse.php → Surveys
│   │   ├── Event.php / EventRsvp.php                      → Events
│   │   ├── Ticket.php / TicketReply.php                   → Help desk
│   │   ├── Course.php / CourseSection.php / Lesson.php    → Training
│   │   ├── Quiz.php / QuizQuestion.php / QuizAttempt.php  → Quizzes
│   │   ├── Document.php / DocumentCategory.php            → Documents
│   │   ├── TimeOffRequest.php / TimeOffPolicy.php         → Time off
│   │   ├── Badge.php / Recognition.php / Reward.php       → Recognition
│   │   ├── TimelineEvent.php                              → Employee timeline
│   │   └── EmployeeId.php                                 → Digital IDs
│   ├── Providers/
│   │   └── TenancyServiceProvider.php         → Multi-tenancy event lifecycle
│   └── Services/                              → Business logic (future)
├── bootstrap/
│   └── app.php                                → Middleware stack & aliases
├── config/
│   └── tenancy.php                            → Multi-tenancy configuration
├── database/
│   ├── migrations/                            → 28 migration files
│   ├── migrations/tenant/                     → Tenant-scoped database schema
│   └── seeders/
│       ├── DatabaseSeeder.php                 → Demo tenant + 3 test users
│       └── FeedSeeder.php                     → 10 updates + 6 events per tenant with comments, reactions, RSVPs
├── resources/
│   ├── js/
│   │   ├── Components/                        → Shared UI components
│   │   ├── Layouts/
│   │   │   ├── AdminLayout.tsx                → Admin sidebar + top bar
│   │   │   ├── UserLayout.tsx                 → Employee sidebar + top bar
│   │   │   └── GuestLayout.tsx                → Centered card for auth pages
│   │   └── Pages/                             → 68 TSX page files
│   │       ├── Admin/                         → Team, Settings, ActivityLog
│   │       ├── Auth/                          → Login, Register, ForgotPassword, etc.
│   │       ├── Communication/                 → Chat, Updates, Directory, KnowledgeBase, Surveys, Events, HelpDesk
│   │       ├── Dashboard.tsx                  → Admin dashboard with live stats
│   │       ├── HR/                            → Courses, Quizzes, Documents, TimeOff, Recognition, Timeline, OrgChart, EmployeeId
│   │       ├── Onboarding/                    → CreateCompany.tsx
│   │       ├── Operations/                    → TimeClock, Scheduling, Tasks, Forms
│   │       ├── Profile/                       → Edit.tsx + partials
│   │       ├── Team/                          → AcceptInvitation.tsx, InvitationExpired.tsx
│   │       ├── User/                          → Home + UserFeed + all user-facing module pages
│   │       └── Welcome.tsx                    → Public landing page
│   └── css/app.css                            → Tailwind + Google Fonts imports
├── routes/
│   ├── web.php                                → All routes: admin/*, app/*, actions
│   ├── auth.php                               → Breeze authentication routes
│   └── tenant.php                             → Tenant-scoped routes (future)
├── public/images/                             → Logo assets (3 PNGs from brand PDF)
├── docs/                                      → Project documentation
│   ├── project-overview.md                    → This file
│   ├── feature-breakdown.md                   → 200+ features by phase
│   ├── deployment.md                          → Server setup & deployment guide
│   └── brand-guidelines.md                    → Colors, typography, voice, logo
├── tailwind.config.js                         → Brand colors & typography theme
└── vite.config.js                             → Vite build configuration
```

## Key Documents

| Document | Path |
|----------|------|
| Feature Breakdown | [`docs/feature-breakdown.md`](./feature-breakdown.md) |
| Brand Guidelines | [`docs/brand-guidelines.md`](./brand-guidelines.md) |
| Project Overview | This file |

---

> This document will be updated as architecture decisions evolve.
