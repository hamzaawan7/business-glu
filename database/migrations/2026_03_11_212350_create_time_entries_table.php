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
        Schema::create('time_entries', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamp('clock_in');
            $table->timestamp('clock_out')->nullable();
            $table->decimal('clock_in_lat', 10, 7)->nullable();
            $table->decimal('clock_in_lng', 10, 7)->nullable();
            $table->decimal('clock_out_lat', 10, 7)->nullable();
            $table->decimal('clock_out_lng', 10, 7)->nullable();
            $table->string('clock_in_note')->nullable();
            $table->string('clock_out_note')->nullable();
            $table->unsignedInteger('total_break_minutes')->default(0);
            $table->unsignedInteger('total_minutes')->nullable(); // computed on clock-out
            $table->string('status')->default('active'); // active | completed | edited | approved
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['tenant_id', 'user_id', 'clock_in']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('time_entry_breaks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('time_entry_id');
            $table->timestamp('start');
            $table->timestamp('end')->nullable();
            $table->string('type')->default('unpaid'); // paid | unpaid
            $table->unsignedInteger('duration_minutes')->nullable(); // computed on end
            $table->timestamps();

            $table->foreign('time_entry_id')->references('id')->on('time_entries')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('time_entry_breaks');
        Schema::dropIfExists('time_entries');
    }
};
