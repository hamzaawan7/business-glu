<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ChatController extends Controller
{
    /**
     * Admin chat view — list all conversations + messages.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $tenantId = $user->tenant_id;

        $conversations = $this->getUserConversations($user);

        $users = User::where('tenant_id', $tenantId)
            ->where('id', '!=', $user->id)
            ->select('id', 'name', 'avatar_url', 'department', 'position')
            ->orderBy('name')
            ->get();

        return Inertia::render('Communication/Chat', [
            'conversations' => $conversations,
            'users' => $users,
            'currentUserId' => $user->id,
        ]);
    }

    /**
     * User chat view.
     */
    public function userChat(Request $request)
    {
        $user = auth()->user();
        $tenantId = $user->tenant_id;

        $conversations = $this->getUserConversations($user);

        $users = User::where('tenant_id', $tenantId)
            ->where('id', '!=', $user->id)
            ->select('id', 'name', 'avatar_url', 'department', 'position')
            ->orderBy('name')
            ->get();

        return Inertia::render('User/MyChat', [
            'conversations' => $conversations,
            'users' => $users,
            'currentUserId' => $user->id,
        ]);
    }

    /**
     * Get conversations for a user.
     */
    private function getUserConversations($user)
    {
        return Conversation::where('tenant_id', $user->tenant_id)
            ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->with([
                'participants:id,name,avatar_url,department,position',
                'latestMessage' => fn ($q) => $q->with('user:id,name'),
            ])
            ->get()
            ->map(function ($conv) use ($user) {
                $participants = $conv->participants->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'avatar_url' => $p->avatar_url,
                    'department' => $p->department,
                    'position' => $p->position,
                ]);

                $myPivot = $conv->participants->firstWhere('id', $user->id)?->pivot;
                $unreadCount = $myPivot && $myPivot->last_read_at
                    ? $conv->messages()->where('created_at', '>', $myPivot->last_read_at)->where('user_id', '!=', $user->id)->count()
                    : $conv->messages()->where('user_id', '!=', $user->id)->count();

                return [
                    'id' => $conv->id,
                    'type' => $conv->type,
                    'name' => $conv->name,
                    'description' => $conv->description,
                    'participants' => $participants,
                    'latest_message' => $conv->latestMessage ? [
                        'id' => $conv->latestMessage->id,
                        'body' => $conv->latestMessage->body,
                        'user_name' => $conv->latestMessage->user?->name,
                        'created_at' => $conv->latestMessage->created_at->toISOString(),
                    ] : null,
                    'unread_count' => $unreadCount,
                    'updated_at' => ($conv->latestMessage?->created_at ?? $conv->created_at)->toISOString(),
                ];
            })
            ->sortByDesc('updated_at')
            ->values();
    }

    /**
     * Create a new conversation (direct or group).
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:direct,group,channel',
            'name' => 'nullable|string|max:100',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'exists:users,id',
        ]);

        $user = auth()->user();
        $participantIds = collect($request->participant_ids)->push($user->id)->unique()->values();

        // For direct messages, check if conversation already exists
        if ($request->type === 'direct' && count($request->participant_ids) === 1) {
            $existing = Conversation::where('tenant_id', $user->tenant_id)
                ->where('type', 'direct')
                ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
                ->whereHas('participants', fn ($q) => $q->where('user_id', $request->participant_ids[0]))
                ->first();

            if ($existing) {
                return back();
            }
        }

        $conversation = Conversation::create([
            'tenant_id' => $user->tenant_id,
            'type' => $request->type,
            'name' => $request->name,
            'created_by' => $user->id,
        ]);

        // Attach participants
        foreach ($participantIds as $pid) {
            $conversation->participants()->attach($pid, [
                'role' => $pid === $user->id ? 'admin' : 'member',
            ]);
        }

        return back();
    }

    /**
     * Get messages for a conversation (polling endpoint).
     */
    public function messages(Request $request, Conversation $conversation)
    {
        $user = auth()->user();

        // Verify user is participant
        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            abort(403);
        }

        $messages = $conversation->messages()
            ->with('user:id,name,avatar_url')
            ->with('replyTo:id,body,user_id')
            ->with('replyTo.user:id,name')
            ->orderBy('created_at', 'asc')
            ->limit(100)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'body' => $m->body,
                'type' => $m->type,
                'file_path' => $m->file_path,
                'file_name' => $m->file_name,
                'file_size' => $m->file_size,
                'reply_to' => $m->replyTo ? [
                    'id' => $m->replyTo->id,
                    'body' => $m->replyTo->body,
                    'user_name' => $m->replyTo->user?->name,
                ] : null,
                'user' => [
                    'id' => $m->user->id,
                    'name' => $m->user->name,
                    'avatar_url' => $m->user->avatar_url,
                ],
                'edited_at' => $m->edited_at?->toISOString(),
                'created_at' => $m->created_at->toISOString(),
            ]);

        // Mark as read
        $conversation->participants()
            ->updateExistingPivot($user->id, ['last_read_at' => now()]);

        return response()->json($messages);
    }

    /**
     * Send a message.
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        $request->validate([
            'body' => 'required_without:file|string|max:5000',
            'reply_to_id' => 'nullable|exists:messages,id',
            'file' => 'nullable|file|max:10240',
        ]);

        $user = auth()->user();

        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            abort(403);
        }

        $data = [
            'tenant_id' => $user->tenant_id,
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'body' => $request->body ?? '',
            'type' => 'text',
            'reply_to_id' => $request->reply_to_id,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('chat-files', 'public');
            $data['file_path'] = $path;
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
            $data['type'] = str_starts_with($file->getMimeType(), 'image/') ? 'image' : 'file';
            if (empty($data['body'])) {
                $data['body'] = $file->getClientOriginalName();
            }
        }

        Message::create($data);

        // Mark as read for sender
        $conversation->participants()
            ->updateExistingPivot($user->id, ['last_read_at' => now()]);

        return back();
    }

    /**
     * Edit a message.
     */
    public function editMessage(Request $request, Message $message)
    {
        $request->validate(['body' => 'required|string|max:5000']);

        if ($message->user_id !== auth()->id()) {
            abort(403);
        }

        $message->update([
            'body' => $request->body,
            'edited_at' => now(),
        ]);

        return back();
    }

    /**
     * Delete a message (soft delete).
     */
    public function deleteMessage(Message $message)
    {
        $user = auth()->user();

        if ($message->user_id !== $user->id && !in_array($user->role, ['super_admin', 'owner', 'admin'])) {
            abort(403);
        }

        $message->delete();

        return back();
    }
}
