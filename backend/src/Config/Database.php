<?php
/**
 * Gestionnaire de connexion à la base de données
 * Utilise PDO avec gestion d'erreurs
 */

namespace Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;
    private static array $config = [];

    /**
     * Initialise la configuration de la base de données
     */
    public static function init(array $config): void
    {
        // Normaliser le mot de passe : convertir chaîne vide en null
        if (isset($config['password']) && $config['password'] === '') {
            $config['password'] = null;
        }
        self::$config = $config;
    }

    /**
     * Obtient une instance unique de PDO (Singleton)
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            try {
                $dsn = sprintf(
                    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                    self::$config['host'],
                    self::$config['port'],
                    self::$config['dbname'],
                    self::$config['charset']
                );

                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
                ];

                // Le mot de passe a déjà été normalisé dans init()
                // null = pas de mot de passe (pour AMPPS par exemple)
                $password = self::$config['password'] ?? null;

                self::$instance = new PDO(
                    $dsn,
                    self::$config['username'],
                    $password,
                    $options
                );
            } catch (PDOException $e) {
                error_log('Database connection error: ' . $e->getMessage());
                throw new \RuntimeException('Database connection failed', 0, $e);
            }
        }

        return self::$instance;
    }

    /**
     * Ferme la connexion (utile pour les tests)
     */
    public static function close(): void
    {
        self::$instance = null;
    }
}

