import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PhonePreview from '@/Components/PhonePreview';
import RichTextEditor from '@/Components/RichTextEditor';
import SortableList, { SortableItem } from '@/Components/SortableList';
import ToastContainer, { showToast } from '@/Components/Toast';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect, FormEventHandler, useCallback, useRef } from 'react';
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
    cover_image: string | null;
    category: { id: number; name: string } | null;
    creator: { id: number; name: string } | null;
    sections: SectionData[];
    assignments_count: number;
    completed_count: number;
}

interface TeamMember { id: number; name: string; email: string; department: string | null; position: string | null; }
interface AssignmentData { id: number; user_id: number; status: string; progress_pct: number; due_date: string | null; completed_at: string | null; user: { id: number; name: string; email: string } | null; }

interface AudienceRule { id: number; rule_type: string; rule_value: string | null; }

interface Props {
    course: CourseData;
    teamMembers: TeamMember[];
    existingAssignees: AssignmentData[];
    audienceRules: AudienceRule[];
    departments: string[];
    roles: string[];
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

export default function CourseBuilder({ course, teamMembers, existingAssignees, audienceRules, departments, roles }: Props) {
    const page = usePage();
    const flash = (page.props as any).flash ?? {};
    const pageErrors = (page.props as any).errors ?? {};

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
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Show flash messages as toasts
    useEffect(() => {
        if (flash.success) showToast('success', flash.success);
        if (flash.error) showToast('error', flash.error);
    }, [flash.success, flash.error]);

    // Show validation errors as toasts
    useEffect(() => {
        const errorKeys = Object.keys(pageErrors);
        if (errorKeys.length > 0) {
            errorKeys.forEach((key) => showToast('error', pageErrors[key]));
        }
    }, [JSON.stringify(pageErrors)]);
    const [showPublishWizard, setShowPublishWizard] = useState(false);
    const [showSaveTemplateConfirm, setShowSaveTemplateConfirm] = useState(false);
    const [showAssignAllConfirm, setShowAssignAllConfirm] = useState(false);
    const [showEditDetails, setShowEditDetails] = useState(false);
    const [publishStep, setPublishStep] = useState(1);
    const [publishAssignTo, setPublishAssignTo] = useState<'none' | 'all' | 'selected'>('none');
    const [publishSelectedUsers, setPublishSelectedUsers] = useState<number[]>([]);
    const [publishDueDate, setPublishDueDate] = useState('');
    const [publishAutoAssign, setPublishAutoAssign] = useState(false);
    const [publishNotify, setPublishNotify] = useState(true);
    const [publishLoading, setPublishLoading] = useState(false);
    const [publishSearch, setPublishSearch] = useState('');

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            showToast('error', 'Please upload a JPEG, PNG, GIF, WebP, or SVG image.');
            if (coverInputRef.current) coverInputRef.current.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('error', 'Image must be smaller than 10 MB.');
            if (coverInputRef.current) coverInputRef.current.value = '';
            return;
        }

