# Business Glu — Developer Overview

> **Purpose:** This document gives a new developer everything they need to understand what Business Glu is, what's been built, how it's structured, and what work remains.
>
> **Last updated:** April 2, 2026

---

## 1. What Is Business Glu?

Business Glu is an **all-in-one workforce management SaaS platform** for deskless and frontline workers — think retail, restaurants, field services, healthcare, construction, cleaning crews, etc.

It replaces the patchwork of disconnected tools (scheduling apps, time trackers, WhatsApp groups, shared drives, paper forms) with **one platform** that both managers and employees use.

**Think of it as:** ConnectTeam + Homebase + Slack + Google Classroom — combined into one app.

**Business model:** Multi-tenant SaaS. Each company signs up and gets their own isolated workspace. The plan is to offer Free / Pro / Enterprise tiers.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend** | Laravel 12 (PHP 8.2) | MVC framework, Eloquent ORM, queues, events, broadcasting |
| **Frontend** | React 19 + TypeScript | Server-driven SPA via **Inertia.js** (no separate API — Laravel routes render React pages directly) |
| **Styling** | Tailwind CSS | Utility-first, custom brand theme in `tailwind.config.js` |
| **Build** | Vite | Fast HMR, Laravel Vite plugin |
| **Auth** | Laravel Breeze (Inertia/React stack) | Registration, login, password reset, email verification |
| **Multi-Tenancy** | stancl/tenancy v3.9 | Database-per-tenant isolation, auto-provisioning |
| **Database** | SQLite (dev) → MySQL 8.0 (prod) | Central DB + per-tenant DBs |
| **Real-Time** | Laravel Broadcasting + Reverb | WebSocket server for chat |
| **File Storage** | Laravel Storage (local dev → AWS S3 prod) | Documents, images, media |
| **Server** | Ubuntu 24.04, Nginx, PHP-FPM | DigitalOcean droplet at `64.225.5.237` |
| **Mobile (future)** | React Native (Expo) | Not started yet |

### Key Architectural Decisions

- **Inertia.js** means there's NO separate REST API for the web app. Laravel controllers return `Inertia::render('Page', $data)` which renders React components directly. This is NOT a traditional SPA with API calls — the router lives on the server.
- **Multi-tenancy** uses stancl/tenancy. Each company gets its own database. The `tenant_id` column is a `string` (not integer) and references the `tenants.id` column.
- **Two layouts:** `AdminLayout.tsx` (manager/admin dashboard) and `UserLayout.tsx` (employee app). Admins can toggle between views via `ViewSwitchController`.

---

## 3. How to Run Locally

```bash
# Clone and install
git clone git@github.com:hamzaawan7/business-glu.git
cd business-glu
composer install
npm install
cp .env.example .env
php artisan key:generate

# Database (SQLite for dev)
touch database/database.sqlite
php artisan migrate
php artisan db:seed                    # Creates demo tenant + 3 test users
php artisan db:seed --class=FeedSeeder # Creates 10 updates + 6 events per tenant

# Run (starts both Laravel + Vite)
npm start
# Or separately:
# php artisan serve
# npm run dev
```

### Test Accounts

| Email | Password | Role | Tenant |
|-------|----------|------|--------|
| `admin@businessglu.com` | `password` | super_admin | — (platform-level) |
| `owner@demo.com` | `password` | owner | Demo Company |
| `member@demo.com` | `password` | member | Demo Company |

---

## 4. Project Structure

```
business-glu/
├── app/Http/Controllers/     → 29 controllers (one per module)
├── app/Models/               → 50 Eloquent models
├── app/Http/Middleware/       → EnsureAdminAccess, EnsureOnboarded, HandleInertiaRequests
├── database/migrations/      → 28+ migration files
├── database/seeders/         → DatabaseSeeder + FeedSeeder
├── resources/js/
│   ├── Components/           → Shared UI (Icon.tsx with 80+ SVG icons, ApplicationLogo, ViewSwitcher, etc.)
│   ├── Layouts/              → AdminLayout.tsx, UserLayout.tsx, GuestLayout.tsx
│   └── Pages/                → 68+ TSX page files organized by area:
│       ├── Admin/            → Team.tsx, Settings.tsx, ActivityLog.tsx, Analytics.tsx
│       ├── Auth/             → Login, Register, ForgotPassword, etc.
│       ├── Communication/    → Chat, Updates, Directory, KnowledgeBase, Surveys, Events, HelpDesk
│       ├── HR/               → Courses, Quizzes, Documents, TimeOff, Recognition, Timeline, OrgChart
│       ├── Operations/       → TimeClock, Scheduling, Tasks, Forms
│       ├── User/             → Home, UserFeed, plus all user-facing module pages (27 files)
│       └── Dashboard.tsx     → Admin dashboard with live stats
├── routes/web.php            → All routes (admin/*, app/*, actions)
├── docs/                     → project-overview, feature-breakdown, deployment, brand-guidelines
└── public/images/            → Logo assets
```

