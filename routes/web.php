<?php

use App\Http\Controllers\FormController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SchedulingController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TimeClockController;
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
    Route::get('/chat', fn () => Inertia::render('Communication/Chat'))->name('chat.index');
    Route::get('/updates', fn () => Inertia::render('Communication/Updates'))->name('updates.index');
    Route::get('/directory', fn () => Inertia::render('Communication/Directory'))->name('directory.index');
    Route::get('/knowledge-base', fn () => Inertia::render('Communication/KnowledgeBase'))->name('knowledge-base.index');
    Route::get('/surveys', fn () => Inertia::render('Communication/Surveys'))->name('surveys.index');
    Route::get('/events', fn () => Inertia::render('Communication/Events'))->name('events.index');
    Route::get('/help-desk', fn () => Inertia::render('Communication/HelpDesk'))->name('help-desk.index');

    // ── HR & People Hub ─────────────────────────────────────
    Route::get('/courses', fn () => Inertia::render('HR/Courses'))->name('courses.index');
    Route::get('/documents', fn () => Inertia::render('HR/Documents'))->name('documents.index');
    Route::get('/time-off', fn () => Inertia::render('HR/TimeOff'))->name('time-off.index');
    Route::get('/recognition', fn () => Inertia::render('HR/Recognition'))->name('recognition.index');

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
    Route::get('/', fn () => Inertia::render('User/Home'))->name('home');
    Route::get('/time-clock', [TimeClockController::class, 'myTimeClock'])->name('time-clock');
    Route::get('/schedule', [SchedulingController::class, 'mySchedule'])->name('schedule');
    Route::get('/chat', fn () => Inertia::render('User/MyChat'))->name('chat');
    Route::get('/tasks', [TaskController::class, 'myTasks'])->name('tasks');
    Route::get('/more', fn () => Inertia::render('User/More'))->name('more');
    Route::get('/forms', [FormController::class, 'myForms'])->name('forms');
    Route::get('/updates', fn () => Inertia::render('User/UserUpdates'))->name('updates');
    Route::get('/time-off', fn () => Inertia::render('User/UserTimeOff'))->name('time-off');
    Route::get('/documents', fn () => Inertia::render('User/UserDocuments'))->name('documents');
    Route::get('/directory', fn () => Inertia::render('User/UserDirectory'))->name('directory');
    Route::get('/knowledge-base', fn () => Inertia::render('User/UserKnowledgeBase'))->name('knowledge-base');
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