        router.post(route('admin.courses.update', course.id), {
            _method: 'PATCH',
            cover_image: file,
        } as any, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => showToast('success', 'Cover image updated.'),
            onError: () => showToast('error', 'Failed to upload cover image. Please try a different file.'),
            onFinish: () => { if (coverInputRef.current) coverInputRef.current.value = ''; },
        });
    };

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
            onSuccess: () => { sectionForm.reset(); setShowAddSection(false); showToast('success', 'Section added.'); },
            onError: () => showToast('error', 'Failed to add section.'),
        });
    };

    /* ── Object form ── */
    const objectForm = useForm({ type: 'text', title: '', content: '', duration_minutes: '' as string | number });
    const submitObject: FormEventHandler = (e) => {
        e.preventDefault();
        if (!addObjectSectionId) return;
        objectForm.post(route('admin.courses.store-object', addObjectSectionId), {
            preserveScroll: true,
            onSuccess: () => { objectForm.reset(); setAddObjectSectionId(null); showToast('success', 'Lesson added.'); },
            onError: () => showToast('error', 'Failed to add lesson.'),
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
            onSuccess: () => { setEditingObject(null); showToast('success', 'Lesson updated.'); },
            onError: () => showToast('error', 'Failed to update lesson.'),
        });
    };

    /* ── Reorder sections ── */
    const handleReorderSections = (activeId: string | number, overId: string | number) => {
        const oldIndex = course.sections.findIndex((s) => s.id === activeId);
        const newIndex = course.sections.findIndex((s) => s.id === overId);
        if (oldIndex === -1 || newIndex === -1) return;
        const newOrder = arrayMove(course.sections, oldIndex, newIndex).map((s) => s.id);
        axios.post(route('admin.courses.reorder-sections', course.id), { order: newOrder })
            .then(() => showToast('success', 'Sections reordered.'))
            .catch(() => showToast('error', 'Failed to reorder sections.'));
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
        axios.post(route('admin.courses.reorder-objects', sectionId), { order: newOrder })
            .then(() => showToast('success', 'Lessons reordered.'))
            .catch(() => showToast('error', 'Failed to reorder lessons.'));
        router.reload({ only: ['course'] });
    };

    /* ── Assignment ── */
    const assignForm = useForm({ user_ids: [] as number[], due_date: '' });
    const submitAssign: FormEventHandler = (e) => {
        e.preventDefault();
        router.post(route('admin.courses.assign', course.id), { user_ids: selectedUsers, due_date: assignForm.data.due_date || null } as any, {
            preserveScroll: true,
            onSuccess: () => { setSelectedUsers([]); assignForm.reset(); setShowAssignModal(false); showToast('success', 'Users assigned successfully.'); },
            onError: () => showToast('error', 'Failed to assign users.'),
        });
    };

    const toggleUser = (id: number) => {
        setSelectedUsers((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);
    };

    const assignedUserIds = existingAssignees.map((a) => a.user_id);

    return (
        <AdminLayout>
            <Head title={`${course.title} — Course Builder`} />
            <ToastContainer />

            <div className="max-w-7xl mx-auto">
                {/* Back & Header */}
                <button onClick={() => router.get(route('admin.courses.index'))} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4 transition">
                    <Icon name="arrow-left" className="w-4 h-4" /> Back to Courses
                </button>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                    {/* Cover Image */}
                    <div className="relative h-32 overflow-hidden group">
                        {course.cover_image ? (
                            <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#495B67] to-[#5d7a8a]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium text-white bg-black/30 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-black/50"
                        >
                            <Icon name="photo" className="w-3.5 h-3.5 inline-block" /> Change Cover
                        </button>
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </div>

                    <div className="p-6">
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
                            <button onClick={() => setShowEditDetails(true)} className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                                <Icon name="pencil" className="w-3.5 h-3.5 inline-block mr-1" /> Edit Details
                            </button>
                            {course.status === 'draft' && (
                                <button onClick={() => { setShowPublishWizard(true); setPublishStep(1); }} className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                                    Publish Course
                                </button>
                            )}
                            <button
                                onClick={() => setShowSaveTemplateConfirm(true)}
                                className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                            >
                                Save as Template
                            </button>
                            <button onClick={() => setShowAssignModal(true)} className="px-3 py-2 text-xs font-medium text-white rounded-lg" style={{ backgroundColor: '#495B67' }}>
                                Assign Users
                            </button>
                        </div>
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
                                                    <button onClick={() => router.delete(route('admin.courses.destroy-section', section.id), { preserveScroll: true, onSuccess: () => showToast('success', 'Section deleted.'), onError: () => showToast('error', 'Failed to delete section.') })} className="text-xs text-red-400 hover:text-red-600">
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
                                                                        <button onClick={() => router.delete(route('admin.courses.destroy-object', obj.id), { preserveScroll: true, onSuccess: () => showToast('success', 'Lesson removed.'), onError: () => showToast('error', 'Failed to remove lesson.') })} className="px-2 py-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
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
                    <div className="space-y-5">
                        {/* Segment Assignment */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Assign by Segment</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setShowAssignAllConfirm(true)}
                                    className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                                >
                                    All Employees
                                </button>
                                {departments.map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => router.post(route('admin.courses.segment-assign', course.id), { rule_type: 'department', rule_value: d }, { preserveScroll: true, onSuccess: () => showToast('success', `Department "${d}" assigned.`), onError: () => showToast('error', 'Failed to assign department.') })}
                                        className="px-3 py-2 text-xs font-medium text-slate-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                                    >
                                        Dept: {d}
                                    </button>
                                ))}
                                {roles.map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => router.post(route('admin.courses.segment-assign', course.id), { rule_type: 'role', rule_value: r }, { preserveScroll: true, onSuccess: () => showToast('success', `Role "${r}" assigned.`), onError: () => showToast('error', 'Failed to assign role.') })}
                                        className="px-3 py-2 text-xs font-medium text-slate-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition"
                                    >
                                        Role: {r}
                                    </button>
                                ))}
                            </div>
                            {audienceRules.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 mb-2">Active audience rules:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {audienceRules.map((rule) => (
                                            <span key={rule.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
                                                {rule.rule_type === 'all' ? 'All Employees' : `${rule.rule_type}: ${rule.rule_value}`}
                                                <button onClick={() => router.delete(route('admin.courses.remove-audience-rule', rule.id), { preserveScroll: true, onSuccess: () => showToast('success', 'Audience rule removed.'), onError: () => showToast('error', 'Failed to remove rule.') })} className="text-emerald-400 hover:text-red-500 transition">
                                                    <Icon name="x-mark" className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

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
                                                <button onClick={() => router.delete(route('admin.courses.remove-assignment', a.id), { preserveScroll: true, onSuccess: () => showToast('success', 'Assignment removed.'), onError: () => showToast('error', 'Failed to remove assignment.') })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>
                )}
            </div>

            {/* ── Add Section Modal ── */}
            {showAddSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddSection(false)}>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAddObjectSectionId(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Add Content</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Add a new lesson to this section</p>
                            </div>
                            <button onClick={() => setAddObjectSectionId(null)} className="text-slate-400 hover:text-slate-600 transition">
                                <Icon name="x-mark" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <form id="add-object-form" onSubmit={submitObject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Content Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(typeLabels).map(([k, v]) => (
                                            <button
                                                key={k}
                                                type="button"
                                                onClick={() => objectForm.setData('type', k)}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                                                    objectForm.data.type === k
                                                        ? 'border-[#495B67] bg-[#495B67]/5 text-[#495B67]'
                                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                            >
                                                <Icon name={typeIcons[k]} className="w-5 h-5" />
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                        <input type="text" value={objectForm.data.title} onChange={(e) => objectForm.setData('title', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" placeholder="Lesson title" required />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                                        <input type="number" min="1" value={objectForm.data.duration_minutes} onChange={(e) => objectForm.setData('duration_minutes', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Optional" />
                                    </div>
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
                                            minHeight="200px"
                                        />
                                    </div>
                                )}
                                {(objectForm.data.type === 'video' || objectForm.data.type === 'link') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{objectForm.data.type === 'video' ? 'Video URL' : 'Link URL'}</label>
                                        <input type="url" value={objectForm.data.content} onChange={(e) => objectForm.setData('content', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" placeholder="https://" />
                                        {objectForm.data.type === 'video' && (
                                            <p className="text-xs text-slate-400 mt-1">Supports YouTube, Vimeo, or direct video file URLs</p>
                                        )}
                                    </div>
                                )}
                                {(objectForm.data.type === 'image' || objectForm.data.type === 'document') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Upload File or Enter URL</label>
                                        <input type="url" value={objectForm.data.content} onChange={(e) => objectForm.setData('content', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2" placeholder="https:// or upload below" />
                                        <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-[#495B67] hover:text-[#495B67] cursor-pointer transition">
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
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                            <button type="button" onClick={() => setAddObjectSectionId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                            <button type="submit" form="add-object-form" disabled={objectForm.processing} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition" style={{ backgroundColor: '#495B67' }}>Add Content</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Object Modal ── */}
            {editingObject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditingObject(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Edit Content</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
                                        <Icon name={typeIcons[editingObject.type]} className="w-3 h-3 text-slate-500" />
                                    </span>
                                    <span className="text-xs text-slate-400">{typeLabels[editingObject.type]}</span>
                                </div>
                            </div>
                            <button onClick={() => setEditingObject(null)} className="text-slate-400 hover:text-slate-600 transition">
                                <Icon name="x-mark" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <form id="edit-object-form" onSubmit={submitEditObject} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" required />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                                        <input type="number" min="1" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Optional" />
                                    </div>
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
                                            minHeight="200px"
                                        />
                                    </div>
                                )}
                                {(editingObject.type === 'video' || editingObject.type === 'link') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{editingObject.type === 'video' ? 'Video URL' : 'Link URL'}</label>
                                        <input type="url" value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]" placeholder="https://" />
                                        {editingObject.type === 'video' && (
                                            <p className="text-xs text-slate-400 mt-1">Supports YouTube, Vimeo, or direct video file URLs</p>
                                        )}
                                    </div>
                                )}
                                {(editingObject.type === 'image' || editingObject.type === 'document') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">File URL</label>
                                        <input type="url" value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2" placeholder="https://" />
                                        <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-[#495B67] hover:text-[#495B67] cursor-pointer transition">
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
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                            <button type="button" onClick={() => setEditingObject(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                            <button type="submit" form="edit-object-form" className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition" style={{ backgroundColor: '#495B67' }}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Users Modal ── */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}>
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

            {/* ── Publish Wizard Modal ── */}
            {showPublishWizard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPublishWizard(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Wizard Header */}
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Publish Course</h2>
                            <div className="flex items-center gap-2 mt-3">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="flex items-center gap-2 flex-1">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${publishStep >= step ? 'text-white' : 'bg-slate-100 text-slate-400'}`} style={publishStep >= step ? { backgroundColor: '#495B67' } : {}}>
                                            {publishStep > step ? <Icon name="check" className="w-3.5 h-3.5" /> : step}
                                        </div>
                                        <span className={`text-xs font-medium hidden sm:block ${publishStep >= step ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {step === 1 ? 'Review' : step === 2 ? 'Audience' : 'Confirm'}
                                        </span>
                                        {step < 3 && <div className={`flex-1 h-0.5 ${publishStep > step ? 'bg-[#495B67]' : 'bg-slate-100'}`} />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                            {/* Step 1: Review Content */}
                            {publishStep === 1 && (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-slate-900">{course.title}</h3>
                                        {course.description && <p className="text-sm text-slate-500 mt-1">{course.description}</p>}
                                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Icon name="squares-2x2" className="w-3.5 h-3.5" /> {course.sections.length} sections</span>
                                            <span className="flex items-center gap-1"><Icon name="document" className="w-3.5 h-3.5" /> {course.sections.reduce((acc, s) => acc + s.objects.length, 0)} lessons</span>
                                            {course.estimated_minutes && <span className="flex items-center gap-1"><Icon name="stopwatch" className="w-3.5 h-3.5" /> {course.estimated_minutes} min</span>}
                                            {course.category && <span className="flex items-center gap-1"><Icon name="tag" className="w-3.5 h-3.5" /> {course.category.name}</span>}
                                        </div>
                                    </div>

                                    {course.sections.length === 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-sm text-amber-700">
                                            <Icon name="exclamation-triangle" className="w-4 h-4 flex-shrink-0" />
                                            This course has no sections or content yet.
                                        </div>
                                    )}
                                    {course.sections.some((s) => s.objects.length === 0) && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-sm text-amber-700">
                                            <Icon name="exclamation-triangle" className="w-4 h-4 flex-shrink-0" />
                                            Some sections have no content: {course.sections.filter((s) => s.objects.length === 0).map((s) => s.title).join(', ')}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {course.sections.map((section) => (
                                            <div key={section.id} className="bg-white border border-slate-200 rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-800">{section.title}</span>
                                                    <span className="text-xs text-slate-400">{section.objects.length} lesson{section.objects.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Audience */}
                            {publishStep === 2 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-500">Choose who should be assigned this course.</p>

                                    <div className="space-y-2">
                                        {([
                                            ['none', 'No one right now', 'Publish without assigning — you can assign later'],
                                            ['all', 'All employees', `Assign to all ${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''}`],
                                            ['selected', 'Select specific people', 'Choose individual team members'],
                                        ] as const).map(([value, label, desc]) => (
                                            <label key={value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${publishAssignTo === value ? 'border-[#495B67] bg-[#495B67]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <input type="radio" name="assign_to" value={value} checked={publishAssignTo === value} onChange={() => setPublishAssignTo(value)} className="mt-0.5 text-[#495B67] focus:ring-[#495B67]" />
                                                <div>
                                                    <span className="text-sm font-medium text-slate-800">{label}</span>
                                                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    {publishAssignTo === 'selected' && (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Search team members..."
                                                value={publishSearch}
                                                onChange={(e) => setPublishSearch(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                            />
                                            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-1 space-y-0.5">
                                                {teamMembers.filter((m) => {
                                                    const q = publishSearch.toLowerCase();
                                                    return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.department && m.department.toLowerCase().includes(q));
                                                }).map((m) => (
                                                    <label key={m.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={publishSelectedUsers.includes(m.id)}
                                                            onChange={() => setPublishSelectedUsers((prev) => prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id])}
                                                            className="rounded border-slate-300 text-[#495B67] focus:ring-[#495B67]"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm text-slate-700">{m.name}</span>
                                                            {m.department && <span className="text-xs text-slate-400 ml-2">{m.department}</span>}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-400">{publishSelectedUsers.length} selected</p>
                                        </div>
                                    )}

                                    {publishAssignTo !== 'none' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date (optional)</label>
                                                <input
                                                    type="date"
                                                    value={publishDueDate}
                                                    onChange={(e) => setPublishDueDate(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#495B67] focus:border-[#495B67]"
                                                />
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={publishAutoAssign}
                                                    onChange={(e) => setPublishAutoAssign(e.target.checked)}
                                                    className="rounded border-slate-300 text-[#495B67] focus:ring-[#495B67]"
                                                />
                                                <span className="text-sm text-slate-700">Auto-assign to new hires</span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Confirm */}
                            {publishStep === 3 && (
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                            <Icon name="check-circle" className="w-6 h-6 text-green-600" />
                                        </div>
                                        <h3 className="font-semibold text-green-800">Ready to Publish</h3>
                                        <p className="text-sm text-green-600 mt-1">Review the settings below and confirm.</p>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-sm text-slate-500">Course</span>
                                            <span className="text-sm font-medium text-slate-900">{course.title}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-sm text-slate-500">Sections</span>
                                            <span className="text-sm font-medium text-slate-900">{course.sections.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-sm text-slate-500">Lessons</span>
                                            <span className="text-sm font-medium text-slate-900">{course.sections.reduce((acc, s) => acc + s.objects.length, 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-sm text-slate-500">Assign to</span>
                                            <span className="text-sm font-medium text-slate-900">
                                                {publishAssignTo === 'none' && 'No one'}
                                                {publishAssignTo === 'all' && `All employees (${teamMembers.length})`}
                                                {publishAssignTo === 'selected' && `${publishSelectedUsers.length} selected`}
                                            </span>
                                        </div>
                                        {publishDueDate && (
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-sm text-slate-500">Due Date</span>
                                                <span className="text-sm font-medium text-slate-900">{new Date(publishDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        )}
                                        {publishAutoAssign && (
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-sm text-slate-500">Auto-assign new hires</span>
                                                <span className="text-sm font-medium text-emerald-600">Yes</span>
                                            </div>
                                        )}
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={publishNotify}
                                            onChange={(e) => setPublishNotify(e.target.checked)}
                                            className="rounded border-slate-300 text-[#495B67] focus:ring-[#495B67]"
                                        />
                                        <span className="text-sm text-slate-700">Send notification to assigned users</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Wizard Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-between">
                            <button
                                onClick={() => publishStep === 1 ? setShowPublishWizard(false) : setPublishStep((s) => s - 1)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {publishStep === 1 ? 'Cancel' : 'Back'}
                            </button>
                            {publishStep < 3 ? (
                                <button
                                    onClick={() => setPublishStep((s) => s + 1)}
                                    className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
                                    style={{ backgroundColor: '#495B67' }}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setPublishLoading(true);
                                        router.post(route('admin.courses.publish', course.id), {
                                            assign_to: publishAssignTo,
                                            user_ids: publishAssignTo === 'selected' ? publishSelectedUsers : [],
                                            due_date: publishDueDate || null,
                                            auto_assign_new_hires: publishAutoAssign,
                                            notify: publishNotify,
                                        }, {
                                            preserveScroll: true,
                                            onSuccess: () => showToast('success', 'Course published successfully!'),
                                            onError: () => showToast('error', 'Failed to publish course.'),
                                            onFinish: () => { setPublishLoading(false); setShowPublishWizard(false); },
                                        });
                                    }}
                                    disabled={publishLoading}
                                    className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                                    style={{ backgroundColor: '#16a34a' }}
                                >
                                    {publishLoading ? 'Publishing...' : 'Publish Now'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Save as Template Confirm ── */}
            {showSaveTemplateConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSaveTemplateConfirm(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[#495B67]/10 flex items-center justify-center mx-auto mb-4">
                                <Icon name="rectangle-stack" className="w-7 h-7 text-[#495B67]" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Save as Template</h3>
                            <p className="text-sm text-slate-500">Save <span className="font-semibold text-slate-700">"{course.title}"</span> as a reusable template?</p>
                            <p className="text-xs text-slate-400 mt-1">All sections and lessons will be saved. You can use this template to create new courses.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                            <button onClick={() => setShowSaveTemplateConfirm(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition">Cancel</button>
                            <button
                                onClick={() => { router.post(route('admin.courses.save-as-template', course.id), {}, { preserveScroll: true, onSuccess: () => showToast('success', 'Saved as template.'), onError: () => showToast('error', 'Failed to save template.') }); setShowSaveTemplateConfirm(false); }}
                                className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition" style={{ backgroundColor: '#495B67' }}
                            >Save Template</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign All Employees Confirm ── */}
            {showAssignAllConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAssignAllConfirm(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                <Icon name="users" className="w-7 h-7 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Assign to All Employees</h3>
                            <p className="text-sm text-slate-500">This will assign <span className="font-semibold text-slate-700">"{course.title}"</span> to every employee in your organization.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                            <button onClick={() => setShowAssignAllConfirm(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition">Cancel</button>
                            <button
                                onClick={() => { router.post(route('admin.courses.segment-assign', course.id), { rule_type: 'all', rule_value: null }, { preserveScroll: true, onSuccess: () => showToast('success', 'Assigned to all employees.'), onError: () => showToast('error', 'Failed to assign.') }); setShowAssignAllConfirm(false); }}
                                className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition" style={{ backgroundColor: '#495B67' }}
                            >Assign All</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Course Details Modal ── */}
            {showEditDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowEditDetails(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Edit Course Details</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Update the course information</p>
                        </div>
                        <EditDetailsForm course={course} onClose={() => setShowEditDetails(false)} />
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

/* ── Separate component to use its own useForm ── */
function EditDetailsForm({ course, onClose }: { course: Props['course']; onClose: () => void }) {
    const form = useForm({
        title: course.title,
        description: course.description || '',
        is_mandatory: course.is_mandatory,
        estimated_minutes: course.estimated_minutes || ('' as string | number),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(route('admin.courses.update', course.id), {
            preserveScroll: true,
            onSuccess: () => { onClose(); showToast('success', 'Course details updated.'); },
            onError: () => showToast('error', 'Failed to update course details.'),
        });
    };

    return (
        <form onSubmit={submit}>
            <div className="px-6 py-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input type="text" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition" placeholder="What will employees learn?" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Minutes</label>
                    <input type="number" min="1" value={form.data.estimated_minutes} onChange={(e) => form.setData('estimated_minutes', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition" placeholder="30" />
                </div>
                <label className="flex items-center gap-2.5 text-sm text-slate-700 py-1">
                    <input type="checkbox" checked={form.data.is_mandatory} onChange={(e) => form.setData('is_mandatory', e.target.checked)} className="rounded border-slate-300 text-[#495B67] focus:ring-[#495B67] w-4 h-4" />
                    Mandatory training
                </label>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 transition">Cancel</button>
                <button type="submit" disabled={form.processing} className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition" style={{ backgroundColor: '#495B67' }}>
                    {form.processing ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
