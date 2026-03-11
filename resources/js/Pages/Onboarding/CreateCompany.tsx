import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const industries = [
    'Restaurant / Food Service',
    'Retail',
    'Healthcare',
    'Construction',
    'Cleaning / Janitorial',
    'Logistics / Delivery',
    'Hospitality / Hotels',
    'Security',
    'Manufacturing',
    'Home Services',
    'Education',
    'Fitness / Wellness',
    'Other',
];

const teamSizes = [
    '1–10',
    '11–50',
    '51–200',
    '201–500',
    '500+',
];

export default function CreateCompany() {
    const { data, setData, post, processing, errors } = useForm({
        company_name: '',
        industry: '',
        team_size: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('onboarding.store'));
    };

    return (
        <>
            <Head title="Set Up Your Company" />

            <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 pt-10 sm:justify-center sm:pt-0">
                {/* Logo & header */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/">
                        <ApplicationLogo size="xl" variant="stacked" />
                    </Link>
                </div>

                <div className="w-full max-w-lg">
                    {/* Welcome card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        {/* Step indicator */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white text-sm font-bold">
                                1
                            </div>
                            <div>
                                <h1 className="text-xl font-bold font-heading text-brand-primary">
                                    Set Up Your Company
                                </h1>
                                <p className="text-sm text-brand-accent">
                                    Tell us about your business to get started
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            {/* Company Name */}
                            <div>
                                <InputLabel htmlFor="company_name" value="Company Name *" />
                                <TextInput
                                    id="company_name"
                                    name="company_name"
                                    value={data.company_name}
                                    className="mt-1 block w-full"
                                    placeholder="e.g. Acme Corp"
                                    isFocused={true}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.company_name} className="mt-2" />
                            </div>

                            {/* Industry */}
                            <div>
                                <InputLabel htmlFor="industry" value="Industry" />
                                <select
                                    id="industry"
                                    name="industry"
                                    value={data.industry}
                                    onChange={(e) => setData('industry', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary text-sm"
                                >
                                    <option value="">Select your industry...</option>
                                    {industries.map((ind) => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                                <InputError message={errors.industry} className="mt-2" />
                            </div>

                            {/* Team Size */}
                            <div>
                                <InputLabel value="Team Size" />
                                <div className="mt-2 grid grid-cols-5 gap-2">
                                    {teamSizes.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => setData('team_size', size)}
                                            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                                data.team_size === size
                                                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary'
                                                    : 'border-gray-200 text-brand-secondary hover:border-brand-accent hover:bg-gray-50'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                                <InputError message={errors.team_size} className="mt-2" />
                            </div>

                            {/* Submit */}
                            <div className="pt-2">
                                <PrimaryButton
                                    className="w-full justify-center !py-3 !text-sm !normal-case !tracking-normal"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Creating your workspace...
                                        </span>
                                    ) : (
                                        'Create Company & Continue'
                                    )}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Footer hint */}
                    <p className="mt-4 text-center text-xs text-brand-accent">
                        You can update these details anytime in Settings.
                    </p>

                    {/* Logout link */}
                    <div className="mt-3 text-center">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-xs text-brand-accent hover:text-brand-primary underline"
                        >
                            Sign out and use a different account
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
