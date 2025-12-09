<?php
/**
 * Service Classes - Logique métier
 * Valide les données et orchestre les opérations
 */

namespace Services;

use Repositories\ClassesRepository;

class ClassesService
{
    private ClassesRepository $repository;

    public function __construct(ClassesRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Récupère toutes les classes selon le rôle de l'utilisateur
     * 
     * Règles :
     * - Tous les rôles : voient uniquement les classes de leur établissement
     * 
     * @param array $user - Utilisateur authentifié
     * @return array
     */
    public function getClassesForUser(array $user): array
    {
        $schoolId = (int) ($user['school_id'] ?? 0);

        if ($schoolId <= 0) {
            return [];
        }

        $classes = $this->repository->findAllBySchoolId($schoolId);
        
        // Formater les classes pour l'API
        return array_map(function ($class) {
            return [
                'id' => (int) $class['id'],
                'name' => $class['name'],
                'short_name' => $class['short_name'],
                'level' => $class['level'],
                'academic_year' => $class['academic_year'],
                'school_id' => (int) $class['school_id'],
                'created_at' => $this->formatDateTime($class['created_at']),
            ];
        }, $classes);
    }

    /**
     * Récupère une classe par ID avec vérification des permissions
     * 
     * @param int $id - ID de la classe
     * @param array $user - Utilisateur authentifié
     * @return array|null
     */
    public function getClassById(int $id, array $user): ?array
    {
        $schoolId = (int) ($user['school_id'] ?? 0);

        if ($schoolId <= 0) {
            return null;
        }

        $class = $this->repository->findById($id);

        if ($class === null) {
            return null;
        }

        // Vérifier que la classe appartient au même établissement
        if ((int) $class['school_id'] !== $schoolId) {
            return null;
        }

        // Formater la classe pour l'API
        return [
            'id' => (int) $class['id'],
            'name' => $class['name'],
            'short_name' => $class['short_name'],
            'level' => $class['level'],
            'academic_year' => $class['academic_year'],
            'school_id' => (int) $class['school_id'],
            'created_at' => $this->formatDateTime($class['created_at']),
        ];
    }

    /**
     * Récupère les étudiants d'une classe avec vérification des permissions
     * 
     * @param int $classId - ID de la classe
     * @param array $user - Utilisateur authentifié
     * @return array
     */
    public function getStudentsByClassId(int $classId, array $user): array
    {
        $schoolId = (int) ($user['school_id'] ?? 0);

        if ($schoolId <= 0) {
            return [];
        }

        // Vérifier que la classe existe et appartient au même établissement
        $class = $this->repository->findById($classId);
        if ($class === null || (int) $class['school_id'] !== $schoolId) {
            return [];
        }

        $students = $this->repository->findStudentsByClassId($classId);

        // Formater les étudiants pour l'API
        return array_map(function ($student) {
            return [
                'id' => (int) $student['id'],
                'name' => $student['name'],
                'email' => $student['email'],
                'social_uuid' => $student['social_uuid'],
                'school_id' => (int) $student['school_id'],
                'created_at' => $this->formatDateTime($student['created_at']),
            ];
        }, $students);
    }

    /**
     * Récupère un étudiant par ID avec vérification des permissions
     * 
     * @param int $id - ID de l'étudiant
     * @param array $user - Utilisateur authentifié
     * @return array|null
     */
    public function getStudentById(int $id, array $user): ?array
    {
        $schoolId = (int) ($user['school_id'] ?? 0);

        if ($schoolId <= 0) {
            return null;
        }

        $student = $this->repository->findStudentById($id);

        if ($student === null) {
            return null;
        }

        // Vérifier que l'étudiant appartient au même établissement
        if ((int) $student['school_id'] !== $schoolId) {
            return null;
        }

        // Formater l'étudiant pour l'API
        return [
            'id' => (int) $student['id'],
            'name' => $student['name'],
            'email' => $student['email'],
            'social_uuid' => $student['social_uuid'],
            'school_id' => (int) $student['school_id'],
            'created_at' => $this->formatDateTime($student['created_at']),
        ];
    }

    /**
     * Formate une date MySQL en ISO 8601 (2025-09-01T08:00:00)
     */
    private function formatDateTime(?string $datetime): ?string
    {
        if ($datetime === null) {
            return null;
        }

        // Si déjà au format ISO, retourner tel quel
        if (strpos($datetime, 'T') !== false) {
            return $datetime;
        }

        // Convertir depuis MySQL DATETIME (2025-09-01 08:00:00) vers ISO 8601
        $dt = \DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
        if ($dt === false) {
            return $datetime; // Retourner tel quel si échec
        }

        return $dt->format('Y-m-d\TH:i:s');
    }
}

