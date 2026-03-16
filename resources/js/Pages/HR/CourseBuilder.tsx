import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface ObjectData {
    id: number;
    type: string;
    title: string;
    content: string | null;
    duration_minutes: number | null;
    sort_order: number;
}

interface SectionData {
    id: number;
    title: string;
    description: string | null;
    sort_order: number;
    objects: ObjectData[];
}

interface CourseData {
    id: number;
    title: string;
    description: string | null;
    status: string;
    is_mandatory: boolean;
    estimated_minutes: number | null;
    category: { id: number; name: string } | null;
    creator: { id: number; name: string } | null;
    sections: SectionData[];
    assignments_count: number;
    completed_count: number;
}

interface TeamMember { id: number; name: string; email: string; department: string | null; position: string | null; }
interface AssignmentData { id: number; user_id: number; status: string; progress_pct: number; due_date: string | null; completed_at: string | null; user: { id: number; name: string; email: string } | null; }

interface Props {
    course: CourseData;
    teamMembers: TeamMember[];
    existingAssignees: AssignmentData[];
}

const typeIcons: Record<string, string> = { text: '📝', video: '🎬', document: '📄', image: '🖼️', link: '🔗', quiz: '❓' };
const typeLabels: Record<string, string> = { text: 'Text', video: 'Video', document: 'Document', image: 'Image', link: 'Link', quiz: 'Quiz' };
const statusColors: Record<string, string> = { draft: 'bg-slate-100 text-slate-600', published: 'bg-green-100 text-green-700', archived: 'bg-amber-100 text-amber-700' };

