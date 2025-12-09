<?php
/**
 * Repository Assignment - Accès aux données
 * Gère toutes les opérations CRUD sur la table assignments
 */

namespace Repositories;

use Config\Database;
use Models\Assignment;
use PDO;
use PDOException;

class AssignmentRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère tous les assignments
     */
    public function findAll(): array
    {
        try {
            $stmt = $this->db->query('SELECT * FROM assignments ORDER BY created_at DESC');
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function ($row) {
                return Assignment::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('AssignmentRepository::findAll error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch assignments', 0, $e);
        }
    }

    /**
     * Récupère un assignment par son ID
     */
    public function findById(int $id): ?Assignment
    {
        try {
            $stmt = $this->db->prepare('SELECT * FROM assignments WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row === false) {
                return null;
            }

            return Assignment::fromArray($row);
        } catch (PDOException $e) {
            error_log('AssignmentRepository::findById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch assignment', 0, $e);
        }
    }

    /**
     * Crée un nouvel assignment
     */
    public function create(Assignment $assignment): Assignment
    {
        try {
            // Vérifier si la table a les nouveaux champs ou les anciens
            $stmt = $this->db->query("SHOW COLUMNS FROM assignments LIKE 'title'");
            $hasNewFields = $stmt->rowCount() > 0;
            
            if ($hasNewFields) {
                // Nouveau format avec title, description, subject, etc.
                $stmt = $this->db->prepare('
                    INSERT INTO assignments (class_id, title, description, subject, due_date, available_at, status)
                    VALUES (:class_id, :title, :description, :subject, :due_date, :available_at, :status)
                ');

                $stmt->execute([
                    'class_id' => $assignment->classId,
                    'title' => $assignment->title,
                    'description' => $assignment->description,
                    'subject' => $assignment->subject,
                    'due_date' => Assignment::isoToMysql($assignment->dueDate),
                    'available_at' => Assignment::isoToMysql($assignment->availableAt),
                    'status' => $assignment->status,
                ]);
            } else {
                // Ancien format avec theme_id, etc.
                $stmt = $this->db->prepare('
                    INSERT INTO assignments (class_id, theme_id, assigned_by, start_at, end_at, due_at)
                    VALUES (:class_id, :theme_id, :assigned_by, :start_at, :end_at, :due_at)
                ');

                $stmt->execute([
                    'class_id' => $assignment->classId,
                    'theme_id' => $assignment->themeId ?? 0,
                    'assigned_by' => $assignment->assignedBy ?? 0,
                    'start_at' => Assignment::isoToMysql($assignment->startAt),
                    'end_at' => Assignment::isoToMysql($assignment->endAt),
                    'due_at' => Assignment::isoToMysql($assignment->dueDate ?? $assignment->dueAt),
                ]);
            }

            $assignment->id = (int) $this->db->lastInsertId();

            // Récupérer l'assignment créé avec les valeurs par défaut (created_at)
            return $this->findById($assignment->id);
        } catch (PDOException $e) {
            error_log('AssignmentRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create assignment', 0, $e);
        }
    }

    /**
     * Met à jour un assignment existant
     */
    public function update(Assignment $assignment): ?Assignment
    {
        if ($assignment->id === null) {
            throw new \InvalidArgumentException('Assignment ID is required for update');
        }

        try {
            // Vérifier si la table a les nouveaux champs
            $stmt = $this->db->query("SHOW COLUMNS FROM assignments LIKE 'title'");
            $hasNewFields = $stmt->rowCount() > 0;
            
            // Construire dynamiquement la requête UPDATE avec seulement les champs fournis
            $fields = [];
            $params = ['id' => $assignment->id];

            if ($hasNewFields) {
                // Nouveau format
                if ($assignment->classId > 0) {
                    $fields[] = 'class_id = :class_id';
                    $params['class_id'] = $assignment->classId;
                }
                if (!empty($assignment->title)) {
                    $fields[] = 'title = :title';
                    $params['title'] = $assignment->title;
                }
                if (!empty($assignment->description)) {
                    $fields[] = 'description = :description';
                    $params['description'] = $assignment->description;
                }
                if (!empty($assignment->subject)) {
                    $fields[] = 'subject = :subject';
                    $params['subject'] = $assignment->subject;
                }
                if (!empty($assignment->dueDate)) {
                    $fields[] = 'due_date = :due_date';
                    $params['due_date'] = Assignment::isoToMysql($assignment->dueDate);
                }
                if ($assignment->availableAt !== null) {
                    $fields[] = 'available_at = :available_at';
                    $params['available_at'] = Assignment::isoToMysql($assignment->availableAt);
                }
                if (!empty($assignment->status)) {
                    $fields[] = 'status = :status';
                    $params['status'] = $assignment->status;
                }
                $fields[] = 'updated_at = NOW()';
            } else {
                // Ancien format
                if ($assignment->classId > 0) {
                    $fields[] = 'class_id = :class_id';
                    $params['class_id'] = $assignment->classId;
                }
                if ($assignment->themeId > 0) {
                    $fields[] = 'theme_id = :theme_id';
                    $params['theme_id'] = $assignment->themeId;
                }
                if ($assignment->assignedBy > 0) {
                    $fields[] = 'assigned_by = :assigned_by';
                    $params['assigned_by'] = $assignment->assignedBy;
                }
                if ($assignment->startAt !== null) {
                    $fields[] = 'start_at = :start_at';
                    $params['start_at'] = Assignment::isoToMysql($assignment->startAt);
                }
                if ($assignment->endAt !== null) {
                    $fields[] = 'end_at = :end_at';
                    $params['end_at'] = Assignment::isoToMysql($assignment->endAt);
                }
                if ($assignment->dueDate !== null || $assignment->dueAt !== null) {
                    $fields[] = 'due_at = :due_at';
                    $params['due_at'] = Assignment::isoToMysql($assignment->dueDate ?? $assignment->dueAt);
                }
            }

            if (empty($fields)) {
                // Aucun champ à mettre à jour
                return $this->findById($assignment->id);
            }

            $sql = 'UPDATE assignments SET ' . implode(', ', $fields) . ' WHERE id = :id';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $this->findById($assignment->id);
        } catch (PDOException $e) {
            error_log('AssignmentRepository::update error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to update assignment', 0, $e);
        }
    }

    /**
     * Supprime un assignment
     */
    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM assignments WHERE id = :id');
            $stmt->execute(['id' => $id]);
            
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('AssignmentRepository::delete error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to delete assignment', 0, $e);
        }
    }

    /**
     * Récupère les assignments pour un étudiant
     * (assignments des classes où l'étudiant est inscrit)
     * 
     * @param int $studentId
     * @return array
     */
    public function findByStudentId(int $studentId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT DISTINCT a.*
                FROM assignments a
                INNER JOIN class_students cs ON cs.class_id = a.class_id
                WHERE cs.student_id = :student_id
                ORDER BY a.created_at DESC
            ');
            $stmt->execute(['student_id' => $studentId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function ($row) {
                return Assignment::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('AssignmentRepository::findByStudentId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch assignments for student', 0, $e);
        }
    }

    /**
     * Récupère les assignments pour un professeur
     * (assignments des thèmes créés par ce professeur)
     * 
     * @param int $teacherId
     * @return array
     */
    public function findByTeacherId(int $teacherId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT DISTINCT a.*
                FROM assignments a
                INNER JOIN themes t ON t.id = a.theme_id
                WHERE t.created_by = :teacher_id
                ORDER BY a.created_at DESC
            ');
            $stmt->execute(['teacher_id' => $teacherId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function ($row) {
                return Assignment::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('AssignmentRepository::findByTeacherId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch assignments for teacher', 0, $e);
        }
    }

    /**
     * Récupère les assignments pour un établissement
     * 
     * @param int $schoolId
     * @return array
     */
    public function findBySchoolId(int $schoolId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT DISTINCT a.*
                FROM assignments a
                INNER JOIN classes c ON c.id = a.class_id
                WHERE c.school_id = :school_id
                ORDER BY a.created_at DESC
            ');
            $stmt->execute(['school_id' => $schoolId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function ($row) {
                return Assignment::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('AssignmentRepository::findBySchoolId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch assignments for school', 0, $e);
        }
    }
    
    /**
     * Récupère les assignments publiés pour un étudiant (pour synchronisation ErgoMate)
     * Filtre par class_id de l'étudiant et status = 'published'
     * 
     * @param int $studentId - ID de l'étudiant
     * @return array - Tableau d'assignments au format sync
     */
    public function syncForStudent(int $studentId): array
    {
        try {
            // Vérifier si la table a les nouveaux champs
            $stmt = $this->db->query("SHOW COLUMNS FROM assignments LIKE 'title'");
            $hasNewFields = $stmt->rowCount() > 0;
            
            if ($hasNewFields) {
                // Nouveau format : utiliser title, description, subject, due_date, available_at, status
                $stmt = $this->db->prepare('
                    SELECT DISTINCT a.*
                    FROM assignments a
                    INNER JOIN class_students cs ON cs.class_id = a.class_id
                    WHERE cs.student_id = :student_id
                      AND a.status = :status
                    ORDER BY a.due_date ASC
                ');
                $stmt->execute([
                    'student_id' => $studentId,
                    'status' => 'published'
                ]);
            } else {
                // Ancien format : simuler avec les données disponibles
                // Pour l'instant, retourner tous les assignments de l'étudiant
                // (sera filtré côté service si nécessaire)
                $stmt = $this->db->prepare('
                    SELECT DISTINCT a.*
                    FROM assignments a
                    INNER JOIN class_students cs ON cs.class_id = a.class_id
                    WHERE cs.student_id = :student_id
                    ORDER BY a.due_at ASC
                ');
                $stmt->execute(['student_id' => $studentId]);
            }
            
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function ($row) {
                $assignment = Assignment::fromArray($row);
                return $assignment->toSyncArray();
            }, $rows);
        } catch (PDOException $e) {
            error_log('AssignmentRepository::syncForStudent error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to sync assignments for student', 0, $e);
        }
    }
    
    /**
     * Récupère les assignments filtrés par classe et/ou statut
     * 
     * @param int|null $classId - Filtrer par classe (optionnel)
     * @param string|null $status - Filtrer par statut (optionnel)
     * @return array
     */
    public function findByFilters(?int $classId = null, ?string $status = null): array
    {
        try {
            $where = [];
            $params = [];
            
            if ($classId !== null && $classId > 0) {
                $where[] = 'a.class_id = :class_id';
                $params['class_id'] = $classId;
            }
            
            if ($status !== null) {
                $where[] = 'a.status = :status';
                $params['status'] = $status;
            }
            
            $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
            
            $stmt = $this->db->prepare("
                SELECT a.*
                FROM assignments a
                $whereClause
                ORDER BY a.created_at DESC
            ");
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function ($row) {
                return Assignment::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('AssignmentRepository::findByFilters error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch assignments with filters', 0, $e);
        }
    }
}

