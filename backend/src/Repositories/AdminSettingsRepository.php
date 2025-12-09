<?php
/**
 * Repository AdminSettings - Accès aux données des paramètres admin
 * Gère toutes les opérations CRUD sur la table admin_settings
 */

namespace Repositories;

use Config\Database;
use PDO;
use PDOException;

class AdminSettingsRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère tous les paramètres
     * 
     * @return array Tableau associatif key => value
     */
    public function findAll(): array
    {
        try {
            $stmt = $this->db->query('SELECT `key`, `value` FROM admin_settings');
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $settings = [];
            foreach ($rows as $row) {
                $settings[$row['key']] = $this->parseValue($row['value']);
            }

            return $settings;
        } catch (PDOException $e) {
            error_log('AdminSettingsRepository::findAll error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch settings', 0, $e);
        }
    }

    /**
     * Récupère un paramètre par sa clé
     * 
     * @param string $key
     * @return mixed|null
     */
    public function findByKey(string $key)
    {
        try {
            $stmt = $this->db->prepare('SELECT `value` FROM admin_settings WHERE `key` = :key');
            $stmt->execute(['key' => $key]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row === false) {
                return null;
            }

            return $this->parseValue($row['value']);
        } catch (PDOException $e) {
            error_log('AdminSettingsRepository::findByKey error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch setting', 0, $e);
        }
    }

    /**
     * Met à jour ou crée un paramètre
     * 
     * @param string $key
     * @param mixed $value
     * @return bool
     */
    public function upsert(string $key, $value): bool
    {
        try {
            $valueStr = $this->serializeValue($value);

            $stmt = $this->db->prepare('
                INSERT INTO admin_settings (`key`, `value`, `updated_at`)
                VALUES (:key, :value, NOW())
                ON DUPLICATE KEY UPDATE `value` = :value, `updated_at` = NOW()
            ');

            return $stmt->execute([
                'key' => $key,
                'value' => $valueStr
            ]);
        } catch (PDOException $e) {
            error_log('AdminSettingsRepository::upsert error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to update setting', 0, $e);
        }
    }

    /**
     * Parse une valeur (JSON ou bool/string)
     * 
     * @param string $value
     * @return mixed
     */
    private function parseValue(string $value)
    {
        // Essayer de décoder en JSON
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        // Sinon, convertir les booléens
        if ($value === 'true') {
            return true;
        }
        if ($value === 'false') {
            return false;
        }

        // Sinon, retourner tel quel
        return $value;
    }

    /**
     * Sérialise une valeur pour stockage
     * 
     * @param mixed $value
     * @return string
     */
    private function serializeValue($value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_array($value) || is_object($value)) {
            return json_encode($value);
        }

        return (string)$value;
    }
}

