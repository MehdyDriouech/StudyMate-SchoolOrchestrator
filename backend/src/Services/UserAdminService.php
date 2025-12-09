<?php
/**
 * Service UserAdmin - Logique métier pour la gestion admin des utilisateurs
 */

namespace Services;

use Repositories\UserRepository;
use Repositories\AdminAuditRepository;

class UserAdminService
{
    private UserRepository $repository;
    private AdminAuditRepository $auditRepository;

    public function __construct(UserRepository $repository, AdminAuditRepository $auditRepository)
    {
        $this->repository = $repository;
        $this->auditRepository = $auditRepository;
    }

    /**
     * Récupère les utilisateurs avec filtres (campus_admin uniquement)
     */
    public function getUsers(array $filters = [], ?int $limit = null, ?int $offset = null): array
    {
        return $this->repository->findAll($filters, $limit, $offset);
    }

    /**
     * Récupère un utilisateur par ID
     */
    public function getUserById(int $id): ?array
    {
        $user = $this->repository->findById($id);
        if ($user) {
            unset($user['password_hash']); // Ne jamais exposer le hash
        }
        return $user;
    }

    /**
     * Crée un utilisateur (campus_admin uniquement)
     */
    public function createUser(array $data, array $adminUser): array
    {
        // Générer un mot de passe temporaire si non fourni
        if (empty($data['password'])) {
            $tempPassword = bin2hex(random_bytes(8));
            $data['password'] = $tempPassword;
        }

        $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
        unset($data['password']);

        $id = $this->repository->create($data);
        $user = $this->repository->findById($id);
        unset($user['password_hash']);

        // Log audit
        $this->auditRepository->create([
            'user_id' => $adminUser['id'],
            'action' => 'CREATE_USER',
            'entity_type' => 'user',
            'entity_id' => $id,
            'metadata' => ['email' => $data['email'], 'role' => $data['role']]
        ]);

        return $user;
    }

    /**
     * Met à jour un utilisateur (campus_admin uniquement)
     */
    public function updateUser(int $id, array $data, array $adminUser): ?array
    {
        $oldUser = $this->repository->findById($id);
        if ($oldUser === null) {
            return null;
        }

        // Si un nouveau mot de passe est fourni, le hasher
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
            unset($data['password']);
        }

        $this->repository->update($id, $data);
        $user = $this->repository->findById($id);
        unset($user['password_hash']);

        // Log audit
        $this->auditRepository->create([
            'user_id' => $adminUser['id'],
            'action' => 'UPDATE_USER',
            'entity_type' => 'user',
            'entity_id' => $id,
            'metadata' => ['old' => $oldUser, 'new' => $user]
        ]);

        return $user;
    }

    /**
     * Supprime un utilisateur (campus_admin uniquement)
     */
    public function deleteUser(int $id, array $adminUser): bool
    {
        $user = $this->repository->findById($id);
        if ($user === null) {
            return false;
        }

        $success = $this->repository->delete($id);

        if ($success) {
            // Log audit
            $this->auditRepository->create([
                'user_id' => $adminUser['id'],
                'action' => 'DELETE_USER',
                'entity_type' => 'user',
                'entity_id' => $id,
                'metadata' => ['email' => $user['email']]
            ]);
        }

        return $success;
    }
}