---

## 5. What's Been Built (Complete Feature List)

### 5.1 Foundation & Infrastructure
- **Authentication:** Email/password registration, login, password reset, email verification, profile management
- **RBAC:** 5 roles — `super_admin` → `owner` → `admin` → `manager` → `member`
- **Multi-Tenancy:** stancl/tenancy v3.9, database-per-tenant, auto-provisioning
- **Onboarding:** Registration → Company creation → Auto-assigns owner role → Dashboard
- **Team Management:** Invite via email (token-based, 7-day expiry), edit roles, remove members, cancel invitations
- **Company Settings:** Company name, toggle 15 feature modules on/off per tenant
- **View Switching:** Admin ↔ Employee view toggle for admin+ roles
- **Activity Log:** Immutable audit trail with filterable events, user/action tracking, date ranges

### 5.2 Operations Hub
- **Time Clock:** Clock in/out with timestamps, GPS capture, break management (paid/unpaid), live timer (HH:MM:SS), weekly summary, admin team overview, approval workflow fields
- **Scheduling:** Drag-and-drop schedule builder, shift templates, recurring shifts, availability management, publish/notify, conflict detection
- **Forms & Checklists:** Dynamic form builder with multiple field types, templates, submission tracking, assignment, reporting
- **Quick Tasks:** Create/assign with priorities, due dates, sub-tasks, status management (pending → in-progress → completed)

