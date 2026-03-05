import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from '@/Pages/Profile/Partials/DeleteUserForm';
import UpdatePasswordForm from '@/Pages/Profile/Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from '@/Pages/Profile/Partials/UpdateProfileInformationForm';
import UserLayout from '@/Layouts/UserLayout';
import { usePage } from '@inertiajs/react';

export default function UserProfile({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <UserLayout title="My Profile">
            <Head title="My Profile" />

            <div className="max-w-lg mx-auto space-y-5">
                <div className="bg-white p-5 shadow-sm rounded-2xl border border-gray-200">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="bg-white p-5 shadow-sm rounded-2xl border border-gray-200">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="bg-white p-5 shadow-sm rounded-2xl border border-gray-200">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </UserLayout>
    );
}
