<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormField;
use App\Models\FormSubmission;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    /**
     * Admin view: all forms for the tenant.
     */
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');
        $type     = $request->get('type', 'all');

        $query = Form::where('tenant_id', $tenantId)
            ->with(['creator:id,name', 'fields', 'assignees:id,name,email'])
            ->withCount(['submissions', 'assignees'])
            ->orderByRaw("CASE status WHEN 'active' THEN 1 WHEN 'draft' THEN 2 WHEN 'archived' THEN 3 END")
            ->orderBy('updated_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($type !== 'all') {
            $query->where('type', $type);
        }

        $forms = $query->get()->map(fn ($form) => $this->formatForm($form));

        $allForms = Form::where('tenant_id', $tenantId);
        $stats = [
            'total'    => (clone $allForms)->count(),
            'active'   => (clone $allForms)->where('status', 'active')->count(),
            'draft'    => (clone $allForms)->where('status', 'draft')->count(),
            'archived' => (clone $allForms)->where('status', 'archived')->count(),
        ];

        $members = User::where('tenant_id', $tenantId)
            ->select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get();

        return Inertia::render('Operations/Forms', [
            'forms'   => $forms,
            'members' => $members,
            'filters' => [
                'status' => $status,
                'type'   => $type,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Create a new form with fields.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string|max:2000',
            'type'           => 'required|in:form,checklist',
            'is_required'    => 'boolean',
            'allow_multiple' => 'boolean',
            'is_anonymous'   => 'boolean',
            'fields'         => 'required|array|min:1',
            'fields.*.type'        => 'required|in:text,textarea,number,select,multiselect,checkbox,radio,date,time,image,file,signature,yes_no,location',
            'fields.*.label'       => 'required|string|max:255',
            'fields.*.description' => 'nullable|string|max:500',
            'fields.*.is_required' => 'boolean',
            'fields.*.options'     => 'nullable|array',
            'fields.*.section'     => 'nullable|string|max:255',
        ]);

        $form = Form::create([
            'tenant_id'      => $user->tenant_id,
            'created_by'     => $user->id,
            'title'          => $validated['title'],
            'description'    => $validated['description'] ?? null,
            'type'           => $validated['type'],
            'status'         => 'draft',
            'is_required'    => $validated['is_required'] ?? false,
            'allow_multiple' => $validated['allow_multiple'] ?? false,
            'is_anonymous'   => $validated['is_anonymous'] ?? false,
        ]);

        foreach ($validated['fields'] as $i => $fieldData) {
            $form->fields()->create([
                'type'        => $fieldData['type'],
                'label'       => $fieldData['label'],
                'description' => $fieldData['description'] ?? null,
                'is_required' => $fieldData['is_required'] ?? false,
                'options'     => $fieldData['options'] ?? null,
                'sort_order'  => $i,
                'section'     => $fieldData['section'] ?? null,
            ]);
        }

        return back()->with('success', "Form \"{$form->title}\" created as draft.");
    }

    /**
     * Update a form and its fields.
     */
    public function update(Request $request, Form $form): RedirectResponse
    {
        if ($form->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string|max:2000',
            'type'           => 'required|in:form,checklist',
            'is_required'    => 'boolean',
            'allow_multiple' => 'boolean',
            'is_anonymous'   => 'boolean',
            'fields'         => 'required|array|min:1',
            'fields.*.id'          => 'nullable|integer',
            'fields.*.type'        => 'required|in:text,textarea,number,select,multiselect,checkbox,radio,date,time,image,file,signature,yes_no,location',
            'fields.*.label'       => 'required|string|max:255',
            'fields.*.description' => 'nullable|string|max:500',
            'fields.*.is_required' => 'boolean',
            'fields.*.options'     => 'nullable|array',
            'fields.*.section'     => 'nullable|string|max:255',
        ]);

        $form->update([
            'title'          => $validated['title'],
            'description'    => $validated['description'] ?? null,
            'type'           => $validated['type'],
            'is_required'    => $validated['is_required'] ?? false,
            'allow_multiple' => $validated['allow_multiple'] ?? false,
            'is_anonymous'   => $validated['is_anonymous'] ?? false,
        ]);

        // Sync fields: delete removed, update existing, create new
        $incomingIds = collect($validated['fields'])
            ->pluck('id')
            ->filter()
            ->toArray();

        // Delete fields not in the incoming set
        $form->fields()->whereNotIn('id', $incomingIds)->delete();

        foreach ($validated['fields'] as $i => $fieldData) {
            if (! empty($fieldData['id'])) {
                FormField::where('id', $fieldData['id'])
                    ->where('form_id', $form->id)
                    ->update([
                        'type'        => $fieldData['type'],
                        'label'       => $fieldData['label'],
                        'description' => $fieldData['description'] ?? null,
                        'is_required' => $fieldData['is_required'] ?? false,
                        'options'     => isset($fieldData['options']) ? json_encode($fieldData['options']) : null,
                        'sort_order'  => $i,
                        'section'     => $fieldData['section'] ?? null,
                    ]);
            } else {
                $form->fields()->create([
                    'type'        => $fieldData['type'],
                    'label'       => $fieldData['label'],
                    'description' => $fieldData['description'] ?? null,
                    'is_required' => $fieldData['is_required'] ?? false,
                    'options'     => $fieldData['options'] ?? null,
                    'sort_order'  => $i,
                    'section'     => $fieldData['section'] ?? null,
                ]);
            }
        }

        return back()->with('success', 'Form updated.');
    }

    /**
     * Delete a form.
     */
    public function destroy(Request $request, Form $form): RedirectResponse
    {
        if ($form->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $title = $form->title;
        $form->delete();

        return back()->with('success', "Form \"{$title}\" deleted.");
    }

    /**
     * Publish a draft form (set status to active).
     */
    public function publish(Request $request, Form $form): RedirectResponse
    {
        if ($form->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $form->update([
            'status'       => 'active',
            'published_at' => now(),
        ]);

        return back()->with('success', "Form \"{$form->title}\" published.");
    }

    /**
     * Archive an active form.
     */
    public function archive(Request $request, Form $form): RedirectResponse
    {
        if ($form->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $form->update(['status' => 'archived']);

        return back()->with('success', "Form \"{$form->title}\" archived.");
    }

    /**
     * Assign form to users.
     */
    public function assign(Request $request, Form $form): RedirectResponse
    {
        if ($form->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'user_ids'   => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        $form->assignees()->sync($validated['user_ids']);

        $count = count($validated['user_ids']);

        return back()->with('success', "Form assigned to {$count} team member(s).");
    }

    /**
     * View submissions for a form (admin).
     */
    public function submissions(Request $request, Form $form): Response
    {
        if ($form->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $submissions = $form->submissions()
            ->with(['user:id,name,email', 'reviewer:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($s) => [
                'id'             => $s->id,
                'user'           => $s->user ? ['id' => $s->user->id, 'name' => $s->user->name, 'email' => $s->user->email] : null,
                'answers'        => $s->answers,
                'status'         => $s->status,
                'reviewer_notes' => $s->reviewer_notes,
                'reviewer'       => $s->reviewer ? ['id' => $s->reviewer->id, 'name' => $s->reviewer->name] : null,
                'reviewed_at'    => $s->reviewed_at?->toDateTimeString(),
                'created_at'     => $s->created_at->toDateTimeString(),
            ]);

        $formData = $this->formatForm($form->loadCount(['submissions', 'assignees'])->load(['creator:id,name', 'fields', 'assignees:id,name,email']));

        return Inertia::render('Operations/FormSubmissions', [
            'form'        => $formData,
            'submissions' => $submissions,
        ]);
    }

    /**
     * Review a submission (approve/reject).
     */
    public function reviewSubmission(Request $request, FormSubmission $submission): RedirectResponse
    {
        $form = $submission->form;
        if ($form->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'status'         => 'required|in:reviewed,rejected',
            'reviewer_notes' => 'nullable|string|max:2000',
        ]);

        $submission->update([
            'status'         => $validated['status'],
            'reviewer_notes' => $validated['reviewer_notes'] ?? null,
            'reviewed_by'    => $request->user()->id,
            'reviewed_at'    => now(),
        ]);

        return back()->with('success', 'Submission ' . $validated['status'] . '.');
    }

    // ─── User-facing ──────────────────────────────────────────

    /**
     * User view: forms assigned to me.
     */
    public function myForms(Request $request): Response
    {
        $user = $request->user();

        $forms = Form::where('status', 'active')
            ->whereHas('assignees', fn ($q) => $q->where('users.id', $user->id))
            ->with(['fields'])
            ->withCount('submissions')
            ->orderBy('is_required', 'desc')
            ->orderBy('title')
            ->get()
            ->map(function ($form) use ($user) {
                $mySubmissions = $form->submissions()
                    ->where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->get();

                return [
                    'id'              => $form->id,
                    'title'           => $form->title,
                    'description'     => $form->description,
                    'type'            => $form->type,
                    'is_required'     => $form->is_required,
                    'allow_multiple'  => $form->allow_multiple,
                    'fields'          => $form->fields->map(fn ($f) => $this->formatField($f))->toArray(),
                    'my_submissions'  => $mySubmissions->map(fn ($s) => [
                        'id'         => $s->id,
                        'answers'    => $s->answers,
                        'status'     => $s->status,
                        'created_at' => $s->created_at->toDateTimeString(),
                    ])->toArray(),
                    'has_submitted'   => $mySubmissions->isNotEmpty(),
                ];
            });

        return Inertia::render('User/UserForms', [
            'forms' => $forms,
        ]);
    }

    /**
     * User submits a form.
     */
    public function submit(Request $request, Form $form): RedirectResponse
    {
        $user = $request->user();

        // Must be assigned
        if (! $form->assignees()->where('users.id', $user->id)->exists()) {
            abort(403, 'You are not assigned to this form.');
        }

        // Must be active
        if (! $form->isActive()) {
            abort(403, 'This form is not accepting submissions.');
        }

        // Check if already submitted (and multiple not allowed)
        if (! $form->allow_multiple) {
            $existing = FormSubmission::where('form_id', $form->id)
                ->where('user_id', $user->id)
                ->exists();
            if ($existing) {
                return back()->with('error', 'You have already submitted this form.');
            }
        }

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        // Validate required fields
        $fields = $form->fields;
        foreach ($fields as $field) {
            if ($field->is_required) {
                $answer = $validated['answers'][$field->id] ?? null;
                if ($answer === null || $answer === '' || $answer === []) {
                    return back()->withErrors(["answers.{$field->id}" => "The {$field->label} field is required."]);
                }
            }
        }

        FormSubmission::create([
            'form_id'   => $form->id,
            'user_id'   => $form->is_anonymous ? null : $user->id,
            'tenant_id' => $user->tenant_id,
            'answers'   => $validated['answers'],
            'status'    => 'submitted',
        ]);

        return back()->with('success', "Form \"{$form->title}\" submitted successfully.");
    }

    // ─── Helpers ──────────────────────────────────────────────

    private function formatForm(Form $form): array
    {
        return [
            'id'              => $form->id,
            'title'           => $form->title,
            'description'     => $form->description,
            'type'            => $form->type,
            'status'          => $form->status,
            'is_required'     => $form->is_required,
            'allow_multiple'  => $form->allow_multiple,
            'is_anonymous'    => $form->is_anonymous,
            'published_at'    => $form->published_at?->toDateTimeString(),
            'creator'         => $form->creator ? ['id' => $form->creator->id, 'name' => $form->creator->name] : null,
            'fields'          => $form->fields->map(fn ($f) => $this->formatField($f))->toArray(),
            'assignees'       => $form->assignees ? $form->assignees->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
            ])->toArray() : [],
            'submissions_count' => $form->submissions_count ?? 0,
            'assignees_count'   => $form->assignees_count ?? 0,
            'created_at'      => $form->created_at->toDateTimeString(),
            'updated_at'      => $form->updated_at->toDateTimeString(),
        ];
    }

    private function formatField(FormField $field): array
    {
        return [
            'id'          => $field->id,
            'type'        => $field->type,
            'label'       => $field->label,
            'description' => $field->description,
            'is_required' => $field->is_required,
            'options'     => $field->options,
            'settings'    => $field->settings,
            'sort_order'  => $field->sort_order,
            'section'     => $field->section,
        ];
    }
}
