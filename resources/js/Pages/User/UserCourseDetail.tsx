import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import ToastContainer, { showToast } from '@/Components/Toast';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback, useRef } from 'react';

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
    objects: ObjectData[];
}

interface CourseData {
    id: number;
    title: string;
    description: string | null;
    estimated_minutes: number | null;
    cover_image: string | null;
    sections: SectionData[];
}

interface AssignmentData {
    id: number;
    status: string;
    progress_pct: number;
    started_at: string | null;
    completed_at: string | null;
}

interface CertificateData {
    id: number;
    certificate_number: string;
    issued_at: string;
}

interface Props {
    course: CourseData;
    assignment: AssignmentData;
    completedObjectIds: number[];
    certificate: CertificateData | null;
}

const typeIcons: Record<string, string> = { text: 'pencil', video: 'video-camera', document: 'document', image: 'photo', link: 'link', quiz: 'question-mark-circle' };
const typeLabels: Record<string, string> = { text: 'Text', video: 'Video', document: 'Document', image: 'Image', link: 'Link', quiz: 'Quiz' };

function isYouTubeUrl(url: string): boolean {
    return /(?:youtube\.com\/(?:watch|embed)|youtu\.be\/)/.test(url);
}

function isVimeoUrl(url: string): boolean {
    return /vimeo\.com/.test(url);
}

