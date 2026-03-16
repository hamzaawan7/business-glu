<?php

namespace App\Http\Controllers;

use App\Models\HelpDeskCategory;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  ADMIN — Management Dashboard
    // ─────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');
        $priority = $request->get('priority', 'all');
        $category = $request->get('category', 'all');
        $search   = $request->get('search', '');

        $query = Ticket::where('tenant_id', $tenantId)
            ->with([
                'category:id,name,color',
                'creator:id,name,email',
                'assignee:id,name,email',
            ])
            ->withCount('replies')
            ->orderByRaw("CASE WHEN status IN ('open','in_progress') THEN 0 ELSE 1 END")
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($priority !== 'all') {
            $query->where('priority', $priority);
        }
        if ($category !== 'all') {
            $query->where('category_id', $category);
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tickets = $query->paginate(25)->withQueryString();

        // Stats
        $allTickets = Ticket::where('tenant_id', $tenantId);
        $stats = [
            'total'       => (clone $allTickets)->count(),
            'open'        => (clone $allTickets)->where('status', 'open')->count(),
            'in_progress' => (clone $allTickets)->where('status', 'in_progress')->count(),
            'resolved'    => (clone $allTickets)->where('status', 'resolved')->count(),
            'closed'      => (clone $allTickets)->where('status', 'closed')->count(),
            'urgent'      => (clone $allTickets)->whereIn('status', ['open', 'in_progress'])->where('priority', 'urgent')->count(),
        ];

        // Categories for filters & forms
        $categories = HelpDeskCategory::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'color', 'description']);

        // Team members for assignment
        $teamMembers = User::where('tenant_id', $tenantId)
            ->whereIn('role', ['super_admin', 'owner', 'admin', 'manager'])
            ->get(['id', 'name', 'email']);

        return Inertia::render('Communication/HelpDesk', [
            'tickets'     => $tickets,
            'filters'     => ['status' => $status, 'priority' => $priority, 'category' => $category, 'search' => $search],
            'stats'       => $stats,
            'categories'  => $categories,
            'teamMembers' => $teamMembers,
        ]);
    }

    public function show(Request $request, Ticket $ticket): Response
    {
        $this->authorizeTenant($request, $ticket);

        $ticket->load([
            'category:id,name,color',
            'creator:id,name,email',
            'assignee:id,name,email',
            'replies' => fn ($q) => $q->orderBy('created_at', 'asc'),
            'replies.user:id,name,email',
        ]);

        $categories = HelpDeskCategory::where('tenant_id', $request->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'color']);

        $teamMembers = User::where('tenant_id', $request->user()->tenant_id)
            ->whereIn('role', ['super_admin', 'owner', 'admin', 'manager'])
            ->get(['id', 'name', 'email']);

        return Inertia::render('Communication/TicketDetail', [
            'ticket'      => $ticket,
            'categories'  => $categories,
            'teamMembers' => $teamMembers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'subject'     => 'required|string|max:255',
            'description' => 'required|string|max:10000',
            'category_id' => 'nullable|exists:help_desk_categories,id',
            'priority'    => 'required|in:low,medium,high,urgent',
        ]);

        // Auto-assign: find the admin/manager with fewest open tickets in this category
        $assignTo = null;
        if (!empty($data['category_id'])) {
            $assignTo = User::where('tenant_id', $user->tenant_id)
                ->whereIn('role', ['super_admin', 'owner', 'admin', 'manager'])
                ->withCount(['assignedTickets' => fn ($q) => $q->whereIn('status', ['open', 'in_progress'])])
                ->orderBy('assigned_tickets_count', 'asc')
                ->first();
        }

        Ticket::create([
            'tenant_id'   => $user->tenant_id,
            'created_by'  => $user->id,
            'category_id' => $data['category_id'] ?? null,
            'assigned_to' => $assignTo?->id,
            'subject'     => $data['subject'],
            'description' => $data['description'],
            'priority'    => $data['priority'],
            'status'      => 'open',
        ]);

        return back()->with('flash', ['success' => 'Ticket created.']);
    }

    public function update(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorizeTenant($request, $ticket);

        $data = $request->validate([
            'subject'     => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:10000',
            'category_id' => 'nullable|exists:help_desk_categories,id',
            'priority'    => 'sometimes|in:low,medium,high,urgent',
            'status'      => 'sometimes|in:open,in_progress,resolved,closed',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        // Track lifecycle timestamps
        if (isset($data['status'])) {
            if ($data['status'] === 'resolved' && $ticket->status !== 'resolved') {
                $data['resolved_at'] = now();
            }
            if ($data['status'] === 'closed' && $ticket->status !== 'closed') {
                $data['closed_at'] = now();
            }
            // Reopening clears resolution timestamps
            if (in_array($data['status'], ['open', 'in_progress']) && in_array($ticket->status, ['resolved', 'closed'])) {
                $data['resolved_at'] = null;
                $data['closed_at']   = null;
            }
        }

        $ticket->update($data);

        return back()->with('flash', ['success' => 'Ticket updated.']);
    }

    public function destroy(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorizeTenant($request, $ticket);
        $ticket->delete();

        return back()->with('flash', ['success' => 'Ticket deleted.']);
    }

    public function reply(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorizeTenant($request, $ticket);
        $user = $request->user();

        $data = $request->validate([
            'body'        => 'required|string|max:10000',
            'is_internal' => 'boolean',
        ]);

        TicketReply::create([
            'ticket_id'   => $ticket->id,
            'user_id'     => $user->id,
            'body'        => $data['body'],
            'is_internal' => $data['is_internal'] ?? false,
        ]);

        // Auto-move to in_progress if still open and admin is replying
        if ($ticket->status === 'open' && $user->isAdmin()) {
            $ticket->update(['status' => 'in_progress']);
        }

        return back()->with('flash', ['success' => 'Reply added.']);
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN — Category Management
    // ─────────────────────────────────────────────────────────

    public function storeCategory(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'color'       => 'nullable|string|max:7',
        ]);

        HelpDeskCategory::create([
            'tenant_id'   => $user->tenant_id,
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'color'       => $data['color'] ?? '#495B67',
        ]);

        return back()->with('flash', ['success' => 'Category created.']);
    }

    public function updateCategory(Request $request, HelpDeskCategory $category): RedirectResponse
    {
        abort_unless($category->tenant_id === $request->user()->tenant_id, 403);

        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'color'       => 'nullable|string|max:7',
            'is_active'   => 'boolean',
        ]);

        $category->update($data);

        return back()->with('flash', ['success' => 'Category updated.']);
    }

    public function destroyCategory(Request $request, HelpDeskCategory $category): RedirectResponse
    {
        abort_unless($category->tenant_id === $request->user()->tenant_id, 403);
        $category->delete();

        return back()->with('flash', ['success' => 'Category deleted.']);
    }

    // ─────────────────────────────────────────────────────────
    //  USER — My Tickets
    // ─────────────────────────────────────────────────────────

    public function browse(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        $myTickets = Ticket::where('tenant_id', $tenantId)
            ->where('created_by', $user->id)
            ->with([
                'category:id,name,color',
                'assignee:id,name',
            ])
            ->withCount('replies')
            ->orderByRaw("CASE WHEN status IN ('open','in_progress') THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'desc')
            ->get();

        $categories = HelpDeskCategory::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'color', 'description']);

        return Inertia::render('User/UserHelpDesk', [
            'tickets'    => $myTickets,
            'categories' => $categories,
        ]);
    }

    public function userShow(Request $request, Ticket $ticket): Response
    {
        $this->authorizeTenant($request, $ticket);
        $user = $request->user();

        // Only allow creator to see their own ticket
        abort_unless($ticket->created_by === $user->id, 403);

        $ticket->load([
            'category:id,name,color',
            'creator:id,name,email',
            'assignee:id,name',
            'replies' => fn ($q) => $q->where('is_internal', false)->orderBy('created_at', 'asc'),
            'replies.user:id,name',
        ]);

        return Inertia::render('User/UserTicketDetail', [
            'ticket' => $ticket,
        ]);
    }

    public function userReply(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorizeTenant($request, $ticket);
        $user = $request->user();

        abort_unless($ticket->created_by === $user->id, 403);

        $data = $request->validate([
            'body' => 'required|string|max:10000',
        ]);

        TicketReply::create([
            'ticket_id'   => $ticket->id,
            'user_id'     => $user->id,
            'body'        => $data['body'],
            'is_internal' => false,
        ]);

        return back()->with('flash', ['success' => 'Reply sent.']);
    }

    // ─────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────

    private function authorizeTenant(Request $request, Ticket $ticket): void
    {
        abort_unless($ticket->tenant_id === $request->user()->tenant_id, 403);
    }
}
