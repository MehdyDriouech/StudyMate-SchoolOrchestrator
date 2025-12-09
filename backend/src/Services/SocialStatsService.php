<?php
/**
 * Service SocialStats - Logique métier pour les statistiques sociales
 * Gère la validation et la logique métier des stats sociales
 */

namespace Services;

use Repositories\SocialStatsRepository;
use Config\Database;
use PDO;
use PDOException;

class SocialStatsService
{
    private SocialStatsRepository $repository;
    private PDO $db;

    public function __construct(SocialStatsRepository $repository)
    {
        $this->repository = $repository;
        $this->db = Database::getInstance();
    }

    /**
     * Récupère toutes les stats sociales pour un établissement
     * 
     * @param int $schoolId - ID de l'établissement
     * @return array
     */
    public function getStatsForSchool(int $schoolId): array
    {
        return $this->repository->findAllBySchool($schoolId);
    }

    /**
     * Récupère les stats sociales pour une classe
     * 
     * @param int $classId - ID de la classe
     * @param string|null $metricDate - Date de la métrique
     * @return array|null
     */
    public function getStatsForClass(int $classId, ?string $metricDate = null): ?array
    {
        // Vérifier que la classe existe
        $stmt = $this->db->prepare('SELECT id FROM classes WHERE id = :id');
        $stmt->execute(['id' => $classId]);
        if (!$stmt->fetch()) {
            throw new \InvalidArgumentException('Class not found');
        }

        return $this->repository->findByClass($classId, $metricDate);
    }

    /**
     * Récupère une stat sociale par ID
     * 
     * @param int $id - ID de la stat
     * @return array|null
     */
    public function getStatById(int $id): ?array
    {
        return $this->repository->findById($id);
    }

    /**
     * Crée ou met à jour une stat sociale
     * 
     * @param array $data - Données de la stat
     * @param array $user - Utilisateur authentifié
     * @return array
     */
    public function createOrUpdateStat(array $data, array $user): array
    {
        // Validation
        $this->validateStatData($data);

        // Vérifier que la classe appartient au même établissement que l'utilisateur
        $stmt = $this->db->prepare('
            SELECT c.id, c.school_id 
            FROM classes c 
            WHERE c.id = :class_id
        ');
        $stmt->execute(['class_id' => $data['class_id']]);
        $class = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$class) {
            throw new \InvalidArgumentException('Class not found');
        }

        $userSchoolId = (int) ($user['school_id'] ?? 0);
        if ($class['school_id'] != $userSchoolId) {
            throw new \InvalidArgumentException('You do not have permission to access this class');
        }

        // Vérifier si une stat existe déjà pour cette classe et cette date
        $existing = $this->repository->findByClass($data['class_id'], $data['metric_date']);

        if ($existing) {
            // Mettre à jour
            return $this->repository->update($existing['id'], $data);
        } else {
            // Créer
            return $this->repository->create($data);
        }
    }

    /**
     * Met à jour une stat sociale
     * 
     * @param int $id - ID de la stat
     * @param array $data - Données à mettre à jour
     * @param array $user - Utilisateur authentifié
     * @return array|null
     */
    public function updateStat(int $id, array $data, array $user): ?array
    {
        $stat = $this->repository->findById($id);
        if (!$stat) {
            return null;
        }

        // Vérifier que la stat appartient au même établissement que l'utilisateur
        $stmt = $this->db->prepare('
            SELECT c.school_id 
            FROM classes c 
            INNER JOIN social_stats ss ON ss.class_id = c.id
            WHERE ss.id = :id
        ');
        $stmt->execute(['id' => $id]);
        $class = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$class) {
            return null;
        }

        $userSchoolId = (int) ($user['school_id'] ?? 0);
        if ($class['school_id'] != $userSchoolId) {
            throw new \InvalidArgumentException('You do not have permission to update this stat');
        }

        // Validation partielle (seulement les champs fournis)
        if (isset($data['collaboration_score'])) {
            $this->validateScore($data['collaboration_score'], 'collaboration_score');
        }
        if (isset($data['participation_rate'])) {
            $this->validateRate($data['participation_rate'], 'participation_rate');
        }
        if (isset($data['engagement_level'])) {
            $this->validateEngagementLevel($data['engagement_level']);
        }

        return $this->repository->update($id, $data);
    }

    /**
     * Supprime une stat sociale
     * 
     * @param int $id - ID de la stat
     * @param array $user - Utilisateur authentifié
     * @return bool
     */
    public function deleteStat(int $id, array $user): bool
    {
        $stat = $this->repository->findById($id);
        if (!$stat) {
            return false;
        }

        // Vérifier que la stat appartient au même établissement que l'utilisateur
        $stmt = $this->db->prepare('
            SELECT c.school_id 
            FROM classes c 
            INNER JOIN social_stats ss ON ss.class_id = c.id
            WHERE ss.id = :id
        ');
        $stmt->execute(['id' => $id]);
        $class = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$class) {
            return false;
        }

        $userSchoolId = (int) ($user['school_id'] ?? 0);
        if ($class['school_id'] != $userSchoolId) {
            throw new \InvalidArgumentException('You do not have permission to delete this stat');
        }

        return $this->repository->delete($id);
    }

    /**
     * Valide les données d'une stat sociale
     * 
     * @param array $data
     * @throws \InvalidArgumentException
     */
    private function validateStatData(array $data): void
    {
        if (empty($data['class_id']) || !is_numeric($data['class_id'])) {
            throw new \InvalidArgumentException('class_id is required and must be numeric');
        }

        if (empty($data['metric_date'])) {
            throw new \InvalidArgumentException('metric_date is required');
        }

        // Valider le format de date
        $date = \DateTime::createFromFormat('Y-m-d', $data['metric_date']);
        if (!$date || $date->format('Y-m-d') !== $data['metric_date']) {
            throw new \InvalidArgumentException('metric_date must be in format Y-m-d');
        }

        // Validation optionnelle des scores
        if (isset($data['collaboration_score'])) {
            $this->validateScore($data['collaboration_score'], 'collaboration_score');
        }

        if (isset($data['participation_rate'])) {
            $this->validateRate($data['participation_rate'], 'participation_rate');
        }

        if (isset($data['engagement_level'])) {
            $this->validateEngagementLevel($data['engagement_level']);
        }
    }

    /**
     * Valide un score (0-100)
     */
    private function validateScore($score, string $fieldName): void
    {
        if (!is_numeric($score)) {
            throw new \InvalidArgumentException("$fieldName must be numeric");
        }
        $score = (float) $score;
        if ($score < 0 || $score > 100) {
            throw new \InvalidArgumentException("$fieldName must be between 0 and 100");
        }
    }

    /**
     * Valide un taux (0-100)
     */
    private function validateRate($rate, string $fieldName): void
    {
        if (!is_numeric($rate)) {
            throw new \InvalidArgumentException("$fieldName must be numeric");
        }
        $rate = (float) $rate;
        if ($rate < 0 || $rate > 100) {
            throw new \InvalidArgumentException("$fieldName must be between 0 and 100");
        }
    }

    /**
     * Valide le niveau d'engagement
     */
    private function validateEngagementLevel($level): void
    {
        $allowedLevels = ['low', 'medium', 'high'];
        if (!in_array($level, $allowedLevels, true)) {
            throw new \InvalidArgumentException('engagement_level must be one of: ' . implode(', ', $allowedLevels));
        }
    }
}

