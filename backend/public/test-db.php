<?php
/**
 * Test de connexion à la base de données
 * Script simple pour diagnostiquer le problème de connexion
 */

header('Content-Type: application/json');

$results = [
    'config' => [],
    'tests' => []
];

// Test 1 : Charger la configuration
$configPath = __DIR__ . '/../src/Config/config.php';
if (file_exists($configPath)) {
    $config = require $configPath;
    $results['config'] = [
        'host' => $config['database']['host'] ?? 'N/A',
        'port' => $config['database']['port'] ?? 'N/A',
        'dbname' => $config['database']['dbname'] ?? 'N/A',
        'username' => $config['database']['username'] ?? 'N/A',
        'password_type' => gettype($config['database']['password'] ?? null),
        'password_value' => ($config['database']['password'] ?? null) === null ? 'NULL' : (empty($config['database']['password']) ? 'EMPTY STRING' : 'SET'),
    ];
    
    // Normaliser le mot de passe
    if (isset($config['database']['password']) && $config['database']['password'] === '') {
        $config['database']['password'] = null;
    }
    
    // Test 2 : Connexion directe avec PDO
    try {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $config['database']['host'],
            $config['database']['port'],
            $config['database']['dbname'],
            $config['database']['charset']
        );
        
        $password = $config['database']['password'] ?? null;
        
        $results['tests']['pdo_direct'] = [
            'dsn' => $dsn,
            'username' => $config['database']['username'],
            'password_is_null' => $password === null,
            'status' => 'testing...'
        ];
        
        $pdo = new PDO(
            $dsn,
            $config['database']['username'],
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]
        );
        
        $results['tests']['pdo_direct']['status'] = 'SUCCESS';
        $results['tests']['pdo_direct']['message'] = 'Connexion PDO directe réussie';
        
        // Test 3 : Requête simple
        $stmt = $pdo->query('SELECT DATABASE() as db, USER() as user');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $results['tests']['query_test'] = [
            'status' => 'SUCCESS',
            'database' => $row['db'] ?? 'N/A',
            'user' => $row['user'] ?? 'N/A',
        ];
        
        // Test 4 : Vérifier la table assignments
        $stmt = $pdo->query('SHOW TABLES LIKE "assignments"');
        $tableExists = $stmt->rowCount() > 0;
        $results['tests']['table_check'] = [
            'status' => $tableExists ? 'SUCCESS' : 'WARNING',
            'assignments_table_exists' => $tableExists,
        ];
        
        if ($tableExists) {
            $stmt = $pdo->query('SELECT COUNT(*) as count FROM assignments');
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $results['tests']['table_check']['assignments_count'] = $row['count'] ?? 0;
        }
        
    } catch (PDOException $e) {
        $results['tests']['pdo_direct'] = [
            'status' => 'ERROR',
            'message' => $e->getMessage(),
            'code' => $e->getCode(),
        ];
    }
    
    // Test 5 : Utiliser la classe Database
    try {
        require_once __DIR__ . '/../src/Config/Database.php';
        
        \Config\Database::init($config['database']);
        $db = \Config\Database::getInstance();
        
        $results['tests']['database_class'] = [
            'status' => 'SUCCESS',
            'message' => 'Classe Database fonctionne correctement',
        ];
    } catch (\Exception $e) {
        $results['tests']['database_class'] = [
            'status' => 'ERROR',
            'message' => $e->getMessage(),
        ];
    }
    
} else {
    $results['error'] = 'Fichier config.php non trouvé';
}

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

