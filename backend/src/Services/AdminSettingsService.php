<?php
/**
 * Service AdminSettings - Logique métier pour les paramètres admin
 */

namespace Services;

use Repositories\AdminSettingsRepository;
use Repositories\AdminAuditRepository;

class AdminSettingsService
{
    private AdminSettingsRepository $repository;
    private AdminAuditRepository $auditRepository;

    public function __construct(AdminSettingsRepository $repository, AdminAuditRepository $auditRepository)
    {
        $this->repository = $repository;
        $this->auditRepository = $auditRepository;
    }

    /**
     * Récupère tous les paramètres
     */
    public function getSettings(): array
    {
        return $this->repository->findAll();
    }

    /**
     * Met à jour les paramètres (campus_admin uniquement)
     */
    public function updateSettings(array $settings, array $user): array
    {
        $oldSettings = $this->repository->findAll();

        foreach ($settings as $key => $value) {
            $this->repository->upsert($key, $value);
        }

        $newSettings = $this->repository->findAll();

        // Log audit
        $this->auditRepository->create([
            'user_id' => $user['id'],
            'action' => 'UPDATE_SETTINGS',
            'entity_type' => 'settings',
            'entity_id' => null,
            'metadata' => ['old' => $oldSettings, 'new' => $newSettings]
        ]);

        return $newSettings;
    }
}