### 5.3 Communications Hub
- **Team Chat:** 1:1 and group conversations, channels, file sharing, real-time messaging, read receipts
- **Updates Feed (Admin):** Rich post builder with cover images, multi-photo gallery, file attachments, YouTube embeds, reusable templates, audience targeting (everyone/department/role/user), scheduling & auto-expiry, reminders, pop-up alerts, per-post analytics (read rate, reactions breakdown, who-read/who-hasn't)
- **Unified Feed (Employee):** Social-media-style timeline aggregating Updates + Events; filter tabs (All/Updates/Events), pinned section, update cards with reactions/comments, event cards with RSVP buttons, popup overlay for must-acknowledge updates
- **Employee Directory:** Profiles, search/filter by department/role, contact actions
- **Knowledge Base:** Articles with rich content, categories, search, access permissions
- **Surveys & Polls:** Survey builder, multiple question types, anonymous responses, analytics, distribution
- **Events:** Event creation (date/time/location/type), RSVP management (attending/maybe/declined), attendee tracking
- **Help Desk:** Ticketing system with priorities, assignment, status tracking, SLA, categories

### 5.4 HR & People Management
- **Courses & Training:** Course builder with sections/lessons, multiple content types, enrollment, progress tracking, certificates
- **Quizzes:** Quiz builder, question banks, randomization, scoring, pass/fail thresholds, retake management, statistics
- **Document Management:** Upload with categorization, expiration tracking, compliance dashboard, version control
- **Time Off:** Leave request/approval workflow, policy management (vacation/sick/etc.), balance tracking, accrual rules
- **Recognition & Rewards:** Badge creation, points system, gift card rewards, recognition feed, leaderboards
- **Employee Timeline:** Milestone tracking (hire/promotion/role change), chronological view, file attachments
- **Org Chart:** Visual hierarchy based on reporting structure, interactive navigation
- **Digital Employee ID:** Mobile-optimized ID cards with QR code, custom fields

### 5.5 Analytics & Admin
- **Analytics Dashboard:** Cross-module analytics (attendance, engagement, training, communications)
- **Admin Dashboard:** Live stats (team members, clocked-in, open tasks, unread messages)

---

## 6. What's NOT Built Yet

These features are planned but have no code yet:

### High Priority
| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Mobile App (iOS/Android)** | React Native (Expo) app for employees | The #1 gap — deskless workers need a native mobile experience |
| **Push Notifications** | Real-time push for updates, events, tasks, chat | Business Glu already has push infrastructure on the backend — needs mobile integration |
| **REST API** | Public API endpoints for mobile app + third-party integrations | Required for the mobile app and any external integrations |

### Medium Priority
| Feature | Description |
|---------|-------------|
| **Advanced Time Clock** | Geofencing, kiosk mode, digital timesheets, overtime rules, payroll export |
| **Payroll Integrations** | Gusto, QuickBooks, Xero, Paychex, ADP exports |
| **Calendar Sync** | Sync shifts/events to Google Calendar, Apple Calendar, Outlook |
| **Feed Enhancements** | "Show on feed" toggle for events, task notifications in feed, form completions in feed |
| **Recurring Updates** | Updates that repeat on a schedule |
| **Offline Support** | Basic mobile functionality when offline, sync on reconnect |

### Lower Priority
| Feature | Description |
|---------|-------------|
| **Zapier Integration** | Connect with 5,000+ external apps |
| **AI Auto-Scheduling** | Smart schedule generation based on availability/skills |
| **Kiosk Mode** | Shared-device clock-in for job sites |
| **SMS Fallback** | Send updates via SMS for employees without the app |
| **Auto-Translation** | Translate updates to the user's device language |
| **Security Hardening** | Encryption at rest, GDPR tools, SOC 2 alignment |

---

## 7. Database Architecture

### Central Database
Houses platform-level data:
- `tenants` — Company registrations (id is a string slug like "acme-corp")
- `users` — All users across all tenants (has `tenant_id` FK)
- `team_invitations` — Pending invites with tokens

### Per-Tenant Data
All business data is scoped by `tenant_id`:
- `updates`, `update_comments`, `update_reactions`, `update_reads`, `update_audiences`, `update_templates`
- `events`, `event_rsvps`
- `shifts`, `time_entries`, `time_entry_breaks`
- `tasks`
- `forms`, `form_fields`, `form_submissions`
- `conversations`, `messages`
- `surveys`, `survey_questions`, `survey_responses`, `survey_answers`
- `tickets`, `ticket_replies`, `help_desk_categories`
- `courses`, `course_sections`, `course_objects`, `course_assignments`, `course_object_progress`
- `quizzes`, `quiz_questions`, `quiz_answers`, `quiz_assignments`, `quiz_attempts`
- `documents`, `document_categories`
- `leave_requests`, `leave_policies`, `leave_balances`
- `recognitions`, `badges`
- `timeline_events`
- `kb_articles`, `kb_categories`, `kb_article_views`
- `activity_logs`

**Important:** `tenant_id` is a **string** column (not integer). It references `tenants.id` which holds values like `"demo"`, `"acme-corp"`, etc.

---

## 8. Routing Overview

All routes are in `routes/web.php`. There are three main route groups:

### Admin Routes (`/admin/*`)
Protected by `EnsureAdminAccess` middleware. Only `owner`, `admin`, `manager` roles.

```
/admin/dashboard          → Dashboard stats
/admin/team               → Team management + invitations
/admin/settings           → Company settings + module toggles
/admin/activity-log       → Audit trail
/admin/analytics          → Cross-module analytics
/admin/time-clock         → Time clock admin view
/admin/scheduling         → Schedule builder
/admin/tasks              → Task management
/admin/forms              → Form builder
/admin/chat               → Chat admin
/admin/updates            → Updates admin (create/edit/templates)
/admin/updates/{id}/analytics → Per-update analytics
/admin/directory          → Directory admin
/admin/knowledge-base     → KB admin
/admin/surveys            → Survey builder
/admin/events             → Event management
/admin/help-desk          → Ticket queue
/admin/courses            → Course builder
/admin/quizzes            → Quiz builder
/admin/documents          → Document management
/admin/time-off           → Leave management
/admin/recognition        → Recognition admin
/admin/timeline           → Timeline admin
/admin/org-chart          → Org chart admin
/admin/employee-ids       → Digital ID management
```

### Employee Routes (`/app/*`)
For all authenticated users (including admins viewing employee view).

```
/app                      → Home dashboard (FeedController::home)
/app/feed                 → Unified feed (FeedController::index)
/app/time-clock           → Clock in/out
/app/schedule             → My schedule
/app/tasks                → My tasks
/app/forms                → My forms
/app/chat                 → My chat
/app/updates              → Updates list (legacy, still works)
/app/events               → My events
/app/surveys              → My surveys
/app/help-desk            → My tickets
/app/courses              → My courses
/app/quizzes              → My quizzes
/app/documents            → My documents
/app/time-off             → My time off
/app/recognition          → Recognition feed
/app/timeline             → My timeline
/app/directory            → Employee directory
/app/knowledge-base       → Knowledge base
/app/org-chart            → Org chart
/app/employee-id          → My digital ID
/app/profile              → My profile
```

### Action Routes (POST/PUT/DELETE)
For form submissions, RSVP, reactions, comments, etc.:
```
POST   /updates/{id}/comment    → Add comment
DELETE /updates/comments/{id}   → Delete comment
POST   /updates/{id}/react      → Toggle reaction
POST   /updates/{id}/read       → Mark as read
POST   /events/{id}/rsvp        → RSVP to event
POST   /time-clock/clock-in     → Clock in
POST   /time-clock/clock-out    → Clock out
... etc.
```

---

## 9. UI / Design Conventions

| Element | Convention |
|---------|-----------|
| **Brand Primary** | `#495B67` (dark blue-gray) |
| **Brand Secondary** | `#515151` |
| **Brand Accent** | `#71858E` |
| **Heading Font** | Montserrat Bold |
| **Body Font** | Lato Regular |
| **Cards** | `rounded-xl border border-gray-200 shadow-sm` |
| **Modals** | `rounded-2xl` |
| **Icons** | SVG-only via `Icon.tsx` component (80+ icons, NO emoji anywhere) |
| **Buttons** | `bg-[#495B67] text-white rounded-xl` for primary actions |
| **Empty States** | Centered icon + heading + description |

### Icon Component
All icons go through `resources/js/Components/Icon.tsx`. Usage:
```tsx
import Icon from '@/Components/Icon';
<Icon name="calendar" className="w-5 h-5" />
```
There are 80+ named icons available. Check `Icon.tsx` for the full list.

---

## 10. Key Files a Developer Should Know

| File | Purpose |
|------|---------|
| `routes/web.php` | **All routes** — admin, employee, and action routes |
| `app/Http/Middleware/HandleInertiaRequests.php` | Shares `auth.user`, `flash`, `activeView` to every page |
| `app/Http/Middleware/EnsureAdminAccess.php` | Guards `/admin/*` routes to owner/admin/manager |
| `app/Http/Middleware/EnsureOnboarded.php` | Redirects users without a tenant to onboarding |
| `resources/js/Layouts/AdminLayout.tsx` | Admin sidebar + top bar layout |
| `resources/js/Layouts/UserLayout.tsx` | Employee sidebar + top bar layout (has the nav structure) |
| `resources/js/Components/Icon.tsx` | Centralized SVG icon library (80+ icons) |
| `resources/js/Components/ViewSwitcher.tsx` | Admin ↔ Employee view toggle |
| `app/Http/Controllers/FeedController.php` | Unified feed + home dashboard data |
| `app/Http/Controllers/UpdateController.php` | Updates CRUD + admin features |
| `app/Http/Controllers/EventController.php` | Events CRUD + RSVP |
| `tailwind.config.js` | Brand colors, fonts, custom theme |
| `database/seeders/DatabaseSeeder.php` | Creates demo tenant + test users |
| `database/seeders/FeedSeeder.php` | Creates dummy updates + events for testing |
| `docs/deployment.md` | Full server setup & deployment guide |

---

## 11. Deployment

- **Server:** DigitalOcean droplet at `64.225.5.237`
- **OS:** Ubuntu 24.04, Nginx, PHP 8.2-FPM, MySQL 8.0
- **DO NOT** deploy automatically on every push
- See `docs/deployment.md` for full setup instructions
- Manual deploy: SSH in, `git pull`, `composer install`, `npm run build`, `php artisan migrate`

---

## 12. Git Workflow

- Single `main` branch (no feature branches currently)
- Commits are descriptive with prefixes: `feat:`, `fix:`, `ui:`, `docs:`
- Push to `main` → does NOT auto-deploy
- All changes go through code → build verify (`npm run build`) → commit → push

---

## 13. What a New Developer Should Do First

1. **Read this document** and `docs/project-overview.md`
2. **Run locally** following Section 3 above
3. **Log in as `owner@demo.com`** and click through both Admin and Employee views
4. **Read `routes/web.php`** to understand all the routes
5. **Read `UserLayout.tsx`** and `AdminLayout.tsx` to understand navigation
6. **Check `FeedController.php`** as a good example of how controllers work with Inertia
7. **Look at `UserFeed.tsx`** as a good example of a complex React page with multiple interactions

---

> This document should be updated as new features are added.
