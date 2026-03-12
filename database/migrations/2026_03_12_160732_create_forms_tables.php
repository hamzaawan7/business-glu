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
        // ── Forms (the form definition) ──────────────────────
        Schema::create('forms', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('created_by');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('form');                   // form, checklist
            $table->string('status')->default('draft');                // draft, active, archived
            $table->boolean('is_required')->default(false);            // must be completed
            $table->boolean('allow_multiple')->default(false);         // multiple submissions
            $table->boolean('is_anonymous')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['tenant_id', 'status']);
        });

        // ── Form Fields ──────────────────────────────────────
        Schema::create('form_fields', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('form_id');
            $table->string('type');                                    // text, textarea, number, select, multiselect, checkbox, radio, date, time, image, file, signature, yes_no, location
            $table->string('label');
            $table->text('description')->nullable();                   // helper text
            $table->boolean('is_required')->default(false);
            $table->json('options')->nullable();                       // for select/radio/checkbox: [{label, value}]
            $table->json('settings')->nullable();                      // extra config (min, max, placeholder, etc.)
            $table->integer('sort_order')->default(0);
            $table->string('section')->nullable();                     // section grouping
            $table->timestamps();

            $table->foreign('form_id')->references('id')->on('forms')->cascadeOnDelete();
            $table->index(['form_id', 'sort_order']);
        });

        // ── Form Assignments (who needs to fill) ─────────────
        Schema::create('form_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('form_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('form_id')->references('id')->on('forms')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['form_id', 'user_id']);
        });

        // ── Form Submissions ─────────────────────────────────
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('form_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('tenant_id');
            $table->json('answers');                                   // { field_id: value, ... }
            $table->string('status')->default('submitted');            // submitted, reviewed, rejected
            $table->text('reviewer_notes')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('form_id')->references('id')->on('forms')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['form_id', 'user_id']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
        Schema::dropIfExists('form_assignments');
        Schema::dropIfExists('form_fields');
        Schema::dropIfExists('forms');
    }
};
