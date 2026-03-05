import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';

export default function UserKnowledgeBase() {
    return (
        <UserLayout title="Knowledge Base">
            <Head title="Knowledge Base" />

            <div className="space-y-4 max-w-lg mx-auto">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search articles..."
                        className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-brand-primary focus:ring-brand-primary"
                    />
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <p className="text-sm text-brand-accent mt-3">No articles published yet.</p>
                </div>
            </div>
        </UserLayout>
    );
}
