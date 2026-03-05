import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    const stats = [
        { label: 'Team Members', value: '—', icon: '👥' },
        { label: 'Clocked In', value: '—', icon: '⏱️' },
        { label: 'Open Tasks', value: '—', icon: '📋' },
        { label: 'Unread Messages', value: '—', icon: '💬' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-brand-primary font-heading">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl">{stat.icon}</span>
                                </div>
                                <p className="text-2xl font-bold font-heading text-brand-primary">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-brand-accent mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Content sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                                Recent Activity
                            </h3>
                            <p className="text-sm text-brand-accent">No activity yet.</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                                Quick Actions
                            </h3>
                            <p className="text-sm text-brand-accent">Set up your workspace to get started.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
