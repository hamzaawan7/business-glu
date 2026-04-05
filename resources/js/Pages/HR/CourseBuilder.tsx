import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PhonePreview from '@/Components/PhonePreview';
import RichTextEditor from '@/Components/RichTextEditor';
import SortableList, { SortableItem } from '@/Components/SortableList';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import axios from 'axios';

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

const typeIcons: Record<string, string> = { text: 'pencil', video: 'video-camera', document: 'document', image: 'photo', link: 'link', quiz: 'question-mark-circle' };
const typeLabels: Record<string, string> = { text: 'Text', video: 'Video', document: 'Document', image: 'Image', link: 'Link', quiz: 'Quiz' };
const statusColors: Record<string, string> = { draft: 'bg-slate-100 text-slate-600', published: 'bg-green-100 text-green-700', archived: 'bg-amber-100 text-amber-700' };

/* ── Live Phone Preview ────── */
function CourseMobilePreview({ course }: { course: CourseData }) {
    return (
        <PhonePreview title={course.title} backLabel="Courses" activeNavIndex={3}>
            {course.sections.map((section) => (
                <div key={section.id} className="mb-3">
                    <h4 className="font-bold text-[10px] text-slate-800 mb-1">{section.title}</h4>
                    {section.objects.map((obj) => (
                        <div key={obj.id} className="flex items-center gap-1.5 py-1.5 border-b border-slate-50">
                            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Icon name={typeIcons[obj.type]} className="w-2.5 h-2.5 text-slate-400" />
                            </span>
                            <span className="text-[10px] text-slate-700 truncate">{obj.title}</span>
                        </div>
                    ))}
                    {section.objects.length === 0 && (
                        <p className="text-[9px] text-slate-300 italic">No content yet</p>
                    )}
                </div>
            ))}
            {course.sections.length === 0 && (
                <p className="text-center text-[10px] text-slate-300 mt-8">No sections yet</p>
            )}
        </PhonePreview>
    );
}

