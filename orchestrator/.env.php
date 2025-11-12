<?php
/**
 * Study-Mate School Orchestrator - Configuration
 *
 * Ce fichier contient toutes les constantes de configuration.
 * À adapter selon l'environnement (dev, staging, production).
 */

// ============================================================
// BASE DE DONNÉES
// ============================================================
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'studymate_orchestrator');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// ============================================================
// AUTHENTIFICATION
// ============================================================
define('AUTH_MODE', getenv('AUTH_MODE') ?: 'MIXED'); // URLENCODED, JWT, MIXED
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'change-me-in-production-to-a-secure-random-string');
define('JWT_EXPIRY_SECONDS', 86400 * 7); // 7 jours

// Clés API pour UrlEncoded auth (à modifier en production)
$GLOBALS['API_KEYS'] = [
    'teacher' => getenv('API_KEY_TEACHER') ?: 'teacher-dev-key-change-me',
    'admin' => getenv('API_KEY_ADMIN') ?: 'admin-dev-key-change-me',
    'director' => getenv('API_KEY_DIRECTOR') ?: 'director-dev-key-change-me',
    'inspector' => getenv('API_KEY_INSPECTOR') ?: 'inspector-dev-key-change-me'
];

// ============================================================
// LOGS
// ============================================================
define('LOG_FILE', __DIR__ . '/../logs/app.log');
define('LOG_LEVEL', getenv('LOG_LEVEL') ?: 'INFO'); // DEBUG, INFO, WARN, ERROR
define('LOG_ROTATE_MAX_SIZE', 5 * 1024 * 1024); // 5 MB
define('LOG_ROTATE_MAX_FILES', 5);
define('LOG_RETENTION_DAYS', 30);

// ============================================================
// CACHE
// ============================================================
define('CACHE_DIR', __DIR__ . '/../cache');
define('CACHE_ENABLED', true);
define('CACHE_DEFAULT_TTL', 300); // 5 minutes

// ============================================================
// RATE LIMITING
// ============================================================
define('RATE_LIMIT_ENABLED', true);
define('RATE_LIMIT_MAX_REQUESTS', 100);
define('RATE_LIMIT_WINDOW_SECONDS', 60);

// ============================================================
// CORS
// ============================================================
define('CORS_ALLOWED_ORIGINS', getenv('CORS_ORIGINS') ?: '*');
define('CORS_ALLOWED_METHODS', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
define('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization, X-Orchestrator-Id, X-Request-ID');
define('CORS_MAX_AGE', 86400);

// ============================================================
// ERGO-MATE INTEGRATION
// ============================================================
define('ERGO_MATE_WEBHOOK_URL', getenv('ERGO_WEBHOOK_URL') ?: 'https://ergo-mate.example.com');
define('ERGO_MATE_API_KEY', getenv('ERGO_API_KEY') ?: 'ergo-dev-key');

// ============================================================
// MODE & DEBUG
// ============================================================
define('APP_ENV', getenv('APP_ENV') ?: 'development'); // development, staging, production
define('APP_DEBUG', APP_ENV !== 'production');
define('MOCK_MODE', getenv('MOCK_MODE') === 'true'); // Activer les mocks IA et webhooks

// ============================================================
// UPLOADS
// ============================================================
define('UPLOADS_DIR', __DIR__ . '/uploads');
define('UPLOADS_MAX_SIZE', 10 * 1024 * 1024); // 10 MB
define('UPLOADS_ALLOWED_TYPES', ['pdf', 'txt', 'docx']);

// ============================================================
// IA (MISTRAL)
// ============================================================
define('MISTRAL_API_ENDPOINT', 'https://api.mistral.ai/v1/chat/completions');
define('MISTRAL_DEFAULT_MODEL', 'mistral-medium');
define('MISTRAL_TIMEOUT', 30); // secondes

// ============================================================
// CHARGEMENT DES LIBRAIRIES
// ============================================================
require_once __DIR__ . '/lib/util.php';
require_once __DIR__ . '/lib/logger.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';

// ============================================================
// INITIALISATION
// ============================================================

// Créer les répertoires nécessaires
$dirs = [
    dirname(LOG_FILE),
    CACHE_DIR,
    UPLOADS_DIR,
    UPLOADS_DIR . '/pdf'
];

foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Logger le démarrage
logInfo('Application started', [
    'env' => APP_ENV,
    'debug' => APP_DEBUG,
    'mock_mode' => MOCK_MODE
]);

// Gestion des erreurs PHP
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', dirname(LOG_FILE) . '/php-errors.log');
}

// Handler d'erreurs personnalisé
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    logError('PHP Error', [
        'errno' => $errno,
        'message' => $errstr,
        'file' => $errfile,
        'line' => $errline
    ]);

    if (APP_DEBUG) {
        echo "Error: $errstr in $errfile on line $errline\n";
    }

    return false;
});

// Handler d'exceptions
set_exception_handler(function($exception) {
    logError('Uncaught Exception', [
        'message' => $exception->getMessage(),
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
        'trace' => $exception->getTraceAsString()
    ]);

    if (APP_DEBUG) {
        echo "Exception: " . $exception->getMessage() . "\n";
        echo $exception->getTraceAsString() . "\n";
    }

    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'code' => 'SERVER_ERROR',
        'message' => APP_DEBUG ? $exception->getMessage() : 'Internal server error',
        'timestamp' => date('c')
    ]);
    exit;
});

// ============================================================
// FIN DE LA CONFIGURATION
// ============================================================
