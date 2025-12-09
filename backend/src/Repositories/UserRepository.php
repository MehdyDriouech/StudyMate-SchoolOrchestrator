<?php
/**
 * Repository User - Accès aux données des utilisateurs
 * Gère les requêtes SQL pour la table users
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class UserRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Trouve un utilisateur par son email
     * 
     * @param string $email
     * @return array|null Tableau associatif de l'utilisateur ou null si non trouvé
     */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('
            SELECT id, school_id, email, password_hash, role, full_name, social_uuid, created_at
            FROM users
            WHERE email = :email
            LIMIT 1
        ');
        
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $user ?: null;
    }

    /**
     * Trouve un utilisateur par son ID
     * 
     * @param int $id
     * @return array|null Tableau associatif de l'utilisateur ou null si non trouvé
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('
            SELECT id, school_id, email, password_hash, role, full_name, social_uuid, created_at
            FROM users
            WHERE id = :id
            LIMIT 1
        ');
        
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $user ?: null;
    }

    /**
     * Met à jour le mot de passe d'un utilisateur
     * 
     * @param int $userId
     * @param string $newPasswordHash Hash du nouveau mot de passe
     * @return bool True si la mise à jour a réussi, false sinon
     */
    public function updatePassword(int $userId, string $newPasswordHash): bool
    {
        $stmt = $this->db->prepare('
            UPDATE users
            SET password_hash = :password_hash
            WHERE id = :id
        ');
        
        return $stmt->execute([
            'id' => $userId,
            'password_hash' => $newPasswordHash
        ]);
    }

    /**
     * Récupère tous les utilisateurs avec filtres (pour admin)
     * 
     * @param array $filters Filtres optionnels (role, school_id, status)
     * @param int|null $limit
     * @param int|null $offset
     * @return array
     */
    public function findAll(array $filters = [], ?int $limit = null, ?int $offset = null): array
    {
        try {
            $where = [];
            $params = [];

            if (isset($filters['role'])) {
                $where[] = 'role = :role';
                $params['role'] = $filters['role'];
            }

            if (isset($filters['school_id'])) {
                $where[] = 'school_id = :school_id';
                $params['school_id'] = $filters['school_id'];
            }

            // Note: status n'est pas encore implémenté dans la table users
            // On pourrait ajouter un champ is_active plus tard

            $sql = 'SELECT id, school_id, email, role, full_name, social_uuid, created_at FROM users';
            if (!empty($where)) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= ' ORDER BY created_at DESC';

            if ($limit !== null) {
                $sql .= ' LIMIT :limit';
                $params['limit'] = $limit;
                if ($offset !== null) {
                    $sql .= ' OFFSET :offset';
                    $params['offset'] = $offset;
                }
            }

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('UserRepository::findAll error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch users', 0, $e);
        }
    }

    /**
     * Crée un nouvel utilisateur
     * 
     * @param array $data
     * @return int ID de l'utilisateur créé
     */
    public function create(array $data): int
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO users (school_id, email, password_hash, role, full_name, social_uuid)
                VALUES (:school_id, :email, :password_hash, :role, :full_name, :social_uuid)
            ');

            $stmt->execute([
                'school_id' => $data['school_id'] ?? null,
                'email' => $data['email'],
                'password_hash' => $data['password_hash'],
                'role' => $data['role'],
                'full_name' => $data['full_name'],
                'social_uuid' => $data['social_uuid'] ?? null
            ]);

            return (int)$this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log('UserRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create user', 0, $e);
        }
    }

    /**
     * Met à jour un utilisateur
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        try {
            $fields = [];
            $params = ['id' => $id];

            $allowedFields = ['school_id', 'email', 'role', 'full_name', 'social_uuid'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log('UserRepository::update error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to update user', 0, $e);
        }
    }

    /**
     * Supprime un utilisateur (soft delete ou hard delete selon la politique)
     * Pour l'instant, on fait un hard delete
     * 
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM users WHERE id = :id');
            return $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {
            error_log('UserRepository::delete error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to delete user', 0, $e);
        }
    }
}

