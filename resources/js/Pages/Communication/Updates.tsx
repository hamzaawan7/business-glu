import ModulePage from '@/Components/ModulePage';

const UpdatesIcon = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
    </svg>
);

export default function Updates() {
    return (
        <ModulePage
            title="Updates"
            description="Company-wide announcements with read tracking, comments, and social engagement features."
            icon={<UpdatesIcon />}
            phase="Phase 2"
            features={[
                'Company-wide announcements',
                'Targeted updates by team or role',
                'Rich text with images & attachments',
                'Read receipt tracking',
                'Comments & reactions',
                'Schedule posts for later',
                'Pin important announcements',
                'Auto-reminders for unread updates',
            ]}
        />
    );
}
