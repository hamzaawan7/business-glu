<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /**
     * Attributes that are stored as top-level columns
     * rather than in the JSON `data` column.
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'plan',
            'is_active',
            'modules',
        ];
    }

    protected $casts = [
        'is_active' => 'boolean',
        'modules'   => 'array',
    ];

    /**
     * Default enabled modules for new tenants.
     */
    public const DEFAULT_MODULES = [
        'time_clock'     => true,
        'scheduling'     => true,
        'tasks'          => true,
        'forms'          => true,
        'chat'           => true,
        'updates'        => true,
        'directory'      => true,
        'knowledge_base' => false,
        'documents'      => true,
        'time_off'       => true,
        'recognition'    => false,
        'courses'        => false,
        'surveys'        => false,
        'events'         => false,
        'help_desk'      => false,
    ];

    /**
     * Get the effective modules config (merges defaults with stored values).
     */
    public function getActiveModules(): array
    {
        return array_merge(self::DEFAULT_MODULES, $this->modules ?? []);
    }

    /**
     * Check if a specific module is enabled.
     */
    public function isModuleEnabled(string $module): bool
    {
        return $this->getActiveModules()[$module] ?? false;
    }
}
