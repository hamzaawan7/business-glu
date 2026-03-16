<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Events ──────────────────────────────────────────
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('type')->default('general');        // general, meeting, social, training, other
            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable();
            $table->boolean('is_all_day')->default(false);
            $table->string('status')->default('draft');        // draft, published, cancelled
            $table->boolean('is_recurring')->default(false);
            $table->string('recurrence_rule')->nullable();     // daily, weekly, monthly
            $table->dateTime('recurrence_end')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'starts_at']);
        });

        // ── Event RSVPs ─────────────────────────────────────
        Schema::create('event_rsvps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('tenant_id');
            $table->string('status')->default('pending');      // pending, attending, declined, maybe
            $table->timestamps();

            $table->unique(['event_id', 'user_id']);
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_rsvps');
        Schema::dropIfExists('events');
    }
};
