import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';

export default function MySchedule() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();
    // Map JS getDay() (0=Sun) to our array index (0=Mon)
    const todayIndex = today === 0 ? 6 : today - 1;

    return (
        <UserLayout title="My Schedule">
            <Head title="My Schedule" />

            <div className="space-y-5 max-w-lg mx-auto">
                {/* Week selector */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <button className="text-brand-accent hover:text-brand-primary p-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <p className="text-sm font-semibold font-heading text-brand-primary">This Week</p>
                        <button className="text-brand-accent hover:text-brand-primary p-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => (
                            <div
                                key={day}
                                className={`text-center py-2 rounded-lg text-xs font-medium ${
                                    i === todayIndex
                                        ? 'bg-brand-primary text-white'
                                        : 'text-brand-accent'
                                }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Today's shifts */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Today's Shifts
                    </h3>
                    <div className="text-center py-8">
                        <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <p className="text-sm text-brand-accent mt-2">No shifts scheduled today</p>
                        <p className="text-xs text-gray-400 mt-1">Your manager hasn't published shifts yet.</p>
                    </div>
                </div>

                {/* Upcoming shifts */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Upcoming
                    </h3>
                    <div className="text-center py-6">
                        <p className="text-sm text-brand-accent">No upcoming shifts</p>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
