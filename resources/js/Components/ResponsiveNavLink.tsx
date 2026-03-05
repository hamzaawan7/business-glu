import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-brand-primary bg-brand-primary/5 text-brand-primary focus:border-brand-primary-dark focus:bg-brand-primary/10 focus:text-brand-primary-dark'
                    : 'border-transparent text-brand-secondary hover:border-brand-accent hover:bg-gray-50 hover:text-brand-primary focus:border-brand-accent focus:bg-gray-50 focus:text-brand-primary'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
