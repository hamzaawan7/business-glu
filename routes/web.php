<?php

use App\Http\Controllers\DirectoryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\KnowledgeBaseController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\UpdateController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RecognitionController;
use App\Http\Controllers\SchedulingController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SurveyController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TimeClockController;
use App\Http\Controllers\TimeOffController;
use App\Http\Controllers\OrgChartController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\TimelineController;
use App\Http\Controllers\EmployeeIdController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\ViewSwitchController;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

/*
|--------------------------------------------------------------------------
| Smart Dashboard Redirect
|--------------------------------------------------------------------------
| Redirects to the correct dashboard based on the user's role and
| active view preference stored in session.
*/
Route::middleware(['auth', 'verified'])->get('/dashboard', function () {
    $user = auth()->user();
    $activeView = session('active_view', $user->isAdmin() ? 'admin' : 'user');

    if ($activeView === 'admin' && $user->isAdmin()) {
        return redirect()->route('admin.dashboard');
    }

    return redirect()->route('user.home');
})->name('dashboard');

/*
|--------------------------------------------------------------------------
| View Switching
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->post('/switch-view', [ViewSwitchController::class, '__invoke'])->name('switch-view');

/*
|--------------------------------------------------------------------------
| Onboarding Routes
|--------------------------------------------------------------------------
| Users who haven't created a company yet are funneled here by
| the EnsureOnboarded middleware.
*/
Route::middleware('auth')->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'create'])->name('onboarding.create');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
});

