import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Module {
    key: string;
    label: string;
    enabled: boolean;
}

interface SettingsProps {
    company?: {
        name: string;
        slug: string;
        plan: string;
        modules: Record<string, boolean>;
    };
}

const moduleLabels: Record<string, string> = {
    time_clock: 'Time Clock',
    scheduling: 'Scheduling',
    tasks: 'Quick Tasks',
    forms: 'Forms & Checklists',
    chat: 'Team Chat',
    updates: 'Updates',
    directory: 'Directory',
    knowledge_base: 'Knowledge Base',
    documents: 'Documents',
    time_off: 'Time Off',
    recognition: 'Recognition',
    courses: 'Courses',
    surveys: 'Surveys & Polls',
    events: 'Events',
    help_desk: 'Help Desk',
};

export default function Settings({ company }: SettingsProps) {
    const page = usePage();
    const user = page.props.auth.user;
    const flash = (page.props as any).flash ?? {};

    const isOwner = user.role === 'super_admin' || user.role === 'owner';

    // Company info form
    const companyForm = useForm({
        name: company?.name ?? '',
    });

    const handleSaveCompany: FormEventHandler = (e) => {
        e.preventDefault();
        companyForm.patch(route('admin.settings.update-company'), {
            preserveScroll: true,
        });
    };

    // Module toggles
    const modules = company?.modules ?? {};
    const [togglingModule, setTogglingModule] = useState<string | null>(null);

    const handleToggleModule = (moduleKey: string, currentEnabled: boolean) => {
        setTogglingModule(moduleKey);
        router.patch(
            route('admin.settings.toggle-module'),
            { module: moduleKey, enabled: !currentEnabled },
            {
                preserveScroll: true,
                onFinish: () => setTogglingModule(null),
            }
        );
    };

    return (
        <AdminLayout title="Settings">
            <Head title="Settings" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Flash Messages */}
                {flash.success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                        <p className="text-sm text-green-700">{flash.success}</p>
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                        <p className="text-sm text-red-700">{flash.error}</p>
                    </div>
                )}

                {/* Company Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                        Company Information
                    </h3>
                    <form onSubmit={handleSaveCompany} className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-brand-secondary mb-1">Company Name</label>
                            <input
                                type="text"
                                value={companyForm.data.name}
                                onChange={(e) => companyForm.setData('name', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:ring-brand-primary"
                                disabled={!isOwner}
                            />
                            {companyForm.errors.name && (
                                <p className="text-xs text-red-500 mt-1">{companyForm.errors.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-secondary mb-1">Company Slug</label>
                            <input
                                type="text"
                                value={company?.slug ?? ''}
                                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-500 bg-gray-50"
                                disabled
                            />
                            <p className="text-xs text-gray-400 mt-1">Used for your company subdomain</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-secondary mb-1">Plan</label>
                            <div className="flex items-center gap-3">
                                <span className="inline-block text-sm px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary font-medium capitalize">
                                    {company?.plan ?? 'Free'}
                                </span>
                                <button type="button" className="text-sm text-brand-primary font-medium hover:underline">
                                    Upgrade Plan
                                </button>
                            </div>
                        </div>
                        {isOwner && (
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={companyForm.processing || !companyForm.isDirty}
                                    className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {companyForm.processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Branding */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                        Branding
                    </h3>
                    <div className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-brand-secondary mb-2">Company Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                                <button type="button" className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-brand-secondary hover:bg-gray-50 transition-colors">
                                    Upload Logo
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Logo upload coming soon</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-secondary mb-2">Primary Color</label>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-brand-primary border border-gray-200" />
                                <input
                                    type="text"
                                    defaultValue="#495B67"
                                    className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-brand-primary focus:ring-brand-primary"
                                    disabled
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Custom branding coming soon</p>
                        </div>
                    </div>
                </div>

                {/* Modules */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold font-heading text-brand-primary mb-4">
                        Active Modules
                    </h3>
                    <p className="text-sm text-brand-accent mb-4">
                        Enable or disable modules for your company. Disabled modules will be hidden from the sidebar.
                    </p>
                    <div className="space-y-1">
                        {Object.entries(modules).map(([key, enabled]) => (
                            <div key={key} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50">
                                <span className="text-sm text-brand-secondary">{moduleLabels[key] ?? key}</span>
                                <button
                                    type="button"
                                    onClick={() => handleToggleModule(key, enabled)}
                                    disabled={togglingModule === key}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        enabled ? 'bg-brand-primary' : 'bg-gray-300'
                                    } ${togglingModule === key ? 'opacity-50' : ''}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                {isOwner && (
                    <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold font-heading text-red-600 mb-2">
                            Danger Zone
                        </h3>
                        <p className="text-sm text-brand-accent mb-4">
                            Irreversible actions that affect your entire company.
                        </p>
                        <button
                            type="button"
                            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            Delete Company
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
