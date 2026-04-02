<?php

namespace Database\Seeders;

use App\Models\UpdateTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    /**
     * Seed realistic update templates for all tenants.
     * Dynamically finds tenants and their owner to avoid hardcoded IDs.
     */
    public function run(): void
    {
        // Find all tenants and seed templates for each
        $owners = User::whereIn('role', ['owner', 'super_admin'])
            ->whereNotNull('tenant_id')
            ->get();

        foreach ($owners as $owner) {
            // Skip if this tenant already has templates (avoid duplicates on re-run)
            $existing = UpdateTemplate::where('tenant_id', $owner->tenant_id)->count();
            if ($existing > 0) {
                echo "Skipping {$owner->tenant_id} — already has {$existing} templates.\n";
                continue;
            }
            $this->seedTenant($owner->tenant_id, $owner->id);
            echo "Seeded 15 templates for {$owner->tenant_id} (user {$owner->id}).\n";
        }
    }

    private function seedTenant(string $tenantId, int $ownerId): void
    {
        $templates = [
            // ── Announcements ────────────────────────────────
            [
                'name'            => 'Company Announcement',
                'title'           => 'Important Announcement',
                'body'            => "Team,\n\nWe have an important update to share with everyone.\n\n[Details here]\n\nPlease read carefully and reach out to your manager if you have any questions.\n\nThank you,\nManagement",
                'type'            => 'announcement',
                'category'        => null,
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => true,
            ],
            [
                'name'            => 'Policy Update',
                'title'           => 'Policy Update — Effective [Date]',
                'body'            => "Hi Team,\n\nWe've made changes to our [policy name] policy. Here are the key updates:\n\n• [Change 1]\n• [Change 2]\n• [Change 3]\n\nThe full policy document is available in the Knowledge Base. Please review it by [deadline].\n\nIf you have questions, reach out to HR or your direct manager.",
                'type'            => 'announcement',
                'category'        => 'hr',
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],
            [
                'name'            => 'Safety Alert',
                'title'           => 'Safety Notice — Please Read Immediately',
                'body'            => "ATTENTION ALL TEAM MEMBERS\n\n[Describe the safety concern or update]\n\nWhat you need to do:\n1. [Action item 1]\n2. [Action item 2]\n3. [Action item 3]\n\nYour safety is our top priority. If you see something unsafe, report it immediately to your supervisor.\n\nStay safe,\nManagement",
                'type'            => 'announcement',
                'category'        => 'safety',
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],
            [
                'name'            => 'Office / Location Closure',
                'title'           => '[Location] Closed on [Date]',
                'body'            => "Hi everyone,\n\nPlease be aware that [location/office name] will be closed on [date] due to [reason].\n\nWhat this means for you:\n• [Impact on schedule]\n• [Alternative arrangements]\n• [Who to contact]\n\nNormal operations will resume on [date]. Please plan accordingly.",
                'type'            => 'announcement',
                'category'        => 'operations',
                'allow_comments'  => false,
                'allow_reactions' => true,
                'is_default'      => false,
            ],

            // ── News ─────────────────────────────────────────
            [
                'name'            => 'Weekly Update / Newsletter',
                'title'           => 'Weekly Update — [Week of Date]',
                'body'            => "Hey team! Here's your weekly roundup:\n\n📊 This Week's Highlights\n• [Highlight 1]\n• [Highlight 2]\n• [Highlight 3]\n\n📅 Coming Up Next Week\n• [Upcoming item 1]\n• [Upcoming item 2]\n\n🏆 Shout-Outs\n• [Recognition 1]\n• [Recognition 2]\n\nHave a great week ahead!",
                'type'            => 'news',
                'category'        => null,
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],
            [
                'name'            => 'New Hire Welcome',
                'title'           => 'Welcome to the Team, [Name]!',
                'body'            => "We're excited to welcome [Name] to the [Department] team!\n\nA little about [Name]:\n• Role: [Job Title]\n• Location: [Office/Site]\n• Fun fact: [Something interesting]\n\n[Name] will be starting on [date]. Please take a moment to introduce yourself and help them feel at home.\n\nWelcome aboard! 🎉",
                'type'            => 'news',
                'category'        => 'hr',
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],
            [
                'name'            => 'Birthday / Work Anniversary',
                'title'           => 'Happy [Birthday/Anniversary], [Name]!',
                'body'            => "Please join us in celebrating [Name]'s [birthday / X-year work anniversary]! 🎂\n\n[Name] has been an incredible part of the [Department] team. [Add a personal note about their contributions or qualities.]\n\nDrop a comment below to wish [Name] well!",
                'type'            => 'news',
                'category'        => 'birthday',
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],
            [
                'name'            => 'Achievement / Milestone',
                'title'           => 'We Hit [Milestone]!',
                'body'            => "Team,\n\nI'm thrilled to announce that we've reached [milestone description]!\n\nThe numbers:\n• [Metric 1]\n• [Metric 2]\n• [Metric 3]\n\nThis wouldn't have been possible without the hard work and dedication of every single one of you. Let's keep the momentum going!\n\nThank you all 🙌",
                'type'            => 'news',
                'category'        => null,
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],

            // ── Operational ──────────────────────────────────
            [
                'name'            => 'Schedule Change Notice',
                'title'           => 'Schedule Update — [Date/Week]',
                'body'            => "Hi team,\n\nThere have been changes to the upcoming schedule:\n\n📅 Changes:\n• [Employee/Role] — [Old shift] → [New shift]\n• [Employee/Role] — [Old shift] → [New shift]\n\n📌 Reason: [Brief explanation]\n\nPlease check the Scheduling tab for your updated shifts. If you have conflicts, contact your manager ASAP.\n\nThanks for your flexibility!",
                'type'            => 'announcement',
                'category'        => 'operations',
                'allow_comments'  => true,
                'allow_reactions' => false,
                'is_default'      => false,
            ],
            [
                'name'            => 'Daily Briefing',
                'title'           => 'Daily Briefing — [Date]',
                'body'            => "Good morning team!\n\nHere's what you need to know today:\n\n✅ Today's Priorities\n• [Priority 1]\n• [Priority 2]\n• [Priority 3]\n\n⚠️ Heads Up\n• [Important note]\n\n👥 Staffing\n• [Any callouts or coverage notes]\n\nLet's have a great day!",
                'type'            => 'news',
                'category'        => 'operations',
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],
            [
                'name'            => 'Maintenance / Downtime Notice',
                'title'           => 'Scheduled Maintenance — [System/Location]',
                'body'            => "Heads up — scheduled maintenance is coming:\n\n🔧 What: [System or location affected]\n📅 When: [Date] from [Start Time] to [End Time]\n⏱️ Expected Duration: [X hours]\n\nWhat to expect:\n• [Impact description]\n• [Workaround if any]\n\nWe'll send an update once maintenance is complete. Thank you for your patience.",
                'type'            => 'announcement',
                'category'        => 'operations',
                'allow_comments'  => false,
                'allow_reactions' => true,
                'is_default'      => false,
            ],

            // ── Training & Development ───────────────────────
            [
                'name'            => 'Training Reminder',
                'title'           => 'Required Training — [Course Name]',
                'body'            => "Hi team,\n\nThis is a reminder to complete your required training:\n\n📚 Course: [Course Name]\n⏰ Deadline: [Date]\n⏱️ Estimated Time: [X minutes]\n\nYou can access the course from the Courses section of the app. If you've already completed it, no action is needed.\n\nPlease reach out to [contact] if you have trouble accessing the training.",
                'type'            => 'announcement',
                'category'        => 'training',
                'allow_comments'  => false,
                'allow_reactions' => true,
                'is_default'      => false,
            ],
            [
                'name'            => 'Tips & Best Practices',
                'title'           => 'Pro Tip: [Topic]',
                'body'            => "Here's a quick tip to help you work smarter:\n\n💡 [Tip title]\n\n[Detailed explanation of the tip or best practice]\n\nWhy this matters:\n[Brief explanation of the benefit]\n\nTry it out and let us know how it works for you in the comments!",
                'type'            => 'news',
                'category'        => 'training',
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],

            // ── Feedback & Engagement ────────────────────────
            [
                'name'            => 'Survey / Feedback Request',
                'title'           => 'We Want Your Feedback!',
                'body'            => "Hi team,\n\nYour feedback helps us improve. Please take a few minutes to complete our [survey name].\n\n📋 Topic: [What the survey is about]\n⏱️ Time: [X minutes]\n📅 Deadline: [Date]\n\nYour responses are [anonymous/confidential]. The results will be shared in [timeframe].\n\nHead to the Surveys section to participate. Thank you!",
                'type'            => 'news',
                'category'        => null,
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],
            [
                'name'            => 'Event Announcement',
                'title'           => '[Event Name] — Save the Date!',
                'body'            => "Mark your calendars!\n\n🎉 Event: [Event Name]\n📅 Date: [Date]\n🕐 Time: [Start Time] — [End Time]\n📍 Location: [Venue / Virtual Link]\n\nWhat to expect:\n• [Agenda item 1]\n• [Agenda item 2]\n• [Agenda item 3]\n\nPlease RSVP in the Events section by [deadline]. We hope to see everyone there!",
                'type'            => 'event',
                'category'        => null,
                'allow_comments'  => true,
                'allow_reactions' => true,
                'is_default'      => false,
            ],
        ];

        foreach ($templates as $template) {
            UpdateTemplate::create(array_merge($template, [
                'tenant_id'  => $tenantId,
                'created_by' => $ownerId,
            ]));
        }
    }
}
