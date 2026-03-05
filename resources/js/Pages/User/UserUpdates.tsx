import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';

export default function UserUpdates() {
    return (
        <UserLayout title="Updates">
            <Head title="Updates" />

            <div className="space-y-4 max-w-lg mx-auto">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-sm text-brand-accent">
                        <div className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-brand-primary">Welcome to Business Glu!</p>
                            <p className="text-xs text-brand-accent mt-0.5">Your company is all set up. Stay tuned for updates from your team.</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">Today</span>
                    </div>
                </div>
                <div className="text-center py-4">
                    <p className="text-xs text-gray-400">Company announcements will appear here.</p>
                </div>
            </div>
        </UserLayout>
    );
}
