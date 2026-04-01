<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ── Enhance updates table ───────────────────────────
        Schema::table('updates', function (Blueprint $table) {
            // Rich content & media
            $table->string('cover_image')->nullable()->after('body');
            $table->json('attachments')->nullable()->after('cover_image');    // [{name, path, type, size}]
            $table->json('images')->nullable()->after('attachments');          // [path1, path2, ...] multi-photo gallery
            $table->string('youtube_url')->nullable()->after('images');

            // Categories (announcement, news, event, poll, hr, holiday, payroll, schedule, birthday, custom)
            $table->string('category')->nullable()->after('type');

            // Reminder / retargeting
            $table->timestamp('reminder_at')->nullable()->after('expires_at');
            $table->boolean('reminder_sent')->default(false)->after('reminder_at');

            // Template reference
            $table->unsignedBigInteger('template_id')->nullable()->after('created_by');
        });

        // ── Update Templates ────────────────────────────────
        Schema::create('update_templates', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('created_by');
            $table->string('name');
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->string('type')->default('announcement');
            $table->string('category')->nullable();
            $table->string('cover_image')->nullable();
            $table->json('images')->nullable();
            $table->boolean('allow_comments')->default(true);
            $table->boolean('allow_reactions')->default(true);
            $table->boolean('is_default')->default(false);  // System-provided templates
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['tenant_id']);
        });

        // ── Update Audiences (targeted distribution) ────────
        Schema::create('update_audiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('update_id')->constrained('updates')->cascadeOnDelete();
            $table->string('audience_type');      // 'all', 'department', 'role', 'user'
            $table->string('audience_value')->nullable(); // department name, role name, or user_id
            $table->timestamps();

            $table->index(['update_id', 'audience_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('update_audiences');
        Schema::dropIfExists('update_templates');

        Schema::table('updates', function (Blueprint $table) {
            $table->dropColumn([
                'cover_image',
                'attachments',
                'images',
                'youtube_url',
                'category',
                'reminder_at',
                'reminder_sent',
                'template_id',
            ]);
        });
    }
};
