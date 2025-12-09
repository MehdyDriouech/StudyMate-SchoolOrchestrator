<?php
/**
 * Repository ThemeReview - Accès aux données
 * Gère toutes les opérations CRUD sur la table theme_reviews
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class ThemeReviewRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère toutes les reviews d'un thème, triées par date décroissante
     * 
     * @param int $themeId - ID du thème
     * @return array
     */
    public function findByThemeId(int $themeId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM theme_reviews 
                WHERE theme_id = :theme_id 
                ORDER BY created_at DESC
            ');
            $stmt->execute(['theme_id' => $themeId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('ThemeReviewRepository::findByThemeId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch theme reviews', 0, $e);
        }
    }

    /**
     * Crée une nouvelle review
     * 
     * @param int $themeId - ID du thème
     * @param int $reviewerId - ID du reviewer
     * @param string $action - Action (submitted, approved, rejected, needs_changes)
     * @param string|null $comment - Commentaire optionnel
     * @return array - La review créée
     */
    public function create(int $themeId, int $reviewerId, string $action, ?string $comment = null): array
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO theme_reviews (theme_id, reviewer_id, action, comment)
                VALUES (:theme_id, :reviewer_id, :action, :comment)
            ');

            $stmt->execute([
                'theme_id' => $themeId,
                'reviewer_id' => $reviewerId,
                'action' => $action,
                'comment' => $comment
            ]);

            $id = (int) $this->db->lastInsertId();

            // Récupérer la review créée
            $stmt = $this->db->prepare('SELECT * FROM theme_reviews WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $review = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($review === false) {
                throw new \RuntimeException('Failed to retrieve created review');
            }

            return $review;
        } catch (PDOException $e) {
            error_log('ThemeReviewRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create theme review', 0, $e);
        }
    }

    /**
     * Vérifie qu'un thème existe
     * 
     * @param int $themeId - ID du thème
     * @return bool
     */
    public function themeExists(int $themeId): bool
    {
        try {
            $stmt = $this->db->prepare('SELECT COUNT(*) as count FROM themes WHERE id = :id');
            $stmt->execute(['id' => $themeId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) ($result['count'] ?? 0) > 0;
        } catch (PDOException $e) {
            error_log('ThemeReviewRepository::themeExists error: ' . $e->getMessage());
            return false;
        }
    }
}

