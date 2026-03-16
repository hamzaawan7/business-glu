<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Badges ─────────────────────────────────────────
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('emoji', 20)->default('⭐');      // emoji icon
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // ── Recognitions ───────────────────────────────────
        Schema::create('recognitions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('badge_id')->nullable()->constrained()->nullOnDelete();
            $table->text('message');
            $table->enum('visibility', ['public', 'private'])->default('public');
            $table->integer('points')->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'created_at']);
            $table->index('recipient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recognitions');
        Schema::dropIfExists('badges');
    }
};
