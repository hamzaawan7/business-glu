import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, router } from '@inertiajs/react';

interface AcceptInvitationProps {
    invitation: {
        token: string;
        email: string;
        role: string;
        company_name: string;
    };
}

export default function AcceptInvitation({ invitation }: AcceptInvitationProps) {
    const { post, processing } = useForm({});

    const handleAccept = () => {
        post(route('invitation.accept', invitation.token));
    };

    return (
        <GuestLayout>
            <Head title="Accept Invitation" />

            <div className="text-center space-y-6">
                {/* Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
                    <svg className="h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                </div>

                {/* Content */}
                <div>
                    <h2 className="text-2xl font-bold font-heading text-brand-primary">
                        You're Invited!
                    </h2>
                    <p className="text-sm text-brand-accent mt-2">
                        You've been invited to join <strong className="text-brand-primary">{invitation.company_name}</strong> as
                        a <span className="capitalize font-medium">{invitation.role}</span>.
                    </p>
                </div>

                {/* Invitation details */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <div className="flex justify-between py-1">
                        <span className="text-brand-accent">Email</span>
                        <span className="text-brand-secondary font-medium">{invitation.email}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-brand-accent">Company</span>
                        <span className="text-brand-secondary font-medium">{invitation.company_name}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-brand-accent">Role</span>
                        <span className="text-brand-secondary font-medium capitalize">{invitation.role}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleAccept}
                        disabled={processing}
                        className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
                    >
                        {processing ? 'Joining...' : 'Accept & Join Team'}
                    </button>
                    <p className="text-xs text-gray-400">
                        You may need to log in or create an account to accept this invitation.
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
