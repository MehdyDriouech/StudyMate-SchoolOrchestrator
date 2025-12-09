<?php
/**
 * Repository AdminImports - Accès aux données des imports
 * Gère toutes les opérations CRUD sur la table admin_imports
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class AdminImportsRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère tous les imports
     * 
     * @param array $filters Filtres optionnels (type, status, created_by)
     * @param int|null $limit
     * @param int|null $offset
     * @return array
     */
    public function findAll(array $filters = [], ?int $limit = null, ?int $offset = null): array
    {
        try {
            $where = [];
            $params = [];

            if (isset($filters['type'])) {
                $where[] = 'type = :type';
                $params['type'] = $filters['type'];
            }

            if (isset($filters['status'])) {
                $where[] = 'status = :status';
                $params['status'] = $filters['status'];
            }

            if (isset($filters['created_by'])) {
                $where[] = 'created_by = :created_by';
                $params['created_by'] = $filters['created_by'];
            }

            $sql = 'SELECT * FROM admin_imports';
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

            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // Parser le summary JSON
            foreach ($rows as &$row) {
                if ($row['summary']) {
                    $row['summary'] = json_decode($row['summary'], true);
                }
            }

            return $rows;
        } catch (PDOException $e) {
            error_log('AdminImportsRepository::findAll error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch imports', 0, $e);
        }
    }

    /**
     * Récupère un import par son ID
     * 
     * @param int $id
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare('SELECT * FROM admin_imports WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row === false) {
                return null;
            }

            // Parser le summary JSON
            if ($row['summary']) {
                $row['summary'] = json_decode($row['summary'], true);
            }

            return $row;
        } catch (PDOException $e) {
            error_log('AdminImportsRepository::findById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch import', 0, $e);
        }
    }

    /**
     * Crée un nouvel import
     * 
     * @param array $data
     * @return int ID de l'import créé
     */
    public function create(array $data): int
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO admin_imports (type, file_name, status, created_by, summary)
                VALUES (:type, :file_name, :status, :created_by, :summary)
            ');

            $summaryJson = null;
            if (isset($data['summary'])) {
                $summaryJson = is_string($data['summary']) ? $data['summary'] : json_encode($data['summary']);
            }

            $stmt->execute([
                'type' => $data['type'],
                'file_name' => $data['file_name'] ?? null,
                'status' => $data['status'] ?? 'pending',
                'created_by' => $data['created_by'],
                'summary' => $summaryJson
            ]);

            return (int)$this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log('AdminImportsRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create import', 0, $e);
        }
    }

    /**
     * Met à jour un import
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

            $allowedFields = ['status', 'summary'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    if ($field === 'summary' && is_array($data[$field])) {
                        $params[$field] = json_encode($data[$field]);
                    } else {
                        $params[$field] = $data[$field];
                    }
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = 'UPDATE admin_imports SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log('AdminImportsRepository::update error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to update import', 0, $e);
        }
    }
}

