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
        // ── Surveys ─────────────────────────────────────────
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->unsignedBigInteger('created_by');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('survey');              // survey, poll
            $table->string('status')->default('draft');             // draft, active, closed, archived
            $table->boolean('is_anonymous')->default(false);
            $table->boolean('allow_multiple')->default(false);      // allow multiple responses
            $table->timestamp('published_at')->nullable();
            $table->timestamp('closes_at')->nullable();             // auto-close date
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['tenant_id', 'status']);
        });

        // ── Survey Questions ────────────────────────────────
        Schema::create('survey_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('survey_id');
            $table->string('type');                                 // text, textarea, single_choice, multiple_choice, rating, yes_no, nps
            $table->text('question');
            $table->text('description')->nullable();                // helper text
            $table->boolean('is_required')->default(true);
            $table->json('options')->nullable();                    // for choice types: ["Option A", "Option B", ...]
            $table->json('settings')->nullable();                   // e.g. { min: 1, max: 10 } for rating
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('survey_id')->references('id')->on('surveys')->cascadeOnDelete();
            $table->index(['survey_id', 'sort_order']);
        });

        // ── Survey Responses (one per user per survey) ──────
        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('survey_id');
            $table->unsignedBigInteger('user_id')->nullable();      // null if anonymous
            $table->string('tenant_id')->index();
            $table->timestamps();

            $table->foreign('survey_id')->references('id')->on('surveys')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['survey_id', 'user_id']);
        });

        // ── Survey Answers (one per question per response) ──
        Schema::create('survey_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('response_id');
            $table->unsignedBigInteger('question_id');
            $table->text('value')->nullable();                      // text answer or selected option(s) as JSON
            $table->timestamps();

            $table->foreign('response_id')->references('id')->on('survey_responses')->cascadeOnDelete();
            $table->foreign('question_id')->references('id')->on('survey_questions')->cascadeOnDelete();
            $table->index(['response_id', 'question_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survey_answers');
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('survey_questions');
        Schema::dropIfExists('surveys');
    }
};
