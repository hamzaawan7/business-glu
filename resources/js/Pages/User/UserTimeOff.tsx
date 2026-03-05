import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';

export default function UserTimeOff() {
    return (
        <UserLayout title="Time Off">
            <Head title="Time Off" />

            <div className="space-y-5 max-w-lg mx-auto">
                {/* Balances */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        My Balances
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'PTO', days: 0, color: 'text-blue-600 bg-blue-50' },
                            { label: 'Sick', days: 0, color: 'text-amber-600 bg-amber-50' },
                            { label: 'Vacation', days: 0, color: 'text-green-600 bg-green-50' },
                        ].map((type) => (
                            <div key={type.label} className="text-center">
                                <div className={`rounded-lg p-3 ${type.color} mb-2`}>
                                    <p className="text-xl font-bold font-heading">{type.days}</p>
                                </div>
                                <p className="text-xs text-brand-accent">{type.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Request button */}
                <button className="w-full rounded-xl bg-brand-primary py-3 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors">
                    Request Time Off
                </button>

                {/* History */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold font-heading text-brand-primary mb-3">
                        Request History
                    </h3>
                    <div className="text-center py-6">
                        <p className="text-sm text-brand-accent">No time off requests yet</p>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
