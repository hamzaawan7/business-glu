import ModulePage from '@/Components/ModulePage';

const KnowledgeIcon = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

export default function KnowledgeBase() {
    return (
        <ModulePage
            title="Knowledge Base"
            description="Centralized company knowledge with articles, categories, and full-text search."
            icon={<KnowledgeIcon />}
            phase="Phase 3"
            features={[
                'Rich text articles with media',
                'Categories & sub-categories',
                'Full-text search across all content',
                'Version history & change tracking',
                'Permission-based access control',
                'Bookmarks & favorites',
                'Article analytics (views, reads)',
                'Comment & feedback on articles',
            ]}
            status="coming-soon"
        />
    );
}
