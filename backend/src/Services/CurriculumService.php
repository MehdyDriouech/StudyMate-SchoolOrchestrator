<?php
/**
 * Service Curriculum - Logique métier
 * Valide les données et orchestre les opérations
 */

namespace Services;

use Repositories\CurriculumRepository;

class CurriculumService
{
    private CurriculumRepository $repository;

    public function __construct(CurriculumRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Récupère le curriculum complet pour un établissement
     * 
     * @param int $schoolId - ID de l'établissement
     * @return array
     */
    public function getCurriculumForSchool(int $schoolId): array
    {
        return $this->repository->findBySchoolId($schoolId);
    }

    /**
     * Récupère la liste des matières
     * 
     * @param int $schoolId - ID de l'établissement
     * @return array
     */
    public function getSubjects(int $schoolId): array
    {
        return $this->repository->findSubjects($schoolId);
    }

    /**
     * Récupère une matière par son ID
     * 
     * @param string $subjectId - ID de la matière
     * @param int $schoolId - ID de l'établissement
     * @return array|null
     */
    public function getSubjectById(string $subjectId, int $schoolId): ?array
    {
        return $this->repository->findSubjectById($subjectId, $schoolId);
    }

    /**
     * Récupère un chapitre par son ID
     * 
     * @param string $subjectId - ID de la matière
     * @param string $chapterId - ID du chapitre
     * @param int $schoolId - ID de l'établissement
     * @return array|null
     */
    public function getChapterById(string $subjectId, string $chapterId, int $schoolId): ?array
    {
        return $this->repository->findChapterById($subjectId, $chapterId, $schoolId);
    }

    /**
     * Met à jour la progression d'un chapitre
     * 
     * @param string $subjectId - ID de la matière
     * @param string $chapterId - ID du chapitre
     * @param int $progress - Nouvelle progression (0-100)
     * @param int $schoolId - ID de l'établissement
     * @return array|null
     */
    public function updateChapterProgress(string $subjectId, string $chapterId, int $progress, int $schoolId): ?array
    {
        return $this->repository->updateChapterProgress($subjectId, $chapterId, $progress, $schoolId);
    }
}