export default function CourseBuilder({ course, teamMembers, existingAssignees }: Props) {
    const [showAddSection, setShowAddSection] = useState(false);
    const [addObjectSectionId, setAddObjectSectionId] = useState<number | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [tab, setTab] = useState<'content' | 'assignments'>('content');

    /* ── Section form ── */
    const sectionForm = useForm({ title: '', description: '' });
    const submitSection: FormEventHandler = (e) => {
        e.preventDefault();
        sectionForm.post(route('admin.courses.store-section', course.id), {
            preserveScroll: true,
            onSuccess: () => { sectionForm.reset(); setShowAddSection(false); },
        });
    };

    /* ── Object form ── */
    const objectForm = useForm({ type: 'text', title: '', content: '', duration_minutes: '' as string | number });
    const submitObject: FormEventHandler = (e) => {
        e.preventDefault();
        if (!addObjectSectionId) return;
        objectForm.post(route('admin.courses.store-object', addObjectSectionId), {
            preserveScroll: true,
            onSuccess: () => { objectForm.reset(); setAddObjectSectionId(null); },
        });
    };

    /* ── Assignment ── */
    const assignForm = useForm({ user_ids: [] as number[], due_date: '' });
    const submitAssign: FormEventHandler = (e) => {
        e.preventDefault();
        assignForm.transform((data) => ({ ...data, user_ids: selectedUsers }));
        router.post(route('admin.courses.assign', course.id), { user_ids: selectedUsers, due_date: assignForm.data.due_date || null } as any, {
            preserveScroll: true,
            onSuccess: () => { setSelectedUsers([]); assignForm.reset(); setShowAssignModal(false); },
        });
    };

    const toggleUser = (id: number) => {
        setSelectedUsers((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);
    };

    const assignedUserIds = existingAssignees.map((a) => a.user_id);

    return (
        <AdminLayout>
            <Head title={`${course.title} — Course Builder`} />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Back & Header */}
                <button onClick={() => router.get(route('admin.courses.index'))} className="text-sm text-[#495B67] hover:underline">
                    ← Back to Courses
                </button>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-slate-900">{course.title}</h1>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[course.status]}`}>{course.status}</span>
                                {course.is_mandatory && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Required</span>}
                            </div>
                            {course.description && <p className="text-sm text-slate-500">{course.description}</p>}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                {course.category && <span>📁 {course.category.name}</span>}
                                {course.estimated_minutes && <span>⏱ {course.estimated_minutes} min</span>}
                                <span>📖 {course.sections.length} sections</span>
                                <span>👥 {course.assignments_count} assigned ({course.completed_count} completed)</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {course.status === 'draft' && (
                                <button onClick={() => router.post(route('admin.courses.publish', course.id), {}, { preserveScroll: true })} className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                                    Publish
                                </button>
                            )}
                            <button onClick={() => setShowAssignModal(true)} className="px-3 py-2 text-xs font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>
                                Assign Users
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                    {([['content', 'Content'], ['assignments', 'Assignments']] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content Tab */}
                {tab === 'content' && (
                    <div className="space-y-4">
                        {course.sections.map((section) => (
                            <div key={section.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{section.title}</h3>
                                        {section.description && <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { objectForm.reset(); setAddObjectSectionId(section.id); }} className="px-3 py-1.5 text-xs font-medium text-[#495B67] bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                                            + Add Content
                                        </button>
                                        <button onClick={() => router.delete(route('admin.courses.destroy-section', section.id), { preserveScroll: true })} className="text-xs text-red-400 hover:text-red-600">
                                            🗑
                                        </button>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-50">
                                    {section.objects.length === 0 && (
                                        <p className="px-5 py-6 text-center text-xs text-slate-400">No content yet. Add text, video, documents, or links.</p>
                                    )}
                                    {section.objects.map((obj) => (
                                        <div key={obj.id} className="flex items-center justify-between px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{typeIcons[obj.type]}</span>
                                                <div>
                                                    <span className="text-sm font-medium text-slate-700">{obj.title}</span>
                                                    <span className="text-xs text-slate-400 ml-2">{typeLabels[obj.type]}</span>
                                                    {obj.duration_minutes && <span className="text-xs text-slate-400 ml-2">· {obj.duration_minutes} min</span>}
                                                </div>
                                            </div>
                                            <button onClick={() => router.delete(route('admin.courses.destroy-object', obj.id), { preserveScroll: true })} className="text-xs text-red-400 hover:text-red-600">
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Add Section Button */}
                        <button onClick={() => setShowAddSection(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-[#495B67] hover:text-[#495B67] transition">
                            + Add Section
                        </button>
                    </div>
                )}

                {/* Assignments Tab */}
                {tab === 'assignments' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-slate-600">Employee</th>
                                        <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                                        <th className="px-4 py-3 font-medium text-slate-600">Progress</th>
                                        <th className="px-4 py-3 font-medium text-slate-600">Due Date</th>
                                        <th className="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {existingAssignees.length === 0 && (
                                        <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No assignments yet</td></tr>
                                    )}
                                    {existingAssignees.map((a) => (
                                        <tr key={a.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{a.user?.name}</div>
                                                <div className="text-xs text-slate-400">{a.user?.email}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                                    a.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    a.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {a.status === 'in_progress' ? 'In Progress' : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-slate-100 rounded-full h-1.5">
                                                        <div className="h-1.5 rounded-full" style={{ width: `${a.progress_pct}%`, backgroundColor: '#495B67' }} />
                                                    </div>
                                                    <span className="text-xs text-slate-500">{a.progress_pct}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {a.due_date || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => router.delete(route('admin.courses.remove-assignment', a.id), { preserveScroll: true })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add Section Modal ── */}
            {showAddSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddSection(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Section</h2>
                        <form onSubmit={submitSection} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Section Title</label>
                                <input type="text" value={sectionForm.data.title} onChange={(e) => sectionForm.setData('title', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                                <input type="text" value={sectionForm.data.description} onChange={(e) => sectionForm.setData('description', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAddSection(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                <button type="submit" disabled={sectionForm.processing} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>Add Section</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Add Object Modal ── */}
            {addObjectSectionId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAddObjectSectionId(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Content</h2>
                        <form onSubmit={submitObject} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                    <select value={objectForm.data.type} onChange={(e) => objectForm.setData('type', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                        {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{typeIcons[k]} {v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                                    <input type="number" min="1" value={objectForm.data.duration_minutes} onChange={(e) => objectForm.setData('duration_minutes', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input type="text" value={objectForm.data.title} onChange={(e) => objectForm.setData('title', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {objectForm.data.type === 'text' ? 'Content' : 'URL / Content'}
                                </label>
                                <textarea value={objectForm.data.content} onChange={(e) => objectForm.setData('content', e.target.value)} rows={objectForm.data.type === 'text' ? 6 : 2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" placeholder={objectForm.data.type === 'text' ? 'Write your content here...' : 'https://'} />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setAddObjectSectionId(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                <button type="submit" disabled={objectForm.processing} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>Add Content</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Assign Users Modal ── */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAssignModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Assign Users</h2>
                        <form onSubmit={submitAssign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date (optional)</label>
                                <input type="date" value={assignForm.data.due_date} onChange={(e) => assignForm.setData('due_date', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div className="space-y-1 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2">
                                {teamMembers.filter((m) => !assignedUserIds.includes(m.id)).map((m) => (
                                    <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input type="checkbox" checked={selectedUsers.includes(m.id)} onChange={() => toggleUser(m.id)} className="rounded border-slate-300 text-[#495B67] focus:ring-[#495B67]" />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">{m.name}</span>
                                            <span className="text-xs text-slate-400 ml-2">{m.email}</span>
                                            {m.department && <span className="text-xs text-slate-400 ml-2">· {m.department}</span>}
                                        </div>
                                    </label>
                                ))}
                                {teamMembers.filter((m) => !assignedUserIds.includes(m.id)).length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4">All team members already assigned</p>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">{selectedUsers.length} selected</span>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                    <button type="submit" disabled={selectedUsers.length === 0} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#495B67' }}>Assign</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
