import AdminLayout from '@/Layouts/AdminLayout';
import PhonePreview from '@/Components/PhonePreview';
import Icon from '@/Components/Icon';
import ToastContainer, { showToast } from '@/Components/Toast';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface TemplateObject {
    type: string;
    title: string;
    content?: string;
}

interface TemplateSection {
    title: string;
    description?: string;
    objects: TemplateObject[];
}

interface Template {
    id: number;
    name: string;
    description: string | null;
    category: string;
    cover_image: string | null;
    content: { sections: TemplateSection[] };
    is_system: boolean;
}

interface Props {
    templates: Template[];
    categories: string[];
}

const typeIcons: Record<string, string> = {
    text: 'document-text',
    video: 'play-circle',
    document: 'paper-clip',
    quiz: 'question-mark-circle',
    image: 'photo',
};

export default function CourseTemplates({ templates, categories }: Props) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [selected, setSelected] = useState<Template | null>(templates[0] ?? null);
    const [creating, setCreating] = useState(false);

    const filtered = templates.filter((t) => {
        if (category !== 'all' && t.category !== category) return false;
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const grouped: Record<string, Template[]> = {};
    filtered.forEach((t) => {
        if (!grouped[t.category]) grouped[t.category] = [];
        grouped[t.category].push(t);
    });

    const useTemplate = (template: Template) => {
        setCreating(true);
        router.post(route('admin.courses.from-template'), { template_id: template.id }, {
            onSuccess: () => showToast('success', 'Course created from template.'),
            onError: () => showToast('error', 'Failed to create course from template.'),
            onFinish: () => setCreating(false),
        });
    };

    const totalObjects = (t: Template) =>
        t.content?.sections?.reduce((n, s) => n + (s.objects?.length ?? 0), 0) ?? 0;

    return (
        <AdminLayout>
            <Head title="Course Templates" />
            <ToastContainer />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <button onClick={() => router.visit(route('admin.courses.index'))} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-3 transition">
                        <Icon name="arrow-left" className="w-4 h-4" /> Back to Courses
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">Template Library</h1>
                    <p className="text-sm text-slate-500 mt-1">Choose a pre-built course to get started quickly</p>
                </div>

                <div className="flex gap-6 items-start">
                    {/* ── Left: Filters & List ── */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {/* Search & Filter */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Icon name="magnifying-glass" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition"
                                />
                            </div>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#495B67]/20 focus:border-[#495B67] transition"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Grouped Template List */}
                        {Object.keys(grouped).length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                    <Icon name="rectangle-stack" className="w-7 h-7 text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">No templates match your search</p>
                            </div>
                        )}

                        {Object.entries(grouped).map(([cat, items]) => (
                            <div key={cat}>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{cat}</h3>
                                <div className="space-y-2">
                                    {items.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelected(t)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                                selected?.id === t.id
                                                    ? 'border-[#495B67] bg-[#495B67]/5'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#495B67] to-[#5d7a8a] flex items-center justify-center flex-shrink-0">
                                                <Icon name="academic-cap" className="w-6 h-6 text-white/80" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-slate-800 truncate">{t.name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.description}</div>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                                                    <span>{t.content?.sections?.length ?? 0} sections</span>
                                                    <span>&middot;</span>
                                                    <span>{totalObjects(t)} lessons</span>
                                                    {t.is_system && (
                                                        <>
                                                            <span>&middot;</span>
                                                            <span className="text-[#495B67] font-medium">System</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {selected?.id === t.id && (
                                                <Icon name="check-circle" className="w-5 h-5 text-[#495B67] flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Right: Preview ── */}
                    <div className="hidden lg:flex flex-col items-center gap-4 sticky top-6">
                        {selected ? (
                            <>
                                <PhonePreview title={selected.name} backLabel="Courses">
                                    <div className="flex-1 overflow-y-auto">
                                        {/* Course cover */}
                                        <div className="h-28 bg-gradient-to-br from-[#495B67] to-[#5d7a8a] flex items-end p-3">
                                            <div>
                                                <div className="text-[10px] text-white/80 font-semibold">{selected.name}</div>
                                                <div className="text-[8px] text-white/50 mt-0.5 line-clamp-2">{selected.description}</div>
                                            </div>
                                        </div>

                                        {/* Sections preview */}
                                        <div className="p-3 space-y-2">
                                            {selected.content?.sections?.map((s, si) => (
                                                <div key={si} className="bg-slate-50 rounded-lg p-2">
                                                    <div className="text-[9px] font-bold text-slate-700 mb-1.5">{s.title}</div>
                                                    {s.objects?.map((o, oi) => (
                                                        <div key={oi} className="flex items-center gap-1.5 py-1">
                                                            <div className="w-4 h-4 rounded bg-white flex items-center justify-center flex-shrink-0">
                                                                <Icon name={typeIcons[o.type] ?? 'document-text'} className="w-2.5 h-2.5 text-slate-400" />
                                                            </div>
                                                            <span className="text-[8px] text-slate-600 truncate">{o.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PhonePreview>

                                <button
                                    onClick={() => useTemplate(selected)}
                                    disabled={creating}
                                    className="w-full px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-sm"
                                    style={{ backgroundColor: '#495B67' }}
                                >
                                    {creating ? 'Creating...' : 'Use This Template'}
                                </button>
                            </>
                        ) : (
                            <div className="w-[280px] h-[560px] rounded-[2.5rem] bg-slate-100 flex items-center justify-center">
                                <p className="text-xs text-slate-400 text-center px-8">Select a template to preview</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile: Use Template button when selected (shown below list on small screens) */}
                {selected && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-800 truncate">{selected.name}</div>
                                <div className="text-xs text-slate-400">{selected.content?.sections?.length ?? 0} sections &middot; {totalObjects(selected)} lessons</div>
                            </div>
                            <button
                                onClick={() => useTemplate(selected)}
                                disabled={creating}
                                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition flex-shrink-0"
                                style={{ backgroundColor: '#495B67' }}
                            >
                                {creating ? 'Creating...' : 'Use Template'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
