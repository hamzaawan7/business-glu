<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  ADMIN — Document Management
    // ─────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;
        $status   = $request->get('status', 'all');
        $category = $request->get('category', 'all');
        $search   = $request->get('search', '');

        $query = Document::where('tenant_id', $tenantId)
            ->with(['category:id,name', 'uploader:id,name', 'employee:id,name'])
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') $query->where('status', $status);
        if ($category !== 'all') $query->where('category_id', $category);
        if ($search) $query->where('title', 'like', "%{$search}%");

        $documents = $query->paginate(25)->withQueryString();

        $allDocs = Document::where('tenant_id', $tenantId);
        $stats = [
            'total'        => (clone $allDocs)->count(),
            'active'       => (clone $allDocs)->where('status', 'active')->count(),
            'expiring_soon' => (clone $allDocs)->where('status', 'active')
                ->whereNotNull('expiry_date')
                ->where('expiry_date', '<=', now()->addDays(30))
                ->where('expiry_date', '>', now())
                ->count(),
            'expired'      => (clone $allDocs)->where('status', 'active')
                ->whereNotNull('expiry_date')
                ->where('expiry_date', '<', now())
                ->count(),
        ];

        $categories = DocumentCategory::where('tenant_id', $tenantId)->orderBy('sort_order')->get(['id', 'name']);
        $employees  = User::where('tenant_id', $tenantId)->get(['id', 'name', 'email']);

        return Inertia::render('HR/Documents', [
            'documents'  => $documents,
            'filters'    => ['status' => $status, 'category' => $category, 'search' => $search],
            'stats'      => $stats,
            'categories' => $categories,
            'employees'  => $employees,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category_id' => 'nullable|exists:document_categories,id',
            'user_id'     => 'nullable|exists:users,id',
            'expiry_date' => 'nullable|date',
            'visibility'  => 'required|in:admin,employee,all',
            'file'        => 'required|file|max:20480', // 20MB
        ]);

        $file = $request->file('file');
        $path = $file->store("documents/{$user->tenant_id}", 'local');

        Document::create([
            'tenant_id'   => $user->tenant_id,
            'uploaded_by'  => $user->id,
            'category_id' => $data['category_id'] ?? null,
            'user_id'     => $data['user_id'] ?? null,
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'file_type'   => $file->getClientOriginalExtension(),
            'file_size'   => $file->getSize(),
            'expiry_date' => $data['expiry_date'] ?? null,
            'visibility'  => $data['visibility'],
            'status'      => 'active',
        ]);

        return back()->with('flash', ['success' => 'Document uploaded.']);
    }

    public function update(Request $request, Document $document): RedirectResponse
    {
        abort_unless($document->tenant_id === $request->user()->tenant_id, 403);

        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category_id' => 'nullable|exists:document_categories,id',
            'user_id'     => 'nullable|exists:users,id',
            'expiry_date' => 'nullable|date',
            'visibility'  => 'sometimes|in:admin,employee,all',
            'status'      => 'sometimes|in:active,archived',
        ]);

        $document->update($data);

        return back()->with('flash', ['success' => 'Document updated.']);
    }

    public function destroy(Request $request, Document $document): RedirectResponse
    {
        abort_unless($document->tenant_id === $request->user()->tenant_id, 403);
        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return back()->with('flash', ['success' => 'Document deleted.']);
    }

    public function download(Request $request, Document $document)
    {
        abort_unless($document->tenant_id === $request->user()->tenant_id, 403);

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    // ─────────────────────────────────────────────────────────
    //  Category Management
    // ─────────────────────────────────────────────────────────

    public function storeCategory(Request $request): RedirectResponse
    {
        $data = $request->validate(['name' => 'required|string|max:100']);
        DocumentCategory::create(['tenant_id' => $request->user()->tenant_id, 'name' => $data['name']]);
        return back()->with('flash', ['success' => 'Category created.']);
    }

    public function destroyCategory(Request $request, DocumentCategory $category): RedirectResponse
    {
        abort_unless($category->tenant_id === $request->user()->tenant_id, 403);
        $category->delete();
        return back()->with('flash', ['success' => 'Category deleted.']);
    }

    // ─────────────────────────────────────────────────────────
    //  USER — My Documents
    // ─────────────────────────────────────────────────────────

    public function browse(Request $request): Response
    {
        $user = $request->user();

        $myDocuments = Document::where('tenant_id', $user->tenant_id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('visibility', 'all');
            })
            ->where('status', 'active')
            ->with('category:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        $categories = DocumentCategory::where('tenant_id', $user->tenant_id)->orderBy('sort_order')->get(['id', 'name']);

        return Inertia::render('User/UserDocuments', [
            'documents'  => $myDocuments,
            'categories' => $categories,
        ]);
    }

    public function userUpload(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'category_id' => 'nullable|exists:document_categories,id',
            'file'        => 'required|file|max:20480',
        ]);

        $file = $request->file('file');
        $path = $file->store("documents/{$user->tenant_id}", 'local');

        Document::create([
            'tenant_id'   => $user->tenant_id,
            'uploaded_by'  => $user->id,
            'user_id'     => $user->id,
            'category_id' => $data['category_id'] ?? null,
            'title'       => $data['title'],
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'file_type'   => $file->getClientOriginalExtension(),
            'file_size'   => $file->getSize(),
            'visibility'  => 'employee',
            'status'      => 'active',
        ]);

        return back()->with('flash', ['success' => 'Document uploaded.']);
    }
}
