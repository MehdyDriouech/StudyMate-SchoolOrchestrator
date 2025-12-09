<?php
/**
 * Repository AdminAudit - Accès aux données des logs d'audit
 * Gère toutes les opérations CRUD sur la table admin_audit_logs
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class AdminAuditRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère tous les logs d'audit
     * 
     * @param array $filters Filtres optionnels (action, user_id, entity_type, entity_id, date_from, date_to)
     * @param int|null $limit
     * @param int|null $offset
     * @return array
     */
    public function findAll(array $filters = [], ?int $limit = null, ?int $offset = null): array
    {
        try {
            $where = [];
            $params = [];

            if (isset($filters['action'])) {
                $where[] = 'action = :action';
                $params['action'] = $filters['action'];
            }

            if (isset($filters['user_id'])) {
                $where[] = 'user_id = :user_id';
                $params['user_id'] = $filters['user_id'];
            }

            if (isset($filters['entity_type'])) {
                $where[] = 'entity_type = :entity_type';
                $params['entity_type'] = $filters['entity_type'];
            }

            if (isset($filters['entity_id'])) {
                $where[] = 'entity_id = :entity_id';
                $params['entity_id'] = $filters['entity_id'];
            }

            if (isset($filters['date_from'])) {
                $where[] = 'created_at >= :date_from';
                $params['date_from'] = $filters['date_from'];
            }

            if (isset($filters['date_to'])) {
                $where[] = 'created_at <= :date_to';
                $params['date_to'] = $filters['date_to'];
            }

            $sql = 'SELECT * FROM admin_audit_logs';
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
            // Parser le metadata JSON
            foreach ($rows as &$row) {
                if ($row['metadata']) {
                    $row['metadata'] = json_decode($row['metadata'], true);
                }
            }

            return $rows;
        } catch (PDOException $e) {
            error_log('AdminAuditRepository::findAll error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch audit logs', 0, $e);
        }
    }

    /**
     * Crée un nouveau log d'audit
     * 
     * @param array $data
     * @return int ID du log créé
     */
    public function create(array $data): int
    {
        try {
            $metadataJson = null;
            if (isset($data['metadata'])) {
                $metadataJson = is_string($data['metadata']) ? $data['metadata'] : json_encode($data['metadata']);
            }

            $stmt = $this->db->prepare('
                INSERT INTO admin_audit_logs (user_id, action, entity_type, entity_id, metadata)
                VALUES (:user_id, :action, :entity_type, :entity_id, :metadata)
            ');

            $stmt->execute([
                'user_id' => $data['user_id'],
                'action' => $data['action'],
                'entity_type' => $data['entity_type'] ?? null,
                'entity_id' => $data['entity_id'] ?? null,
                'metadata' => $metadataJson
            ]);

            return (int)$this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log('AdminAuditRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create audit log', 0, $e);
        }
    }
}

