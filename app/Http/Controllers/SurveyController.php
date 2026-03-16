<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SurveyController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  ADMIN — Full management dashboard
    // ─────────────────────────────────────────────────────────

    /**
     * Admin view: all surveys for the tenant.
     */
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');
        $type     = $request->get('type', 'all');

        $query = Survey::where('tenant_id', $tenantId)
            ->with(['creator:id,name,email', 'questions' => fn ($q) => $q->orderBy('sort_order')])
            ->withCount(['questions', 'responses'])
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($type !== 'all') {
            $query->where('type', $type);
        }

        $surveys = $query->get();

        $allSurveys = Survey::where('tenant_id', $tenantId);
        $stats = [
            'total'    => (clone $allSurveys)->count(),
            'active'   => (clone $allSurveys)->where('status', 'active')->count(),
            'draft'    => (clone $allSurveys)->where('status', 'draft')->count(),
            'closed'   => (clone $allSurveys)->where('status', 'closed')->count(),
        ];

        $teamCount = User::where('tenant_id', $tenantId)->count();

        return Inertia::render('Communication/Surveys', [
            'surveys'   => $surveys,
            'filters'   => ['status' => $status, 'type' => $type],
            'stats'     => $stats,
            'teamCount' => $teamCount,
        ]);
    }

    /**
     * Create a new survey.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string|max:2000',
            'type'           => 'required|in:survey,poll',
            'is_anonymous'   => 'boolean',
            'allow_multiple' => 'boolean',
            'closes_at'      => 'nullable|date',
            'questions'      => 'required|array|min:1',
            'questions.*.type'        => 'required|in:text,textarea,single_choice,multiple_choice,rating,yes_no,nps',
            'questions.*.question'    => 'required|string|max:1000',
            'questions.*.description' => 'nullable|string|max:500',
            'questions.*.is_required' => 'boolean',
            'questions.*.options'     => 'nullable|array',
            'questions.*.settings'    => 'nullable|array',
        ]);

        $survey = Survey::create([
            'tenant_id'      => $user->tenant_id,
            'created_by'     => $user->id,
            'title'          => $data['title'],
            'description'    => $data['description'] ?? null,
            'type'           => $data['type'],
            'is_anonymous'   => $data['is_anonymous'] ?? false,
            'allow_multiple' => $data['allow_multiple'] ?? false,
            'closes_at'      => $data['closes_at'] ?? null,
        ]);

        foreach ($data['questions'] as $index => $q) {
            $survey->questions()->create([
                'type'        => $q['type'],
                'question'    => $q['question'],
                'description' => $q['description'] ?? null,
                'is_required' => $q['is_required'] ?? true,
                'options'     => $q['options'] ?? null,
                'settings'    => $q['settings'] ?? null,
                'sort_order'  => $index,
            ]);
        }

        return back()->with('flash', ['success' => 'Survey created.']);
    }

    /**
     * Update survey details and questions.
     */
    public function update(Request $request, Survey $survey): RedirectResponse
    {
        $this->authorizeTenant($request, $survey);

        $data = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string|max:2000',
            'type'           => 'required|in:survey,poll',
            'is_anonymous'   => 'boolean',
            'allow_multiple' => 'boolean',
            'closes_at'      => 'nullable|date',
            'questions'      => 'required|array|min:1',
            'questions.*.id'          => 'nullable|integer',
            'questions.*.type'        => 'required|in:text,textarea,single_choice,multiple_choice,rating,yes_no,nps',
            'questions.*.question'    => 'required|string|max:1000',
            'questions.*.description' => 'nullable|string|max:500',
            'questions.*.is_required' => 'boolean',
            'questions.*.options'     => 'nullable|array',
            'questions.*.settings'    => 'nullable|array',
        ]);

        $survey->update([
            'title'          => $data['title'],
            'description'    => $data['description'] ?? null,
            'type'           => $data['type'],
            'is_anonymous'   => $data['is_anonymous'] ?? false,
            'allow_multiple' => $data['allow_multiple'] ?? false,
            'closes_at'      => $data['closes_at'] ?? null,
        ]);

        // Sync questions: update existing, create new, delete removed
        $existingIds = $survey->questions()->pluck('id')->toArray();
        $incomingIds = [];

        foreach ($data['questions'] as $index => $q) {
            if (!empty($q['id']) && in_array($q['id'], $existingIds)) {
                // Update existing
                SurveyQuestion::where('id', $q['id'])->update([
                    'type'        => $q['type'],
                    'question'    => $q['question'],
                    'description' => $q['description'] ?? null,
                    'is_required' => $q['is_required'] ?? true,
                    'options'     => $q['options'] ?? null,
                    'settings'    => $q['settings'] ?? null,
                    'sort_order'  => $index,
                ]);
                $incomingIds[] = $q['id'];
            } else {
                // Create new
                $newQ = $survey->questions()->create([
                    'type'        => $q['type'],
                    'question'    => $q['question'],
                    'description' => $q['description'] ?? null,
                    'is_required' => $q['is_required'] ?? true,
                    'options'     => $q['options'] ?? null,
                    'settings'    => $q['settings'] ?? null,
                    'sort_order'  => $index,
                ]);
                $incomingIds[] = $newQ->id;
            }
        }

        // Delete removed questions
        SurveyQuestion::where('survey_id', $survey->id)
            ->whereNotIn('id', $incomingIds)
            ->delete();

        return back()->with('flash', ['success' => 'Survey updated.']);
    }

    /**
     * Delete a survey.
     */
    public function destroy(Request $request, Survey $survey): RedirectResponse
    {
        $this->authorizeTenant($request, $survey);
        $survey->delete();

        return back()->with('flash', ['success' => 'Survey deleted.']);
    }

    /**
     * Publish a survey (set status to active).
     */
    public function publish(Request $request, Survey $survey): RedirectResponse
    {
        $this->authorizeTenant($request, $survey);

        $survey->update([
            'status'       => 'active',
            'published_at' => now(),
        ]);

        return back()->with('flash', ['success' => 'Survey published.']);
    }

    /**
     * Close a survey (stop accepting responses).
     */
    public function close(Request $request, Survey $survey): RedirectResponse
    {
        $this->authorizeTenant($request, $survey);

        $survey->update([
            'status'    => 'closed',
            'closes_at' => now(),
        ]);

        return back()->with('flash', ['success' => 'Survey closed.']);
    }

    /**
     * View results for a specific survey.
     */
    public function results(Request $request, Survey $survey): Response
    {
        $this->authorizeTenant($request, $survey);

        $survey->load([
            'questions' => fn ($q) => $q->orderBy('sort_order'),
            'responses.answers',
            'responses.user:id,name,email',
        ]);

        // Build per-question analytics
        $analytics = [];
        foreach ($survey->questions as $question) {
            $questionAnswers = SurveyAnswer::where('question_id', $question->id)->pluck('value');

            $breakdown = [];
            if (in_array($question->type, ['single_choice', 'multiple_choice', 'yes_no'])) {
                $options = $question->type === 'yes_no' ? ['Yes', 'No'] : ($question->options ?? []);
                foreach ($options as $opt) {
                    $count = $questionAnswers->filter(function ($val) use ($opt) {
                        $decoded = json_decode($val, true);
                        if (is_array($decoded)) {
                            return in_array($opt, $decoded);
                        }
                        return $val === $opt;
                    })->count();
                    $breakdown[] = ['label' => $opt, 'count' => $count];
                }
            } elseif (in_array($question->type, ['rating', 'nps'])) {
                $numericValues = $questionAnswers->map(fn ($v) => (float) $v)->filter(fn ($v) => $v > 0);
                $breakdown = [
                    'average' => $numericValues->count() > 0 ? round($numericValues->avg(), 1) : 0,
                    'min'     => $numericValues->min() ?? 0,
                    'max'     => $numericValues->max() ?? 0,
                    'count'   => $numericValues->count(),
                ];
            }

            $analytics[] = [
                'question_id'   => $question->id,
                'question'      => $question->question,
                'type'          => $question->type,
                'total_answers' => $questionAnswers->count(),
                'breakdown'     => $breakdown,
            ];
        }

        return Inertia::render('Communication/SurveyResults', [
            'survey'    => $survey,
            'analytics' => $analytics,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  USER — Browse & respond to surveys
    // ─────────────────────────────────────────────────────────

    /**
     * User view: list available surveys.
     */
    public function browse(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $surveys = Survey::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->withCount(['questions', 'responses'])
            ->with(['creator:id,name'])
            ->orderBy('published_at', 'desc')
            ->get()
            ->map(function ($survey) use ($user) {
                $survey->has_responded = SurveyResponse::where('survey_id', $survey->id)
                    ->where('user_id', $user->id)
                    ->exists();
                return $survey;
            });

        // Also include closed surveys the user responded to
        $completedSurveys = Survey::where('tenant_id', $tenantId)
            ->where('status', 'closed')
            ->whereHas('responses', fn ($q) => $q->where('user_id', $user->id))
            ->withCount(['questions', 'responses'])
            ->with(['creator:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($survey) {
                $survey->has_responded = true;
                return $survey;
            });

        return Inertia::render('User/UserSurveys', [
            'activeSurveys'    => $surveys,
            'completedSurveys' => $completedSurveys,
        ]);
    }

    /**
     * Show a single survey for the user to take.
     */
    public function show(Request $request, Survey $survey): Response
    {
        $this->authorizeTenant($request, $survey);
        $user = $request->user();

        $survey->load(['questions' => fn ($q) => $q->orderBy('sort_order')]);

        $existingResponse = SurveyResponse::where('survey_id', $survey->id)
            ->where('user_id', $user->id)
            ->with('answers')
            ->first();

        return Inertia::render('User/UserSurveyTake', [
            'survey'           => $survey,
            'existingResponse' => $existingResponse,
        ]);
    }

    /**
     * Submit a survey response.
     */
    public function submit(Request $request, Survey $survey): RedirectResponse
    {
        $this->authorizeTenant($request, $survey);
        $user = $request->user();

        // Check if survey is active
        if (!$survey->isActive()) {
            return back()->with('flash', ['error' => 'This survey is no longer accepting responses.']);
        }

        // Check if already responded (unless multiple allowed)
        if (!$survey->allow_multiple) {
            $exists = SurveyResponse::where('survey_id', $survey->id)
                ->where('user_id', $user->id)
                ->exists();
            if ($exists) {
                return back()->with('flash', ['error' => 'You have already responded to this survey.']);
            }
        }

        $data = $request->validate([
            'answers'              => 'required|array',
            'answers.*.question_id' => 'required|integer|exists:survey_questions,id',
            'answers.*.value'       => 'nullable|string',
        ]);

        $response = SurveyResponse::create([
            'survey_id' => $survey->id,
            'user_id'   => $survey->is_anonymous ? null : $user->id,
            'tenant_id' => $user->tenant_id,
        ]);

        foreach ($data['answers'] as $answer) {
            $response->answers()->create([
                'question_id' => $answer['question_id'],
                'value'       => $answer['value'] ?? null,
            ]);
        }

        return redirect()->route('user.surveys')
            ->with('flash', ['success' => 'Response submitted.']);
    }

    // ─────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────

    private function authorizeTenant(Request $request, Survey $survey): void
    {
        abort_unless($survey->tenant_id === $request->user()->tenant_id, 403);
    }
}
