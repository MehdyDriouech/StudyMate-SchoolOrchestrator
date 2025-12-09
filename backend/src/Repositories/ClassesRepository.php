<?php
/**
 * Repository Classes - Accès aux données
 * Gère toutes les opérations de lecture sur les classes et étudiants
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class ClassesRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère toutes les classes d'un établissement
     * 
     * @param int $schoolId
     * @return array
     */
    public function findAllBySchoolId(int $schoolId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM classes 
                WHERE school_id = :school_id 
                ORDER BY name ASC
            ');
            $stmt->execute(['school_id' => $schoolId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('ClassesRepository::findAllBySchoolId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch classes', 0, $e);
        }
    }

    /**
     * Récupère une classe par son ID
     * 
     * @param int $id
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare('SELECT * FROM classes WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row === false) {
                return null;
            }

            return $row;
        } catch (PDOException $e) {
            error_log('ClassesRepository::findById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch class', 0, $e);
        }
    }

    /**
     * Récupère les étudiants d'une classe
     * 
     * @param int $classId
     * @return array
     */
    public function findStudentsByClassId(int $classId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT 
                    u.id,
                    u.full_name as name,
                    u.email,
                    u.role,
                    u.social_uuid,
                    u.school_id,
                    u.created_at
                FROM users u
                INNER JOIN class_students cs ON cs.student_id = u.id
                WHERE cs.class_id = :class_id 
                  AND u.role = \'student\'
                ORDER BY u.full_name ASC
            ');
            $stmt->execute(['class_id' => $classId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('ClassesRepository::findStudentsByClassId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch students for class', 0, $e);
        }
    }

    /**
     * Récupère un étudiant par son ID
     * 
     * @param int $id
     * @return array|null
     */
    public function findStudentById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT 
                    id,
                    full_name as name,
                    email,
                    role,
                    social_uuid,
                    school_id,
                    created_at
                FROM users 
                WHERE id = :id AND role = \'student\'
            ');
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row === false) {
                return null;
            }

            return $row;
        } catch (PDOException $e) {
            error_log('ClassesRepository::findStudentById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch student', 0, $e);
        }
    }
}

