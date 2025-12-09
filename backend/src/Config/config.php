<?php
/**
 * Configuration générale de l'application
 * StudyMate School Orchestrator - Backend
 */

return [
    'database' => [
        'host' => $_ENV['DB_HOST'] ?? 'localhost',
        'port' => $_ENV['DB_PORT'] ?? 3306,
        'dbname' => $_ENV['DB_NAME'] ?? 'smso',
        'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
        'username' => $_ENV['DB_USER'] ?? 'root',
        'password' => $_ENV['DB_PASSWORD'] ?? 'root1',
    ],
    'app' => [
        'env' => $_ENV['APP_ENV'] ?? 'development',
        'debug' => ($_ENV['APP_DEBUG'] ?? 'true') === 'true',
        'timezone' => $_ENV['APP_TIMEZONE'] ?? 'Europe/Paris',
    ],
    'api' => [
        'base_path' => '/api',
    ],
    'auth' => [
        'mode' => $_ENV['AUTH_MODE'] ?? 'lenient',      // 'lenient' ou 'jwt'
        'jwt_secret' => $_ENV['JWT_SECRET'] ?? 'CHANGE_ME_SUPER_SECRET_KEY',
        'jwt_ttl_hours' => (int)($_ENV['JWT_TTL_HOURS'] ?? 8),
    ],
];

