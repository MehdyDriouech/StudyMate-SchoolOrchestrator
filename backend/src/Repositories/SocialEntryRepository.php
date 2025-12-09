<?php
/**
 * Repository SocialEntry - Accès aux données
 * Gère toutes les opérations CRUD sur la table social_entries
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class SocialEntryRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère toutes les entrées sociales visibles par l'utilisateur
     * 
     * @param int|null $schoolId - ID de l'établissement (null = global)
     * @return array
     */
    public function findAll(?int $schoolId = null): array
    {
        try {
            // Vérifier d'abord si la table existe
            $tableCheck = $this->db->query("SHOW TABLES LIKE 'social_entries'");
            if ($tableCheck->rowCount() === 0) {
                error_log('SocialEntryRepository::findAll - Table social_entries does not exist');
                throw new \RuntimeException('Table social_entries does not exist. Please run the migration: backend/sql/db/updates/2025_01_25_create_social_entries_table.sql', 0);
            }
            
            if ($schoolId !== null) {
                // Récupérer les entrées globales (school_id = NULL) + celles de l'établissement
                $stmt = $this->db->prepare('
                    SELECT * FROM social_entries 
                    WHERE school_id IS NULL OR school_id = :school_id
                    ORDER BY created_at DESC
                ');
                $stmt->execute(['school_id' => $schoolId]);
            } else {
                // Récupérer toutes les entrées (admin)
                $stmt = $this->db->prepare('
                    SELECT * FROM social_entries 
                    ORDER BY created_at DESC
                ');
                $stmt->execute();
            }
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('SocialEntryRepository::findAll error: ' . $e->getMessage());
            error_log('SocialEntryRepository::findAll SQL error code: ' . $e->getCode());
            throw new \RuntimeException('Failed to fetch social entries: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Récupère une entrée sociale par ID
     * 
     * @param int $id - ID de l'entrée
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        try {
            // Vérifier d'abord si la table existe
            $tableCheck = $this->db->query("SHOW TABLES LIKE 'social_entries'");
            if ($tableCheck->rowCount() === 0) {
                error_log('SocialEntryRepository::findById - Table social_entries does not exist');
                throw new \RuntimeException('Table social_entries does not exist. Please run the migration: backend/sql/db/updates/2025_01_25_create_social_entries_table.sql', 0);
            }
            
            $stmt = $this->db->prepare('SELECT * FROM social_entries WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            error_log('SocialEntryRepository::findById error: ' . $e->getMessage());
            error_log('SocialEntryRepository::findById SQL error code: ' . $e->getCode());
            throw new \RuntimeException('Failed to fetch social entry: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Crée une nouvelle entrée sociale
     * 
     * @param array $data - Données de l'entrée
     * @return array - L'entrée créée
     */
    public function create(array $data): array
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO social_entries (school_id, type, title, description, payload, created_by)
                VALUES (:school_id, :type, :title, :description, :payload, :created_by)
            ');

            $payloadJson = null;
            if (isset($data['payload']) && is_array($data['payload'])) {
                $payloadJson = json_encode($data['payload']);
            } elseif (isset($data['payload']) && is_string($data['payload'])) {
                $payloadJson = $data['payload'];
            }

            $stmt->execute([
                'school_id' => $data['school_id'] ?? null,
                'type' => $data['type'] ?? 'config',
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? null,
                'payload' => $payloadJson,
                'created_by' => $data['created_by']
            ]);

            $id = (int) $this->db->lastInsertId();
            return $this->findById($id);
        } catch (PDOException $e) {
            error_log('SocialEntryRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create social entry', 0, $e);
        }
    }

    /**
     * Met à jour une entrée sociale
     * 
     * @param int $id - ID de l'entrée
     * @param array $data - Nouvelles données
     * @return array|null - L'entrée mise à jour
     */
    public function update(int $id, array $data): ?array
    {
        try {
            $updates = [];
            $params = ['id' => $id];

            if (isset($data['type'])) {
                $updates[] = 'type = :type';
                $params['type'] = $data['type'];
            }
            if (isset($data['title'])) {
                $updates[] = 'title = :title';
                $params['title'] = $data['title'];
            }
            if (isset($data['description'])) {
                $updates[] = 'description = :description';
                $params['description'] = $data['description'];
            }
            if (isset($data['payload'])) {
                $updates[] = 'payload = :payload';
                $params['payload'] = is_array($data['payload']) 
                    ? json_encode($data['payload']) 
                    : $data['payload'];
            }

            if (empty($updates)) {
                return $this->findById($id);
            }

            $sql = 'UPDATE social_entries SET ' . implode(', ', $updates) . ' WHERE id = :id';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $this->findById($id);
        } catch (PDOException $e) {
            error_log('SocialEntryRepository::update error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to update social entry', 0, $e);
        }
    }

    /**
     * Supprime une entrée sociale
     * 
     * @param int $id - ID de l'entrée
     * @return bool
     */
    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM social_entries WHERE id = :id');
            $stmt->execute(['id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('SocialEntryRepository::delete error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to delete social entry', 0, $e);
        }
    }
}

