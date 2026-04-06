# Courses & Training — Improvement Plan

> **Created:** 2026-04-06  
> **Context:** Client feedback from Curtis Lane (lane-enterprises), ConnectTeam competitive analysis, 5ssupplies.com existing training platform analysis, and full codebase audit.

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Gap Analysis](#2-gap-analysis)
3. [Implementation Phases](#3-implementation-phases)
4. [Phase 1 — Cover Images & Visual Course Cards](#phase-1--cover-images--visual-course-cards)
5. [Phase 2 — Video Player & Lesson Sidebar](#phase-2--video-player--lesson-sidebar)
6. [Phase 3 — Document Viewer & Downloads](#phase-3--document-viewer--downloads)
7. [Phase 4 — Course Progress & Tracking Enhancements](#phase-4--course-progress--tracking-enhancements)
8. [Phase 5 — Admin Training Visibility](#phase-5--admin-training-visibility)
9. [Phase 6 — Publishing Wizard & Course Settings](#phase-6--publishing-wizard--course-settings)
10. [Phase 7 — Template Library & Quick Create](#phase-7--template-library--quick-create)
11. [Phase 8 — Certificates & Completion](#phase-8--certificates--completion)
12. [Phase 9 — Segment-Based Assignment & Mandatory Training](#phase-9--segment-based-assignment--mandatory-training)
13. [Database Changes Summary](#database-changes-summary)
14. [Known Bugs to Fix First](#known-bugs-to-fix-first)
15. [File Reference Map](#file-reference-map)

---

## 1. Current State Summary

### What's Built

| Area | Status | Details |
|------|--------|---------|
| Course CRUD | Done | Create, edit, delete, publish, archive |
| Course Builder | Done | Sections, objects, drag-drop reorder, RichTextEditor, PhonePreview |
| Content Types | Done | text, video, document, image, link, quiz (6 types) |
| File Upload | Done | Up to 50MB, stored in `public/courses/{id}` |
| Assignments | Done | Assign users, due dates, remove assignments |
| Self-Enrollment | Done | Users auto-enroll when viewing published courses |
| Progress Tracking | Done | Per-object completion, percentage calculation, auto-complete at 100% |
| Categories | Done | CRUD for course categories |
| User Course List | Done | My Courses / Browse tabs, progress bars |
| User Course Detail | Done | Section outline, content viewer, "Mark Complete" |
| Live Preview | Done | PhonePreview component in CourseBuilder |

### What's Missing (from client feedback and competitive analysis)

- No cover images on course cards (column exists, never stored/displayed)
- No video player with lesson sidebar (videos are just iframe embeds)
- No document viewer/download UI (just a plain link)
- No "X of Y Lessons Complete" progress in course detail
- No admin view of per-user training progress
- No publishing wizard (just a single "Publish" button)
- No template library for quick course creation
- No certificates on completion
- No segment-based assignment (assign to department/role, not just individuals)
- No mandatory training enforcement/reminders
- Route bug: `UserCourseDetail.tsx` references `route('user.courses')` but the route is named `courses`

---

## 2. Gap Analysis

### vs. ConnectTeam (competitor screenshots)

| ConnectTeam Feature | Our Status | Priority |
|---|---|---|
| Segment-based course listing (by department/role) | Not built | High |
| Template library with pre-built courses | Not built | Medium |
| 3-option create flow (blank, template, duplicate) | Not built | Medium |
| Publishing wizard (audience, schedule, notifications) | Not built | High |
| Course sidebar with lesson list during viewing | Not built | **Critical** |
| Video tracking (watch time, completion detection) | Not built | High |
| Certificates on completion | Not built | Medium |
| Cover images on course cards | Column exists, not wired up | **Critical** |
| Rich course detail page with cover hero | Not built | High |

### vs. 5ssupplies.com (client's existing training system)

| 5ssupplies Feature | Our Status | Priority |
|---|---|---|
| Course cards with cover images + progress bars | Partially built (no cover images) | **Critical** |
| PDF/form downloads embedded in courses | Partially built (document type exists, no viewer) | High |
| Video lesson player with sidebar showing all lessons | Not built | **Critical** |
| "8 of 19 Lessons Complete" progress header | Not built | **Critical** |
| Admin user detail → "Training" button → per-user progress | Not built | High |
| Category-based course grouping in grid | Partially built (filter exists, no visual grouping) | Medium |

### Client Verbatim Priorities

> "I really want to copy a lot of what they're doing" — referring to ConnectTeam  
> Specifically wants: video series with watch tracking, certificates, ConnectTeam-style publishing, live preview improvements

---

## 3. Implementation Phases

Ordered by impact and client priority. Each phase is independently deployable.

| Phase | Name | Effort | Client Priority |
|---|---|---|---|
| **0** | Bug Fixes | 1 hour | Blocker |
| **1** | Cover Images & Visual Course Cards | 1 day | Critical |
| **2** | Video Player & Lesson Sidebar | 2 days | Critical |
| **3** | Document Viewer & Downloads | 0.5 day | High |
| **4** | Course Progress & Tracking Enhancements | 1 day | Critical |
| **5** | Admin Training Visibility | 1 day | High |
| **6** | Publishing Wizard & Course Settings | 1 day | High |
| **7** | Template Library & Quick Create | 1.5 days | Medium |
| **8** | Certificates & Completion | 1.5 days | Medium |
| **9** | Segment-Based Assignment & Mandatory Training | 1.5 days | High |

---

## Known Bugs to Fix First

### Bug 1: Broken "Back" route in UserCourseDetail

**File:** `resources/js/Pages/User/UserCourseDetail.tsx` line ~66  
**Problem:** References `route('user.courses')` but the actual route name is `courses` (defined in `routes/web.php` line ~270).  
**Fix:** Change to `route('courses')`.

### Bug 2: Cover image column never stored or displayed

**File:** `app/Http/Controllers/CourseController.php` — `store()` and `update()` methods  
**Problem:** The `cover_image` column exists in the migration and model fillable, but neither `store()` nor `update()` accept or save it. No frontend component displays it.  
**Fix:** See Phase 1.

### Bug 3: `dangerouslySetInnerHTML` without sanitization

**File:** `resources/js/Pages/User/UserCourseDetail.tsx`  
**Problem:** Text-type course objects render HTML via `dangerouslySetInnerHTML` with no server-side sanitization. While content is admin-created (trusted within tenant), this is an XSS vector if any admin account is compromised.  
**Fix:** Add server-side HTML sanitization in `storeObject()` and `updateObject()` using Laravel's `strip_tags()` with allowed tags, or install `mews/purifier`.

### Bug 4: No file cleanup on course/object deletion

**File:** `CourseController.php` — `destroy()`, `destroyObject()`, `destroySection()`  
**Problem:** When courses/objects are deleted, uploaded files remain on disk.  
**Fix:** Add `Storage::delete()` calls in the relevant destroy methods.

---

## Phase 1 — Cover Images & Visual Course Cards

### Goal
Course cards show cover images like 5ssupplies.com training dashboard. Admin can upload cover images when creating/editing courses.

### Backend Changes

**`CourseController.php` — `store()` method:**
- Add `cover_image` to validation: `'cover_image' => 'nullable|image|max:5120'`
- If file uploaded, store to `courses/covers/{id}` and save path

**`CourseController.php` — `update()` method:**
- Same validation and storage logic
- Delete old cover image when replacing

**`CourseController.php` — `index()` method:**
- Ensure `cover_image` is included in the course query (already is via `get()`)

### Frontend Changes

**`resources/js/Pages/HR/Courses.tsx` — Course card grid:**
- Add cover image above the card content area
- If `cover_image` exists: render `<img>` with `object-cover` and aspect ratio
- If no cover: show a gradient placeholder with the course category icon
- Update the Create Course modal to include a cover image upload field

**`resources/js/Pages/User/UserCourses.tsx` — User course cards:**
- Same cover image treatment on user-facing course cards
- Progress bar overlaid on the card bottom (like 5ssupplies)

**`resources/js/Pages/HR/CourseBuilder.tsx` — Builder header:**
- Show cover image in the header card
- Add "Change Cover" button

### Database
No migration needed — `cover_image` column already exists.

---

## Phase 2 — Video Player & Lesson Sidebar

### Goal
Replicate the 5ssupplies video player experience: video playing on the left, lesson list sidebar on the right with green checkmarks for completed lessons, and "X of Y Lessons Complete" header.

### Frontend Changes

**`resources/js/Pages/User/UserCourseDetail.tsx` — Full redesign:**

Replace the current single-column layout with a two-panel layout:

```
┌─────────────────────────────┬──────────────────────┐
│  Progress Header            │                      │
│  "8 of 19 Lessons Complete" │                      │
├─────────────────────────────┤  Lesson Sidebar      │
│                             │  ┌─ Section 1 ─────┐ │
│  Content Viewer             │  │ ✓ Lesson 1      │ │
│  (video / text / doc)       │  │ ▶ Lesson 2      │ │
│                             │  │   Lesson 3      │ │
│                             │  └─────────────────┘ │
│                             │  ┌─ Section 2 ─────┐ │
│                             │  │   Lesson 4      │ │
│                             │  └─────────────────┘ │
└─────────────────────────────┴──────────────────────┘
```

**Layout structure:**
- Top bar: Course title, progress bar, "X of Y Complete" text, back button
- Left panel (flex-1): Active content viewer
  - Video type: `<video>` element with native controls (NOT iframe) for uploaded videos; iframe for YouTube/Vimeo URLs
  - Text type: Rendered HTML content
  - Document type: Inline PDF viewer (`<iframe>` or `<embed>`) with download button
  - Image type: Full-width image
  - Link type: Styled link card
- Right panel (w-80): Scrollable lesson sidebar
  - Grouped by section with collapsible headers
  - Each lesson shows: type icon, title, duration, completion status (checkmark)
  - Active lesson highlighted
  - Click to switch between lessons
  - "Mark as Complete" button at bottom of content area or auto-complete for videos

**Auto-advance:** When marking a lesson complete, auto-navigate to the next incomplete lesson.

### Backend Changes

**`CourseController.php` — `userCourseDetail()` method:**
- Already loads sections with objects and completed IDs — no changes needed
- Consider adding `cover_image` to the response if not already included

### Video-Specific Behavior
- For uploaded videos (content starts with `/storage/`): use `<video>` tag with native player
- For external URLs (YouTube, Vimeo, etc.): use `<iframe>` embed
- Track which video is playing (store in local state)
- Auto-detect YouTube/Vimeo URLs and convert to embed format

---

## Phase 3 — Document Viewer & Downloads

### Goal
PDFs and documents display inline (like 5ssupplies shows PDF forms) with a download button, rather than just a download link.

### Frontend Changes

**`resources/js/Pages/User/UserCourseDetail.tsx` — Document content viewer:**
- PDF files: Render in `<iframe src="...pdf" />` with `width="100%" height="600px"`
- Non-PDF documents (.doc, .xls, .ppt): Show file icon, filename, file size, and a "Download" button
- Add a "Download" button below the PDF viewer too

**`resources/js/Pages/HR/CourseBuilder.tsx` — Document preview:**
- Show filename and file type icon instead of just the URL text
- In PhonePreview, show a mini document card

### Backend Changes
- In `storeObject()` for document type: extract and store original filename in a new `metadata` JSON column (or parse it from the storage path)

### Database
- Consider adding a `metadata` JSON column to `course_objects` for storing filename, file size, etc. (optional — can parse from path)

---

## Phase 4 — Course Progress & Tracking Enhancements

### Goal
Better progress visibility matching the "8 of 19 Lessons Complete" style from 5ssupplies.

### Frontend Changes

**`resources/js/Pages/User/UserCourseDetail.tsx`:**
- Progress header bar at top: colored progress bar + "X of Y Lessons Complete" text
- Per-section progress: "3/5 complete" next to each section header
- Visual distinction: completed lessons get green checkmark, current lesson gets blue highlight, future lessons are gray

**`resources/js/Pages/User/UserCourses.tsx`:**
- Course cards show progress bar with percentage
- Show "X of Y lessons" below the progress bar
- Show estimated time remaining: `(totalMinutes - completedMinutes) min remaining`
- Badge for completed courses: green checkmark overlay

### Backend Changes

**`CourseController.php` — `browse()` method:**
- Load `objectProgress` count for each assignment
- Load total objects count per course for progress display
- Add `cover_image` to the select list

**`CourseAssignment` model:**
- Add a computed accessor: `lessons_completed_text` → "X of Y Lessons Complete"

---

## Phase 5 — Admin Training Visibility

### Goal
Admin can view any user's training progress (like the "Training" button in 5ssupplies admin user panel).

### New Controller Method

**`CourseController.php` — `userTrainingOverview()`:**
```php
public function userTrainingOverview(Request $request, User $user): Response
{
    abort_unless($user->tenant_id === $request->user()->tenant_id, 403);

    $assignments = CourseAssignment::where('user_id', $user->id)
        ->with(['course:id,title,cover_image,estimated_minutes', 'course.category:id,name', 'objectProgress'])
        ->get();

    return Inertia::render('HR/UserTraining', [
        'employee' => $user->only('id', 'name', 'email', 'department', 'position'),
        'assignments' => $assignments,
    ]);
}
```

### New Route
```php
Route::get('/team/{user}/training', [CourseController::class, 'userTrainingOverview'])
    ->name('admin.team.training');
```

### New Frontend Page

**`resources/js/Pages/HR/UserTraining.tsx`:**
- Header: Employee name, department, position
- Stats: Courses assigned, in progress, completed, overall progress %
- Course list: Cards or table showing each assigned course with:
  - Cover image thumbnail
  - Course title & category
  - Progress bar + "X of Y Complete"
  - Status badge (assigned / in progress / completed)
  - Due date
  - Completion date (if completed)

### Integration Point
- Add a "Training" button/link in the existing Team/Directory employee detail modal/page
- This button navigates to `route('admin.team.training', userId)`

---

## Phase 6 — Publishing Wizard & Course Settings

### Goal
Replace the single "Publish" button with a multi-step publishing wizard like ConnectTeam.

### Publishing Wizard Steps

1. **Review Content** — Summary of sections, objects, estimated time. Warnings for empty sections or missing content.
2. **Audience** — Choose who to assign: All employees, specific departments, specific users, or roles. Option for "auto-assign new hires."
3. **Schedule** — Publish now or schedule for later. Set due date for all assignees.
4. **Notifications** — Toggle: send email notification, send push notification (future), send in-app notification.
5. **Confirm** — Final review with course card preview.

### Backend Changes

**`CourseController.php` — `publish()` method:**
- Accept optional `audience`, `schedule`, `due_date`, `notify` parameters
- If audience specified, auto-create assignments
- If scheduled, set `published_at` to the scheduled time and add a scheduled job

**New migration:**
- Add `auto_assign_new_hires` boolean to `courses` table (default false)
- Add `scheduled_publish_at` datetime to `courses` table (nullable)

### Frontend Changes

**`resources/js/Pages/HR/CourseBuilder.tsx`:**
- Replace the "Publish" button with "Publish Course" that opens a multi-step modal
- Create a `PublishWizard` component with step navigation

---

## Phase 7 — Template Library & Quick Create

### Goal
Pre-built course templates (like ConnectTeam) so admins can quickly create courses from templates.

### Database Changes

**New migration — `create_course_templates_table`:**
```
course_templates:
  id, name, description, cover_image, category, content (JSON),
  is_system (boolean), tenant_id (nullable — null = system template),
  created_at, updated_at
```

The `content` JSON stores the full course structure:
```json
{
  "sections": [
    {
      "title": "Section 1",
      "description": "...",
      "objects": [
        { "type": "text", "title": "Welcome", "content": "<p>...</p>" },
        { "type": "video", "title": "Orientation Video", "content": "" }
      ]
    }
  ]
}
```

### System Templates (seeded)
- Employee Onboarding
- Safety & Compliance Training
- Customer Service Basics
- Equipment Operation
- Company Policies & Handbook
- Anti-Harassment Training
- Food Safety (HACCP)
- Forklift Safety
- Emergency Procedures
- New Hire Checklist

### Backend Changes

**`CourseController.php` — `createFromTemplate()`:**
- Accept template_id, create a new course with the template's structure
- Deep-copy sections and objects from the template JSON

**`CourseController.php` — `saveAsTemplate()`:**
- Save an existing course as a tenant-specific template

### Frontend Changes

**`resources/js/Pages/HR/Courses.tsx` — New Create Flow:**
Replace the current "New Course" modal with a 3-option selector:
1. **Start from Scratch** — Opens current create modal
2. **Use a Template** — Shows template library grid with previews
3. **Duplicate Existing** — Shows list of existing courses to clone

---

## Phase 8 — Certificates & Completion

### Goal
Auto-generate a completion certificate when a user finishes a course (100% progress).

### Database Changes

**New migration — `create_course_certificates_table`:**
```
course_certificates:
  id, assignment_id (FK), user_id, course_id, tenant_id,
  certificate_number (unique string), issued_at (datetime),
  certificate_data (JSON — stores snapshot of user name, course title, completion date),
  created_at, updated_at
```

### Backend Changes

**`CourseController.php` — `completeObject()` method:**
- When `progress_pct` reaches 100%, auto-generate a certificate record
- Certificate number format: `BG-{TENANT}-{YEAR}-{ID}` (e.g., `BG-LANE-2026-00042`)

**New method — `downloadCertificate()`:**
- Generate a PDF certificate using a Blade template
- Include: Employee name, course title, completion date, certificate number, company logo
- Use `barryvdh/laravel-dompdf` package

### Frontend Changes

**`resources/js/Pages/User/UserCourseDetail.tsx`:**
- When course is 100% complete, show a congratulations banner with "Download Certificate" button

**`resources/js/Pages/User/UserCourses.tsx`:**
- Completed courses show a certificate icon; clicking downloads the PDF

---

## Phase 9 — Segment-Based Assignment & Mandatory Training

### Goal
Assign courses to departments, roles, or "all employees" instead of only individual users. Support mandatory training with enforcement.

### Database Changes

**New migration — `create_course_audience_rules_table`:**
```
course_audience_rules:
  id, course_id (FK), rule_type (enum: all, department, role, user),
  rule_value (string — department name, role name, or user_id),
  created_at
```

### Backend Changes

**`CourseController.php` — `assign()` method:**
- Accept segment-based assignment: `{ type: 'department', value: 'Shipping' }`
- Resolve all users matching the segment and create assignments
- Store the rule in `course_audience_rules` for auto-assigning new hires

**New Artisan command or job — `SyncCourseAssignments`:**
- Run periodically (or on user creation) to check audience rules and create missing assignments
- Ensures new hires get auto-assigned to mandatory courses

**Middleware or dashboard hook:**
- For mandatory courses: show a banner/notification if the user has overdue mandatory training

### Frontend Changes

**`resources/js/Pages/HR/CourseBuilder.tsx` — Assignments tab:**
- Add segment selector: "Assign to" dropdown with options: All Employees, By Department, By Role, Individual Users
- Show which segments are active
- Show auto-assignment rules

---

## Database Changes Summary

### Modifications to Existing Tables

| Table | Change | Phase |
|---|---|---|
| `courses` | Add `auto_assign_new_hires` boolean default false | 6 |
| `courses` | Add `scheduled_publish_at` datetime nullable | 6 |
| `course_objects` | Add `metadata` JSON nullable (for original filename, etc.) | 3 (optional) |

### New Tables

| Table | Purpose | Phase |
|---|---|---|
| `course_templates` | Pre-built and tenant-specific course templates | 7 |
| `course_certificates` | Completion certificates | 8 |
| `course_audience_rules` | Segment-based assignment rules | 9 |

---

## File Reference Map

### Backend Files
| File | Purpose |
|---|---|
| `app/Http/Controllers/CourseController.php` | All course logic — CRUD, builder, assignments, user views |
| `app/Models/Course.php` | Course model — relations, fillable, casts |
| `app/Models/CourseSection.php` | Section model — belongs to course, has objects |
| `app/Models/CourseObject.php` | Content object model — types: text/video/document/image/link/quiz |
| `app/Models/CourseAssignment.php` | User-course assignment with progress tracking |
| `app/Models/CourseObjectProgress.php` | Per-object completion records |
| `app/Models/CourseCategory.php` | Course categories |
| `database/migrations/2026_03_18_100000_create_courses_tables.php` | Creates all 6 course tables |
| `routes/web.php` | Course routes (admin lines ~181-201, user line ~270, shared lines ~395-397) |

### Frontend Files
| File | Purpose |
|---|---|
| `resources/js/Pages/HR/Courses.tsx` | Admin course listing — cards, stats, filters, create/category modals |
| `resources/js/Pages/HR/CourseBuilder.tsx` | Full-screen course builder — sections, objects, drag-drop, preview |
| `resources/js/Pages/User/UserCourses.tsx` | Employee course browsing — My Courses / Browse tabs |
| `resources/js/Pages/User/UserCourseDetail.tsx` | Employee course detail — content viewer, progress, mark complete |
| `resources/js/Components/SortableList.tsx` | Drag-and-drop wrapper (dnd-kit) |
| `resources/js/Components/RichTextEditor.tsx` | WYSIWYG editor with image upload |
| `resources/js/Components/PhonePreview.tsx` | Mobile phone mockup for live preview |

### Key Route Names (Ziggy)
| Route Name | Method | URI |
|---|---|---|
| `admin.courses.index` | GET | `/courses` |
| `admin.courses.store` | POST | `/courses` |
| `admin.courses.builder` | GET | `/courses/{course}/builder` |
| `admin.courses.publish` | POST | `/courses/{course}/publish` |
| `admin.courses.store-section` | POST | `/courses/{course}/sections` |
| `admin.courses.store-object` | POST | `/courses/sections/{section}/objects` |
| `admin.courses.update-object` | PATCH | `/courses/objects/{object}` |
| `admin.courses.reorder-sections` | POST | `/courses/{course}/reorder-sections` |
| `admin.courses.reorder-objects` | POST | `/courses/sections/{section}/reorder-objects` |
| `admin.courses.upload` | POST | `/courses/upload` |
| `admin.courses.assign` | POST | `/courses/{course}/assign` |
| `courses` | GET | `/app/courses` (user browse) |
| `courses.detail` | GET | `/courses/{course}` |
| `courses.complete-object` | POST | `/courses/objects/{object}/complete` |