export default function CourseBuilder({ course, teamMembers, existingAssignees }: Props) {
    const [showAddSection, setShowAddSection] = useState(false);
    const [addObjectSectionId, setAddObjectSectionId] = useState<number | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [tab, setTab] = useState<'content' | 'assignments'>('content');
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set(course.sections.map((s) => s.id)));
    const [editingObject, setEditingObject] = useState<ObjectData | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editDuration, setEditDuration] = useState<string | number>('');

    const toggleSection = (id: number) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    /* ── Image upload handler for RichTextEditor ── */
    const handleImageUpload = useCallback(async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(route('admin.courses.upload'), formData);
        return res.data.url;
    }, []);

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

    /* ── Edit Object ── */
    const openEditObject = (obj: ObjectData) => {
        setEditingObject(obj);
        setEditTitle(obj.title);
        setEditContent(obj.content || '');
        setEditDuration(obj.duration_minutes || '');
    };
    const submitEditObject: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingObject) return;
        router.patch(route('admin.courses.update-object', editingObject.id), {
            title: editTitle,
            content: editContent,
            duration_minutes: editDuration || null,
        } as any, {
            preserveScroll: true,
            onSuccess: () => setEditingObject(null),
        });
    };

    /* ── Reorder sections ── */
    const handleReorderSections = (activeId: string | number, overId: string | number) => {
        const oldIndex = course.sections.findIndex((s) => s.id === activeId);
        const newIndex = course.sections.findIndex((s) => s.id === overId);
        if (oldIndex === -1 || newIndex === -1) return;
        const newOrder = arrayMove(course.sections, oldIndex, newIndex).map((s) => s.id);
        axios.post(route('admin.courses.reorder-sections', course.id), { order: newOrder });
        router.reload({ only: ['course'] });
    };

    /* ── Reorder objects within a section ── */
    const handleReorderObjects = (sectionId: number, activeId: string | number, overId: string | number) => {
        const section = course.sections.find((s) => s.id === sectionId);
        if (!section) return;
        const oldIndex = section.objects.findIndex((o) => o.id === activeId);
        const newIndex = section.objects.findIndex((o) => o.id === overId);
        if (oldIndex === -1 || newIndex === -1) return;
        const newOrder = arrayMove(section.objects, oldIndex, newIndex).map((o) => o.id);
        axios.post(route('admin.courses.reorder-objects', sectionId), { order: newOrder });
        router.reload({ only: ['course'] });
    };

    /* ── Assignment ── */
    const assignForm = useForm({ user_ids: [] as number[], due_date: '' });
    const submitAssign: FormEventHandler = (e) => {
        e.preventDefault();
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

            <div className="max-w-7xl mx-auto">
                {/* Back & Header */}
                <button onClick={() => router.get(route('admin.courses.index'))} className="text-sm text-[#495B67] hover:underline mb-4">
                    ← Back to Courses
                </button>

                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-slate-900">{course.title}</h1>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[course.status]}`}>{course.status}</span>
                                {course.is_mandatory && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Required</span>}
                            </div>
                            {course.description && <p className="text-sm text-slate-500">{course.description}</p>}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                {course.category && <span>{course.category.name}</span>}
                                {course.estimated_minutes && <span><Icon name="stopwatch" className="w-3.5 h-3.5 inline-block" /> {course.estimated_minutes} min</span>}
                                <span>{course.sections.length} sections</span>
                                <span>{course.assignments_count} assigned ({course.completed_count} completed)</span>
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
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-6">
                    {([['content', 'Content'], ['assignments', 'Assignments']] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content Tab */}
                {tab === 'content' && (
                    <div className="flex gap-6">
                        {/* Left: Builder */}
                        <div className="flex-1 min-w-0 space-y-4">
                            <SortableList
                                items={course.sections.map((s) => ({ id: s.id }))}
                                onReorder={handleReorderSections}
                                className="space-y-4"
                            >
                                {course.sections.map((section) => (
                                    <SortableItem key={section.id} id={section.id}>
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            {/* Section Header (Accordion) */}
                                            <div
                                                className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100 cursor-pointer select-none"
                                                onClick={() => toggleSection(section.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon
                                                        name={expandedSections.has(section.id) ? 'chevron-up' : 'chevron-down'}
                                                        className="w-4 h-4 text-slate-400"
                                                    />
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">{section.title}</h3>
                                                        {section.description && <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-xs text-slate-400">{section.objects.length} items</span>
                                                    <button onClick={() => { objectForm.reset(); setAddObjectSectionId(section.id); }} className="px-3 py-1.5 text-xs font-medium text-[#495B67] bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                                                        <Icon name="plus" className="w-3.5 h-3.5 inline-block" /> Add
                                                    </button>
                                                    <button onClick={() => router.delete(route('admin.courses.destroy-section', section.id), { preserveScroll: true })} className="text-xs text-red-400 hover:text-red-600">
                                                        <Icon name="trash" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Section Content (Collapsible) */}
                                            {expandedSections.has(section.id) && (
                                                <div className="divide-y divide-slate-50">
                                                    {section.objects.length === 0 && (
                                                        <p className="px-5 py-6 text-center text-xs text-slate-400">No content yet. Add text, video, documents, or links.</p>
                                                    )}
                                                    <SortableList
                                                        items={section.objects.map((o) => ({ id: o.id }))}
                                                        onReorder={(activeId, overId) => handleReorderObjects(section.id, activeId, overId)}
                                                    >
                                                        {section.objects.map((obj) => (
                                                            <SortableItem key={obj.id} id={obj.id}>
                                                                <div className="flex items-center justify-between px-3 py-3 hover:bg-slate-50 transition rounded-lg">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                                            <Icon name={typeIcons[obj.type]} className="w-3.5 h-3.5 text-slate-500" />
                                                                        </span>
                                                                        <div className="min-w-0">
                                                                            <span className="text-sm font-medium text-slate-700 block truncate">{obj.title}</span>
                                                                            <span className="text-xs text-slate-400">{typeLabels[obj.type]}{obj.duration_minutes ? ` · ${obj.duration_minutes} min` : ''}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => openEditObject(obj)} className="px-2 py-1 text-xs text-[#495B67] hover:bg-slate-100 rounded">
                                                                            Edit
                                                                        </button>
                                                                        <button onClick={() => router.delete(route('admin.courses.destroy-object', obj.id), { preserveScroll: true })} className="px-2 py-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </SortableItem>
                                                        ))}
                                                    </SortableList>
                                                </div>
                                            )}
                                        </div>
                                    </SortableItem>
                                ))}
                            </SortableList>

                            {/* Add Section Button */}
                            <button onClick={() => setShowAddSection(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-[#495B67] hover:text-[#495B67] transition">
                                <Icon name="plus" className="w-4 h-4 inline-block" /> Add Section
                            </button>
                        </div>

                        {/* Right: Live Phone Preview */}
                        <div className="hidden lg:block flex-shrink-0 sticky top-6 self-start">
                            <p className="text-xs font-medium text-slate-500 mb-2 text-center">Live Preview</p>
                            <CourseMobilePreview course={course} />
                        </div>
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

            {/* ── Add Object Modal (Full-screen with Preview) ── */}
            {addObjectSectionId && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900">Add Content</h2>
                        <button onClick={() => setAddObjectSectionId(null)} className="text-slate-400 hover:text-slate-600">
                            <Icon name="x-mark" className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Editor Side */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={submitObject} className="max-w-2xl space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                        <select value={objectForm.data.type} onChange={(e) => objectForm.setData('type', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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

                                {/* Type-specific editors */}
                                {objectForm.data.type === 'text' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                                        <RichTextEditor
                                            content={objectForm.data.content}
                                            onChange={(html) => objectForm.setData('content', html)}
                                            onImageUpload={handleImageUpload}
                                            placeholder="Write your course content here..."
                                            minHeight="300px"
                                        />
                                    </div>
                                )}
                                {(objectForm.data.type === 'video' || objectForm.data.type === 'link') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                                        <input type="url" value={objectForm.data.content} onChange={(e) => objectForm.setData('content', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" placeholder="https://" />
                                    </div>
                                )}
                                {(objectForm.data.type === 'image' || objectForm.data.type === 'document') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Upload File or Enter URL</label>
                                        <input type="url" value={objectForm.data.content} onChange={(e) => objectForm.setData('content', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2" placeholder="https:// or upload below" />
                                        <label className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-[#495B67] hover:text-[#495B67] cursor-pointer transition">
                                            <Icon name="plus" className="w-4 h-4" /> Upload {objectForm.data.type === 'image' ? 'Image' : 'Document'}
                                            <input type="file" accept={objectForm.data.type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'} className="hidden" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const url = await handleImageUpload(file);
                                                objectForm.setData('content', url);
                                            }} />
                                        </label>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setAddObjectSectionId(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                    <button type="submit" disabled={objectForm.processing} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>Add Content</button>
                                </div>
                            </form>
                        </div>

                        {/* Preview Side */}
                        <div className="hidden lg:flex items-start justify-center px-6 py-8 bg-slate-50 border-l border-slate-200 w-[340px]">
                            <PhonePreview title={objectForm.data.title || 'Untitled'} backLabel={course.title} activeNavIndex={3}>
                                {objectForm.data.type === 'text' && objectForm.data.content && (
                                    <div className="prose prose-sm max-w-none text-[10px]" dangerouslySetInnerHTML={{ __html: objectForm.data.content }} />
                                )}
                                {objectForm.data.type === 'video' && objectForm.data.content && (
                                    <div className="bg-slate-200 rounded aspect-video flex items-center justify-center">
                                        <Icon name="video-camera" className="w-6 h-6 text-slate-400" />
                                    </div>
                                )}
                                {objectForm.data.type === 'image' && objectForm.data.content && (
                                    <img src={objectForm.data.content} alt="" className="w-full rounded" />
                                )}
                                {objectForm.data.type === 'link' && objectForm.data.content && (
                                    <p className="text-[#495B67] underline text-[10px] break-all">{objectForm.data.content}</p>
                                )}
                                {objectForm.data.type === 'document' && objectForm.data.content && (
                                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded">
                                        <Icon name="document" className="w-4 h-4 text-slate-400" />
                                        <span className="text-[10px] text-slate-600 truncate">Document</span>
                                    </div>
                                )}
                                {!objectForm.data.content && (
                                    <p className="text-center text-[10px] text-slate-300 mt-8">Content preview will appear here</p>
                                )}
                            </PhonePreview>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Object Modal (Full-screen with Preview) ── */}
            {editingObject && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900">Edit Content</h2>
                        <button onClick={() => setEditingObject(null)} className="text-slate-400 hover:text-slate-600">
                            <Icon name="x-mark" className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Editor Side */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={submitEditObject} className="max-w-2xl space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                        <div className="px-3 py-2 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-500">{typeLabels[editingObject.type]}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                                        <input type="number" min="1" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" required />
                                </div>

                                {/* Type-specific editors */}
                                {editingObject.type === 'text' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                                        <RichTextEditor
                                            content={editContent}
                                            onChange={(html) => setEditContent(html)}
                                            onImageUpload={handleImageUpload}
                                            placeholder="Write your course content here..."
                                            minHeight="300px"
                                        />
                                    </div>
                                )}
                                {(editingObject.type === 'video' || editingObject.type === 'link') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                                        <input type="url" value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" placeholder="https://" />
                                    </div>
                                )}
                                {(editingObject.type === 'image' || editingObject.type === 'document') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">File URL</label>
                                        <input type="url" value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2" placeholder="https://" />
                                        <label className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-[#495B67] hover:text-[#495B67] cursor-pointer transition">
                                            <Icon name="plus" className="w-4 h-4" /> Replace File
                                            <input type="file" accept={editingObject.type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'} className="hidden" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const url = await handleImageUpload(file);
                                                setEditContent(url);
                                            }} />
                                        </label>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setEditingObject(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>Save Changes</button>
                                </div>
                            </form>
                        </div>

                        {/* Preview Side */}
                        <div className="hidden lg:flex items-start justify-center px-6 py-8 bg-slate-50 border-l border-slate-200 w-[340px]">
                            <PhonePreview title={editTitle || 'Untitled'} backLabel={course.title} activeNavIndex={3}>
                                {editingObject.type === 'text' && editContent && (
                                    <div className="prose prose-sm max-w-none text-[10px]" dangerouslySetInnerHTML={{ __html: editContent }} />
                                )}
                                {editingObject.type === 'video' && editContent && (
                                    <div className="bg-slate-200 rounded aspect-video flex items-center justify-center">
                                        <Icon name="video-camera" className="w-6 h-6 text-slate-400" />
                                    </div>
                                )}
                                {editingObject.type === 'image' && editContent && (
                                    <img src={editContent} alt="" className="w-full rounded" />
                                )}
                                {editingObject.type === 'link' && editContent && (
                                    <p className="text-[#495B67] underline text-[10px] break-all">{editContent}</p>
                                )}
                                {editingObject.type === 'document' && editContent && (
                                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded">
                                        <Icon name="document" className="w-4 h-4 text-slate-400" />
                                        <span className="text-[10px] text-slate-600 truncate">Document</span>
                                    </div>
                                )}
                                {!editContent && (
                                    <p className="text-center text-[10px] text-slate-300 mt-8">Content preview will appear here</p>
                                )}
                            </PhonePreview>
                        </div>
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
