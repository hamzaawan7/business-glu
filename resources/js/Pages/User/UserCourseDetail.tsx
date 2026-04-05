import UserLayout from '@/Layouts/UserLayout';
import Icon from '@/Components/Icon';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

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
    sections: SectionData[];
}

interface AssignmentData {
    id: number;
    status: string;
    progress_pct: number;
    started_at: string | null;
    completed_at: string | null;
}

interface Props {
    course: CourseData;
    assignment: AssignmentData;
    completedObjectIds: number[];
}

const typeIcons: Record<string, string> = { text: 'pencil', video: 'video-camera', document: 'document', image: 'photo', link: 'link', quiz: 'question-mark-circle' };

export default function UserCourseDetail({ course, assignment, completedObjectIds }: Props) {
    const [activeObjectId, setActiveObjectId] = useState<number | null>(null);

    const activeObject = course.sections
        .flatMap((s) => s.objects)
        .find((o) => o.id === activeObjectId);

    const totalObjects = course.sections.reduce((sum, s) => sum + s.objects.length, 0);
    const completedCount = completedObjectIds.length;

    const markComplete = (objectId: number) => {
        router.post(route('courses.complete-object', objectId), {}, {
            preserveScroll: true,
        });
    };

    return (
        <UserLayout>
            <Head title={course.title} />

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Back */}
                <button onClick={() => router.get(route('user.courses'))} className="text-sm text-[#495B67] hover:underline">
                    ← Back to Courses
                </button>

                {/* Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h1 className="text-lg font-bold text-slate-900">{course.title}</h1>
                    {course.description && <p className="text-sm text-slate-500 mt-1">{course.description}</p>}
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{assignment.progress_pct}% complete ({completedCount}/{totalObjects} items)</span>
                            {assignment.completed_at && <span className="text-green-600">Completed</span>}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                            <div
                                className="h-2.5 rounded-full transition-all"
                                style={{ width: `${assignment.progress_pct}%`, backgroundColor: assignment.status === 'completed' ? '#16a34a' : '#495B67' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Content Viewer */}
                {activeObject && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xl"><Icon name={typeIcons[activeObject.type]} className="w-4 h-4 inline-block" /></span>
                                <h2 className="font-semibold text-slate-900">{activeObject.title}</h2>
                            </div>
                            <button onClick={() => setActiveObjectId(null)} className="text-xs text-slate-400 hover:text-slate-600"><Icon name="x-mark" className="w-3.5 h-3.5 inline-block" /> Close</button>
                        </div>

                        {/* Render content by type */}
                        {activeObject.type === 'text' && activeObject.content && (
                            <div
                                className="prose prose-sm max-w-none text-slate-700
                                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
                                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
                                    [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                                    [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic
                                    [&_a]:text-[#495B67] [&_a]:underline
                                    [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:rounded
                                    [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-3"
                                dangerouslySetInnerHTML={{ __html: activeObject.content }}
                            />
                        )}
                        {activeObject.type === 'video' && activeObject.content && (
                            <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                                <iframe src={activeObject.content} className="w-full h-full" allowFullScreen />
                            </div>
                        )}
                        {activeObject.type === 'image' && activeObject.content && (
                            <img src={activeObject.content} alt={activeObject.title} className="max-w-full rounded-lg" />
                        )}
                        {activeObject.type === 'link' && activeObject.content && (
                            <a href={activeObject.content} target="_blank" rel="noopener noreferrer" className="text-[#495B67] hover:underline text-sm">
                                {activeObject.content}
                            </a>
                        )}
                        {activeObject.type === 'document' && activeObject.content && (
                            <a href={activeObject.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200">
                                <Icon name="document" className="w-4 h-4 inline-block" /> View Document
                            </a>
                        )}

                        {/* Mark Complete */}
                        {!completedObjectIds.includes(activeObject.id) && (
                            <button
                                onClick={() => markComplete(activeObject.id)}
                                className="mt-6 w-full py-3 text-sm font-medium text-white rounded-lg"
                                style={{ backgroundColor: '#495B67' }}
                            >
                                <Icon name="check" className="w-3.5 h-3.5 inline-block" />  Mark as Complete
                            </button>
                        )}
                        {completedObjectIds.includes(activeObject.id) && (
                            <div className="mt-6 py-3 text-center text-sm text-green-600 bg-green-50 rounded-lg">
                                <Icon name="check-circle" className="w-4 h-4 inline-block" /> Completed
                            </div>
                        )}
                    </div>
                )}

                {/* Sections & Objects Outline */}
                <div className="space-y-4">
                    {course.sections.map((section) => (
                        <div key={section.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-900 text-sm">{section.title}</h3>
                                {section.description && <p className="text-xs text-slate-400">{section.description}</p>}
                            </div>
                            <div className="divide-y divide-slate-50">
                                {section.objects.map((obj) => {
                                    const isDone = completedObjectIds.includes(obj.id);
                                    const isActive = activeObjectId === obj.id;
                                    return (
                                        <button
                                            key={obj.id}
                                            onClick={() => setActiveObjectId(obj.id)}
                                            className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 transition ${isActive ? 'bg-[#495B67]/5' : ''}`}
                                        >
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isDone ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {isDone ? 'check' : typeIcons[obj.type]}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{obj.title}</span>
                                                {obj.duration_minutes && <span className="text-xs text-slate-400 ml-2">· {obj.duration_minutes} min</span>}
                                            </div>
                                            <span className="text-xs text-[#495B67]">→</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </UserLayout>
    );
}