function getYouTubeEmbedUrl(url: string): string {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function getVimeoEmbedUrl(url: string): string {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : url;
}

function isPdf(url: string): boolean {
    return url.toLowerCase().endsWith('.pdf');
}

export default function UserCourseDetail({ course, assignment, completedObjectIds, certificate }: Props) {
    const allObjects = useMemo(() => course.sections.flatMap((s) => s.objects), [course.sections]);

    // Auto-select first incomplete object, or first object
    const firstIncomplete = allObjects.find((o) => !completedObjectIds.includes(o.id));
    const [activeObjectId, setActiveObjectId] = useState<number | null>(firstIncomplete?.id ?? allObjects[0]?.id ?? null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const activeObject = allObjects.find((o) => o.id === activeObjectId) ?? null;

    const totalObjects = allObjects.length;
    const completedCount = completedObjectIds.length;

    const markComplete = useCallback((objectId: number) => {
        router.post(route('courses.complete-object', objectId), {}, {
            preserveScroll: true,
            onSuccess: () => showToast('success', 'Lesson completed!'),
            onError: () => showToast('error', 'Failed to mark lesson as complete.'),
        });
    }, []);

    const navigateToNext = useCallback(() => {
        if (!activeObjectId) return;
        const currentIndex = allObjects.findIndex((o) => o.id === activeObjectId);
        if (currentIndex < allObjects.length - 1) {
            setActiveObjectId(allObjects[currentIndex + 1].id);
        }
    }, [activeObjectId, allObjects]);

    const navigateToPrev = useCallback(() => {
        if (!activeObjectId) return;
        const currentIndex = allObjects.findIndex((o) => o.id === activeObjectId);
        if (currentIndex > 0) {
            setActiveObjectId(allObjects[currentIndex - 1].id);
        }
    }, [activeObjectId, allObjects]);

    const markAndNext = useCallback((objectId: number) => {
        markComplete(objectId);
        // Navigate to next after a brief delay
        const currentIndex = allObjects.findIndex((o) => o.id === objectId);
        if (currentIndex < allObjects.length - 1) {
            setTimeout(() => setActiveObjectId(allObjects[currentIndex + 1].id), 300);
        }
    }, [allObjects, markComplete]);

    const currentIndex = activeObjectId ? allObjects.findIndex((o) => o.id === activeObjectId) : -1;
    const isFirst = currentIndex <= 0;
    const isLast = currentIndex >= allObjects.length - 1;
    const isActiveCompleted = activeObjectId ? completedObjectIds.includes(activeObjectId) : false;

    // Per-section progress
    const sectionProgress = useMemo(() => {
        const map: Record<number, { done: number; total: number }> = {};
        course.sections.forEach((s) => {
            const done = s.objects.filter((o) => completedObjectIds.includes(o.id)).length;
            map[s.id] = { done, total: s.objects.length };
        });
        return map;
    }, [course.sections, completedObjectIds]);

    return (
        <UserLayout>
            <Head title={course.title} />
            <ToastContainer />

            <div className="flex flex-col h-[calc(100vh-64px)]">
                {/* ── Top Progress Bar ── */}
                <div className="bg-white border-b border-slate-200 flex-shrink-0 shadow-sm">
                    <div className="flex items-center gap-4 px-5 lg:px-8 py-3.5">
                        <button onClick={() => router.get(route('courses'))} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition flex-shrink-0">
                            <Icon name="arrow-left" className="w-4 h-4" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm font-bold text-slate-900 truncate">{course.title}</h1>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex-1 max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 rounded-full transition-all duration-700 ease-out"
                                        style={{
                                            width: `${assignment.progress_pct}%`,
                                            background: assignment.status === 'completed'
                                                ? 'linear-gradient(90deg, #059669, #10b981)'
                                                : 'linear-gradient(90deg, #495B67, #6b8090)',
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap tabular-nums">
                                    {completedCount}/{totalObjects} Lessons
                                </span>
                            </div>
                        </div>
                        {assignment.status === 'completed' && (
                            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full flex-shrink-0 ring-1 ring-emerald-200">
                                <Icon name="check-circle" className="w-4 h-4" /> Complete
                            </span>
                        )}
                        {certificate && (
                            <a
                                href={route('courses.certificate-download', certificate.id)}
                                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-lg flex-shrink-0 hover:opacity-90 transition shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #495B67, #3a4a54)' }}
                            >
                                <Icon name="arrow-down-tray" className="w-3.5 h-3.5" /> Certificate
                            </a>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition flex-shrink-0"
                        >
                            <Icon name="bars-3" className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Completion Banner ── */}
                {certificate && (
                    <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                        <div className="px-5 lg:px-8 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Icon name="academic-cap" className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Congratulations! You've completed this course.</p>
                                    <p className="text-xs text-white/80 mt-0.5">Certificate #{certificate.certificate_number}</p>
                                </div>
                            </div>
                            <a
                                href={route('courses.certificate-download', certificate.id)}
                                className="px-5 py-2.5 bg-white text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-50 transition flex items-center gap-2 shadow-sm flex-shrink-0"
                            >
                                <Icon name="arrow-down-tray" className="w-4 h-4" /> Download Certificate
                            </a>
                        </div>
                    </div>
                )}

                {/* ── Main Content Area ── */}
                <div className="flex flex-1 overflow-hidden">
                    {/* ── Left: Content Viewer ── */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/50">
                        {activeObject ? (
                            <div className="flex flex-col h-full">
                                {/* Lesson Header Bar */}
                                <div className="flex-shrink-0 bg-white border-b border-slate-100 px-5 lg:px-8 py-3">
                                    <div className="max-w-5xl mx-auto flex items-center gap-3">
                                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                            isActiveCompleted ? 'bg-emerald-100' : 'bg-[#495B67]'
                                        }`}>
                                            {isActiveCompleted
                                                ? <Icon name="check" className="w-4 h-4 text-emerald-600" />
                                                : <Icon name={typeIcons[activeObject.type]} className="w-4 h-4 text-white" />
                                            }
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-sm font-bold text-slate-900 truncate">{activeObject.title}</h2>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-semibold text-[#495B67] bg-[#495B67]/10 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                    {typeLabels[activeObject.type]}
                                                </span>
                                                {activeObject.duration_minutes && (
                                                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                                        <Icon name="clock" className="w-3 h-3" /> {activeObject.duration_minutes} min
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isActiveCompleted && (
                                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg ring-1 ring-emerald-200">
                                                <Icon name="check-circle" className="w-3.5 h-3.5" /> Done
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-5 lg:p-8 overflow-y-auto">
                                    {/* Video Content */}
                                    {activeObject.type === 'video' && activeObject.content && (
                                        <div className="max-w-4xl mx-auto">
                                            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10">
                                                {activeObject.content.startsWith('/storage/') ? (
                                                    <video
                                                        ref={videoRef}
                                                        src={activeObject.content}
                                                        controls
                                                        className="w-full h-full"
                                                        controlsList="nodownload"
                                                    />
                                                ) : isYouTubeUrl(activeObject.content) ? (
                                                    <iframe
                                                        src={getYouTubeEmbedUrl(activeObject.content)}
                                                        className="w-full h-full"
                                                        allowFullScreen
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    />
                                                ) : isVimeoUrl(activeObject.content) ? (
                                                    <iframe
                                                        src={getVimeoEmbedUrl(activeObject.content)}
                                                        className="w-full h-full"
                                                        allowFullScreen
                                                    />
                                                ) : (
                                                    <iframe src={activeObject.content} className="w-full h-full" allowFullScreen />
                                                )}
                                            </div>

                                        </div>
                                    )}

                                    {/* Text Content */}
                                    {activeObject.type === 'text' && activeObject.content && (
                                        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 lg:p-8">
                                            <div
                                                className="prose prose-sm max-w-none text-slate-700
                                                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
                                                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                                                    [&_p]:leading-relaxed [&_p]:mb-3
                                                    [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                                                    [&_li]:mb-1
                                                    [&_blockquote]:border-l-4 [&_blockquote]:border-[#495B67]/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500
                                                    [&_a]:text-[#495B67] [&_a]:underline
                                                    [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:rounded
                                                    [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-4 [&_img]:shadow-sm"
                                                dangerouslySetInnerHTML={{ __html: activeObject.content }}
                                            />
                                        </div>
                                    )}

                                    {/* Document Content */}
                                    {activeObject.type === 'document' && activeObject.content && (
                                        <div className="max-w-4xl mx-auto">
                                            {isPdf(activeObject.content) ? (
                                                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                                    <iframe
                                                        src={activeObject.content}
                                                        className="w-full border-0"
                                                        style={{ height: '70vh' }}
                                                        title={activeObject.title}
                                                    />
                                                    <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                                                        <span className="text-xs text-slate-400">PDF Document</span>
                                                        <a
                                                            href={activeObject.content}
                                                            download
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#495B67] bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Icon name="arrow-down-tray" className="w-3.5 h-3.5" />
                                                            Download
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <Icon name="document" className="w-8 h-8 text-slate-400" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 mb-1">{activeObject.title}</p>
                                                    <p className="text-xs text-slate-400 mb-4">Document file</p>
                                                    <a
                                                        href={activeObject.content}
                                                        download
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
                                                        style={{ backgroundColor: '#495B67' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Icon name="arrow-down-tray" className="w-4 h-4" />
                                                        Download File
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Image Content */}
                                    {activeObject.type === 'image' && activeObject.content && (
                                        <div className="max-w-4xl mx-auto">
                                            <div className="bg-slate-50 rounded-xl p-4">
                                                <img
                                                    src={activeObject.content}
                                                    alt={activeObject.title}
                                                    className="max-w-full rounded-lg mx-auto shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Link Content */}
                                    {activeObject.type === 'link' && activeObject.content && (
                                        <div className="max-w-3xl mx-auto">
                                            <a
                                                href={activeObject.content}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#495B67]/30 transition group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-[#495B67]/10 flex items-center justify-center flex-shrink-0">
                                                    <Icon name="link" className="w-5 h-5 text-[#495B67]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[#495B67] group-hover:underline truncate">{activeObject.content}</p>
                                                    <p className="text-xs text-slate-400">Opens in a new tab</p>
                                                </div>
                                                <Icon name="arrow-top-right-on-square" className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            </a>
                                        </div>
                                    )}

                                    {/* No content */}
                                    {!activeObject.content && (
                                        <div className="max-w-3xl mx-auto text-center py-16">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                                <Icon name={typeIcons[activeObject.type]} className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-sm text-slate-400">No content available for this lesson</p>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Action Bar */}
                                <div className="flex-shrink-0 border-t border-slate-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
                                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-5 lg:px-8 py-3.5">
                                        {/* Previous */}
                                        <button
                                            onClick={navigateToPrev}
                                            disabled={isFirst}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                                        >
                                            <Icon name="chevron-left" className="w-4 h-4" /> Previous
                                        </button>

                                        {/* Center: Complete / Status + Counter */}
                                        <div className="flex items-center gap-3">
                                            <span className="hidden sm:inline text-xs font-semibold text-slate-400 tabular-nums">
                                                {currentIndex + 1} / {totalObjects}
                                            </span>
                                            {!isActiveCompleted ? (
                                                <button
                                                    onClick={() => activeObjectId && markAndNext(activeObjectId)}
                                                    className="px-7 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition shadow-md hover:shadow-lg flex items-center gap-2"
                                                    style={{ background: 'linear-gradient(135deg, #495B67, #3a4a54)' }}
                                                >
                                                    <Icon name="check" className="w-4 h-4" />
                                                    {isLast ? 'Complete Lesson' : 'Complete & Next'}
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl ring-1 ring-emerald-200">
                                                    <Icon name="check-circle" className="w-4 h-4" /> Completed
                                                </span>
                                            )}
                                        </div>

                                        {/* Next */}
                                        <button
                                            onClick={navigateToNext}
                                            disabled={isLast}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm hover:opacity-90"
                                            style={{ backgroundColor: isLast ? '#94a3b8' : '#495B67' }}
                                        >
                                            Next <Icon name="chevron-right" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* No lesson selected — show course overview */
                            <div className="p-6 lg:p-10">
                                <div className="max-w-2xl mx-auto">
                                    {course.cover_image && (
                                        <div className="rounded-2xl overflow-hidden mb-8 shadow-md ring-1 ring-black/5">
                                            <img src={course.cover_image} alt={course.title} className="w-full h-52 object-cover" />
                                        </div>
                                    )}
                                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">{course.title}</h1>
                                    {course.description && <p className="text-slate-500 mt-3 leading-relaxed text-[15px]">{course.description}</p>}
                                    <div className="flex flex-wrap items-center gap-3 mt-5">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">
                                            <Icon name="book-open" className="w-3.5 h-3.5" /> {totalObjects} lessons
                                        </span>
                                        {course.estimated_minutes && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">
                                                <Icon name="clock" className="w-3.5 h-3.5" /> {course.estimated_minutes} min
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                                            <Icon name="check-circle" className="w-3.5 h-3.5" /> {completedCount} completed
                                        </span>
                                    </div>
                                    {firstIncomplete && (
                                        <button
                                            onClick={() => setActiveObjectId(firstIncomplete.id)}
                                            className="mt-8 px-8 py-3.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition shadow-md hover:shadow-lg flex items-center gap-2"
                                            style={{ background: 'linear-gradient(135deg, #495B67, #3a4a54)' }}
                                        >
                                            {completedCount > 0 ? 'Continue Learning' : 'Start Course'} <Icon name="arrow-right" className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Lesson Sidebar ── */}
                    <div
                        className={`
                            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                            fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-slate-200
                            lg:translate-x-0 lg:static lg:z-auto lg:w-80 lg:flex-shrink-0
                            transition-transform duration-300 ease-in-out
                            flex flex-col overflow-hidden shadow-xl lg:shadow-none
                        `}
                    >
                        {/* Sidebar Header */}
                        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 bg-slate-50/80">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">Course Content</h3>
                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                        {completedCount} of {totalObjects} lessons complete
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="lg:hidden w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500"
                                >
                                    <Icon name="x-mark" className="w-4 h-4" />
                                </button>
                            </div>
                            {/* Mini progress */}
                            <div className="mt-3 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-1.5 rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${totalObjects > 0 ? (completedCount / totalObjects) * 100 : 0}%`,
                                        background: assignment.status === 'completed'
                                            ? 'linear-gradient(90deg, #059669, #10b981)'
                                            : 'linear-gradient(90deg, #495B67, #6b8090)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Sidebar Content */}
                        <div className="flex-1 overflow-y-auto">
                            {course.sections.map((section) => {
                                const sp = sectionProgress[section.id];
                                return (
                                    <div key={section.id}>
                                        {/* Section Header */}
                                        <div className="px-5 py-3 bg-white border-b border-slate-100 sticky top-0 z-10">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider truncate">{section.title}</h4>
                                                <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0 ml-2 tabular-nums bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {sp?.done}/{sp?.total}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Lesson Items */}
                                        <div className="py-1">
                                            {section.objects.map((obj) => {
                                                const isDone = completedObjectIds.includes(obj.id);
                                                const isActive = activeObjectId === obj.id;
                                                return (
                                                    <button
                                                        key={obj.id}
                                                        onClick={() => { setActiveObjectId(obj.id); setSidebarOpen(false); }}
                                                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all border-l-[3px] ${
                                                            isActive
                                                                ? 'bg-[#495B67]/[0.06] border-l-[#495B67]'
                                                                : isDone
                                                                    ? 'border-l-transparent hover:bg-slate-50/80'
                                                                    : 'border-l-transparent hover:bg-slate-50/80'
                                                        }`}
                                                    >
                                                        {/* Status Icon */}
                                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                                            isDone
                                                                ? 'bg-emerald-100'
                                                                : isActive
                                                                    ? 'bg-[#495B67] shadow-sm'
                                                                    : 'bg-slate-100'
                                                        }`}>
                                                            {isDone ? (
                                                                <Icon name="check" className="w-4 h-4 text-emerald-600" />
                                                            ) : isActive ? (
                                                                <Icon name={typeIcons[obj.type]} className="w-4 h-4 text-white" />
                                                            ) : (
                                                                <Icon name={typeIcons[obj.type]} className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </span>
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <span className={`text-[13px] leading-snug block truncate ${
                                                                isDone
                                                                    ? 'text-slate-400 line-through decoration-slate-300'
                                                                    : isActive
                                                                        ? 'text-slate-900 font-semibold'
                                                                        : 'text-slate-700'
                                                            }`}>
                                                                {obj.title}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-medium">
                                                                {typeLabels[obj.type]}
                                                                {obj.duration_minutes ? ` · ${obj.duration_minutes} min` : ''}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile sidebar overlay */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
