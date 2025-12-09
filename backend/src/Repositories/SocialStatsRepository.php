<?php
/**
 * Repository SocialStats - Accès aux données
 * Gère toutes les opérations CRUD sur la table social_stats
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class SocialStatsRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère toutes les stats sociales pour un établissement
     * 
     * @param int $schoolId - ID de l'établissement
     * @return array
     */
    public function findAllBySchool(int $schoolId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT ss.*, c.name as class_name
                FROM social_stats ss
                INNER JOIN classes c ON ss.class_id = c.id
                WHERE c.school_id = :school_id
                ORDER BY ss.metric_date DESC, c.name ASC
            ');
            $stmt->execute(['school_id' => $schoolId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('SocialStatsRepository::findAllBySchool error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch social stats', 0, $e);
        }
    }

    /**
     * Récupère les stats sociales pour une classe spécifique
     * 
     * @param int $classId - ID de la classe
     * @param string|null $metricDate - Date de la métrique (format Y-m-d), null pour la plus récente
     * @return array|null
     */
    public function findByClass(int $classId, ?string $metricDate = null): ?array
    {
        try {
            if ($metricDate) {
                $stmt = $this->db->prepare('
                    SELECT ss.*, c.name as class_name
                    FROM social_stats ss
                    INNER JOIN classes c ON ss.class_id = c.id
                    WHERE ss.class_id = :class_id AND ss.metric_date = :metric_date
                    LIMIT 1
                ');
                $stmt->execute([
                    'class_id' => $classId,
                    'metric_date' => $metricDate
                ]);
            } else {
                $stmt = $this->db->prepare('
                    SELECT ss.*, c.name as class_name
                    FROM social_stats ss
                    INNER JOIN classes c ON ss.class_id = c.id
                    WHERE ss.class_id = :class_id
                    ORDER BY ss.metric_date DESC
                    LIMIT 1
                ');
                $stmt->execute(['class_id' => $classId]);
            }
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (PDOException $e) {
            error_log('SocialStatsRepository::findByClass error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch social stats for class', 0, $e);
        }
    }

    /**
     * Récupère une stat sociale par ID
     * 
     * @param int $id - ID de la stat
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT ss.*, c.name as class_name
                FROM social_stats ss
                INNER JOIN classes c ON ss.class_id = c.id
                WHERE ss.id = :id
            ');
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (PDOException $e) {
            error_log('SocialStatsRepository::findById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch social stat', 0, $e);
        }
    }

    /**
     * Crée une nouvelle stat sociale
     * 
     * @param array $data - Données de la stat
     * @return array - Stat créée avec ID
     */
    public function create(array $data): array
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO social_stats (class_id, metric_date, collaboration_score, participation_rate, engagement_level, notes)
                VALUES (:class_id, :metric_date, :collaboration_score, :participation_rate, :engagement_level, :notes)
            ');
            
            $stmt->execute([
                'class_id' => $data['class_id'],
                'metric_date' => $data['metric_date'],
                'collaboration_score' => $data['collaboration_score'] ?? null,
                'participation_rate' => $data['participation_rate'] ?? null,
                'engagement_level' => $data['engagement_level'] ?? null,
                'notes' => $data['notes'] ?? null
            ]);
            
            $id = (int) $this->db->lastInsertId();
            return $this->findById($id);
        } catch (PDOException $e) {
            error_log('SocialStatsRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create social stat', 0, $e);
        }
    }

    /**
     * Met à jour une stat sociale
     * 
     * @param int $id - ID de la stat
     * @param array $data - Données à mettre à jour
     * @return array|null - Stat mise à jour ou null si non trouvée
     */
    public function update(int $id, array $data): ?array
    {
        try {
            $updates = [];
            $params = ['id' => $id];
            
            if (isset($data['collaboration_score'])) {
                $updates[] = 'collaboration_score = :collaboration_score';
                $params['collaboration_score'] = $data['collaboration_score'];
            }
            if (isset($data['participation_rate'])) {
                $updates[] = 'participation_rate = :participation_rate';
                $params['participation_rate'] = $data['participation_rate'];
            }
            if (isset($data['engagement_level'])) {
                $updates[] = 'engagement_level = :engagement_level';
                $params['engagement_level'] = $data['engagement_level'];
            }
            if (isset($data['notes'])) {
                $updates[] = 'notes = :notes';
                $params['notes'] = $data['notes'];
            }
            
            if (empty($updates)) {
                return $this->findById($id);
            }
            
            $updates[] = 'updated_at = NOW()';
            $sql = 'UPDATE social_stats SET ' . implode(', ', $updates) . ' WHERE id = :id';
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            
            return $this->findById($id);
        } catch (PDOException $e) {
            error_log('SocialStatsRepository::update error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to update social stat', 0, $e);
        }
    }

    /**
     * Supprime une stat sociale
     * 
     * @param int $id - ID de la stat
     * @return bool - True si supprimée, false sinon
     */
    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM social_stats WHERE id = :id');
            $stmt->execute(['id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('SocialStatsRepository::delete error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to delete social stat', 0, $e);
        }
    }
}

