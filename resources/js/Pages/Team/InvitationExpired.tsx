import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function InvitationExpired() {
    return (
        <GuestLayout>
            <Head title="Invitation Expired" />

            <div className="text-center space-y-6">
                {/* Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                    <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>

                {/* Content */}
                <div>
                    <h2 className="text-2xl font-bold font-heading text-brand-primary">
                        Invitation Expired
                    </h2>
                    <p className="text-sm text-brand-accent mt-2 max-w-sm mx-auto">
                        This invitation link is no longer valid. It may have expired or already been used.
                        Please ask your team administrator to send a new invitation.
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Link
                        href={route('login')}
                        className="inline-block rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark transition-colors"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
