<?php
/**
 * Repository Submission - Accès aux données
 * Gère toutes les opérations CRUD sur la table submissions
 */

namespace Repositories;

use Config\Database;
use Models\Submission;
use PDO;
use PDOException;

class SubmissionRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère une soumission par ID
     */
    public function findById(int $id): ?Submission
    {
        try {
            $stmt = $this->db->prepare('SELECT * FROM submissions WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row === false) {
                return null;
            }

            return Submission::fromArray($row);
        } catch (PDOException $e) {
            error_log('SubmissionRepository::findById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch submission', 0, $e);
        }
    }

    /**
     * Récupère une soumission par assignment_id et student_id
     */
    public function findByAssignmentAndStudent(int $assignmentId, int $studentId): ?Submission
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM submissions 
                WHERE assignment_id = :assignment_id AND student_id = :student_id
            ');
            $stmt->execute([
                'assignment_id' => $assignmentId,
                'student_id' => $studentId
            ]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row === false) {
                return null;
            }

            return Submission::fromArray($row);
        } catch (PDOException $e) {
            error_log('SubmissionRepository::findByAssignmentAndStudent error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch submission', 0, $e);
        }
    }

    /**
     * Crée ou met à jour une soumission (UPSERT)
     * Utilise INSERT ... ON DUPLICATE KEY UPDATE pour gérer la contrainte UNIQUE
     */
    public function upsert(Submission $submission): Submission
    {
        try {
            $rawResponseJson = $submission->rawResponse !== null 
                ? json_encode($submission->rawResponse, JSON_UNESCAPED_UNICODE) 
                : null;

            $completedAt = $submission->completedAt !== null 
                ? Submission::isoToMysql($submission->completedAt) 
                : date('Y-m-d H:i:s');

            $stmt = $this->db->prepare('
                INSERT INTO submissions (
                    assignment_id, 
                    student_id, 
                    score, 
                    duration_seconds, 
                    raw_response, 
                    completed_at
                )
                VALUES (
                    :assignment_id,
                    :student_id,
                    :score,
                    :duration_seconds,
                    :raw_response,
                    :completed_at
                )
                ON DUPLICATE KEY UPDATE
                    score = VALUES(score),
                    duration_seconds = VALUES(duration_seconds),
                    raw_response = VALUES(raw_response),
                    completed_at = VALUES(completed_at),
                    updated_at = NOW()
            ');

            $stmt->execute([
                'assignment_id' => $submission->assignmentId,
                'student_id' => $submission->studentId,
                'score' => $submission->score,
                'duration_seconds' => $submission->durationSeconds,
                'raw_response' => $rawResponseJson,
                'completed_at' => $completedAt
            ]);

            // Si c'était une insertion, récupérer l'ID
            if ($submission->id === null) {
                $submission->id = (int) $this->db->lastInsertId();
            }

            // Récupérer la soumission complète avec les valeurs par défaut
            return $this->findByAssignmentAndStudent(
                $submission->assignmentId,
                $submission->studentId
            ) ?? $submission;
        } catch (PDOException $e) {
            error_log('SubmissionRepository::upsert error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to save submission', 0, $e);
        }
    }

    /**
     * Récupère toutes les soumissions pour un assignment donné
     * 
     * @param int $assignmentId
     * @return array Array de Submission
     */
    public function findByAssignmentId(int $assignmentId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM submissions 
                WHERE assignment_id = :assignment_id
                ORDER BY completed_at DESC
            ');
            $stmt->execute(['assignment_id' => $assignmentId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map(function ($row) {
                return Submission::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('SubmissionRepository::findByAssignmentId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch submissions for assignment', 0, $e);
        }
    }

    /**
     * Récupère toutes les soumissions d'un étudiant
     * 
     * @param int $studentId
     * @return array Array de Submission
     */
    public function findByStudentId(int $studentId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM submissions 
                WHERE student_id = :student_id
                ORDER BY completed_at DESC
            ');
            $stmt->execute(['student_id' => $studentId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map(function ($row) {
                return Submission::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('SubmissionRepository::findByStudentId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch submissions for student', 0, $e);
        }
    }

    /**
     * Vérifie si un assignment existe
     * 
     * @param int $assignmentId
     * @return bool
     */
    public function assignmentExists(int $assignmentId): bool
    {
        try {
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM assignments WHERE id = :id');
            $stmt->execute(['id' => $assignmentId]);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log('SubmissionRepository::assignmentExists error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Vérifie si un étudiant existe
     * 
     * @param int $studentId
     * @return bool
     */
    public function studentExists(int $studentId): bool
    {
        try {
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM users WHERE id = :id AND role = \'student\'');
            $stmt->execute(['id' => $studentId]);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log('SubmissionRepository::studentExists error: ' . $e->getMessage());
            return false;
        }
    }
}

