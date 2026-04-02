<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\Update;
use App\Models\UpdateAudience;
use App\Models\UpdateComment;
use App\Models\UpdateReaction;
use App\Models\UpdateRead;
use App\Models\User;
use Illuminate\Database\Seeder;

class FeedSeeder extends Seeder
{
    /**
     * Seed dummy Updates + Events so the Feed page has realistic content.
     * Dynamically finds tenants and their users to work on any environment.
     */
    public function run(): void
    {
        $owners = User::whereIn('role', ['owner', 'super_admin'])
            ->whereNotNull('tenant_id')
            ->get();

        foreach ($owners as $owner) {
            // Skip if this tenant already has updates (avoid duplicates on re-run)
            $existing = Update::where('tenant_id', $owner->tenant_id)->count();
            if ($existing > 0) {
                echo "Skipping {$owner->tenant_id} — already has {$existing} updates.\n";
                continue;
            }

            // Find another user in the same tenant (for comments/reactions variety)
            $member = User::where('tenant_id', $owner->tenant_id)
                ->where('id', '!=', $owner->id)
                ->first();

            $this->seedTenant($owner->tenant_id, $owner->id, $member?->id);
            echo "Seeded feed data for {$owner->tenant_id}.\n";
        }
    }

    private function seedTenant(string $tenantId, int $ownerId, ?int $memberId = null): void
    {
        $memberIds = $memberId ? [$ownerId, $memberId] : [$ownerId];

        // ══════════════════════════════════════════════════
        // UPDATES
        // ══════════════════════════════════════════════════

        // 1. Pinned Announcement
        $u1 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'Welcome to Business Glu!',
            'body'            => 'We are excited to roll out Business Glu as our new team communication platform. You\'ll find company updates, events, schedules, and more all in one place. Please take a moment to explore the app and let us know if you have any questions!',
            'type'            => 'announcement',
            'category'        => 'hr',
            'status'          => 'published',
            'is_pinned'       => true,
            'is_popup'        => false,
            'allow_comments'  => true,
            'allow_reactions' => true,
            'published_at'    => now()->subDays(14),
            'youtube_url'     => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]);
        $this->addAudience($u1, 'all');

        // 2. Recent news update
        $u2 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'Q2 Goals & Company Priorities',
            'body'            => "Here's a quick look at our top priorities for Q2:\n\n1. Launch the new client onboarding portal\n2. Reach 500 active customers\n3. Improve NPS score to 60+\n4. Roll out employee wellness program\n\nEvery team has a role to play. Please check with your manager for department-specific goals. Let's make this quarter our best yet!",
            'type'            => 'news',
            'category'        => null,
            'status'          => 'published',
            'is_pinned'       => false,
            'allow_comments'  => true,
            'allow_reactions' => true,
            'published_at'    => now()->subDays(3),
        ]);
        $this->addAudience($u2, 'all');

        // 3. HR / Policy update
        $u3 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'Updated PTO Policy — Effective April 15',
            'body'            => "Team,\n\nWe've updated our Paid Time Off policy. Key changes:\n\n- PTO accrual increases from 15 to 18 days/year for employees with 2+ years\n- Unused PTO now rolls over up to 5 days into the next year\n- Mental health days no longer require a doctor's note\n\nThe full policy is available in the Knowledge Base. Please review it by April 15th.",
            'type'            => 'announcement',
            'category'        => 'hr',
            'status'          => 'published',
            'is_pinned'       => false,
            'is_popup'        => true,
            'allow_comments'  => true,
            'allow_reactions' => true,
            'published_at'    => now()->subDays(1),
        ]);
        $this->addAudience($u3, 'all');

        // 4. Birthday / celebration
        $u4 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'Happy Work Anniversary, Sarah!',
            'body'            => "Please join me in congratulating Sarah Martinez on her 3-year work anniversary! Sarah has been an incredible asset to the Customer Success team. Her dedication and positive energy make a real difference every day. Thank you, Sarah!",
            'type'            => 'announcement',
            'category'        => 'birthday',
            'status'          => 'published',
            'is_pinned'       => false,
            'allow_comments'  => true,
            'allow_reactions' => true,
            'published_at'    => now()->subHours(6),
        ]);
        $this->addAudience($u4, 'all');

        // 5. Schedule / operational update
        $u5 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'Office Closure — Good Friday',
            'body'            => "Reminder: the office will be closed on Friday, April 3rd for Good Friday. This is a paid holiday for all full-time employees. Part-time staff should check with their manager about schedule adjustments. Enjoy the long weekend!",
            'type'            => 'announcement',
            'category'        => 'holiday',
            'status'          => 'published',
            'is_pinned'       => false,
            'allow_comments'  => false,
            'allow_reactions' => true,
            'published_at'    => now()->subHours(2),
        ]);
        $this->addAudience($u5, 'all');

        // 6. News article style
        $u6 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'New Client Win: Greenfield Industries',
            'body'            => "Great news! We've just signed Greenfield Industries as a new enterprise client. This is our largest deal of the quarter and a big win for the Sales and Solutions Engineering teams.\n\nGreenfield will be onboarding over the next 6 weeks. If you're involved in the implementation, you'll receive calendar invites shortly.\n\nCongratulations to everyone who made this happen!",
            'type'            => 'news',
            'category'        => null,
            'status'          => 'published',
            'is_pinned'       => false,
            'allow_comments'  => true,
            'allow_reactions' => true,
            'published_at'    => now()->subDays(5),
        ]);
        $this->addAudience($u6, 'all');

        // 7. Poll-style update
        $u7 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'Team Lunch Preference — Vote Now!',
            'body'            => "We're planning a team lunch for next Friday. Help us decide!\n\nOptions:\nA) Italian — Olive Garden\nB) Mexican — Chipotle catering\nC) BBQ — local smokehouse\nD) Sushi — Sakura Bistro\n\nDrop your vote in the comments below! Voting closes Wednesday at 5 PM.",
            'type'            => 'poll',
            'category'        => null,
            'status'          => 'published',
            'is_pinned'       => false,
            'allow_comments'  => true,
            'allow_reactions' => true,
            'published_at'    => now()->subDays(2),
        ]);
        $this->addAudience($u7, 'all');

        // 8. Payroll notice
        $u8 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'Payroll Reminder: Timesheets Due Friday',
            'body'            => "This is your friendly reminder to submit your timesheets by Friday at 12 PM. Late submissions may result in delayed payment processing.\n\nIf you have any discrepancies or questions about your hours, please contact HR before the deadline.",
            'type'            => 'announcement',
            'category'        => 'payroll',
            'status'          => 'published',
            'is_pinned'       => false,
            'allow_comments'  => false,
            'allow_reactions' => true,
            'published_at'    => now()->subDays(7),
        ]);
        $this->addAudience($u8, 'all');

        // 9. Safety / compliance
        $u9 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'Mandatory Safety Training — Complete by April 30',
            'body'            => "All team members are required to complete the annual Workplace Safety Training course by April 30th. The course takes approximately 45 minutes and can be found in the Learning section.\n\nManagers: please ensure your direct reports have completed this before the deadline. Compliance will be tracked and reported to leadership.",
            'type'            => 'announcement',
            'category'        => 'hr',
            'status'          => 'published',
            'is_pinned'       => false,
            'is_popup'        => false,
            'allow_comments'  => true,
            'allow_reactions' => true,
            'published_at'    => now()->subDays(10),
        ]);
        $this->addAudience($u9, 'all');

        // 10. Fun / culture update
        $u10 = Update::create([
            'tenant_id'       => $tenantId,
            'created_by'      => $ownerId,
            'title'           => 'Casual Friday is Back!',
            'body'            => "By popular demand, Casual Fridays are making a comeback starting this week! Feel free to dress down — jeans, sneakers, and your favorite team tees are all welcome.\n\nJust a reminder: if you have client-facing meetings, please dress appropriately. Have a great Friday!",
            'type'            => 'news',
            'category'        => null,
            'status'          => 'published',
            'is_pinned'       => false,
            'allow_comments'  => true,
            'allow_reactions' => true,
            'published_at'    => now()->subHours(12),
        ]);
        $this->addAudience($u10, 'all');

        // ── Add Comments ──────────────────────────────────────
        $allUpdates = [$u1, $u2, $u3, $u4, $u5, $u6, $u7, $u8, $u9, $u10];
        $commentBodies = [
            'This is great news! Thanks for sharing.',
            'Looking forward to it!',
            'Thanks for the heads up.',
            'Can we get more details on this?',
            'Love this! Keep it coming.',
            'Noted, thank you!',
            'Awesome update! Really appreciate the transparency.',
            'Count me in!',
            'This is exactly what we needed.',
            'Will there be a follow-up on this?',
        ];

        foreach ($allUpdates as $i => $update) {
            if (!$update->allow_comments) continue;

            // Add 1-3 comments per update
            $numComments = min($i % 3 + 1, 3);
            for ($j = 0; $j < $numComments; $j++) {
                UpdateComment::create([
                    'update_id' => $update->id,
                    'user_id'   => $memberIds[array_rand($memberIds)],
                    'body'      => $commentBodies[($i + $j) % count($commentBodies)],
                    'created_at' => $update->published_at->addMinutes(rand(5, 480)),
                ]);
            }
        }

        // ── Add Reactions ─────────────────────────────────────
        $emojis = ['hand-thumb-up', 'heart', 'face-smile', 'party-popper', 'face-surprised', 'face-frown'];
        foreach ($allUpdates as $i => $update) {
            if (!$update->allow_reactions) continue;

            // Each user reacts with 1-2 emojis on some updates
            foreach ($memberIds as $userId) {
                if (rand(0, 100) > 70) continue; // 70% chance to react
                $numReactions = rand(1, 2);
                $picked = array_rand(array_flip($emojis), $numReactions);
                if (!is_array($picked)) $picked = [$picked];
                foreach ($picked as $emoji) {
                    UpdateReaction::create([
                        'update_id' => $update->id,
                        'user_id'   => $userId,
                        'emoji'     => $emoji,
                        'created_at' => $update->published_at->addMinutes(rand(1, 240)),
                    ]);
                }
            }
        }

        // ── Mark some as read ─────────────────────────────────
        foreach ([$u1, $u2, $u6, $u8, $u9] as $update) {
            UpdateRead::create([
                'update_id' => $update->id,
                'user_id'   => $ownerId,
                'read_at'   => $update->published_at->addMinutes(rand(10, 600)),
            ]);
        }

        // ══════════════════════════════════════════════════
        // EVENTS
        // ══════════════════════════════════════════════════

        // 1. Upcoming meeting
        $e1 = Event::create([
            'tenant_id'   => $tenantId,
            'created_by'  => $ownerId,
            'title'       => 'All-Hands Meeting — Q2 Kickoff',
            'description' => 'Join us for our quarterly all-hands meeting. We\'ll review Q1 results, discuss Q2 priorities, and have an open Q&A with leadership.',
            'location'    => 'Main Conference Room / Zoom',
            'type'        => 'meeting',
            'starts_at'   => now()->addDays(3)->setTime(10, 0),
            'ends_at'     => now()->addDays(3)->setTime(11, 30),
            'is_all_day'  => false,
            'status'      => 'published',
        ]);

        // 2. Tomorrow social event
        $e2 = Event::create([
            'tenant_id'   => $tenantId,
            'created_by'  => $ownerId,
            'title'       => 'Team Happy Hour',
            'description' => 'Let\'s unwind after a great week! Drinks and appetizers on the company. Bring your positive vibes.',
            'location'    => 'The Rusty Anchor — 123 Main St',
            'type'        => 'social',
            'starts_at'   => now()->addDay()->setTime(17, 0),
            'ends_at'     => now()->addDay()->setTime(19, 0),
            'is_all_day'  => false,
            'status'      => 'published',
        ]);

        // 3. Training event next week
        $e3 = Event::create([
            'tenant_id'   => $tenantId,
            'created_by'  => $ownerId,
            'title'       => 'Leadership Workshop: Managing Remote Teams',
            'description' => 'A 2-hour interactive workshop on best practices for leading remote and hybrid teams. Open to all managers and team leads.',
            'location'    => 'Training Room B',
            'type'        => 'training',
            'starts_at'   => now()->addDays(7)->setTime(13, 0),
            'ends_at'     => now()->addDays(7)->setTime(15, 0),
            'is_all_day'  => false,
            'status'      => 'published',
        ]);

        // 4. Today event
        $e4 = Event::create([
            'tenant_id'   => $tenantId,
            'created_by'  => $ownerId,
            'title'       => 'Sprint Retrospective',
            'description' => 'End-of-sprint retro. We\'ll discuss what went well, what didn\'t, and action items for next sprint.',
            'location'    => 'Zoom — link in calendar',
            'type'        => 'meeting',
            'starts_at'   => now()->setTime(15, 0),
            'ends_at'     => now()->setTime(16, 0),
            'is_all_day'  => false,
            'status'      => 'published',
        ]);

        // 5. All-day company event
        $e5 = Event::create([
            'tenant_id'   => $tenantId,
            'created_by'  => $ownerId,
            'title'       => 'Company Picnic & Field Day',
            'description' => 'Annual company picnic! Food, games, and fun for the whole family. Arrive any time after 10 AM.',
            'location'    => 'Riverside Park — Pavilion C',
            'type'        => 'social',
            'starts_at'   => now()->addDays(14)->setTime(10, 0),
            'ends_at'     => now()->addDays(14)->setTime(16, 0),
            'is_all_day'  => true,
            'status'      => 'published',
        ]);

        // 6. Past event (to show in feed history)
        $e6 = Event::create([
            'tenant_id'   => $tenantId,
            'created_by'  => $ownerId,
            'title'       => 'March Town Hall Recap',
            'description' => 'Monthly town hall covering revenue updates, new hires, and product roadmap preview.',
            'location'    => 'Main Conference Room',
            'type'        => 'meeting',
            'starts_at'   => now()->subDays(5)->setTime(14, 0),
            'ends_at'     => now()->subDays(5)->setTime(15, 30),
            'is_all_day'  => false,
            'status'      => 'published',
        ]);

        // ── Add RSVPs ────────────────────────────────────────
        foreach ([$e1, $e2, $e4] as $event) {
            EventRsvp::create([
                'event_id'  => $event->id,
                'user_id'   => $ownerId,
                'tenant_id' => $tenantId,
                'status'    => 'attending',
            ]);
        }
        EventRsvp::create([
            'event_id'  => $e3->id,
            'user_id'   => $ownerId,
            'tenant_id' => $tenantId,
            'status'    => 'maybe',
        ]);
        EventRsvp::create([
            'event_id'  => $e5->id,
            'user_id'   => $ownerId,
            'tenant_id' => $tenantId,
            'status'    => 'attending',
        ]);

        if ($memberId) {
            foreach ([$e1, $e2, $e5] as $event) {
                EventRsvp::create([
                    'event_id'  => $event->id,
                    'user_id'   => $memberId,
                    'tenant_id' => $tenantId,
                    'status'    => 'attending',
                ]);
            }
            EventRsvp::create([
                'event_id'  => $e4->id,
                'user_id'   => $memberId,
                'tenant_id' => $tenantId,
                'status'    => 'declined',
            ]);
        }

        $this->command->info("Seeded 10 updates + 6 events for tenant: {$tenantId}");
    }

    private function addAudience(Update $update, string $type, ?string $value = null): void
    {
        UpdateAudience::create([
            'update_id'      => $update->id,
            'audience_type'  => $type,
            'audience_value' => $value,
        ]);
    }
}
