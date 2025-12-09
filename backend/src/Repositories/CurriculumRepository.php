<?php
/**
 * Repository Curriculum - Accès aux données
 * V1 : Implémentation en mémoire (mock)
 * TODO : Migrer vers une vraie table SQL pour les versions futures
 */

namespace Repositories;

class CurriculumRepository
{
    /**
     * Données mockées du curriculum
     * Structure alignée avec MOCK_CURRICULUM du FakeRouter
     */
    private static array $mockCurriculum = [
        'subjects' => [
            [
                'id' => 'math-term',
                'name' => 'Mathématiques Terminale',
                'level' => 'Terminale',
                'chapters' => [
                    ['id' => 'ch1', 'title' => 'Suites numériques', 'progress' => 85],
                    ['id' => 'ch2', 'title' => 'Fonctions exponentielles', 'progress' => 60],
                    ['id' => 'ch3', 'title' => 'Probabilités conditionnelles', 'progress' => 30]
                ]
            ],
            [
                'id' => 'philo-term',
                'name' => 'Philosophie Terminale',
                'level' => 'Terminale',
                'chapters' => [
                    ['id' => 'ch1', 'title' => 'La conscience', 'progress' => 100],
                    ['id' => 'ch2', 'title' => 'Le bonheur', 'progress' => 70],
                    ['id' => 'ch3', 'title' => 'La vérité', 'progress' => 40]
                ]
            ]
        ]
    ];

    /**
     * Récupère le curriculum complet pour un établissement
     * 
     * @param int $schoolId - ID de l'établissement (non utilisé en V1, mais préparé pour la migration DB)
     * @return array
     */
    public function findBySchoolId(int $schoolId): array
    {
        // En V1, on retourne toujours les mêmes données mockées
        // En production, on ferait une requête SQL : SELECT * FROM curriculum WHERE school_id = :school_id
        return self::$mockCurriculum;
    }

    /**
     * Récupère une matière par son ID
     * 
     * @param string $subjectId - ID de la matière (ex: 'math-term')
     * @param int $schoolId - ID de l'établissement
     * @return array|null
     */
    public function findSubjectById(string $subjectId, int $schoolId): ?array
    {
        $curriculum = $this->findBySchoolId($schoolId);
        
        foreach ($curriculum['subjects'] as $subject) {
            if ($subject['id'] === $subjectId) {
                return $subject;
            }
        }
        
        return null;
    }

    /**
     * Récupère un chapitre par son ID (composite : subjectId + chapterId)
     * 
     * @param string $subjectId - ID de la matière
     * @param string $chapterId - ID du chapitre
     * @param int $schoolId - ID de l'établissement
     * @return array|null
     */
    public function findChapterById(string $subjectId, string $chapterId, int $schoolId): ?array
    {
        $subject = $this->findSubjectById($subjectId, $schoolId);
        
        if ($subject === null) {
            return null;
        }
        
        foreach ($subject['chapters'] as $chapter) {
            if ($chapter['id'] === $chapterId) {
                return $chapter;
            }
        }
        
        return null;
    }

    /**
     * Met à jour la progression d'un chapitre
     * 
     * @param string $subjectId - ID de la matière
     * @param string $chapterId - ID du chapitre
     * @param int $progress - Nouvelle progression (0-100)
     * @param int $schoolId - ID de l'établissement
     * @return array|null - Chapitre mis à jour ou null si non trouvé
     */
    public function updateChapterProgress(string $subjectId, string $chapterId, int $progress, int $schoolId): ?array
    {
        // Valider la progression (0-100)
        if ($progress < 0 || $progress > 100) {
            throw new \InvalidArgumentException('Progress must be between 0 and 100');
        }
        
        $curriculum = &self::$mockCurriculum;
        
        foreach ($curriculum['subjects'] as &$subject) {
            if ($subject['id'] === $subjectId) {
                foreach ($subject['chapters'] as &$chapter) {
                    if ($chapter['id'] === $chapterId) {
                        $chapter['progress'] = $progress;
                        return $chapter;
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Récupère la liste des matières (sans les détails complets des chapitres)
     * 
     * @param int $schoolId - ID de l'établissement
     * @return array
     */
    public function findSubjects(int $schoolId): array
    {
        $curriculum = $this->findBySchoolId($schoolId);
        
        // Retourner uniquement les matières avec un résumé des chapitres
        return array_map(function ($subject) {
            return [
                'id' => $subject['id'],
                'name' => $subject['name'],
                'level' => $subject['level'],
                'chapters_count' => count($subject['chapters']),
                'average_progress' => $this->calculateAverageProgress($subject['chapters'])
            ];
        }, $curriculum['subjects']);
    }

    /**
     * Calcule la progression moyenne d'un ensemble de chapitres
     * 
     * @param array $chapters - Liste des chapitres
     * @return float
     */
    private function calculateAverageProgress(array $chapters): float
    {
        if (empty($chapters)) {
            return 0.0;
        }
        
        $total = array_sum(array_column($chapters, 'progress'));
        return round($total / count($chapters), 2);
    }
}

