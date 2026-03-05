import ModulePage from '@/Components/ModulePage';

const DocumentsIcon = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export default function Documents() {
    return (
        <ModulePage
            title="Documents"
            description="Secure document management with e-signatures, version control, and expiry tracking."
            icon={<DocumentsIcon />}
            phase="Phase 2"
            features={[
                'Upload & organize company documents',
                'Employee document requests',
                'E-signature collection',
                'Document expiry tracking & alerts',
                'Version control & history',
                'Permission-based access control',
                'Document categories & tags',
                'Bulk document operations',
            ]}
        />
    );
}
