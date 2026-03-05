<?php

use App\Http\Controllers\ProfileController;
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
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {

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

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
