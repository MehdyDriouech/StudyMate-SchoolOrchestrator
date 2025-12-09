<?php
/**
 * Script de vérification de la configuration
 * Vérifie que tout est correctement configuré avant d'utiliser l'API
 */

header('Content-Type: application/json');

$checks = [
    'php_version' => [
        'status' => version_compare(PHP_VERSION, '8.0.0', '>='),
        'message' => PHP_VERSION,
        'required' => 'PHP 8.0+'
    ],
    'pdo_mysql' => [
        'status' => extension_loaded('pdo_mysql'),
        'message' => extension_loaded('pdo_mysql') ? 'Extension chargée' : 'Extension manquante',
        'required' => 'PDO MySQL'
    ],
    'mod_rewrite' => [
        'status' => function_exists('apache_get_modules') ? in_array('mod_rewrite', apache_get_modules()) : true,
        'message' => function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules()) ? 'Activé' : 'Non vérifiable (peut être OK)',
        'required' => 'mod_rewrite (recommandé)'
    ],
    'classes_loaded' => [
        'status' => false,
        'message' => 'Non chargées',
        'required' => 'Toutes les classes'
    ],
    'config_file' => [
        'status' => false,
        'message' => 'Non trouvé',
        'required' => 'config.php'
    ],
    'database_connection' => [
        'status' => false,
        'message' => 'Non testé',
        'required' => 'Connexion MySQL'
    ]
];

// Vérifier le fichier de configuration
$configPath = __DIR__ . '/../src/Config/config.php';
if (file_exists($configPath)) {
    $checks['config_file']['status'] = true;
    $checks['config_file']['message'] = 'Fichier trouvé';
    
    // Charger la configuration
    $config = require $configPath;
    
    // Charger les classes
    $classes = [
        'Config\\Database' => __DIR__ . '/../src/Config/Database.php',
        'Http\\Request' => __DIR__ . '/../src/Http/Request.php',
        'Http\\Response' => __DIR__ . '/../src/Http/Response.php',
        'Router\\Router' => __DIR__ . '/../src/Router/Router.php',
        'Models\\Assignment' => __DIR__ . '/../src/Models/Assignment.php',
        'Repositories\\AssignmentRepository' => __DIR__ . '/../src/Repositories/AssignmentRepository.php',
        'Services\\AssignmentService' => __DIR__ . '/../src/Services/AssignmentService.php',
        'Controllers\\AssignmentController' => __DIR__ . '/../src/Controllers/AssignmentController.php',
    ];
    
    $allClassesLoaded = true;
    $missingClasses = [];
    
    foreach ($classes as $className => $filePath) {
        if (!file_exists($filePath)) {
            $allClassesLoaded = false;
            $missingClasses[] = $className . ' (' . basename($filePath) . ')';
        } else {
            require_once $filePath;
        }
    }
    
    if ($allClassesLoaded && class_exists('Config\\Database')) {
        $checks['classes_loaded']['status'] = true;
        $checks['classes_loaded']['message'] = 'Toutes les classes chargées';
    } else {
        $checks['classes_loaded']['message'] = 'Classes manquantes: ' . implode(', ', $missingClasses);
    }
    
    // Tester la connexion à la base de données
    if ($checks['classes_loaded']['status']) {
        try {
            // Normaliser le mot de passe vide
            if (isset($config['database']['password']) && $config['database']['password'] === '') {
                $config['database']['password'] = null;
            }
            
            \Config\Database::init($config['database']);
            $db = \Config\Database::getInstance();
            
            // Tester une requête simple
            $stmt = $db->query('SELECT 1');
            $stmt->fetch();
            
            $checks['database_connection']['status'] = true;
            $checks['database_connection']['message'] = 'Connexion réussie - Base de données accessible';
        } catch (\Exception $e) {
            $checks['database_connection']['message'] = 'Erreur: ' . $e->getMessage();
            $checks['database_connection']['details'] = [
                'host' => $config['database']['host'] ?? 'N/A',
                'dbname' => $config['database']['dbname'] ?? 'N/A',
                'username' => $config['database']['username'] ?? 'N/A',
                'password_set' => isset($config['database']['password']) && $config['database']['password'] !== null && $config['database']['password'] !== '',
            ];
        }
    }
} else {
    $checks['config_file']['message'] = 'Fichier non trouvé: ' . $configPath;
}

// Calculer le statut global
$allOk = true;
foreach ($checks as $check) {
    if (!$check['status']) {
        $allOk = false;
        break;
    }
}

echo json_encode([
    'success' => $allOk,
    'message' => $allOk ? 'Tous les tests sont passés ✅' : 'Certains tests ont échoué ❌',
    'checks' => $checks,
    'paths' => [
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'N/A',
        'script_path' => __DIR__,
        'base_url' => 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . dirname($_SERVER['SCRIPT_NAME'] ?? ''),
        'api_url' => 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ($_SERVER['SCRIPT_NAME'] ?? '') . '/api',
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

