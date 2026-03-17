<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAssignment;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuizController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  ADMIN — Quiz List
    // ─────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');

        $query = Quiz::where('tenant_id', $tenantId)
            ->withCount(['questions', 'assignments', 'attempts'])
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') $query->where('status', $status);

        $quizzes = $query->get();

        $stats = [
            'total'     => Quiz::where('tenant_id', $tenantId)->count(),
            'published' => Quiz::where('tenant_id', $tenantId)->where('status', 'published')->count(),
            'draft'     => Quiz::where('tenant_id', $tenantId)->where('status', 'draft')->count(),
            'attempts'  => QuizAttempt::where('tenant_id', $tenantId)->count(),
        ];

        return Inertia::render('HR/Quizzes', [
            'quizzes' => $quizzes,
            'filters' => ['status' => $status],
            'stats'   => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'title'                => 'required|string|max:255',
            'description'          => 'nullable|string|max:1000',
            'passing_score'        => 'required|integer|min:1|max:100',
            'max_attempts'         => 'nullable|integer|min:1',
            'randomize_questions'  => 'boolean',
            'show_score'           => 'boolean',
            'show_correct_answers' => 'boolean',
        ]);

        Quiz::create([
            'tenant_id'            => $user->tenant_id,
            'created_by'           => $user->id,
            'title'                => $data['title'],
            'description'          => $data['description'] ?? null,
            'passing_score'        => $data['passing_score'],
            'max_attempts'         => $data['max_attempts'] ?? null,
            'randomize_questions'  => $data['randomize_questions'] ?? false,
            'show_score'           => $data['show_score'] ?? true,
            'show_correct_answers' => $data['show_correct_answers'] ?? false,
        ]);

        return back()->with('flash', ['success' => 'Quiz created.']);
    }

    public function update(Request $request, Quiz $quiz): RedirectResponse
    {
        abort_unless($quiz->tenant_id === $request->user()->tenant_id, 403);

        $data = $request->validate([
            'title'                => 'sometimes|string|max:255',
            'description'          => 'nullable|string|max:1000',
            'passing_score'        => 'sometimes|integer|min:1|max:100',
            'max_attempts'         => 'nullable|integer|min:1',
            'randomize_questions'  => 'boolean',
            'show_score'           => 'boolean',
            'show_correct_answers' => 'boolean',
            'due_date'             => 'nullable|date',
        ]);

        $quiz->update($data);
        return back()->with('flash', ['success' => 'Quiz updated.']);
    }

    public function destroy(Request $request, Quiz $quiz): RedirectResponse
    {
        abort_unless($quiz->tenant_id === $request->user()->tenant_id, 403);
        $quiz->delete();
        return back()->with('flash', ['success' => 'Quiz deleted.']);
    }

    public function publish(Request $request, Quiz $quiz): RedirectResponse
    {
        abort_unless($quiz->tenant_id === $request->user()->tenant_id, 403);
        $quiz->update(['status' => 'published']);
        return back()->with('flash', ['success' => 'Quiz published.']);
    }

    public function archive(Request $request, Quiz $quiz): RedirectResponse
    {
        abort_unless($quiz->tenant_id === $request->user()->tenant_id, 403);
        $quiz->update(['status' => 'archived']);
        return back()->with('flash', ['success' => 'Quiz archived.']);
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN — Quiz Builder (questions + answers)
    // ─────────────────────────────────────────────────────────

    public function builder(Request $request, Quiz $quiz): Response
    {
        abort_unless($quiz->tenant_id === $request->user()->tenant_id, 403);

        $quiz->load(['questions.answers']);
        $employees  = User::where('tenant_id', $request->user()->tenant_id)->get(['id', 'name', 'email']);
        $assignments = QuizAssignment::where('quiz_id', $quiz->id)->with('user:id,name,email')->get();

        // Stats
        $attempts = QuizAttempt::where('quiz_id', $quiz->id)->get();
        $quizStats = [
            'total_attempts'  => $attempts->count(),
            'avg_score'       => $attempts->count() ? round($attempts->avg('score')) : 0,
            'pass_rate'       => $attempts->count() ? round(($attempts->where('result', 'pass')->count() / $attempts->count()) * 100) : 0,
            'unique_takers'   => $attempts->unique('user_id')->count(),
        ];

        return Inertia::render('HR/QuizBuilder', [
            'quiz'        => $quiz,
            'employees'   => $employees,
            'assignments' => $assignments,
            'quizStats'   => $quizStats,
        ]);
    }

    public function storeQuestion(Request $request, Quiz $quiz): RedirectResponse
    {
        abort_unless($quiz->tenant_id === $request->user()->tenant_id, 403);

        $data = $request->validate([
            'question' => 'required|string|max:1000',
            'answers'  => 'required|array|min:2',
            'answers.*.answer'     => 'required|string|max:500',
            'answers.*.is_correct' => 'required|boolean',
        ]);

        $maxOrder = $quiz->questions()->max('sort_order') ?? 0;
        $question = QuizQuestion::create([
            'quiz_id'    => $quiz->id,
            'question'   => $data['question'],
            'sort_order' => $maxOrder + 1,
        ]);

        foreach ($data['answers'] as $i => $ans) {
            QuizAnswer::create([
                'quiz_question_id' => $question->id,
                'answer'           => $ans['answer'],
                'is_correct'       => $ans['is_correct'],
                'sort_order'       => $i,
            ]);
        }

        return back()->with('flash', ['success' => 'Question added.']);
    }

    public function destroyQuestion(Request $request, QuizQuestion $question): RedirectResponse
    {
        abort_unless($question->quiz->tenant_id === $request->user()->tenant_id, 403);
        $question->delete();
        return back()->with('flash', ['success' => 'Question deleted.']);
    }

    // ─────────────────────────────────────────────────────────
    //  Assignment
    // ─────────────────────────────────────────────────────────

    public function assign(Request $request, Quiz $quiz): RedirectResponse
    {
        abort_unless($quiz->tenant_id === $request->user()->tenant_id, 403);

        $data = $request->validate([
            'user_ids'   => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        foreach ($data['user_ids'] as $uid) {
            QuizAssignment::firstOrCreate([
                'quiz_id' => $quiz->id,
                'user_id' => $uid,
            ], ['tenant_id' => $quiz->tenant_id]);
        }

        return back()->with('flash', ['success' => 'Quiz assigned.']);
    }

    public function removeAssignment(Request $request, QuizAssignment $assignment): RedirectResponse
    {
        abort_unless($assignment->tenant_id === $request->user()->tenant_id, 403);
        $assignment->delete();
        return back()->with('flash', ['success' => 'Assignment removed.']);
    }

    // ─────────────────────────────────────────────────────────
    //  USER — Browse & Take Quizzes
    // ─────────────────────────────────────────────────────────

    public function browse(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        // Quizzes assigned to me
        $assignedIds = QuizAssignment::where('user_id', $user->id)->pluck('quiz_id');
        $quizzes = Quiz::where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->whereIn('id', $assignedIds)
            ->withCount('questions')
            ->get();

        // My attempts
        $myAttempts = QuizAttempt::where('user_id', $user->id)->get()->groupBy('quiz_id');

        return Inertia::render('User/UserQuizzes', [
            'quizzes'    => $quizzes,
            'myAttempts' => $myAttempts,
        ]);
    }

    public function take(Request $request, Quiz $quiz): Response
    {
        $user = $request->user();
        abort_unless($quiz->tenant_id === $user->tenant_id, 403);
        abort_unless($quiz->status === 'published', 404);

        // Check attempt limits
        $attemptCount = QuizAttempt::where('quiz_id', $quiz->id)->where('user_id', $user->id)->count();
        if ($quiz->max_attempts && $attemptCount >= $quiz->max_attempts) {
            return redirect()->route('user.quizzes')->with('flash', ['error' => 'Max attempts reached.']);
        }

        // Check if already passed (one-time pass rule)
        $hasPassed = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('result', 'pass')
            ->exists();

        $quiz->load(['questions.answers']);

        // If randomize, shuffle questions
        if ($quiz->randomize_questions) {
            $quiz->setRelation('questions', $quiz->questions->shuffle());
        }

        return Inertia::render('User/TakeQuiz', [
            'quiz'        => $quiz,
            'hasPassed'   => $hasPassed,
            'attemptCount' => $attemptCount,
        ]);
    }

    public function submitAttempt(Request $request, Quiz $quiz): RedirectResponse
    {
        $user = $request->user();
        abort_unless($quiz->tenant_id === $user->tenant_id, 403);

        $data = $request->validate([
            'answers'   => 'required|array',
            'answers.*' => 'required|integer',
        ]);

        $quiz->load(['questions.answers']);
        $totalQuestions = $quiz->questions->count();
        $correctCount  = 0;

        foreach ($quiz->questions as $q) {
            $chosenId = $data['answers'][$q->id] ?? null;
            if ($chosenId) {
                $correctAnswer = $q->answers->firstWhere('is_correct', true);
                if ($correctAnswer && $correctAnswer->id == $chosenId) {
                    $correctCount++;
                }
            }
        }

        $score  = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 100) : 0;
        $result = $score >= $quiz->passing_score ? 'pass' : 'fail';

        QuizAttempt::create([
            'tenant_id'       => $user->tenant_id,
            'quiz_id'         => $quiz->id,
            'user_id'         => $user->id,
            'score'           => $score,
            'correct_count'   => $correctCount,
            'total_questions' => $totalQuestions,
            'result'          => $result,
            'answers'         => $data['answers'],
        ]);

        return back()->with('flash', [
            'success' => $result === 'pass'
                ? "Congratulations! You passed with {$score}%!"
                : "You scored {$score}%. You need {$quiz->passing_score}% to pass.",
        ]);
    }
}
