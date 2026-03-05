import UserLayout from '@/Layouts/UserLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function MyTimeClock() {
    const user = usePage().props.auth.user;
    const [isClockedIn, setIsClockedIn] = useState(false);

    return (
        <UserLayout title="Time Clock">
            <Head title="Time Clock" />

            <div className="space-y-5 max-w-lg mx-auto">
                {/* Clock button */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
                    <p className="text-sm text-brand-accent mb-4">
                        {isClockedIn ? "You're currently clocked in" : 'Ready to start your shift?'}
                    </p>

                    <button
                        onClick={() => setIsClockedIn(!isClockedIn)}
                        className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full text-white font-bold text-lg font-heading shadow-lg transition-all active:scale-95 ${
                            isClockedIn
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                                : 'bg-green-500 hover:bg-green-600 shadow-green-200'
                        }`}
                    >
                        {isClockedIn ? 'Clock Out' : 'Clock In'}
                    </button>

                    {isClockedIn && (
                        <div className="mt-4">
                            <p className="text-xs text-brand-accent">Clocked in at</p>
                            <p className="text-sm font-semibold text-brand-primary">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Today's summary */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Today
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-brand-accent">Hours Today</p>
                            <p className="text-lg font-bold font-heading text-brand-primary">0h 0m</p>
                        </div>
                        <div>
                            <p className="text-xs text-brand-accent">Hours This Week</p>
                            <p className="text-lg font-bold font-heading text-brand-primary">0h 0m</p>
                        </div>
                    </div>
                </div>

                {/* Recent entries */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Recent Entries
                    </h3>
                    <div className="text-center py-8">
                        <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-brand-accent mt-2">No time entries yet</p>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
