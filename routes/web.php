<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ViewSwitchController;
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
                'clockedIn' => 0,
                'openTasks' => 0,
                'unreadMessages' => 0,
            ],
        ]);
    })->name('dashboard');

    // ── Operations Hub ──────────────────────────────────────
    Route::get('/time-clock', fn () => Inertia::render('Operations/TimeClock'))->name('time-clock.index');
    Route::get('/scheduling', fn () => Inertia::render('Operations/Scheduling'))->name('scheduling.index');
    Route::get('/tasks', fn () => Inertia::render('Operations/Tasks'))->name('tasks.index');
    Route::get('/forms', fn () => Inertia::render('Operations/Forms'))->name('forms.index');

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
    Route::get('/team', function () {
        $user = auth()->user();
        return Inertia::render('Admin/Team', [
            'members' => User::where('tenant_id', $user->tenant_id)
                ->select(['id', 'name', 'email', 'email_verified_at', 'role', 'tenant_id'])
                ->orderBy('name')
                ->get(),
        ]);
    })->name('team.index');

    Route::get('/settings', function () {
        $user = auth()->user();
        $tenant = $user->tenant;
        return Inertia::render('Admin/Settings', [
            'company' => $tenant ? [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'plan' => $tenant->plan ?? 'free',
            ] : null,
        ]);
    })->name('settings.index');
});

/*
|--------------------------------------------------------------------------
| User / Employee Routes — /app/*
|--------------------------------------------------------------------------
| Simplified mobile-first view for all authenticated users.
*/
Route::middleware(['auth', 'verified'])->prefix('app')->name('user.')->group(function () {
    Route::get('/', fn () => Inertia::render('User/Home'))->name('home');
    Route::get('/time-clock', fn () => Inertia::render('User/MyTimeClock'))->name('time-clock');
    Route::get('/schedule', fn () => Inertia::render('User/MySchedule'))->name('schedule');
    Route::get('/chat', fn () => Inertia::render('User/MyChat'))->name('chat');
    Route::get('/tasks', fn () => Inertia::render('User/MyTasks'))->name('tasks');
    Route::get('/more', fn () => Inertia::render('User/More'))->name('more');
    Route::get('/forms', fn () => Inertia::render('User/UserForms'))->name('forms');
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
| Profile Routes (shared)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
