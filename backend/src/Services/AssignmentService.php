<?php
/**
 * Service Assignment - Logique métier
 * Valide les données et orchestre les opérations
 */

namespace Services;

use Models\Assignment;
use Repositories\AssignmentRepository;

class AssignmentService
{
    private AssignmentRepository $repository;

    public function __construct(AssignmentRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Récupère tous les assignments
     * @deprecated Utiliser getAssignmentsForUser() à la place pour respecter les permissions
     */
    public function getAllAssignments(): array
    {
        return $this->repository->findAll();
    }

    /**
     * Récupère les assignments selon le rôle de l'utilisateur
     * 
     * Règles :
     * - student : uniquement ses propres assignments (via class_students)
     * - teacher : uniquement les assignments de ses classes (via themes.created_by)
     * - pedago : tous les assignments de son établissement
     * - director : tous les assignments de son établissement
     * 
     * @param array $user - Utilisateur authentifié
     * @return array
     */
    public function getAssignmentsForUser(array $user): array
    {
        $role = $user['role'] ?? 'student';
        $userId = (int) ($user['id'] ?? 0);
        $schoolId = (int) ($user['school_id'] ?? 0);

        switch ($role) {
            case 'student':
                // Uniquement les assignments des classes où l'étudiant est inscrit
                return $this->repository->findByStudentId($userId);
            
            case 'teacher':
                // Uniquement les assignments des thèmes créés par ce professeur
                return $this->repository->findByTeacherId($userId);
            
            case 'pedago':
            case 'director':
                // Tous les assignments de l'établissement
                return $this->repository->findBySchoolId($schoolId);
            
            default:
                // Par défaut, retourner un tableau vide
                return [];
        }
    }

    /**
     * Récupère un assignment par ID
     */
    public function getAssignmentById(int $id): ?Assignment
    {
        return $this->repository->findById($id);
    }

    /**
     * Crée un nouvel assignment
     * 
     * @param array $data - Données de l'assignment
     * @param array $user - Utilisateur authentifié (pour vérifier les permissions)
     * @return Assignment
     */
    public function createAssignment(array $data, array $user): Assignment
    {
        // Vérifier si les données utilisent le nouveau format ou l'ancien
        if (isset($data['title'])) {
            // Nouveau format
            $assignment = new Assignment(
                null,
                $data['class_id'] ?? 0,
                $data['title'] ?? '',
                $data['description'] ?? '',
                $data['subject'] ?? '',
                $data['due_date'] ?? '',
                $data['available_at'] ?? null,
                $data['status'] ?? 'draft'
            );
        } else {
            // Ancien format (compatibilité)
            $assignment = new Assignment(
                null,
                $data['class_id'] ?? 0,
                '', // title
                '', // description
                '', // subject
                $data['due_at'] ?? $data['due_date'] ?? '',
                null, // available_at
                'draft' // status
            );
            $assignment->themeId = $data['theme_id'] ?? null;
            $assignment->assignedBy = $data['assigned_by'] ?? null;
            $assignment->startAt = $data['start_at'] ?? null;
            $assignment->endAt = $data['end_at'] ?? null;
        }

        // Validation
        $errors = $assignment->validate();
        if (!empty($errors)) {
            throw new \InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        return $this->repository->create($assignment);
    }

    /**
     * Met à jour un assignment existant
     * 
     * @param int $id - ID de l'assignment
     * @param array $data - Nouvelles données
     * @param array $user - Utilisateur authentifié (pour vérifier les permissions)
     * @return Assignment|null
     */
    public function updateAssignment(int $id, array $data, array $user): ?Assignment
    {
        // Vérifier que l'assignment existe
        $existing = $this->repository->findById($id);
        if ($existing === null) {
            return null;
        }

        // Mettre à jour avec les nouvelles données (nouveau ou ancien format)
        if (isset($data['title'])) {
            // Nouveau format
            $assignment = new Assignment(
                $id,
                $data['class_id'] ?? $existing->classId,
                $data['title'] ?? $existing->title,
                $data['description'] ?? $existing->description,
                $data['subject'] ?? $existing->subject,
                $data['due_date'] ?? $existing->dueDate,
                $data['available_at'] ?? $existing->availableAt,
                $data['status'] ?? $existing->status
            );
        } else {
            // Ancien format ou mise à jour partielle
            $assignment = new Assignment(
                $id,
                $data['class_id'] ?? $existing->classId,
                $existing->title,
                $existing->description,
                $existing->subject,
                $data['due_at'] ?? $data['due_date'] ?? $existing->dueDate,
                $existing->availableAt,
                $data['status'] ?? $existing->status
            );
            if (isset($data['theme_id'])) {
                $assignment->themeId = $data['theme_id'];
            }
            if (isset($data['assigned_by'])) {
                $assignment->assignedBy = $data['assigned_by'];
            }
            if (isset($data['start_at'])) {
                $assignment->startAt = $data['start_at'];
            }
            if (isset($data['end_at'])) {
                $assignment->endAt = $data['end_at'];
            }
        }

        // Validation
        $errors = $assignment->validate();
        if (!empty($errors)) {
            throw new \InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        return $this->repository->update($assignment);
    }

    /**
     * Supprime un assignment
     * 
     * @param int $id - ID de l'assignment
     * @param array $user - Utilisateur authentifié (pour vérifier les permissions)
     * @return bool
     */
    public function deleteAssignment(int $id, array $user): bool
    {
        // Vérifier que l'assignment existe
        $existing = $this->repository->findById($id);
        if ($existing === null) {
            return false;
        }

        // Vérifier les permissions selon le rôle
        // Note: Les permissions globales (teacher/pedago) sont vérifiées dans le contrôleur
        // Ici, on peut ajouter des vérifications plus fines si nécessaire (par classe, etc.)
        // Pour V1, on fait confiance au contrôleur pour les permissions globales

        return $this->repository->delete($id);
    }
    
    /**
     * Récupère les assignments pour synchronisation ErgoMate
     * Filtre par class_id de l'étudiant et status = 'published'
     * 
     * @param int $studentId - ID de l'étudiant
     * @return array - Tableau d'assignments au format sync (title, date, matiere, description, available_at)
     */
    public function syncForStudent(int $studentId): array
    {
        return $this->repository->syncForStudent($studentId);
    }
    
    /**
     * Récupère les assignments avec filtres optionnels
     * 
     * @param int|null $classId - Filtrer par classe
     * @param string|null $status - Filtrer par statut
     * @return array
     */
    public function getAssignmentsWithFilters(?int $classId = null, ?string $status = null): array
    {
        return $this->repository->findByFilters($classId, $status);
    }
}

