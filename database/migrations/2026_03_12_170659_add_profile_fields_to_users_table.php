<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->after('email');
            $table->string('position')->nullable()->after('role');        // Job title
            $table->string('department')->nullable()->after('position');
            $table->string('location')->nullable()->after('department');  // Office / site
            $table->text('bio')->nullable()->after('location');
            $table->string('avatar_url')->nullable()->after('bio');
            $table->date('hire_date')->nullable()->after('avatar_url');
            $table->boolean('directory_visible')->default(true)->after('hire_date');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'position', 'department', 'location',
                'bio', 'avatar_url', 'hire_date', 'directory_visible',
            ]);
        });
    }
};
