<?php
/**
 * Service Stats - Logique métier pour les statistiques
 * Génère les données de statistiques pour un établissement
 */

namespace Services;

use Config\Database;
use PDO;
use PDOException;

class StatsService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère les statistiques d'aperçu pour un établissement
     * 
     * @param int $schoolId - ID de l'établissement
     * @return array Tableau avec kpis, topSubjects, recentActivity
     */
    public function getOverviewForSchool(int $schoolId): array
    {
        try {
            // KPIs
            $kpis = $this->getKPIs($schoolId);
            
            // Top subjects (matières les plus actives)
            $topSubjects = $this->getTopSubjects($schoolId);
            
            // Activité récente
            $recentActivity = $this->getRecentActivity($schoolId);
            
            return [
                'kpis' => $kpis,
                'topSubjects' => $topSubjects,
                'recentActivity' => $recentActivity
            ];
        } catch (PDOException $e) {
            error_log('StatsService::getOverviewForSchool error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch stats overview', 0, $e);
        }
    }

    /**
     * Récupère les KPIs (indicateurs clés)
     * 
     * @param int $schoolId
     * @return array
     */
    private function getKPIs(int $schoolId): array
    {
        // Total étudiants
        $stmt = $this->db->prepare('
            SELECT COUNT(DISTINCT u.id) as total_students
            FROM users u
            WHERE u.school_id = :school_id AND u.role = "student"
        ');
        $stmt->execute(['school_id' => $schoolId]);
        $totalStudents = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total_students'] ?? 0;

        // Total classes
        $stmt = $this->db->prepare('
            SELECT COUNT(*) as total_classes
            FROM classes
            WHERE school_id = :school_id
        ');
        $stmt->execute(['school_id' => $schoolId]);
        $totalClasses = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total_classes'] ?? 0;

        // Assignments actifs (non terminés)
        $stmt = $this->db->prepare('
            SELECT COUNT(*) as active_assignments
            FROM assignments a
            INNER JOIN classes c ON a.class_id = c.id
            WHERE c.school_id = :school_id
            AND (a.end_at IS NULL OR a.end_at > NOW())
        ');
        $stmt->execute(['school_id' => $schoolId]);
        $activeAssignments = (int) $stmt->fetch(PDO::FETCH_ASSOC)['active_assignments'] ?? 0;

        // Taux de complétion moyen (basé sur les submissions)
        $stmt = $this->db->prepare('
            SELECT 
                COUNT(DISTINCT s.student_id) as completed_students,
                COUNT(DISTINCT cs.student_id) as total_students
            FROM assignments a
            INNER JOIN classes c ON a.class_id = c.id
            INNER JOIN class_students cs ON cs.class_id = c.id
            LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = cs.student_id
            WHERE c.school_id = :school_id
        ');
        $stmt->execute(['school_id' => $schoolId]);
        $completionData = $stmt->fetch(PDO::FETCH_ASSOC);
        $completionRate = 0.0;
        if ($completionData && $completionData['total_students'] > 0) {
            $completionRate = round(
                ($completionData['completed_students'] / $completionData['total_students']) * 100,
                1
            );
        }

        // Note moyenne (basée sur les submissions avec score)
        $stmt = $this->db->prepare('
            SELECT AVG(s.score) as average_grade
            FROM submissions s
            INNER JOIN assignments a ON s.assignment_id = a.id
            INNER JOIN classes c ON a.class_id = c.id
            WHERE c.school_id = :school_id
            AND s.score IS NOT NULL
        ');
        $stmt->execute(['school_id' => $schoolId]);
        $avgGrade = (float) $stmt->fetch(PDO::FETCH_ASSOC)['average_grade'] ?? 0.0;
        $avgGrade = round($avgGrade, 1);

        return [
            'totalStudents' => $totalStudents,
            'totalClasses' => $totalClasses,
            'activeAssignments' => $activeAssignments,
            'completionRate' => $completionRate,
            'averageGrade' => $avgGrade
        ];
    }

    /**
     * Récupère les matières les plus actives
     * 
     * @param int $schoolId
     * @return array
     */
    private function getTopSubjects(int $schoolId): array
    {
        $stmt = $this->db->prepare('
            SELECT 
                t.subject,
                COUNT(DISTINCT a.id) as assignments_count,
                COUNT(DISTINCT s.student_id) as completed_students,
                COUNT(DISTINCT cs.student_id) as total_students
            FROM themes t
            INNER JOIN assignments a ON a.theme_id = t.id
            INNER JOIN classes c ON a.class_id = c.id
            INNER JOIN class_students cs ON cs.class_id = c.id
            LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = cs.student_id
            WHERE t.school_id = :school_id
            AND t.subject IS NOT NULL
            GROUP BY t.subject
            ORDER BY assignments_count DESC
            LIMIT 5
        ');
        $stmt->execute(['school_id' => $schoolId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function ($row) {
            $completionRate = 0.0;
            if ($row['total_students'] > 0) {
                $completionRate = round(
                    ($row['completed_students'] / $row['total_students']) * 100,
                    1
                );
            }
            
            return [
                'name' => $row['subject'],
                'assignmentsCount' => (int) $row['assignments_count'],
                'avgCompletion' => $completionRate
            ];
        }, $rows);
    }

    /**
     * Récupère l'activité récente (dernières submissions et créations d'assignments)
     * 
     * @param int $schoolId
     * @return array
     */
    private function getRecentActivity(int $schoolId): array
    {
        $activities = [];

        // Dernières submissions complétées
        $stmt = $this->db->prepare('
            SELECT 
                s.completed_at as timestamp,
                u.full_name as student_name,
                t.title as assignment_title,
                t.subject,
                s.score as grade
            FROM submissions s
            INNER JOIN assignments a ON s.assignment_id = a.id
            INNER JOIN themes t ON a.theme_id = t.id
            INNER JOIN classes c ON a.class_id = c.id
            INNER JOIN users u ON s.student_id = u.id
            WHERE c.school_id = :school_id
            AND s.completed_at IS NOT NULL
            ORDER BY s.completed_at DESC
            LIMIT 5
        ');
        $stmt->execute(['school_id' => $schoolId]);
        $completedSubmissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($completedSubmissions as $sub) {
            $activities[] = [
                'type' => 'assignment_completed',
                'studentName' => $sub['student_name'],
                'assignmentTitle' => $sub['assignment_title'],
                'subject' => $sub['subject'],
                'grade' => $sub['grade'] ? (float) $sub['grade'] : null,
                'timestamp' => $sub['timestamp']
            ];
        }

        // Dernières submissions soumises (sans note encore)
        $stmt = $this->db->prepare('
            SELECT 
                s.created_at as timestamp,
                u.full_name as student_name,
                t.title as assignment_title,
                t.subject
            FROM submissions s
            INNER JOIN assignments a ON s.assignment_id = a.id
            INNER JOIN themes t ON a.theme_id = t.id
            INNER JOIN classes c ON a.class_id = c.id
            INNER JOIN users u ON s.student_id = u.id
            WHERE c.school_id = :school_id
            AND s.completed_at IS NULL
            ORDER BY s.created_at DESC
            LIMIT 3
        ');
        $stmt->execute(['school_id' => $schoolId]);
        $submittedSubmissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($submittedSubmissions as $sub) {
            $activities[] = [
                'type' => 'assignment_submitted',
                'studentName' => $sub['student_name'],
                'assignmentTitle' => $sub['assignment_title'],
                'subject' => $sub['subject'],
                'timestamp' => $sub['timestamp']
            ];
        }

        // Derniers assignments créés
        $stmt = $this->db->prepare('
            SELECT 
                a.created_at as timestamp,
                u.full_name as teacher_name,
                t.title as assignment_title,
                t.subject
            FROM assignments a
            INNER JOIN themes t ON a.theme_id = t.id
            INNER JOIN classes c ON a.class_id = c.id
            INNER JOIN users u ON a.assigned_by = u.id
            WHERE c.school_id = :school_id
            ORDER BY a.created_at DESC
            LIMIT 3
        ');
        $stmt->execute(['school_id' => $schoolId]);
        $createdAssignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($createdAssignments as $assign) {
            $activities[] = [
                'type' => 'assignment_created',
                'teacherName' => $assign['teacher_name'],
                'assignmentTitle' => $assign['assignment_title'],
                'subject' => $assign['subject'],
                'timestamp' => $assign['timestamp']
            ];
        }

        // Trier par timestamp décroissant et limiter à 10
        usort($activities, function ($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        return array_slice($activities, 0, 10);
    }

    /**
     * Récupère les statistiques agrégées par établissement
     * 
     * @return array Tableau avec les stats par école
     */
    public function getStatsBySchools(): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT 
                    s.id as school_id,
                    s.name as school_name,
                    COUNT(DISTINCT u.id) as active_students,
                    COUNT(DISTINCT c.id) as classes_count
                FROM schools s
                LEFT JOIN users u ON u.school_id = s.id AND u.role = "student"
                LEFT JOIN classes c ON c.school_id = s.id
                GROUP BY s.id, s.name
                ORDER BY s.name ASC
            ');
            $stmt->execute();
            $schools = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Pour chaque école, calculer les stats détaillées
            $result = [];
            foreach ($schools as $school) {
                $schoolId = (int) $school['school_id'];

                // Note moyenne (basée sur les submissions avec score)
                $stmt = $this->db->prepare('
                    SELECT AVG(sub.score) as avg_score
                    FROM submissions sub
                    INNER JOIN assignments a ON sub.assignment_id = a.id
                    INNER JOIN classes c ON a.class_id = c.id
                    WHERE c.school_id = :school_id
                    AND sub.score IS NOT NULL
                ');
                $stmt->execute(['school_id' => $schoolId]);
                $avgScore = (float) ($stmt->fetch(PDO::FETCH_ASSOC)['avg_score'] ?? 0.0);
                $avgScore = round($avgScore, 1);

                // Taux de complétion (assignments rendus / assignés)
                $stmt = $this->db->prepare('
                    SELECT 
                        COUNT(DISTINCT sub.student_id) as completed_students,
                        COUNT(DISTINCT cs.student_id) as total_students
                    FROM assignments a
                    INNER JOIN classes c ON a.class_id = c.id
                    INNER JOIN class_students cs ON cs.class_id = c.id
                    LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = cs.student_id
                    WHERE c.school_id = :school_id
                ');
                $stmt->execute(['school_id' => $schoolId]);
                $completionData = $stmt->fetch(PDO::FETCH_ASSOC);
                $completionRate = 0.0;
                if ($completionData && $completionData['total_students'] > 0) {
                    $completionRate = round(
                        ($completionData['completed_students'] / $completionData['total_students']),
                        2
                    );
                }

                $result[] = [
                    'school_id' => $schoolId,
                    'school_name' => $school['school_name'],
                    'avg_score' => $avgScore,
                    'completion_rate' => $completionRate,
                    'active_students' => (int) $school['active_students'],
                    'classes_count' => (int) $school['classes_count']
                ];
            }

            return $result;
        } catch (PDOException $e) {
            error_log('StatsService::getStatsBySchools error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch schools statistics', 0, $e);
        }
    }
}

