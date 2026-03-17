<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timeline_events', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', [
                'hired', 'promotion', 'role_change', 'department_change',
                'salary_change', 'review', 'award', 'training',
                'probation_end', 'anniversary', 'termination', 'custom',
            ]);
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('event_date');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->json('metadata')->nullable(); // extra data (old_role, new_role, etc.)
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'user_id', 'event_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timeline_events');
    }
};
