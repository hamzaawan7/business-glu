<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create a demo tenant (organisation)
        $tenant = Tenant::create([
            'id'        => 'demo',
            'name'      => 'Demo Company',
            'slug'      => 'demo',
            'plan'      => 'pro',
            'is_active' => true,
        ]);

        // 2. Create a super-admin (platform-level user)
        User::create([
            'name'              => 'Super Admin',
            'email'             => 'admin@businessglu.com',
            'email_verified_at' => now(),
            'password'          => 'password',   // hashed via cast
            'role'              => 'super_admin',
            'tenant_id'         => null,          // platform-level, not tied to tenant
        ]);

        // 3. Create a tenant owner
        User::create([
            'name'              => 'Demo Owner',
            'email'             => 'owner@demo.com',
            'email_verified_at' => now(),
            'password'          => 'password',
            'role'              => 'owner',
            'tenant_id'         => $tenant->id,
        ]);

        // 4. Create a regular team member
        User::create([
            'name'              => 'Demo Member',
            'email'             => 'member@demo.com',
            'email_verified_at' => now(),
            'password'          => 'password',
            'role'              => 'member',
            'tenant_id'         => $tenant->id,
        ]);
    }
}
