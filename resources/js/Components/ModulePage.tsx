import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

interface ModulePageProps {
    title: string;
    description: string;
    icon: ReactNode;
    phase: string;
    features: string[];
    status?: 'active' | 'coming-soon';
}

export default function ModulePage({
    title,
    description,
    icon,
    phase,
    features,
    status = 'active',
    children,
}: PropsWithChildren<ModulePageProps>) {
    return (
        <AppLayout title={title}>
            <Head title={title} />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Module header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-brand-primary/10 p-3 text-brand-primary">
                            {icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold font-heading text-brand-primary">{title}</h2>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                    status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {status === 'active' ? 'Active' : 'Coming Soon'}
                                </span>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-medium">
                                    {phase}
                                </span>
                            </div>
                            <p className="text-sm text-brand-accent mt-1">{description}</p>
                        </div>
                    </div>
                </div>

                {/* Feature list */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                            Features
                        </h3>
                        <ul className="space-y-3">
                            {features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-brand-secondary">
                                    <svg className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        {children ?? (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                                    Module Preview
                                </h3>
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="rounded-full bg-brand-primary/10 p-4 mb-4">
                                        {icon}
                                    </div>
                                    <p className="text-sm text-brand-accent mb-4">
                                        This module is being built. Check back soon for updates!
                                    </p>
                                    <Link
                                        href="/dashboard"
                                        className="text-sm text-brand-primary font-medium hover:underline"
                                    >
                                        ← Back to Dashboard
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
