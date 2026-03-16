<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Course Categories ───────────────────────────────
        Schema::create('course_categories', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('tenant_id');
        });

        // ── Courses ─────────────────────────────────────────
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('category_id')->nullable()->constrained('course_categories')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('status')->default('draft');         // draft, published, archived
            $table->boolean('is_mandatory')->default(false);
            $table->unsignedInteger('estimated_minutes')->nullable();
            $table->dateTime('published_at')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'status']);
        });

        // ── Course Sections ─────────────────────────────────
        Schema::create('course_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('course_id');
        });

        // ── Course Objects (content items within sections) ──
        Schema::create('course_objects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('course_sections')->cascadeOnDelete();
            $table->string('type');                             // text, video, document, image, link, quiz
            $table->string('title');
            $table->text('content')->nullable();                // HTML for text, URL for video/link/image/document
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('section_id');
        });

        // ── Course Assignments ──────────────────────────────
        Schema::create('course_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('tenant_id');
            $table->date('due_date')->nullable();
            $table->string('status')->default('assigned');      // assigned, in_progress, completed
            $table->unsignedInteger('progress_pct')->default(0);
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['course_id', 'user_id']);
            $table->index('tenant_id');
            $table->index(['tenant_id', 'user_id']);
        });

        // ── Object Progress (tracks which objects a user completed) ──
        Schema::create('course_object_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('course_assignments')->cascadeOnDelete();
            $table->foreignId('object_id')->constrained('course_objects')->cascadeOnDelete();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['assignment_id', 'object_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_object_progress');
        Schema::dropIfExists('course_assignments');
        Schema::dropIfExists('course_objects');
        Schema::dropIfExists('course_sections');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('course_categories');
    }
};
