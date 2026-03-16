<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Leave Policies ─────────────────────────────────
        Schema::create('leave_policies', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');                          // e.g. "Vacation", "Sick Leave", "PTO"
            $table->string('color', 20)->default('#3B82F6'); // calendar display color
            $table->decimal('days_per_year', 5, 1)->default(0); // annual allowance
            $table->enum('accrual_type', ['annual', 'monthly', 'none'])->default('annual');
            $table->boolean('requires_approval')->default(true);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // ── Leave Balances ─────────────────────────────────
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leave_policy_id')->constrained()->cascadeOnDelete();
            $table->decimal('balance', 6, 1)->default(0);   // remaining days
            $table->decimal('used', 6, 1)->default(0);       // used days this period
            $table->decimal('total', 6, 1)->default(0);      // total allowance this period
            $table->year('year');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['user_id', 'leave_policy_id', 'year']);
            $table->index('tenant_id');
        });

        // ── Leave Requests ─────────────────────────────────
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leave_policy_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('days', 5, 1);                   // total working days requested
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'denied', 'cancelled'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('leave_balances');
        Schema::dropIfExists('leave_policies');
    }
};
