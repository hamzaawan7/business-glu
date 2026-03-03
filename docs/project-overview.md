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
│  Time Clock  │  Team Chat       │  Training & Onboarding │
│  Scheduling  │  Updates Feed    │  Documents             │
│  Forms       │  Directory       │  Time Off              │
│  Tasks       │  Knowledge Base  │  Recognition & Rewards │
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

## Tech Stack

_To be decided — will be finalized once design elements are provided. Potential candidates:_

| Layer | Options |
|-------|---------|
| **Frontend (Web)** | React / Next.js, Tailwind CSS |
| **Frontend (Mobile)** | React Native / Flutter |
| **Backend** | Node.js (Express/Fastify) or Laravel |
| **Database** | PostgreSQL + Redis |
| **Real-Time** | WebSockets (Socket.io) or Pusher |
| **File Storage** | AWS S3 / Cloudflare R2 |
| **Auth** | JWT + OAuth2 / Auth0 |
| **Deployment** | Docker, AWS / Vercel / Railway |

## Key Documents

| Document | Path |
|----------|------|
| Feature Breakdown | [`docs/feature-breakdown.md`](./feature-breakdown.md) |
| Project Overview | This file |

---

> This document will be updated as design elements are provided and architecture decisions are made.
