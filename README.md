# Business Glu

**Connecting the pieces that make your business stick.**

Business Glu is an all-in-one workforce management platform for deskless and frontline workers. Train, communicate with, and manage your team — all from a single web and mobile app.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 12 (PHP 8.2) |
| Frontend | React 19 + TypeScript via Inertia.js |
| Styling | Tailwind CSS (brand-themed) |
| Build | Vite 7 |
| Auth | Laravel Breeze (Inertia/React) |
| Multi-Tenancy | stancl/tenancy v3.9 (database-per-tenant) |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Mobile (future) | React Native (Expo) |

## Getting Started

### Prerequisites

- PHP 8.2+
- Composer 2.x
- Node.js 22+ / npm 10+

### Installation

```bash
# Clone the repo
git clone https://github.com/hamzaawan7/business-glu.git
cd business-glu

# Install dependencies
composer install
npm install

# Environment
cp .env.example .env
php artisan key:generate

# Database (SQLite)
touch database/database.sqlite
php artisan migrate --seed

# Start development servers (runs both Laravel + Vite)
npm start
```

Or start servers individually:
```bash
php artisan serve          # → http://127.0.0.1:8000
npm run dev                # → Vite HMR on :5173
```
npm run dev                # → Vite HMR on :5173
```

### Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@businessglu.com` | `password` |
| Tenant Owner | `owner@demo.com` | `password` |
| Team Member | `member@demo.com` | `password` |

Re-seed anytime: `php artisan migrate:fresh --seed`

---

## Multi-Tenancy Architecture

Business Glu uses **database-per-tenant** isolation via [stancl/tenancy](https://tenancyforlaravel.com/):

- **Central database** — `tenants`, `domains`, platform-level `users`
- **Tenant databases** — auto-created when a tenant is provisioned; each has its own `users`, `sessions`, etc.
- **Identification** — domain/subdomain-based (configurable to path-based)
- **Roles** — `super_admin` → `owner` → `admin` → `manager` → `member`

## Implementation Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **1 — Foundation** | Auth, RBAC, multi-tenancy, onboarding, admin + user dashboards, view switching | ✅ Mostly Complete |
| **2 — Operations** | Time clock, scheduling, quick tasks, forms & checklists | 🟡 Next Up |
| **3 — Communications** | Team chat, updates feed, directory, knowledge base, surveys, events, help desk | ⬜ Planned |
| **4 — HR & People** | Courses, quizzes, documents, time off, recognition, timeline, org chart, digital ID | ⬜ Planned |
| **5 — Integrations** | Payroll, API & webhooks, Zapier, calendar sync, kiosk, AI scheduling, offline, analytics | ⬜ Planned |

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/project-overview.md`](docs/project-overview.md) | Architecture, tech stack, project structure |
| [`docs/feature-breakdown.md`](docs/feature-breakdown.md) | 200+ features organized by phase |
| [`docs/brand-guidelines.md`](docs/brand-guidelines.md) | Colors, typography, voice, logo usage |

## License

Proprietary — © Business Glu. All rights reserved.
