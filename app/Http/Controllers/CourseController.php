<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\CourseCategory;
use App\Models\CourseObject;
use App\Models\CourseObjectProgress;
use App\Models\CourseSection;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  ADMIN — Course Management
    // ─────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');
        $category = $request->get('category', 'all');

        $query = Course::where('tenant_id', $tenantId)
            ->with(['category:id,name', 'creator:id,name'])
            ->withCount(['sections', 'assignments'])
            ->withCount(['assignments as completed_count' => fn ($q) => $q->where('status', 'completed')])
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($category !== 'all') {
            $query->where('category_id', $category);
        }

        $courses = $query->get();

        $allCourses = Course::where('tenant_id', $tenantId);
        $stats = [
            'total'     => (clone $allCourses)->count(),
            'published' => (clone $allCourses)->where('status', 'published')->count(),
            'draft'     => (clone $allCourses)->where('status', 'draft')->count(),
            'mandatory' => (clone $allCourses)->where('is_mandatory', true)->count(),
        ];

        $categories = CourseCategory::where('tenant_id', $tenantId)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'description']);

        return Inertia::render('HR/Courses', [
            'courses'    => $courses,
            'filters'    => ['status' => $status, 'category' => $category],
            'stats'      => $stats,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'title'             => 'required|string|max:255',
            'description'       => 'nullable|string|max:5000',
            'category_id'       => 'nullable|exists:course_categories,id',
            'is_mandatory'      => 'boolean',
            'estimated_minutes' => 'nullable|integer|min:1',
        ]);

        Course::create([
            'tenant_id'         => $user->tenant_id,
            'created_by'        => $user->id,
            'title'             => $data['title'],
            'description'       => $data['description'] ?? null,
            'category_id'       => $data['category_id'] ?? null,
            'is_mandatory'      => $data['is_mandatory'] ?? false,
            'estimated_minutes' => $data['estimated_minutes'] ?? null,
            'status'            => 'draft',
        ]);

        return back()->with('flash', ['success' => 'Course created.']);
    }

    public function update(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeTenant($request, $course);

        $data = $request->validate([
            'title'             => 'sometimes|string|max:255',
            'description'       => 'nullable|string|max:5000',
            'category_id'       => 'nullable|exists:course_categories,id',
            'is_mandatory'      => 'boolean',
            'estimated_minutes' => 'nullable|integer|min:1',
        ]);

        $course->update($data);

        return back()->with('flash', ['success' => 'Course updated.']);
    }

    public function destroy(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeTenant($request, $course);
        $course->delete();

        return back()->with('flash', ['success' => 'Course deleted.']);
    }

    public function publish(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeTenant($request, $course);
        $course->update(['status' => 'published', 'published_at' => now()]);

        return back()->with('flash', ['success' => 'Course published.']);
    }

    public function archive(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeTenant($request, $course);
        $course->update(['status' => 'archived']);

        return back()->with('flash', ['success' => 'Course archived.']);
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN — Course Builder (sections & objects)
    // ─────────────────────────────────────────────────────────

    public function builder(Request $request, Course $course): Response
    {
        $this->authorizeTenant($request, $course);

        $course->load([
            'category:id,name',
            'creator:id,name',
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.objects' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        $course->loadCount(['assignments', 'assignments as completed_count' => fn ($q) => $q->where('status', 'completed')]);

        $teamMembers = User::where('tenant_id', $request->user()->tenant_id)
            ->get(['id', 'name', 'email', 'department', 'position']);

        $existingAssignees = CourseAssignment::where('course_id', $course->id)
            ->with('user:id,name,email')
            ->get(['id', 'user_id', 'status', 'progress_pct', 'due_date', 'completed_at']);

        return Inertia::render('HR/CourseBuilder', [
            'course'              => $course,
            'teamMembers'         => $teamMembers,
            'existingAssignees'   => $existingAssignees,
        ]);
    }

    public function storeSection(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeTenant($request, $course);

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $maxOrder = $course->sections()->max('sort_order') ?? 0;

        $course->sections()->create([
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'sort_order'  => $maxOrder + 1,
        ]);

        return back()->with('flash', ['success' => 'Section added.']);
    }

    public function updateSection(Request $request, CourseSection $section): RedirectResponse
    {
        $course = $section->course;
        $this->authorizeTenant($request, $course);

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $section->update($data);

        return back()->with('flash', ['success' => 'Section updated.']);
    }

    public function destroySection(Request $request, CourseSection $section): RedirectResponse
    {
        $course = $section->course;
        $this->authorizeTenant($request, $course);
        $section->delete();

        return back()->with('flash', ['success' => 'Section deleted.']);
    }

    public function storeObject(Request $request, CourseSection $section): RedirectResponse
    {
        $course = $section->course;
        $this->authorizeTenant($request, $course);

        $data = $request->validate([
            'type'             => 'required|in:text,video,document,image,link,quiz',
            'title'            => 'required|string|max:255',
            'content'          => 'nullable|string|max:50000',
            'duration_minutes' => 'nullable|integer|min:1',
        ]);

        $maxOrder = $section->objects()->max('sort_order') ?? 0;

        $section->objects()->create([
            'type'             => $data['type'],
            'title'            => $data['title'],
            'content'          => $data['content'] ?? null,
            'duration_minutes' => $data['duration_minutes'] ?? null,
            'sort_order'       => $maxOrder + 1,
        ]);

        return back()->with('flash', ['success' => 'Content added.']);
    }

    public function updateObject(Request $request, CourseObject $object): RedirectResponse
    {
        $course = $object->section->course;
        $this->authorizeTenant($request, $course);

        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'content'          => 'nullable|string|max:50000',
            'duration_minutes' => 'nullable|integer|min:1',
        ]);

        $object->update($data);

        return back()->with('flash', ['success' => 'Content updated.']);
    }

    public function destroyObject(Request $request, CourseObject $object): RedirectResponse
    {
        $course = $object->section->course;
        $this->authorizeTenant($request, $course);
        $object->delete();

        return back()->with('flash', ['success' => 'Content removed.']);
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN — Assignments
    // ─────────────────────────────────────────────────────────

    public function assign(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeTenant($request, $course);

        $data = $request->validate([
            'user_ids'   => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'due_date'   => 'nullable|date',
        ]);

        foreach ($data['user_ids'] as $userId) {
            CourseAssignment::firstOrCreate(
                ['course_id' => $course->id, 'user_id' => $userId],
                [
                    'tenant_id' => $request->user()->tenant_id,
                    'due_date'  => $data['due_date'] ?? null,
                    'status'    => 'assigned',
                ]
            );
        }

        return back()->with('flash', ['success' => count($data['user_ids']) . ' user(s) assigned.']);
    }

    public function removeAssignment(Request $request, CourseAssignment $assignment): RedirectResponse
    {
        $course = $assignment->course;
        $this->authorizeTenant($request, $course);
        $assignment->delete();

        return back()->with('flash', ['success' => 'Assignment removed.']);
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN — Category Management
    // ─────────────────────────────────────────────────────────

    public function storeCategory(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
        ]);

        CourseCategory::create([
            'tenant_id'   => $request->user()->tenant_id,
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        return back()->with('flash', ['success' => 'Category created.']);
    }

    public function destroyCategory(Request $request, CourseCategory $category): RedirectResponse
    {
        abort_unless($category->tenant_id === $request->user()->tenant_id, 403);
        $category->delete();

        return back()->with('flash', ['success' => 'Category deleted.']);
    }

    // ─────────────────────────────────────────────────────────
    //  USER — My Courses
    // ─────────────────────────────────────────────────────────

    public function browse(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        // Courses assigned to this user
        $assignments = CourseAssignment::where('user_id', $user->id)
            ->with([
                'course:id,title,description,estimated_minutes,is_mandatory,status',
                'course.category:id,name',
            ])
            ->orderByRaw("CASE WHEN status = 'in_progress' THEN 0 WHEN status = 'assigned' THEN 1 ELSE 2 END")
            ->orderBy('created_at', 'desc')
            ->get();

        // Also list published courses the user can self-enroll in
        $assignedCourseIds = $assignments->pluck('course_id')->toArray();
        $availableCourses = Course::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->whereNotIn('id', $assignedCourseIds)
            ->with('category:id,name')
            ->withCount('sections')
            ->orderBy('title')
            ->get();

        return Inertia::render('User/UserCourses', [
            'assignments'      => $assignments,
            'availableCourses' => $availableCourses,
        ]);
    }

    public function userCourseDetail(Request $request, Course $course): Response
    {
        $user = $request->user();
        abort_unless($course->tenant_id === $user->tenant_id, 403);

        $assignment = CourseAssignment::where('course_id', $course->id)
            ->where('user_id', $user->id)
            ->first();

        // Self-enroll if not assigned but course is published
        if (!$assignment && $course->status === 'published') {
            $assignment = CourseAssignment::create([
                'course_id' => $course->id,
                'user_id'   => $user->id,
                'tenant_id' => $user->tenant_id,
                'status'    => 'in_progress',
                'started_at' => now(),
            ]);
        }

        abort_unless($assignment, 404);

        $course->load([
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.objects' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        $completedObjectIds = CourseObjectProgress::where('assignment_id', $assignment->id)
            ->whereNotNull('completed_at')
            ->pluck('object_id')
            ->toArray();

        return Inertia::render('User/UserCourseDetail', [
            'course'             => $course,
            'assignment'         => $assignment,
            'completedObjectIds' => $completedObjectIds,
        ]);
    }

    public function completeObject(Request $request, CourseObject $object): RedirectResponse
    {
        $course = $object->section->course;
        $user   = $request->user();

        abort_unless($course->tenant_id === $user->tenant_id, 403);

        $assignment = CourseAssignment::where('course_id', $course->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Mark started if first interaction
        if (!$assignment->started_at) {
            $assignment->update(['started_at' => now(), 'status' => 'in_progress']);
        }

        CourseObjectProgress::firstOrCreate(
            ['assignment_id' => $assignment->id, 'object_id' => $object->id],
            ['completed_at' => now()]
        );

        // Recalculate progress
        $totalObjects = 0;
        foreach ($course->sections as $section) {
            $totalObjects += $section->objects()->count();
        }
        $completedCount = $assignment->objectProgress()->whereNotNull('completed_at')->count();
        $pct = $totalObjects > 0 ? round(($completedCount / $totalObjects) * 100) : 0;

        $updateData = ['progress_pct' => $pct];
        if ($pct >= 100) {
            $updateData['status']       = 'completed';
            $updateData['completed_at'] = now();
        } else {
            $updateData['status'] = 'in_progress';
        }
        $assignment->update($updateData);

        return back()->with('flash', ['success' => 'Progress saved.']);
    }

    // ─────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────

    private function authorizeTenant(Request $request, Course $course): void
    {
        abort_unless($course->tenant_id === $request->user()->tenant_id, 403);
    }
}
