import ModulePage from '@/Components/ModulePage';

const CalendarIcon = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
);

export default function Scheduling() {
    return (
        <ModulePage
            title="Scheduling"
            description="Create and manage employee schedules with drag-and-drop, templates, and auto-scheduling."
            icon={<CalendarIcon />}
            phase="Phase 1"
            features={[
                'Drag-and-drop shift scheduling',
                'Schedule templates & recurring shifts',
                'Employee availability management',
                'Shift swap & open shift marketplace',
                'Auto-scheduling based on availability',
                'Overtime alerts & labor cost tracking',
                'Push notifications for schedule changes',
                'Multi-location schedule view',
            ]}
        />
    );
}
