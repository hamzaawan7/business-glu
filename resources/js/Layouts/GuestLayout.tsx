import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-50 pt-6 sm:justify-center sm:pt-0">
            <div className="flex flex-col items-center">
                <Link href="/">
                    <ApplicationLogo size="xl" />
                </Link>
                <p className="text-center text-sm text-brand-accent mt-2">
                    Connecting the pieces that make your business stick
                </p>
            </div>

            <div className="mt-8 w-full overflow-hidden bg-white px-6 py-8 shadow-sm border border-gray-200 sm:max-w-md sm:rounded-xl">
                {children}
            </div>
        </div>
    );
}
