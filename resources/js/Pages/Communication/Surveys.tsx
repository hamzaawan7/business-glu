import ModulePage from '@/Components/ModulePage';

const SurveysIcon = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

export default function Surveys() {
    return (
        <ModulePage
            title="Surveys"
            description="Create and distribute surveys with real-time analytics and response tracking."
            icon={<SurveysIcon />}
            phase="Phase 3"
            features={[
                'Customizable survey builder',
                'Multiple question types',
                'Anonymous response options',
                'Real-time results dashboard',
                'Scheduled survey distribution',
                'Reminder notifications',
                'Export results to CSV',
                'Net Promoter Score (NPS) surveys',
            ]}
            status="coming-soon"
        />
    );
}
