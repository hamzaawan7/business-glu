import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';

export default function MyChat() {
    return (
        <UserLayout title="Chat">
            <Head title="Chat" />

            <div className="space-y-4 max-w-lg mx-auto">
                {/* Search */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-brand-primary focus:ring-brand-primary"
                    />
                </div>

                {/* Conversations */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* General channel */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-sm font-bold">
                            #
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-brand-primary">General</p>
                            <p className="text-xs text-brand-accent truncate">Company-wide channel</p>
                        </div>
                    </div>

                    {/* Team channel */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                            #
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-brand-primary">Team</p>
                            <p className="text-xs text-brand-accent truncate">Your team's channel</p>
                        </div>
                    </div>

                    {/* Empty state for DMs */}
                    <div className="p-6 text-center">
                        <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                        </svg>
                        <p className="text-sm text-brand-accent mt-2">Start a conversation</p>
                        <p className="text-xs text-gray-400 mt-1">Messages from your team will appear here.</p>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