/*
|--------------------------------------------------------------------------
| Admin Routes — /admin/*
|--------------------------------------------------------------------------
| Protected by the 'admin' middleware alias (EnsureAdminAccess).
| Full management dashboard with sidebar layout.
*/
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    // Dashboard
    Route::get('/dashboard', function () {
        $user = auth()->user();
        return Inertia::render('Dashboard', [
            'stats' => [
                'teamMembers' => User::where('tenant_id', $user->tenant_id)->count(),
                'clockedIn' => TimeEntry::where('tenant_id', $user->tenant_id)
                    ->where('status', 'active')
                    ->count(),
                'openTasks' => Task::where('tenant_id', $user->tenant_id)
                    ->whereNull('parent_id')
                    ->whereIn('status', ['open', 'in_progress'])
                    ->count(),
                'unreadMessages' => 0,
            ],
        ]);
    })->name('dashboard');

    // ── Operations Hub ──────────────────────────────────────
    Route::get('/time-clock', [TimeClockController::class, 'index'])->name('time-clock.index');
    Route::get('/scheduling', [SchedulingController::class, 'index'])->name('scheduling.index');
    Route::post('/scheduling', [SchedulingController::class, 'store'])->name('scheduling.store');
    Route::patch('/scheduling/{shift}', [SchedulingController::class, 'update'])->name('scheduling.update');
    Route::delete('/scheduling/{shift}', [SchedulingController::class, 'destroy'])->name('scheduling.destroy');
    Route::post('/scheduling/publish', [SchedulingController::class, 'publish'])->name('scheduling.publish');
    Route::post('/scheduling/duplicate', [SchedulingController::class, 'duplicate'])->name('scheduling.duplicate');
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::get('/forms', [FormController::class, 'index'])->name('forms.index');
    Route::post('/forms', [FormController::class, 'store'])->name('forms.store');
    Route::patch('/forms/{form}', [FormController::class, 'update'])->name('forms.update');
    Route::delete('/forms/{form}', [FormController::class, 'destroy'])->name('forms.destroy');
    Route::post('/forms/{form}/publish', [FormController::class, 'publish'])->name('forms.publish');
    Route::post('/forms/{form}/archive', [FormController::class, 'archive'])->name('forms.archive');
    Route::post('/forms/{form}/assign', [FormController::class, 'assign'])->name('forms.assign');
    Route::get('/forms/{form}/submissions', [FormController::class, 'submissions'])->name('forms.submissions');
    Route::patch('/forms/submissions/{submission}/review', [FormController::class, 'reviewSubmission'])->name('forms.review-submission');

    // ── Communication Hub ───────────────────────────────────
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/updates', [UpdateController::class, 'index'])->name('updates.index');
    Route::post('/updates', [UpdateController::class, 'store'])->name('updates.store');
    Route::patch('/updates/{update}', [UpdateController::class, 'update'])->name('updates.update');
    Route::delete('/updates/{update}', [UpdateController::class, 'destroy'])->name('updates.destroy');
    Route::post('/updates/{update}/publish', [UpdateController::class, 'publish'])->name('updates.publish');
    Route::post('/updates/{update}/archive', [UpdateController::class, 'archive'])->name('updates.archive');
    Route::post('/updates/{update}/pin', [UpdateController::class, 'togglePin'])->name('updates.toggle-pin');
    Route::get('/updates/{update}/analytics', [UpdateController::class, 'analytics'])->name('updates.analytics');
    Route::post('/updates/{update}/save-template', [UpdateController::class, 'saveAsTemplate'])->name('updates.save-as-template');
    Route::post('/templates', [UpdateController::class, 'storeTemplate'])->name('templates.store');
    Route::delete('/templates/{template}', [UpdateController::class, 'destroyTemplate'])->name('templates.destroy');
    Route::get('/directory', [DirectoryController::class, 'index'])->name('directory.index');
    Route::patch('/directory/{member}', [DirectoryController::class, 'updateProfile'])->name('directory.update-profile');
    Route::post('/directory/bulk-department', [DirectoryController::class, 'bulkUpdateDepartment'])->name('directory.bulk-department');
    Route::get('/directory/{user}/training', [CourseController::class, 'userTrainingOverview'])->name('directory.user-training');
    Route::get('/knowledge-base', [KnowledgeBaseController::class, 'index'])->name('kb.index');
    Route::post('/knowledge-base/categories', [KnowledgeBaseController::class, 'storeCategory'])->name('kb.store-category');
    Route::patch('/knowledge-base/categories/{category}', [KnowledgeBaseController::class, 'updateCategory'])->name('kb.update-category');
    Route::delete('/knowledge-base/categories/{category}', [KnowledgeBaseController::class, 'destroyCategory'])->name('kb.destroy-category');
    Route::post('/knowledge-base/articles', [KnowledgeBaseController::class, 'storeArticle'])->name('kb.store-article');
    Route::patch('/knowledge-base/articles/{article}', [KnowledgeBaseController::class, 'updateArticle'])->name('kb.update-article');
    Route::delete('/knowledge-base/articles/{article}', [KnowledgeBaseController::class, 'destroyArticle'])->name('kb.destroy-article');
    Route::post('/knowledge-base/articles/{article}/publish', [KnowledgeBaseController::class, 'publishArticle'])->name('kb.publish-article');
    Route::post('/knowledge-base/articles/{article}/archive', [KnowledgeBaseController::class, 'archiveArticle'])->name('kb.archive-article');
    Route::get('/surveys', [SurveyController::class, 'index'])->name('surveys.index');
    Route::post('/surveys', [SurveyController::class, 'store'])->name('surveys.store');
    Route::patch('/surveys/{survey}', [SurveyController::class, 'update'])->name('surveys.update');
    Route::delete('/surveys/{survey}', [SurveyController::class, 'destroy'])->name('surveys.destroy');
    Route::post('/surveys/{survey}/publish', [SurveyController::class, 'publish'])->name('surveys.publish');
    Route::post('/surveys/{survey}/close', [SurveyController::class, 'close'])->name('surveys.close');
    Route::get('/surveys/{survey}/results', [SurveyController::class, 'results'])->name('surveys.results');
    Route::get('/events', [EventController::class, 'index'])->name('events.index');
    Route::post('/events', [EventController::class, 'store'])->name('events.store');
    Route::patch('/events/{event}', [EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');
    Route::post('/events/{event}/publish', [EventController::class, 'publish'])->name('events.publish');
    Route::post('/events/{event}/cancel', [EventController::class, 'cancel'])->name('events.cancel');
    Route::get('/help-desk', [TicketController::class, 'index'])->name('help-desk.index');
    Route::get('/help-desk/tickets/{ticket}', [TicketController::class, 'show'])->name('help-desk.show');
    Route::post('/help-desk', [TicketController::class, 'store'])->name('help-desk.store');
    Route::patch('/help-desk/{ticket}', [TicketController::class, 'update'])->name('help-desk.update');
    Route::delete('/help-desk/{ticket}', [TicketController::class, 'destroy'])->name('help-desk.destroy');
    Route::post('/help-desk/{ticket}/reply', [TicketController::class, 'reply'])->name('help-desk.reply');
    Route::post('/help-desk/categories', [TicketController::class, 'storeCategory'])->name('help-desk.store-category');
    Route::patch('/help-desk/categories/{category}', [TicketController::class, 'updateCategory'])->name('help-desk.update-category');
    Route::delete('/help-desk/categories/{category}', [TicketController::class, 'destroyCategory'])->name('help-desk.destroy-category');

    // ── HR & People Hub ─────────────────────────────────────
    Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::patch('/courses/{course}', [CourseController::class, 'update'])->name('courses.update');
    Route::delete('/courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');
    Route::post('/courses/{course}/publish', [CourseController::class, 'publish'])->name('courses.publish');
    Route::post('/courses/{course}/archive', [CourseController::class, 'archive'])->name('courses.archive');
    Route::get('/courses/{course}/builder', [CourseController::class, 'builder'])->name('courses.builder');
    Route::post('/courses/{course}/sections', [CourseController::class, 'storeSection'])->name('courses.store-section');
    Route::patch('/courses/sections/{section}', [CourseController::class, 'updateSection'])->name('courses.update-section');
    Route::delete('/courses/sections/{section}', [CourseController::class, 'destroySection'])->name('courses.destroy-section');
    Route::post('/courses/sections/{section}/objects', [CourseController::class, 'storeObject'])->name('courses.store-object');
    Route::patch('/courses/objects/{object}', [CourseController::class, 'updateObject'])->name('courses.update-object');
    Route::delete('/courses/objects/{object}', [CourseController::class, 'destroyObject'])->name('courses.destroy-object');
    Route::post('/courses/{course}/reorder-sections', [CourseController::class, 'reorderSections'])->name('courses.reorder-sections');
    Route::post('/courses/sections/{section}/reorder-objects', [CourseController::class, 'reorderObjects'])->name('courses.reorder-objects');
    Route::post('/courses/upload', [CourseController::class, 'upload'])->name('courses.upload');
    Route::post('/courses/{course}/assign', [CourseController::class, 'assign'])->name('courses.assign');
    Route::delete('/courses/assignments/{assignment}', [CourseController::class, 'removeAssignment'])->name('courses.remove-assignment');
    Route::post('/courses/categories', [CourseController::class, 'storeCategory'])->name('courses.store-category');
    Route::delete('/courses/categories/{category}', [CourseController::class, 'destroyCategory'])->name('courses.destroy-category');
    Route::get('/courses/templates', [CourseController::class, 'templates'])->name('courses.templates');
    Route::post('/courses/from-template', [CourseController::class, 'createFromTemplate'])->name('courses.from-template');
    Route::post('/courses/{course}/duplicate', [CourseController::class, 'duplicateCourse'])->name('courses.duplicate');
    Route::post('/courses/{course}/save-as-template', [CourseController::class, 'saveAsTemplate'])->name('courses.save-as-template');
    Route::post('/courses/{course}/segment-assign', [CourseController::class, 'segmentAssign'])->name('courses.segment-assign');
    Route::delete('/courses/audience-rules/{rule}', [CourseController::class, 'removeAudienceRule'])->name('courses.remove-audience-rule');
    Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::patch('/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::post('/documents/categories', [DocumentController::class, 'storeCategory'])->name('documents.store-category');
    Route::delete('/documents/categories/{category}', [DocumentController::class, 'destroyCategory'])->name('documents.destroy-category');
    Route::get('/time-off', [TimeOffController::class, 'index'])->name('time-off.index');
    Route::post('/time-off/{leaveRequest}/review', [TimeOffController::class, 'review'])->name('time-off.review');
    Route::post('/time-off/policies', [TimeOffController::class, 'storePolicy'])->name('time-off.store-policy');
    Route::patch('/time-off/policies/{policy}', [TimeOffController::class, 'updatePolicy'])->name('time-off.update-policy');
    Route::delete('/time-off/policies/{policy}', [TimeOffController::class, 'destroyPolicy'])->name('time-off.destroy-policy');
    Route::get('/recognition', [RecognitionController::class, 'index'])->name('recognition.index');
    Route::post('/recognition', [RecognitionController::class, 'store'])->name('recognition.store');
    Route::delete('/recognition/{recognition}', [RecognitionController::class, 'destroy'])->name('recognition.destroy');
    Route::post('/recognition/badges', [RecognitionController::class, 'storeBadge'])->name('recognition.store-badge');
    Route::delete('/recognition/badges/{badge}', [RecognitionController::class, 'destroyBadge'])->name('recognition.destroy-badge');
    Route::get('/quizzes', [QuizController::class, 'index'])->name('quizzes.index');
    Route::post('/quizzes', [QuizController::class, 'store'])->name('quizzes.store');
    Route::put('/quizzes/{quiz}', [QuizController::class, 'update'])->name('quizzes.update');
    Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy'])->name('quizzes.destroy');
    Route::post('/quizzes/{quiz}/publish', [QuizController::class, 'publish'])->name('quizzes.publish');
    Route::post('/quizzes/{quiz}/archive', [QuizController::class, 'archive'])->name('quizzes.archive');
    Route::get('/quizzes/{quiz}/builder', [QuizController::class, 'builder'])->name('quizzes.builder');
    Route::post('/quizzes/{quiz}/questions', [QuizController::class, 'storeQuestion'])->name('quizzes.questions.store');
    Route::delete('/quizzes/{quiz}/questions/{question}', [QuizController::class, 'destroyQuestion'])->name('quizzes.questions.destroy');
    Route::post('/quizzes/{quiz}/assign', [QuizController::class, 'assign'])->name('quizzes.assign');
    Route::delete('/quizzes/assignments/{assignment}', [QuizController::class, 'removeAssignment'])->name('quizzes.remove-assignment');
    Route::get('/timeline', [TimelineController::class, 'index'])->name('timeline.index');
    Route::post('/timeline', [TimelineController::class, 'store'])->name('timeline.store');
    Route::patch('/timeline/{event}', [TimelineController::class, 'update'])->name('timeline.update');
    Route::delete('/timeline/{event}', [TimelineController::class, 'destroy'])->name('timeline.destroy');
    Route::get('/timeline/{event}/download', [TimelineController::class, 'download'])->name('timeline.download');
    Route::get('/org-chart', [OrgChartController::class, 'index'])->name('org-chart.index');
    Route::get('/employee-ids', [EmployeeIdController::class, 'index'])->name('employee-ids.index');
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    Route::get('/activity-log', [ActivityLogController::class, 'index'])->name('activity-log.index');

    // ── Admin ───────────────────────────────────────────────
    Route::get('/team', [TeamController::class, 'index'])->name('team.index');
    Route::post('/team/invite', [TeamController::class, 'invite'])->name('team.invite');
    Route::patch('/team/{member}/role', [TeamController::class, 'updateRole'])->name('team.update-role');
    Route::delete('/team/{member}', [TeamController::class, 'remove'])->name('team.remove');
    Route::delete('/team/invitation/{invitation}', [TeamController::class, 'cancelInvitation'])->name('team.cancel-invitation');

    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::patch('/settings/company', [SettingsController::class, 'updateCompany'])->name('settings.update-company');
    Route::patch('/settings/module', [SettingsController::class, 'toggleModule'])->name('settings.toggle-module');
});

/*
|--------------------------------------------------------------------------
| User / Employee Routes — /app/*
|--------------------------------------------------------------------------
| Simplified mobile-first view for all authenticated users.
*/
Route::middleware(['auth', 'verified'])->prefix('app')->name('user.')->group(function () {
    Route::get('/', [FeedController::class, 'home'])->name('home');
    Route::get('/feed', [FeedController::class, 'index'])->name('feed');
    Route::get('/time-clock', [TimeClockController::class, 'myTimeClock'])->name('time-clock');
    Route::get('/schedule', [SchedulingController::class, 'mySchedule'])->name('schedule');
    Route::get('/chat', [ChatController::class, 'userChat'])->name('chat');
    Route::get('/tasks', [TaskController::class, 'myTasks'])->name('tasks');
    Route::get('/more', fn () => Inertia::render('User/More'))->name('more');
    Route::get('/forms', [FormController::class, 'myForms'])->name('forms');
    Route::get('/updates', [UpdateController::class, 'feed'])->name('updates');
    Route::get('/time-off', [TimeOffController::class, 'browse'])->name('time-off');
    Route::get('/surveys', [SurveyController::class, 'browse'])->name('surveys');
    Route::get('/events', [EventController::class, 'browse'])->name('events');
    Route::get('/help-desk', [TicketController::class, 'browse'])->name('help-desk');
    Route::get('/courses', [CourseController::class, 'browse'])->name('courses');
    Route::get('/documents', [DocumentController::class, 'browse'])->name('documents');
    Route::get('/recognition', [RecognitionController::class, 'browse'])->name('recognition');
    Route::get('/quizzes', [QuizController::class, 'browse'])->name('quizzes');
    Route::get('/timeline', [TimelineController::class, 'myTimeline'])->name('timeline');
    Route::get('/org-chart', [OrgChartController::class, 'browse'])->name('org-chart');
    Route::get('/employee-id', [EmployeeIdController::class, 'myId'])->name('employee-id');
    Route::get('/directory', [DirectoryController::class, 'browse'])->name('directory');
    Route::get('/knowledge-base', [KnowledgeBaseController::class, 'browse'])->name('knowledge-base');
    Route::get('/profile', fn () => Inertia::render('User/UserProfile', [
        'mustVerifyEmail' => ! auth()->user()->hasVerifiedEmail(),
        'status' => session('status'),
    ]))->name('profile');
});

/*
|--------------------------------------------------------------------------
| Time Clock Actions (shared — used by both admin and user views)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('time-clock')->name('time-clock.')->group(function () {
    Route::post('/clock-in', [TimeClockController::class, 'clockIn'])->name('clock-in');
    Route::post('/clock-out', [TimeClockController::class, 'clockOut'])->name('clock-out');
    Route::post('/break/start', [TimeClockController::class, 'startBreak'])->name('break-start');
    Route::post('/break/end', [TimeClockController::class, 'endBreak'])->name('break-end');
});

/*
|--------------------------------------------------------------------------
| Scheduling Actions (shared — claim open shifts)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('scheduling')->name('scheduling.')->group(function () {
    Route::post('/{shift}/claim', [SchedulingController::class, 'claim'])->name('claim');
});

/*
|--------------------------------------------------------------------------
| Chat Actions (shared — used by both admin and user views)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('chat')->name('chat.')->group(function () {
    Route::post('/', [ChatController::class, 'store'])->name('store');
    Route::get('/{conversation}/messages', [ChatController::class, 'messages'])->name('messages');
    Route::post('/{conversation}/messages', [ChatController::class, 'sendMessage'])->name('send-message');
    Route::patch('/messages/{message}', [ChatController::class, 'editMessage'])->name('edit-message');
    Route::delete('/messages/{message}', [ChatController::class, 'deleteMessage'])->name('delete-message');
});

/*
|--------------------------------------------------------------------------
| Task Actions (shared — used by both admin and user views)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('tasks')->name('tasks.')->group(function () {
    Route::patch('/{task}/status', [TaskController::class, 'toggleStatus'])->name('toggle-status');
    Route::post('/bulk-status', [TaskController::class, 'bulkStatus'])->name('bulk-status');
});

/*
|--------------------------------------------------------------------------
| Form Actions (shared — submit forms from any view)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('forms')->name('forms.')->group(function () {
    Route::post('/{form}/submit', [FormController::class, 'submit'])->name('submit');
});

/*
|--------------------------------------------------------------------------
| Update Actions (shared — comments, reactions, reads from any view)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('updates')->name('updates.')->group(function () {
    Route::post('/{update}/comment', [UpdateController::class, 'addComment'])->name('comment');
    Route::delete('/comments/{comment}', [UpdateController::class, 'deleteComment'])->name('delete-comment');
    Route::post('/{update}/react', [UpdateController::class, 'toggleReaction'])->name('react');
    Route::post('/{update}/read', [UpdateController::class, 'markRead'])->name('read');
});

/*
|--------------------------------------------------------------------------
| Knowledge Base Actions (shared — article view tracking)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('kb')->name('kb.')->group(function () {
    Route::post('/articles/{article}/view', [KnowledgeBaseController::class, 'markViewed'])->name('mark-viewed');
});

/*
|--------------------------------------------------------------------------
| Survey Actions (shared — view & submit surveys from any view)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('surveys')->name('surveys.')->group(function () {
    Route::get('/{survey}', [SurveyController::class, 'show'])->name('show');
    Route::post('/{survey}/submit', [SurveyController::class, 'submit'])->name('submit');
});

/*
|--------------------------------------------------------------------------
| Event Actions (shared — RSVP from any view)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('events')->name('events.')->group(function () {
    Route::post('/{event}/rsvp', [EventController::class, 'rsvp'])->name('rsvp');
});

/*
|--------------------------------------------------------------------------
| Help Desk Actions (shared — submit & reply from user view)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('help-desk')->name('help-desk.')->group(function () {
    Route::post('/submit', [TicketController::class, 'store'])->name('submit');
    Route::get('/{ticket}', [TicketController::class, 'userShow'])->name('show');
    Route::post('/{ticket}/reply', [TicketController::class, 'userReply'])->name('reply');
});

/*
|--------------------------------------------------------------------------
| Course Actions (shared — user course detail & progress)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('courses')->name('courses.')->group(function () {
    Route::get('/{course}', [CourseController::class, 'userCourseDetail'])->name('detail');
    Route::post('/objects/{object}/complete', [CourseController::class, 'completeObject'])->name('complete-object');
    Route::get('/certificates/{certificate}/download', [CourseController::class, 'downloadCertificate'])->name('certificate-download');
});

/*
|--------------------------------------------------------------------------
| Document Actions (shared — download & user upload)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('documents')->name('documents.')->group(function () {
    Route::get('/{document}/download', [DocumentController::class, 'download'])->name('download');
    Route::post('/upload', [DocumentController::class, 'userUpload'])->name('user-upload');
});

/*
|--------------------------------------------------------------------------
| Time Off Actions (shared — submit & cancel from user view)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('time-off')->name('time-off.')->group(function () {
    Route::post('/submit', [TimeOffController::class, 'submit'])->name('submit');
    Route::post('/{leaveRequest}/cancel', [TimeOffController::class, 'cancel'])->name('cancel');
});

/*
|--------------------------------------------------------------------------
| Recognition Actions (shared — user peer-to-peer recognition)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('recognition')->name('recognition.')->group(function () {
    Route::post('/send', [RecognitionController::class, 'send'])->name('send');
});

/*
|--------------------------------------------------------------------------
| Quiz Actions (shared — take quiz & submit answers)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('quizzes')->name('quizzes.')->group(function () {
    Route::get('/{quiz}/take', [QuizController::class, 'take'])->name('take');
    Route::post('/{quiz}/submit', [QuizController::class, 'submitAttempt'])->name('submit');
});

/*
|--------------------------------------------------------------------------
| Timeline Actions (shared — file download)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('timeline')->name('timeline.')->group(function () {
    Route::get('/{event}/download', [TimelineController::class, 'download'])->name('download');
});

/*
|--------------------------------------------------------------------------
| Team Invitation Routes (public)
|--------------------------------------------------------------------------
| These are accessible without authentication — invited users
| may not have an account yet.
*/
Route::get('/invitation/{token}', [TeamController::class, 'showAcceptForm'])->name('invitation.show');
Route::post('/invitation/{token}/accept', [TeamController::class, 'acceptInvitation'])->name('invitation.accept');

/*
|--------------------------------------------------------------------------
| Profile Routes (shared)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
