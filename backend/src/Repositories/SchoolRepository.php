<?php
/**
 * Repository School - Accès aux données des établissements
 * Gère toutes les opérations CRUD sur la table schools
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class SchoolRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère tous les établissements
     * 
     * @param array $filters Filtres optionnels (is_active, etc.)
     * @param int|null $limit Limite de résultats
     * @param int|null $offset Offset pour pagination
     * @return array
     */
    public function findAll(array $filters = [], ?int $limit = null, ?int $offset = null): array
    {
        try {
            $where = [];
            $params = [];

            if (isset($filters['is_active'])) {
                $where[] = 'is_active = :is_active';
                $params['is_active'] = $filters['is_active'] ? 1 : 0;
            }

            $sql = 'SELECT * FROM schools';
            if (!empty($where)) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= ' ORDER BY name ASC';

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
            error_log('SchoolRepository::findAll error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch schools', 0, $e);
        }
    }

    /**
     * Récupère un établissement par son ID
     * 
     * @param int $id
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare('SELECT * FROM schools WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            return $row ?: null;
        } catch (PDOException $e) {
            error_log('SchoolRepository::findById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch school', 0, $e);
        }
    }

    /**
     * Crée un nouvel établissement
     * 
     * @param array $data
     * @return int ID de l'établissement créé
     */
    public function create(array $data): int
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO schools (name, code, address, city, postal_code, country, is_active)
                VALUES (:name, :code, :address, :city, :postal_code, :country, :is_active)
            ');

            $stmt->execute([
                'name' => $data['name'],
                'code' => $data['code'] ?? null,
                'address' => $data['address'] ?? null,
                'city' => $data['city'] ?? null,
                'postal_code' => $data['postal_code'] ?? null,
                'country' => $data['country'] ?? 'FR',
                'is_active' => $data['is_active'] ?? true
            ]);

            return (int)$this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log('SchoolRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create school', 0, $e);
        }
    }

    /**
     * Met à jour un établissement
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

            $allowedFields = ['name', 'code', 'address', 'city', 'postal_code', 'country', 'is_active'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = 'UPDATE schools SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log('SchoolRepository::update error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to update school', 0, $e);
        }
    }

    /**
     * Supprime (soft delete) un établissement
     * 
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        try {
            // Soft delete : on met is_active = false
            $stmt = $this->db->prepare('UPDATE schools SET is_active = false, updated_at = NOW() WHERE id = :id');
            return $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {
            error_log('SchoolRepository::delete error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to delete school', 0, $e);
        }
    }
}

