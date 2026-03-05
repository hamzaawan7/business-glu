import ApplicationLogo from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

/* ─── Inline SVG icon components (Heroicons-inspired) ─── */
const IconUsers = ({ className = 'w-8 h-8' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
);

const IconShield = ({ className = 'w-8 h-8' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
);

const IconAcademic = ({ className = 'w-8 h-8' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
);

const IconChat = ({ className = 'w-8 h-8' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
);

const IconChart = ({ className = 'w-8 h-8' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);

const IconDevice = ({ className = 'w-8 h-8' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
);

const pillars = [
    {
        icon: IconAcademic,
        title: 'Train Your Team',
        desc: 'Deliver training courses, quizzes, and onboarding materials your team can access anytime, anywhere.',
    },
    {
        icon: IconChat,
        title: 'Communicate Clearly',
        desc: 'Push notifications, updates, and team announcements that actually get seen — no more lost messages.',
    },
    {
        icon: IconUsers,
        title: 'Build Accountability',
        desc: 'Track progress, assign tasks, and keep your leadership and team aligned on what matters.',
    },
    {
        icon: IconChart,
        title: 'Measure Growth',
        desc: 'See real-time insights on training completion, team engagement, and operational performance.',
    },
    {
        icon: IconShield,
        title: 'Secure & Private',
        desc: 'Your own branded platform — no reliance on social media. Your data stays yours.',
    },
    {
        icon: IconDevice,
        title: 'Web & Mobile',
        desc: 'One app for your whole team — accessible on desktop, tablet, and smartphone.',
    },
];

export default function Welcome({
    auth,
}: PageProps) {
    return (
        <>
            <Head title="Business Glu — Connecting the pieces that make your business stick" />
            <div className="min-h-screen bg-gray-50">
                {/* Nav */}
                <nav className="bg-white border-b border-gray-200">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <Link href="/">
                                <ApplicationLogo size="md" />
                            </Link>
                            <div className="flex items-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark transition"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="rounded-lg px-5 py-2 text-sm font-semibold text-brand-primary hover:bg-gray-100 transition"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark transition"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="py-24 lg:py-32">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <h1 className="font-heading text-5xl lg:text-6xl font-bold text-brand-primary leading-tight">
                            Connecting the pieces that make your business{' '}
                            <span className="text-brand-accent">stick</span>
                        </h1>
                        <p className="mt-6 text-lg text-brand-secondary max-w-2xl mx-auto leading-relaxed">
                            Train and communicate with your team in one place. Business Glu holds
                            everything together for your leadership and team: training,
                            communication, accountability.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-4">
                            <Link
                                href={route('register')}
                                className="rounded-lg bg-brand-primary px-8 py-3 text-base font-semibold text-white hover:bg-brand-primary-dark transition shadow-lg shadow-brand-primary/20"
                            >
                                Start for Free
                            </Link>
                            <Link
                                href={route('login')}
                                className="rounded-lg border-2 border-brand-primary px-8 py-3 text-base font-semibold text-brand-primary hover:bg-brand-primary hover:text-white transition"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Value Pillars */}
                <section className="py-20 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <h2 className="font-heading text-3xl font-bold text-brand-primary text-center mb-4">
                            Everything your team needs — in one place
                        </h2>
                        <p className="text-brand-accent text-center mb-16 max-w-2xl mx-auto">
                            Ditch the reliance on ever-changing social media platforms and get your own team app.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {pillars.map((pillar) => (
                                <div
                                    key={pillar.title}
                                    className="rounded-xl border border-gray-200 p-8 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-200"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                                        <pillar.icon />
                                    </div>
                                    <h3 className="font-heading font-semibold text-lg text-brand-primary mt-4 mb-2">
                                        {pillar.title}
                                    </h3>
                                    <p className="text-brand-secondary text-sm leading-relaxed">
                                        {pillar.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-brand-primary">
                    <div className="mx-auto max-w-3xl px-6 text-center">
                        <h2 className="font-heading text-3xl font-bold text-white mb-4">
                            Ready to hold your team together?
                        </h2>
                        <p className="text-white/70 mb-8">
                            Get started today — no credit card required.
                        </p>
                        <Link
                            href={route('register')}
                            className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-brand-primary hover:bg-gray-100 transition shadow-lg"
                        >
                            Create Your Team App
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 bg-gray-50 border-t border-gray-200">
                    <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
                        <ApplicationLogo size="sm" />
                        <p className="text-sm text-brand-accent">
                            &copy; {new Date().getFullYear()} Business Glu. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
