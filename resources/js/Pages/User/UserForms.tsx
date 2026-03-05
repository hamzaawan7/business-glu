import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';

export default function UserForms() {
    return (
        <UserLayout title="Forms">
            <Head title="Forms" />

            <div className="space-y-4 max-w-lg mx-auto">
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <h3 className="mt-3 text-base font-semibold font-heading text-brand-primary">No forms to fill</h3>
                    <p className="text-sm text-brand-accent mt-1">
                        When forms are assigned to you, they'll appear here.
                    </p>
                </div>
            </div>
        </UserLayout>
    );
}
