<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\CourseAudienceRule;
use App\Models\CourseCategory;
use App\Models\CourseCertificate;
use App\Models\CourseObject;
use App\Models\CourseObjectProgress;
use App\Models\CourseSection;
use App\Models\CourseTemplate;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'cover_image'       => 'nullable|image|mimes:jpeg,jpg,png,gif,webp,svg|max:10240',
        ], [
            'cover_image.image' => 'The cover image must be a valid image file (JPEG, PNG, GIF, WebP, or SVG).',
            'cover_image.mimes' => 'The cover image must be a JPEG, PNG, GIF, WebP, or SVG file.',
            'cover_image.max'   => 'The cover image must be smaller than 10 MB.',
        ]);

        $coverPath = null;
        if ($request->hasFile('cover_image')) {
            $coverPath = '/storage/' . $request->file('cover_image')->store('courses/covers', 'public');
        }

        Course::create([
            'tenant_id'         => $user->tenant_id,
            'created_by'        => $user->id,
            'title'             => $data['title'],
            'description'       => $data['description'] ?? null,
            'category_id'       => $data['category_id'] ?? null,
            'is_mandatory'      => $data['is_mandatory'] ?? false,
            'estimated_minutes' => $data['estimated_minutes'] ?? null,
            'cover_image'       => $coverPath,
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
            'cover_image'       => 'nullable|image|mimes:jpeg,jpg,png,gif,webp,svg|max:10240',
        ], [
            'cover_image.image' => 'The cover image must be a valid image file (JPEG, PNG, GIF, WebP, or SVG).',
            'cover_image.mimes' => 'The cover image must be a JPEG, PNG, GIF, WebP, or SVG file.',
            'cover_image.max'   => 'The cover image must be smaller than 10 MB.',
        ]);

        if ($request->hasFile('cover_image')) {
            if ($course->cover_image) {
                $oldPath = str_replace('/storage/', '', $course->cover_image);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $data['cover_image'] = '/storage/' . $request->file('cover_image')->store('courses/covers', 'public');
        }
        unset($data['cover_image_file']);

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

        $data = $request->validate([
            'assign_to'            => 'nullable|in:none,all,selected',
            'user_ids'             => 'nullable|array',
            'user_ids.*'           => 'exists:users,id',
            'due_date'             => 'nullable|date',
            'auto_assign_new_hires' => 'boolean',
            'notify'               => 'boolean',
        ]);

        $course->update([
            'status'                => 'published',
            'published_at'          => now(),
            'auto_assign_new_hires' => $data['auto_assign_new_hires'] ?? false,
        ]);

        // Auto-assign based on audience selection
        $assignTo = $data['assign_to'] ?? 'none';
        $dueDate  = $data['due_date'] ?? null;

        if ($assignTo === 'all') {
            $userIds = User::where('tenant_id', $request->user()->tenant_id)
                ->pluck('id')
                ->toArray();
        } elseif ($assignTo === 'selected') {
            $userIds = $data['user_ids'] ?? [];
        } else {
            $userIds = [];
        }

        foreach ($userIds as $userId) {
            CourseAssignment::firstOrCreate(
                ['course_id' => $course->id, 'user_id' => $userId],
                [
                    'tenant_id' => $request->user()->tenant_id,
                    'due_date'  => $dueDate,
                    'status'    => 'assigned',
                ]
            );
        }

        $assignedCount = count($userIds);
        $msg = 'Course published.';
        if ($assignedCount > 0) {
            $msg .= " Assigned to {$assignedCount} user(s).";
        }

        return back()->with('flash', ['success' => $msg]);
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

        $audienceRules = CourseAudienceRule::where('course_id', $course->id)->get();

        $departments = User::where('tenant_id', $request->user()->tenant_id)
            ->whereNotNull('department')->where('department', '!=', '')
            ->distinct()->pluck('department')->sort()->values();

        $roles = User::where('tenant_id', $request->user()->tenant_id)
            ->whereNotNull('position')->where('position', '!=', '')
            ->distinct()->pluck('position')->sort()->values();

        return Inertia::render('HR/CourseBuilder', [
            'course'              => $course,
            'teamMembers'         => $teamMembers,
            'existingAssignees'   => $existingAssignees,
            'audienceRules'       => $audienceRules,
            'departments'         => $departments,
            'roles'               => $roles,
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
            'content'          => 'nullable|string|max:100000',
            'file'             => 'nullable|file|max:51200',
            'duration_minutes' => 'nullable|integer|min:1',
        ]);

        $content = $data['content'] ?? null;

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store("courses/{$course->id}", 'public');
            $content = '/storage/' . $path;
        }

        $maxOrder = $section->objects()->max('sort_order') ?? 0;

        $section->objects()->create([
            'type'             => $data['type'],
            'title'            => $data['title'],
            'content'          => $content,
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
            'content'          => 'nullable|string|max:100000',
            'file'             => 'nullable|file|max:51200',
            'duration_minutes' => 'nullable|integer|min:1',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store("courses/{$course->id}", 'public');
            $data['content'] = '/storage/' . $path;
        }

        unset($data['file']);
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
    //  ADMIN — Reorder & Upload
    // ─────────────────────────────────────────────────────────

    public function reorderSections(Request $request, Course $course): JsonResponse
    {
        $this->authorizeTenant($request, $course);

        $data = $request->validate([
            'order'   => 'required|array',
            'order.*' => 'integer',
        ]);

        foreach ($data['order'] as $index => $sectionId) {
            $course->sections()->where('id', $sectionId)->update(['sort_order' => $index + 1]);
        }

        return response()->json(['success' => true]);
    }

    public function reorderObjects(Request $request, CourseSection $section): JsonResponse
    {
        $course = $section->course;
        $this->authorizeTenant($request, $course);

        $data = $request->validate([
            'order'   => 'required|array',
            'order.*' => 'integer',
        ]);

        foreach ($data['order'] as $index => $objectId) {
            $section->objects()->where('id', $objectId)->update(['sort_order' => $index + 1]);
        }

        return response()->json(['success' => true]);
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:51200',
        ]);

        $path = $request->file('file')->store('courses/uploads', 'public');

        return response()->json(['url' => '/storage/' . $path]);
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
    //  ADMIN — Template Library
    // ─────────────────────────────────────────────────────────

    public function templates(Request $request): Response
    {
        $tenantId = $request->user()->tenant_id;

        $templates = CourseTemplate::where('is_system', true)
            ->orWhere('tenant_id', $tenantId)
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'category', 'cover_image', 'content', 'is_system']);

        $categories = $templates->pluck('category')->unique()->sort()->values();

        return Inertia::render('HR/CourseTemplates', [
            'templates'  => $templates,
            'categories' => $categories,
        ]);
    }

    public function createFromTemplate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'template_id' => 'required|exists:course_templates,id',
        ]);

        $template = CourseTemplate::findOrFail($data['template_id']);
        $user     = $request->user();

        // Create the course
        $course = Course::create([
            'tenant_id'   => $user->tenant_id,
            'created_by'  => $user->id,
            'title'       => $template->name,
            'description' => $template->description,
            'status'      => 'draft',
        ]);

        // Deep-copy sections and objects from template JSON
        $content = $template->content;
        if (isset($content['sections'])) {
            foreach ($content['sections'] as $sIdx => $sectionData) {
                $section = $course->sections()->create([
                    'title'       => $sectionData['title'],
                    'description' => $sectionData['description'] ?? null,
                    'sort_order'  => $sIdx + 1,
                ]);

                foreach ($sectionData['objects'] ?? [] as $oIdx => $objectData) {
                    $section->objects()->create([
                        'type'       => $objectData['type'],
                        'title'      => $objectData['title'],
                        'content'    => $objectData['content'] ?? null,
                        'sort_order' => $oIdx + 1,
                    ]);
                }
            }
        }

        return redirect()->route('admin.courses.builder', $course->id)
            ->with('flash', ['success' => 'Course created from template.']);
    }

    public function duplicateCourse(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeTenant($request, $course);
        $user = $request->user();

        $course->load(['sections' => fn ($q) => $q->orderBy('sort_order'), 'sections.objects' => fn ($q) => $q->orderBy('sort_order')]);

        $newCourse = Course::create([
            'tenant_id'         => $user->tenant_id,
            'created_by'        => $user->id,
            'title'             => $course->title . ' (Copy)',
            'description'       => $course->description,
            'category_id'       => $course->category_id,
            'is_mandatory'      => $course->is_mandatory,
            'estimated_minutes' => $course->estimated_minutes,
            'status'            => 'draft',
        ]);

        foreach ($course->sections as $section) {
            $newSection = $newCourse->sections()->create([
                'title'       => $section->title,
                'description' => $section->description,
                'sort_order'  => $section->sort_order,
            ]);

            foreach ($section->objects as $object) {
                $newSection->objects()->create([
                    'type'             => $object->type,
                    'title'            => $object->title,
                    'content'          => $object->content,
                    'duration_minutes' => $object->duration_minutes,
                    'sort_order'       => $object->sort_order,
                ]);
            }
        }

        return redirect()->route('admin.courses.builder', $newCourse->id)
            ->with('flash', ['success' => 'Course duplicated.']);
    }

    public function saveAsTemplate(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeTenant($request, $course);
        $user = $request->user();

        $course->load(['sections' => fn ($q) => $q->orderBy('sort_order'), 'sections.objects' => fn ($q) => $q->orderBy('sort_order')]);

        $content = ['sections' => []];
        foreach ($course->sections as $section) {
            $sectionData = [
                'title'       => $section->title,
                'description' => $section->description,
                'objects'     => [],
            ];
            foreach ($section->objects as $object) {
                $sectionData['objects'][] = [
                    'type'    => $object->type,
                    'title'   => $object->title,
                    'content' => $object->content,
                ];
            }
            $content['sections'][] = $sectionData;
        }

        CourseTemplate::create([
            'tenant_id'   => $user->tenant_id,
            'name'        => $course->title,
            'description' => $course->description,
            'category'    => $course->category?->name ?? 'General',
            'content'     => $content,
            'is_system'   => false,
        ]);

        return back()->with('flash', ['success' => 'Course saved as template.']);
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
                'course:id,title,description,estimated_minutes,is_mandatory,status,cover_image',
                'course.category:id,name',
                'course.sections.objects:id,section_id,duration_minutes',
            ])
            ->withCount(['objectProgress as completed_lessons' => fn ($q) => $q->whereNotNull('completed_at')])
            ->orderByRaw("CASE WHEN status = 'in_progress' THEN 0 WHEN status = 'assigned' THEN 1 ELSE 2 END")
            ->orderBy('created_at', 'desc')
            ->get();

        // Attach total lesson count and completed minutes to each assignment
        $assignments->each(function ($assignment) {
            $totalLessons = 0;
            $totalMinutes = 0;
            if ($assignment->course && $assignment->course->sections) {
                foreach ($assignment->course->sections as $section) {
                    $totalLessons += $section->objects->count();
                    $totalMinutes += $section->objects->sum('duration_minutes');
                }
            }
            $assignment->total_lessons = $totalLessons;
            $assignment->total_duration_minutes = $totalMinutes;
            // Clean up nested objects to reduce payload
            if ($assignment->course) {
                unset($assignment->course->sections);
            }
        });

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

        // Check for certificate
        $certificate = CourseCertificate::where('assignment_id', $assignment->id)->first();

        return Inertia::render('User/UserCourseDetail', [
            'course'             => $course->only('id', 'title', 'description', 'estimated_minutes', 'cover_image', 'sections'),
            'assignment'         => $assignment,
            'completedObjectIds' => $completedObjectIds,
            'certificate'        => $certificate ? $certificate->only('id', 'certificate_number', 'issued_at') : null,
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

        // Auto-generate certificate on completion
        if ($pct >= 100) {
            $existing = CourseCertificate::where('assignment_id', $assignment->id)->first();
            if (!$existing) {
                $tenantSlug = strtoupper(substr($user->tenant_id, 0, 4));
                $certNumber = 'BG-' . $tenantSlug . '-' . date('Y') . '-' . str_pad($assignment->id, 5, '0', STR_PAD_LEFT);

                CourseCertificate::create([
                    'assignment_id'    => $assignment->id,
                    'user_id'          => $user->id,
                    'course_id'        => $course->id,
                    'tenant_id'        => $user->tenant_id,
                    'certificate_number' => $certNumber,
                    'issued_at'        => now(),
                    'certificate_data' => [
                        'user_name'       => $user->name,
                        'course_title'    => $course->title,
                        'completion_date' => now()->toDateString(),
                        'estimated_minutes' => $course->estimated_minutes,
                    ],
                ]);
            }
        }

        return back()->with('flash', ['success' => 'Progress saved.']);
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN — User Training Overview
    // ─────────────────────────────────────────────────────────

    public function userTrainingOverview(Request $request, User $user): Response
    {
        abort_unless($user->tenant_id === $request->user()->tenant_id, 403);

        $assignments = CourseAssignment::where('user_id', $user->id)
            ->with([
                'course:id,title,cover_image,estimated_minutes,is_mandatory',
                'course.category:id,name',
                'course.sections.objects:id,section_id',
            ])
            ->withCount(['objectProgress as completed_lessons' => fn ($q) => $q->whereNotNull('completed_at')])
            ->orderByRaw("CASE WHEN status = 'in_progress' THEN 0 WHEN status = 'assigned' THEN 1 ELSE 2 END")
            ->orderBy('created_at', 'desc')
            ->get();

        $assignments->each(function ($assignment) {
            $totalLessons = 0;
            if ($assignment->course && $assignment->course->sections) {
                foreach ($assignment->course->sections as $section) {
                    $totalLessons += $section->objects->count();
                }
            }
            $assignment->total_lessons = $totalLessons;
            if ($assignment->course) {
                unset($assignment->course->sections);
            }
        });

        $stats = [
            'total'       => $assignments->count(),
            'in_progress' => $assignments->where('status', 'in_progress')->count(),
            'completed'   => $assignments->where('status', 'completed')->count(),
            'overdue'     => $assignments->filter(fn ($a) => $a->due_date && $a->due_date->isPast() && $a->status !== 'completed')->count(),
            'avg_progress' => $assignments->count() > 0 ? round($assignments->avg('progress_pct')) : 0,
        ];

        return Inertia::render('HR/UserTraining', [
            'employee'    => $user->only('id', 'name', 'email', 'department', 'position', 'avatar_url'),
            'assignments' => $assignments,
            'stats'       => $stats,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────

    private function authorizeTenant(Request $request, Course $course): void
    {
        abort_unless($course->tenant_id === $request->user()->tenant_id, 403);
    }

    // ─────────────────────────────────────────────────────────
    //  Certificate Download
    // ─────────────────────────────────────────────────────────

    public function downloadCertificate(Request $request, CourseCertificate $certificate)
    {
        abort_unless($certificate->user_id === $request->user()->id || $certificate->tenant_id === $request->user()->tenant_id, 403);

        $data = $certificate->certificate_data;

        $pdf = Pdf::loadView('certificates.course', [
            'certificate'   => $certificate,
            'userName'      => $data['user_name'] ?? 'Employee',
            'courseTitle'   => $data['course_title'] ?? 'Course',
            'completionDate' => $data['completion_date'] ?? $certificate->issued_at->toDateString(),
            'certNumber'    => $certificate->certificate_number,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('certificate-' . $certificate->certificate_number . '.pdf');
    }

    // ─────────────────────────────────────────────────────────
    //  Segment-Based Assignment
    // ─────────────────────────────────────────────────────────

    public function segmentAssign(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeTenant($request, $course);

        $data = $request->validate([
            'rule_type'  => 'required|in:all,department,role',
            'rule_value' => 'nullable|string|max:255',
            'due_date'   => 'nullable|date',
        ]);

        $tenantId = $request->user()->tenant_id;

        // Store the audience rule
        CourseAudienceRule::updateOrCreate(
            ['course_id' => $course->id, 'rule_type' => $data['rule_type'], 'rule_value' => $data['rule_value'] ?? null],
        );

        // Resolve users from the segment
        $query = User::where('tenant_id', $tenantId);
        if ($data['rule_type'] === 'department' && $data['rule_value']) {
            $query->where('department', $data['rule_value']);
        } elseif ($data['rule_type'] === 'role' && $data['rule_value']) {
            $query->where('position', $data['rule_value']);
        }
        // 'all' = no filter

        $userIds = $query->pluck('id');

        $count = 0;
        foreach ($userIds as $userId) {
            $created = CourseAssignment::firstOrCreate(
                ['course_id' => $course->id, 'user_id' => $userId],
                [
                    'tenant_id' => $tenantId,
                    'due_date'  => $data['due_date'] ?? null,
                    'status'    => 'assigned',
                ]
            );
            if ($created->wasRecentlyCreated) $count++;
        }

        $label = $data['rule_type'] === 'all' ? 'all employees' : $data['rule_type'] . ': ' . $data['rule_value'];
        return back()->with('flash', ['success' => "Assigned to {$count} user(s) ({$label})." ]);
    }

    public function removeAudienceRule(Request $request, CourseAudienceRule $rule): RedirectResponse
    {
        $course = $rule->course;
        $this->authorizeTenant($request, $course);
        $rule->delete();

        return back()->with('flash', ['success' => 'Audience rule removed.']);
    }
}
