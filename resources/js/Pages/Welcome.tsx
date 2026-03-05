import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

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
                            <span className="font-heading font-bold text-2xl tracking-tight">
                                <span className="text-brand-primary">Business</span>
                                <span className="text-brand-accent"> Glu</span>
                            </span>
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

                {/* Features */}
                <section className="py-20 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <h2 className="font-heading text-3xl font-bold text-brand-primary text-center mb-4">
                            Everything your team needs
                        </h2>
                        <p className="text-brand-accent text-center mb-16 max-w-2xl mx-auto">
                            Ditch the reliance on ever-changing social media platforms and get your own team app.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { icon: '📚', title: 'Training 24/7', desc: 'Load & view training for your team and leadership around the clock.' },
                                { icon: '🔔', title: 'Push Notifications', desc: 'Communicate with your team via push notifications that actually get seen.' },
                                { icon: '📋', title: 'Tasks & Leads', desc: 'Access your leads, tasks, and notes instantly on your smartphone.' },
                                { icon: '⏱️', title: 'Time Tracking', desc: 'Clock in/out with GPS, manage timesheets, and track overtime automatically.' },
                                { icon: '📅', title: 'Scheduling', desc: 'Build schedules, manage shifts, and handle swaps — all in one place.' },
                                { icon: '💬', title: 'Team Chat', desc: 'Real-time messaging with channels, groups, and direct messages.' },
                            ].map((feature) => (
                                <div
                                    key={feature.title}
                                    className="rounded-xl border border-gray-200 p-8 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-200"
                                >
                                    <span className="text-3xl">{feature.icon}</span>
                                    <h3 className="font-heading font-semibold text-lg text-brand-primary mt-4 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-brand-secondary text-sm leading-relaxed">
                                        {feature.desc}
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
                        <span className="font-heading font-bold text-lg">
                            <span className="text-brand-primary">Business</span>
                            <span className="text-brand-accent"> Glu</span>
                        </span>
                        <p className="text-sm text-brand-accent">
                            &copy; {new Date().getFullYear()} Business Glu. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
