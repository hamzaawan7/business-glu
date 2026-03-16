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
        // ── Updates (posts / announcements) ─────────────────
        Schema::create('updates', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('created_by');
            $table->string('title');
            $table->text('body');
            $table->string('type')->default('announcement'); // announcement, news, event, poll
            $table->string('status')->default('draft');       // draft, published, scheduled, archived
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_popup')->default(false);
            $table->boolean('allow_comments')->default(true);
            $table->boolean('allow_reactions')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'is_pinned']);
        });

        // ── Update Comments ─────────────────────────────────
        Schema::create('update_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('update_id')->constrained('updates')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        // ── Update Reactions ────────────────────────────────
        Schema::create('update_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('update_id')->constrained('updates')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('emoji', 20)->default('👍');
            $table->timestamps();

            $table->unique(['update_id', 'user_id', 'emoji']);
        });

        // ── Update Read Receipts ────────────────────────────
        Schema::create('update_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('update_id')->constrained('updates')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('read_at')->useCurrent();

            $table->unique(['update_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('update_reads');
        Schema::dropIfExists('update_reactions');
        Schema::dropIfExists('update_comments');
        Schema::dropIfExists('updates');
    }
};
