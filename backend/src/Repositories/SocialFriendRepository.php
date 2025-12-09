<?php
/**
 * Repository SocialFriend - Accès aux données
 * Gère toutes les opérations CRUD sur la table social_friends
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class SocialFriendRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère tous les amis d'un utilisateur (owner_user_id)
     * 
     * @param int $ownerUserId - ID de l'utilisateur propriétaire
     * @return array
     */
    public function findAllByOwner(int $ownerUserId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT 
                    sf.id,
                    sf.owner_user_id,
                    sf.friend_user_id,
                    sf.school_id,
                    sf.created_at,
                    u.full_name as friend_name,
                    u.email as friend_email,
                    u.school_id as friend_school_id
                FROM social_friends sf
                INNER JOIN users u ON sf.friend_user_id = u.id
                WHERE sf.owner_user_id = :owner_user_id
                ORDER BY sf.created_at DESC
            ');
            $stmt->execute(['owner_user_id' => $ownerUserId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('SocialFriendRepository::findAllByOwner error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch friends', 0, $e);
        }
    }

    /**
     * Vérifie si une relation d'amitié existe déjà
     * 
     * @param int $ownerUserId - ID de l'utilisateur propriétaire
     * @param int $friendUserId - ID de l'ami
     * @return bool
     */
    public function friendshipExists(int $ownerUserId, int $friendUserId): bool
    {
        try {
            $stmt = $this->db->prepare('
                SELECT COUNT(*) FROM social_friends 
                WHERE owner_user_id = :owner_user_id AND friend_user_id = :friend_user_id
            ');
            $stmt->execute([
                'owner_user_id' => $ownerUserId,
                'friend_user_id' => $friendUserId
            ]);
            return (int) $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log('SocialFriendRepository::friendshipExists error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to check friendship existence', 0, $e);
        }
    }

    /**
     * Crée une nouvelle relation d'amitié
     * 
     * @param array $data - Données de la relation
     * @return array - La relation créée
     */
    public function create(array $data): array
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO social_friends (owner_user_id, friend_user_id, school_id, created_at)
                VALUES (:owner_user_id, :friend_user_id, :school_id, NOW())
            ');

            $stmt->execute([
                'owner_user_id' => $data['owner_user_id'],
                'friend_user_id' => $data['friend_user_id'],
                'school_id' => $data['school_id'] ?? null
            ]);

            $id = (int) $this->db->lastInsertId();
            return $this->findById($id);
        } catch (PDOException $e) {
            error_log('SocialFriendRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create friendship', 0, $e);
        }
    }

    /**
     * Récupère une relation par son ID
     * 
     * @param int $id - ID de la relation
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT 
                    sf.*,
                    u.full_name as friend_name,
                    u.email as friend_email
                FROM social_friends sf
                INNER JOIN users u ON sf.friend_user_id = u.id
                WHERE sf.id = :id
            ');
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            error_log('SocialFriendRepository::findById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch friendship', 0, $e);
        }
    }

    /**
     * Vérifie si une relation appartient à un utilisateur
     * 
     * @param int $id - ID de la relation
     * @param int $ownerUserId - ID de l'utilisateur propriétaire
     * @return bool
     */
    public function belongsToOwner(int $id, int $ownerUserId): bool
    {
        try {
            $stmt = $this->db->prepare('
                SELECT COUNT(*) FROM social_friends 
                WHERE id = :id AND owner_user_id = :owner_user_id
            ');
            $stmt->execute([
                'id' => $id,
                'owner_user_id' => $ownerUserId
            ]);
            return (int) $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log('SocialFriendRepository::belongsToOwner error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to check friendship ownership', 0, $e);
        }
    }

    /**
     * Supprime une relation d'amitié
     * 
     * @param int $id - ID de la relation
     * @return bool
     */
    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM social_friends WHERE id = :id');
            $stmt->execute(['id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('SocialFriendRepository::delete error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to delete friendship', 0, $e);
        }
    }
}

