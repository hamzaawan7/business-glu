import ModulePage from '@/Components/ModulePage';

const ClockIcon = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function TimeClock() {
    return (
        <ModulePage
            title="Time Clock"
            description="GPS-enabled time tracking with geofencing, automated timesheets, and payroll integration."
            icon={<ClockIcon />}
            phase="Phase 1"
            features={[
                'One-tap clock in/out with GPS tracking',
                'Geofencing — restrict clock-in to job sites',
                'Real-time who\'s clocked in dashboard',
                'Automated timesheet generation',
                'Break tracking & overtime calculations',
                'Manager approval workflow',
                'Export to CSV/PDF for payroll',
                'Kiosk mode for shared devices',
            ]}
        />
    );
}
