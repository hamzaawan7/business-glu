import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';

export default function MyTasks() {
    return (
        <UserLayout title="My Tasks">
            <Head title="My Tasks" />

            <div className="space-y-4 max-w-lg mx-auto">
                {/* Filters */}
                <div className="flex gap-2">
                    {['All', 'Pending', 'In Progress', 'Done'].map((filter, i) => (
                        <button
                            key={filter}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                i === 0
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-white border border-gray-200 text-brand-accent hover:text-brand-primary'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Empty state */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
                    </svg>
                    <h3 className="mt-3 text-base font-semibold font-heading text-brand-primary">No tasks assigned</h3>
                    <p className="text-sm text-brand-accent mt-1">
                        When your manager assigns tasks to you, they'll show up here.
                    </p>
                </div>
            </div>
        </UserLayout>
    );
}
