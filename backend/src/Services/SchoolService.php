<?php
/**
 * Service School - Logique métier pour les établissements
 */

namespace Services;

use Repositories\SchoolRepository;
use Repositories\AdminAuditRepository;

class SchoolService
{
    private SchoolRepository $repository;
    private AdminAuditRepository $auditRepository;

    public function __construct(SchoolRepository $repository, AdminAuditRepository $auditRepository)
    {
        $this->repository = $repository;
        $this->auditRepository = $auditRepository;
    }

    /**
     * Récupère les établissements selon le rôle
     * campus_admin : tous
     * director : uniquement son établissement
     */
    public function getSchoolsForUser(array $user, array $filters = [], ?int $limit = null, ?int $offset = null): array
    {
        $role = $user['role'] ?? '';
        $schoolId = (int)($user['school_id'] ?? 0);

        if ($role === 'campus_admin') {
            return $this->repository->findAll($filters, $limit, $offset);
        } elseif ($role === 'director' && $schoolId > 0) {
            $school = $this->repository->findById($schoolId);
            return $school ? [$school] : [];
        }

        return [];
    }

    /**
     * Récupère un établissement par ID avec vérification des permissions
     */
    public function getSchoolById(int $id, array $user): ?array
    {
        $role = $user['role'] ?? '';
        $schoolId = (int)($user['school_id'] ?? 0);

        $school = $this->repository->findById($id);
        if ($school === null) {
            return null;
        }

        // campus_admin : accès tous
        if ($role === 'campus_admin') {
            return $school;
        }

        // director : uniquement son établissement
        if ($role === 'director' && $schoolId === $id) {
            return $school;
        }

        return null;
    }

    /**
     * Crée un établissement (campus_admin uniquement)
     */
    public function createSchool(array $data, array $user): array
    {
        $id = $this->repository->create($data);
        $school = $this->repository->findById($id);

        // Log audit
        $this->auditRepository->create([
            'user_id' => $user['id'],
            'action' => 'CREATE_SCHOOL',
            'entity_type' => 'school',
            'entity_id' => $id,
            'metadata' => ['name' => $data['name']]
        ]);

        return $school;
    }

    /**
     * Met à jour un établissement (campus_admin uniquement)
     */
    public function updateSchool(int $id, array $data, array $user): ?array
    {
        $oldSchool = $this->repository->findById($id);
        if ($oldSchool === null) {
            return null;
        }

        $this->repository->update($id, $data);
        $school = $this->repository->findById($id);

        // Log audit
        $this->auditRepository->create([
            'user_id' => $user['id'],
            'action' => 'UPDATE_SCHOOL',
            'entity_type' => 'school',
            'entity_id' => $id,
            'metadata' => ['old' => $oldSchool, 'new' => $school]
        ]);

        return $school;
    }

    /**
     * Supprime (soft delete) un établissement (campus_admin uniquement)
     */
    public function deleteSchool(int $id, array $user): bool
    {
        $school = $this->repository->findById($id);
        if ($school === null) {
            return false;
        }

        $success = $this->repository->delete($id);

        if ($success) {
            // Log audit
            $this->auditRepository->create([
                'user_id' => $user['id'],
                'action' => 'ARCHIVE_SCHOOL',
                'entity_type' => 'school',
                'entity_id' => $id,
                'metadata' => ['name' => $school['name']]
            ]);
        }

        return $success;
    }
}

