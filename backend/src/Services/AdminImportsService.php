<?php
/**
 * Service AdminImports - Logique métier pour les imports utilisateurs
 */

namespace Services;

use Repositories\AdminImportsRepository;
use Repositories\UserRepository;
use Repositories\AdminAuditRepository;

class AdminImportsService
{
    private AdminImportsRepository $importRepository;
    private UserRepository $userRepository;
    private AdminAuditRepository $auditRepository;

    public function __construct(
        AdminImportsRepository $importRepository,
        UserRepository $userRepository,
        AdminAuditRepository $auditRepository
    ) {
        $this->importRepository = $importRepository;
        $this->userRepository = $userRepository;
        $this->auditRepository = $auditRepository;
    }

    /**
     * Récupère les imports avec filtres
     */
    public function getImports(array $filters = [], ?int $limit = null, ?int $offset = null): array
    {
        return $this->importRepository->findAll($filters, $limit, $offset);
    }

    /**
     * Récupère un import par ID
     */
    public function getImportById(int $id): ?array
    {
        return $this->importRepository->findById($id);
    }

    /**
     * Traite un import utilisateurs (campus_admin uniquement)
     */
    public function importUsers(array $data, array $user): array
    {
        // Créer l'entrée d'import
        $importId = $this->importRepository->create([
            'type' => $data['type'],
            'file_name' => $data['file_name'] ?? null,
            'status' => 'running',
            'created_by' => $user['id']
        ]);

        $summary = [
            'total' => 0,
            'created' => 0,
            'errors' => []
        ];

        try {
            $users = $data['users'] ?? [];
            $summary['total'] = count($users);

            foreach ($users as $index => $userData) {
                try {
                    // Générer un mot de passe temporaire
                    $tempPassword = bin2hex(random_bytes(8));
                    $userData['password_hash'] = password_hash($tempPassword, PASSWORD_DEFAULT);

                    $this->userRepository->create($userData);
                    $summary['created']++;
                } catch (\Exception $e) {
                    $summary['errors'][] = [
                        'index' => $index,
                        'email' => $userData['email'] ?? 'unknown',
                        'error' => $e->getMessage()
                    ];
                }
            }

            // Mettre à jour l'import avec le statut final
            $this->importRepository->update($importId, [
                'status' => empty($summary['errors']) ? 'completed' : 'failed',
                'summary' => $summary
            ]);

            // Log audit
            $this->auditRepository->create([
                'user_id' => $user['id'],
                'action' => 'IMPORT_USERS',
                'entity_type' => 'import',
                'entity_id' => $importId,
                'metadata' => $summary
            ]);

            return $this->importRepository->findById($importId);
        } catch (\Exception $e) {
            // En cas d'erreur globale, marquer l'import comme failed
            $this->importRepository->update($importId, [
                'status' => 'failed',
                'summary' => array_merge($summary, ['global_error' => $e->getMessage()])
            ]);

            throw $e;
        }
    }
}

