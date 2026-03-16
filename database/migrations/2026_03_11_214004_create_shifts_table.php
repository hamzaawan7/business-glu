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
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('user_id')->nullable();       // null = open shift
            $table->unsignedBigInteger('created_by');                 // who created the shift
            $table->string('title')->nullable();                       // e.g. "Morning Shift"
            $table->date('date');                                      // the calendar day
            $table->time('start_time');                                // e.g. 08:00
            $table->time('end_time');                                  // e.g. 16:00
            $table->string('color', 7)->default('#495B67');            // hex color for UI
            $table->string('location')->nullable();                    // job site / branch
            $table->text('notes')->nullable();
            $table->boolean('is_published')->default(false);
            $table->boolean('is_open')->default(false);                // open shift (anyone can claim)
            $table->string('repeat_type')->nullable();                 // daily, weekly, monthly, none
            $table->unsignedBigInteger('repeat_group_id')->nullable(); // links repeated shifts together
            $table->string('status')->default('scheduled');            // scheduled, completed, cancelled
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();

            $table->index(['tenant_id', 'date']);
            $table->index(['tenant_id', 'user_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
