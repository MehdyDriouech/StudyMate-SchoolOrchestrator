<?php
/**
 * Repository SocialProfile - Accès aux données
 * Gère toutes les opérations CRUD sur la table social_profiles
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class SocialProfileRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère le profil social actif d'un utilisateur (revoked_at IS NULL)
     * 
     * @param int $userId - ID de l'utilisateur
     * @return array|null
     */
    public function findActiveByUserId(int $userId): ?array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM social_profiles 
                WHERE user_id = :user_id AND revoked_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
            ');
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            error_log('SocialProfileRepository::findActiveByUserId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch social profile', 0, $e);
        }
    }

    /**
     * Récupère un profil social par son code
     * 
     * @param string $socialCode - Code social
     * @return array|null
     */
    public function findBySocialCode(string $socialCode): ?array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM social_profiles 
                WHERE social_code = :social_code AND revoked_at IS NULL
                LIMIT 1
            ');
            $stmt->execute(['social_code' => $socialCode]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            error_log('SocialProfileRepository::findBySocialCode error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch social profile by code', 0, $e);
        }
    }

    /**
     * Vérifie si un code social existe déjà
     * 
     * @param string $socialCode - Code social
     * @return bool
     */
    public function codeExists(string $socialCode): bool
    {
        try {
            $stmt = $this->db->prepare('
                SELECT COUNT(*) FROM social_profiles 
                WHERE social_code = :social_code
            ');
            $stmt->execute(['social_code' => $socialCode]);
            return (int) $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log('SocialProfileRepository::codeExists error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to check social code existence', 0, $e);
        }
    }

    /**
     * Crée un nouveau profil social
     * 
     * @param array $data - Données du profil
     * @return array - Le profil créé
     */
    public function create(array $data): array
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO social_profiles (user_id, school_id, social_code, created_at)
                VALUES (:user_id, :school_id, :social_code, NOW())
            ');

            $stmt->execute([
                'user_id' => $data['user_id'],
                'school_id' => $data['school_id'] ?? null,
                'social_code' => $data['social_code']
            ]);

            $id = (int) $this->db->lastInsertId();
            return $this->findById($id);
        } catch (PDOException $e) {
            error_log('SocialProfileRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create social profile', 0, $e);
        }
    }

    /**
     * Récupère un profil par son ID
     * 
     * @param int $id - ID du profil
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare('SELECT * FROM social_profiles WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            error_log('SocialProfileRepository::findById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch social profile', 0, $e);
        }
    }

    /**
     * Révoque un profil social (marque revoked_at = NOW())
     * 
     * @param int $userId - ID de l'utilisateur
     * @return bool
     */
    public function revokeActiveProfile(int $userId): bool
    {
        try {
            $stmt = $this->db->prepare('
                UPDATE social_profiles 
                SET revoked_at = NOW()
                WHERE user_id = :user_id AND revoked_at IS NULL
            ');
            $stmt->execute(['user_id' => $userId]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('SocialProfileRepository::revokeActiveProfile error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to revoke social profile', 0, $e);
        }
    }
}

