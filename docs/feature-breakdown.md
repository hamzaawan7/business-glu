# Business Glu — Feature Breakdown

> Comprehensive feature mapping based on Connecteam's platform.
> Each feature is documented with a description and implementation priority.

---

## Table of Contents

1. [Hub 1 — Operations](#hub-1--operations)
2. [Hub 2 — Communications](#hub-2--communications)
3. [Hub 3 — HR & People Management](#hub-3--hr--people-management)
4. [Cross-Cutting Concerns](#cross-cutting-concerns)
5. [Implementation Roadmap](#implementation-roadmap)

---

## Hub 1 — Operations

### 1.1 Employee Time Clock

Track precise employee work hours and produce payroll-ready timesheets.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Clock In / Clock Out** | Employees clock in/out via mobile app, web dashboard, or on-site kiosk | 🔴 High |
| 2 | **GPS Location Tracking** | Capture employee location at clock-in; optional breadcrumb trail while clocked in | 🟡 Medium |
| 3 | **Geofencing** | Define a radius around job sites — employees can only clock in from within the fence; optional auto clock-out when leaving | 🟡 Medium |
| 4 | **Kiosk Mode** | Shared-device clock-in station (tablet/iPad) with PIN or selfie verification | 🟡 Medium |
| 5 | **Digital Timesheets** | Auto-generated timesheets listing hours, breaks, overtime, and time off per employee per pay period | 🔴 High |
| 6 | **Timesheet Approval Workflow** | Managers review → approve → lock timesheets; bulk approval support | 🔴 High |
| 7 | **Break Management** | Manual breaks (paid/unpaid) and auto-deducted breaks after X hours | 🔴 High |
| 8 | **Overtime Rules** | Configurable overtime: daily, weekly, holiday, consecutive days, partial day, pay-period | 🔴 High |
| 9 | **Jobs / Sub-Jobs** | Track time against specific projects, clients, or job sites; switch between jobs without re-clocking | 🟡 Medium |
| 10 | **Shift Attachments** | Require employees to complete fields (dropdown, text, number, image, file, signature) before clocking out | 🟡 Medium |
| 11 | **Payroll Integrations** | Export timesheets as PDF/XLS; integrate with Gusto, QuickBooks, Xero, Paychex, ADP | 🟡 Medium |
| 12 | **Payroll Period Configuration** | Define payroll cycle; send reminders to employees & managers before each period closes | 🟡 Medium |
| 13 | **Auto Clock-Out** | Automatically clock out employees after a configurable number of hours or when leaving geofence | 🟢 Low |
| 14 | **Punch Rounding** | Round clock-in/out times to nearest 5, 10, 15, or 30 minutes | 🟢 Low |
| 15 | **Conflict Detection** | Flag overlapping hours, double bookings, exceeded overtime limits | 🔴 High |
| 16 | **Map View** | View employee locations and routes on a map | 🟢 Low |
| 17 | **Reporting & Auto Reports** | Custom exports, shift-based reports, scheduled email reports, multiple time-clock exports merged | 🟡 Medium |
| 18 | **Notifications & Reminders** | Late/missed clock-in alerts, clock-in reminders, timesheet review reminders | 🔴 High |
| 19 | **Planned vs. Actual Hours** | Compare scheduled hours against actual hours worked | 🟡 Medium |
| 20 | **Weekly Timesheet Email** | Automated weekly summary emailed to employees and managers | 🟢 Low |

### 1.2 Employee Scheduling

Create, manage, and distribute employee schedules.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Drag & Drop Schedule Builder** | Visual calendar interface; drag-and-drop shift assignment | 🔴 High |
| 2 | **Shift Templates** | Save and reuse daily/weekly/monthly templates | 🔴 High |
| 3 | **Recurring / Duplicate Shifts** | Set shifts to repeat on a selected frequency (daily, weekly, monthly) | 🔴 High |
| 4 | **Auto Scheduling (AI)** | AI-powered schedule generation considering availability, roles, fairness, conflicts | 🟡 Medium |
| 5 | **Open Shifts** | Unassigned shifts employees can claim (first-come-first-serve or with admin approval) | 🟡 Medium |
| 6 | **Multi-Location Scheduling** | Schedule across multiple locations; detect cross-schedule conflicts | 🟡 Medium |
| 7 | **Shift Information** | Start/end times, time zones, colors, layers, locations, notes, tasks | 🔴 High |
| 8 | **Shift Tasks & Sub-Tasks** | Attach tasks to shifts; real-time tracking; task reminders | 🟡 Medium |
| 9 | **Schedule Publishing & Notifications** | Publish schedules; employees accept/reject; instant change alerts | 🔴 High |
| 10 | **Employee Availability** | Employees set available/unavailable times; repeating unavailability | 🔴 High |
| 11 | **Preferred Working Hours** | Employees set preferences; visible during schedule creation | 🟢 Low |
| 12 | **Shift Replacement / Swap** | Employees release shifts for others to claim; optional admin approval | 🟡 Medium |
| 13 | **Smart Groups** | Auto-assign based on qualifications, certifications, or tags | 🟡 Medium |
| 14 | **Schedule Shareable Link** | Share a live schedule link with clients | 🟢 Low |
| 15 | **Calendar Sync** | Sync shifts to Google / Apple / Outlook personal calendars | 🟢 Low |
| 16 | **Scheduling Filters** | Filter by user, job, layer; custom filters | 🟡 Medium |
| 17 | **Compliance & Conflict Detection** | Overlapping shifts, cross-schedule conflicts, overtime/undertime calculations | 🔴 High |
| 18 | **Labor Cost View** | View actual labor costs per day based on scheduled shifts | 🟡 Medium |
| 19 | **Import/Export** | Import shifts from Excel/CSV/API; export schedules to Excel; print views | 🟡 Medium |
| 20 | **Bulk Edit Shifts** | Edit multiple shifts, dates, times, titles at once | 🟡 Medium |
| 21 | **Scheduling Layers** | Additional information layers on shifts for resource management | 🟢 Low |
| 22 | **Mobile Schedule Editing** | Full schedule management from the mobile app | 🔴 High |

### 1.3 Forms & Checklists

Digital forms and checklists for field operations.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Form Builder** | Drag-and-drop form builder with multiple field types (text, number, dropdown, checkbox, image, file, signature, location stamp) | 🔴 High |
| 2 | **Checklist Builder** | Task-based checklists employees complete on the job | 🔴 High |
| 3 | **Templates Library** | Pre-built and custom templates for common workflows (safety inspections, reports, etc.) | 🟡 Medium |
| 4 | **Required Fields / Proof of Completion** | Mark fields as required; image/signature/location as proof | 🔴 High |
| 5 | **Real-Time Submission Feed** | Managers see completed forms instantly in a dashboard | 🔴 High |
| 6 | **PDF Export** | Auto-generate PDF reports from form submissions | 🟡 Medium |
| 7 | **Conditional Logic** | Show/hide fields based on previous answers | 🟡 Medium |
| 8 | **Form Assignment** | Assign forms to specific employees, teams, or shifts | 🔴 High |
| 9 | **Submission History & Audit Trail** | Full history of all submissions with timestamps | 🟡 Medium |

### 1.4 Task Management

Assign and track tasks for individuals or teams.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Create & Assign Tasks** | Create tasks with descriptions, due dates, checklists; assign to individuals or teams | 🔴 High |
| 2 | **Real-Time Progress Tracking** | See task status (not started, in progress, completed) in real time | 🔴 High |
| 3 | **Task Reminders & Notifications** | Automated reminders for upcoming/overdue tasks | 🔴 High |
| 4 | **Recurring Tasks** | Tasks that repeat on a schedule | 🟡 Medium |
| 5 | **Task Comments & Chat** | In-task communication thread | 🟡 Medium |
| 6 | **File Attachments** | Attach images, documents, and files to tasks | 🟡 Medium |
| 7 | **Task Dashboard** | Manager overview of all tasks across teams with filters | 🔴 High |
| 8 | **Batch Task Creation** | Create and assign multiple tasks at once | 🟢 Low |

---

## Hub 2 — Communications

### 2.1 Team Chat

Secure, work-only instant messaging.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **1:1 Chat** | Direct messaging between any two users | 🔴 High |
| 2 | **Group Chat** | Group conversations for teams, departments, or custom groups | 🔴 High |
| 3 | **Company-Wide Chat Channels** | Organization-wide announcement channels | 🟡 Medium |
| 4 | **Media Sharing** | Share images, videos, files, GIFs, and links | 🔴 High |
| 5 | **Read Receipts** | See who has read messages | 🟡 Medium |
| 6 | **Scheduled Messages** | Schedule messages to send during work hours only | 🟢 Low |
| 7 | **Admin Controls** | Admins can moderate chats; separate work and private messaging | 🔴 High |
| 8 | **Chat from Other Features** | Start a chat directly from time clock, scheduling, or task views | 🟡 Medium |
| 9 | **Push Notifications** | Real-time push notifications for new messages | 🔴 High |
| 10 | **Search** | Search across all conversations | 🟡 Medium |

### 2.2 Updates Feed

Social media-style company communication feed.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Company Updates Feed** | Post announcements visible to all or targeted groups | 🔴 High |
| 2 | **Rich Media Posts** | Support for images, videos, GIFs, links | 🔴 High |
| 3 | **Reactions & Comments** | Employees can react (like, love, etc.) and comment on posts | 🔴 High |
| 4 | **Read Tracking** | See who viewed/read each update | 🟡 Medium |
| 5 | **Targeted Distribution** | Send updates to specific teams, departments, or locations | 🟡 Medium |
| 6 | **SMS Fallback** | Send updates via SMS for employees without the app | 🟢 Low |
| 7 | **Pinned Posts** | Pin important updates to the top of the feed | 🟡 Medium |
| 8 | **Scheduled Posts** | Schedule updates to publish at a future date/time | 🟢 Low |

### 2.3 Employee Directory

Digital company phonebook.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Employee Profiles** | Name, role, department, location, contact info, profile photo | 🔴 High |
| 2 | **Search & Filter** | Find people by name, department, role, location, or custom fields | 🔴 High |
| 3 | **External Contacts** | Store client, supplier, and vendor contacts | 🟡 Medium |
| 4 | **Direct Contact Actions** | Call, message, or email directly from the directory | 🔴 High |
| 5 | **Access Control** | Control which users can see which contact information | 🟡 Medium |
| 6 | **Custom Fields** | Add custom profile fields per organization needs | 🟡 Medium |

### 2.4 Knowledge Base

Centralized company knowledge repository.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Content Management** | Create and organize articles, policies, handbooks, SOPs | 🔴 High |
| 2 | **Categories & Folders** | Organize content into a navigable structure | 🔴 High |
| 3 | **Rich Media Support** | Embed images, videos, PDFs, and links | 🟡 Medium |
| 4 | **Mobile Access** | Full access to knowledge base from mobile devices | 🔴 High |
| 5 | **Search** | Full-text search across all knowledge base content | 🔴 High |
| 6 | **Access Permissions** | Control who can view/edit content by role or team | 🟡 Medium |
| 7 | **Version Control** | Track changes and maintain a single source of truth | 🟢 Low |

### 2.5 Surveys & Polls

Collect employee feedback.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Survey Builder** | Create surveys with multiple question types (multiple choice, rating, free text, etc.) | 🔴 High |
| 2 | **Live Polls** | Real-time polling with instant results | 🟡 Medium |
| 3 | **Anonymous Responses** | Option for anonymous feedback | 🟡 Medium |
| 4 | **Targeted Distribution** | Send surveys to specific groups or the whole org | 🔴 High |
| 5 | **Results Dashboard** | Visual analytics and summary of responses | 🔴 High |
| 6 | **Completion Tracking** | See who has/hasn't completed a survey; send reminders | 🟡 Medium |
| 7 | **Export Results** | Export survey data to CSV/Excel | 🟢 Low |

### 2.6 Events

Company event management.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Event Creation** | Create events with details (date, time, location, description) | 🟡 Medium |
| 2 | **RSVP Management** | Employees RSVP directly from the app | 🟡 Medium |
| 3 | **Targeted Invitations** | Invite individuals, departments, or entire company | 🟡 Medium |
| 4 | **Attendee Tracking** | View who's attending, declined, or hasn't responded | 🟡 Medium |
| 5 | **Event Notifications** | Push notification reminders before events | 🟢 Low |

### 2.7 Help Desk

Internal employee ticketing system.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Ticket Creation** | Employees submit tickets/requests through the app | 🟡 Medium |
| 2 | **Auto-Assignment** | Tickets assigned to first available rep from relevant desk | 🟡 Medium |
| 3 | **Ticket Lifecycle** | Open → In Progress → Resolved → Closed workflow | 🟡 Medium |
| 4 | **Manager Dashboard** | Monitor all open tickets, SLAs, and response times | 🟡 Medium |
| 5 | **Categories / Desks** | Multiple help desks for different departments (IT, HR, Facilities, etc.) | 🟢 Low |
| 6 | **Ticket History** | Full audit trail of all tickets and resolutions | 🟢 Low |

---

## Hub 3 — HR & People Management

### 3.1 Training & Onboarding

Mobile-first employee training platform.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Course Builder** | Create training courses with modules, sections, and multimedia content | 🔴 High |
| 2 | **Quizzes & Assessments** | Add quizzes to test understanding; pass/fail thresholds | 🔴 High |
| 3 | **Onboarding Workflows** | Structured onboarding sequences for new hires | 🔴 High |
| 4 | **Mobile Learning** | Employees complete training from their mobile devices | 🔴 High |
| 5 | **Progress Tracking** | Real-time dashboard showing completion status per employee | 🔴 High |
| 6 | **Mandatory Training Records** | Track and record all mandatory/compliance training | 🟡 Medium |
| 7 | **Certificate Generation** | Auto-generate completion certificates | 🟢 Low |
| 8 | **Training Reminders** | Automated reminders for incomplete or recurring training | 🟡 Medium |

### 3.2 Document Management

Secure employee document storage.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Document Upload & Storage** | Centralized storage for all employee documents (contracts, IDs, certs) | 🔴 High |
| 2 | **Employee Self-Upload** | Employees upload required documents from their phones | 🔴 High |
| 3 | **Expiration Dates & Alerts** | Set expiration dates on documents; auto-notify before expiry | 🔴 High |
| 4 | **Document Categories** | Organize documents by type (licenses, contracts, certifications, etc.) | 🟡 Medium |
| 5 | **Compliance Dashboard** | Overview of missing, expired, or soon-to-expire documents | 🟡 Medium |
| 6 | **Access Control** | Role-based access to sensitive documents | 🔴 High |
| 7 | **Bulk Upload** | Upload multiple documents at once | 🟢 Low |

### 3.3 Time Off Management

Leave request and policy management.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Leave Request Submission** | Employees submit time-off requests via the app | 🔴 High |
| 2 | **Approval Workflow** | Managers approve/deny requests with one click | 🔴 High |
| 3 | **Leave Policies** | Create policies for vacation, sick leave, parental leave, etc. | 🔴 High |
| 4 | **Balance Tracking** | Auto-calculate and display remaining leave balances | 🔴 High |
| 5 | **Calendar View** | Visual calendar of who's off and when | 🟡 Medium |
| 6 | **Accrual Rules** | Configure how leave accrues over time | 🟡 Medium |
| 7 | **Compliance Notifications** | Auto-notify about regulatory requirements | 🟡 Medium |
| 8 | **Team Availability View** | Managers see team availability at a glance when reviewing requests | 🟡 Medium |

### 3.4 Recognition & Rewards

Employee motivation and appreciation tools.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Public Recognition** | Spotlight employees in the company feed | 🟡 Medium |
| 2 | **Private Recognition** | Send private "thank you" or appreciation messages | 🟡 Medium |
| 3 | **Custom Badges** | Create and award digital badges for achievements | 🟡 Medium |
| 4 | **Reward Points / Tokens** | Assign redeemable points for exceptional work | 🟢 Low |
| 5 | **Gift Card Redemption** | Employees redeem points for gift cards | 🟢 Low |
| 6 | **Milestone Celebrations** | Auto-celebrate birthdays, work anniversaries, etc. | 🟢 Low |
| 7 | **Recognition Wall / Feed** | Dedicated space for all recognitions visible to the team | 🟡 Medium |

### 3.5 Employee Timeline

Track employee lifecycle milestones.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Milestone Tracking** | Log hire date, promotions, role changes, salary raises, reviews | 🟡 Medium |
| 2 | **File Attachments** | Attach files to timeline events (e.g., review forms, offer letters) | 🟡 Medium |
| 3 | **Upcoming Events** | View upcoming milestones (annual reviews, probation end) | 🟡 Medium |
| 4 | **History View** | Full chronological view of an employee's journey | 🟡 Medium |

### 3.6 Org Chart

Visual company structure.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Auto-Generated Org Chart** | Visual hierarchy based on reporting structure | 🟢 Low |
| 2 | **Interactive Navigation** | Click to view employee profiles, contact info | 🟢 Low |
| 3 | **Department Views** | Filter by department or location | 🟢 Low |

### 3.7 Digital Employee ID

Mobile employee identification.

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Digital ID Card** | Mobile-accessible ID card with photo, name, role, company | 🟢 Low |
| 2 | **Custom Fields** | Choose which fields appear on the ID | 🟢 Low |
| 3 | **Instant Issuance** | Issue IDs instantly without physical production | 🟢 Low |

---

## Cross-Cutting Concerns

### 4.1 Authentication & User Management

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **User Registration & Login** | Email/password, SSO, social login | 🔴 High |
| 2 | **Role-Based Access Control (RBAC)** | Admin, Manager, Employee roles with configurable permissions | 🔴 High |
| 3 | **Multi-Tenancy** | Each company is an isolated tenant | 🔴 High |
| 4 | **User Profiles** | Employee profiles with custom fields, photo, department, etc. | 🔴 High |
| 5 | **Smart Groups / Tags** | Auto-group users by department, location, role, custom tags | 🟡 Medium |

### 4.2 Admin Dashboard

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Web Admin Panel** | Full-featured web dashboard for admins/managers | 🔴 High |
| 2 | **Activity Log** | Track all actions across the platform | 🟡 Medium |
| 3 | **Analytics & Reporting** | Cross-feature analytics (attendance, engagement, training, etc.) | 🟡 Medium |
| 4 | **Company Settings** | Configure company-wide settings, branding, policies | 🔴 High |

### 4.3 Mobile App

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **iOS & Android App** | Native or cross-platform mobile app for employees | 🔴 High |
| 2 | **Push Notifications** | Real-time notifications for all relevant events | 🔴 High |
| 3 | **Offline Support** | Basic functionality when offline; sync when reconnected | 🟡 Medium |

### 4.4 Integrations & API

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **REST API** | Public API for user data, timesheets, shifts, forms, etc. | 🟡 Medium |
| 2 | **Webhooks** | Real-time event notifications to external systems | 🟡 Medium |
| 3 | **Payroll Integrations** | Gusto, QuickBooks, Xero, Paychex, ADP | 🟡 Medium |
| 4 | **Zapier Integration** | Connect with 5,000+ apps via Zapier | 🟢 Low |
| 5 | **Calendar Sync** | Google Calendar, Apple Calendar, Outlook | 🟢 Low |

### 4.5 Security & Compliance

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Data Encryption** | Encryption at rest and in transit | 🔴 High |
| 2 | **GDPR Compliance** | Data processing agreements, right to erasure, consent management | 🔴 High |
| 3 | **SOC 2 Alignment** | Security controls aligned with SOC 2 standards | 🟡 Medium |
| 4 | **Audit Trail** | Immutable logs of all data changes | 🟡 Medium |
| 5 | **Data Backup & Recovery** | Regular backups with point-in-time recovery | 🔴 High |

---

## Implementation Roadmap

### Phase 1 — Foundation (MVP)
> Core platform, auth, and the first operational features.

- [ ] Authentication & User Management (registration, login, RBAC, multi-tenancy)
- [ ] Admin Dashboard (web panel, company settings)
- [ ] Employee Time Clock (clock in/out, timesheets, breaks, overtime)
- [ ] Employee Scheduling (schedule builder, templates, publish/notify)
- [ ] Team Chat (1:1, group, push notifications)
- [ ] Mobile App shell (iOS & Android)

### Phase 2 — Operations Expansion
> Complete the operations hub.

- [ ] Task Management (create, assign, track, reminders)
- [ ] Forms & Checklists (builder, submissions, templates)
- [ ] GPS & Geofencing for Time Clock
- [ ] Conflict Detection & Compliance (scheduling + timeclock)
- [ ] Reporting & Exports

### Phase 3 — Communications Hub
> Full internal communication suite.

- [ ] Updates Feed (posts, reactions, comments, read tracking)
- [ ] Employee Directory (profiles, search, contact actions)
- [ ] Knowledge Base (content management, categories, search)
- [ ] Surveys & Polls (builder, analytics, distribution)
- [ ] Events (create, RSVP, notifications)
- [ ] Help Desk (ticketing system)

### Phase 4 — HR & People Management
> Complete the HR platform.

- [ ] Training & Onboarding (course builder, quizzes, progress tracking)
- [ ] Document Management (upload, expiration, compliance)
- [ ] Time Off Management (requests, policies, balances, accrual)
- [ ] Recognition & Rewards (badges, points, gift cards)
- [ ] Employee Timeline (milestones, history)
- [ ] Org Chart & Digital ID

### Phase 5 — Integrations & Polish
> Third-party integrations and platform refinement.

- [ ] Payroll Integrations (Gusto, QuickBooks, Xero, ADP)
- [ ] REST API & Webhooks
- [ ] Zapier Integration
- [ ] Calendar Sync
- [ ] Advanced Analytics
- [ ] Kiosk Mode
- [ ] AI/Auto-Scheduling
- [ ] Offline Support

---

> **Note:** Priorities and phases will be adjusted as design elements are provided and requirements are refined.
