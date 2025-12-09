<?php
/**
 * Point d'entrée alternatif pour l'API
 * Utilisez ce fichier si .htaccess ne fonctionne pas correctement
 * Accès : http://localhost/.../api.php/assignments
 */

// Configuration de l'environnement
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');

// Définir le fuseau horaire
date_default_timezone_set('Europe/Paris');

// Charger la configuration
$config = require __DIR__ . '/../src/Config/config.php';

// Charger les classes nécessaires AVANT d'initialiser la base de données
require_once __DIR__ . '/../src/Config/Database.php';
require_once __DIR__ . '/../src/Http/Request.php';
require_once __DIR__ . '/../src/Http/Response.php';
require_once __DIR__ . '/../src/Router/Router.php';
require_once __DIR__ . '/../src/Models/Assignment.php';
require_once __DIR__ . '/../src/Repositories/AssignmentRepository.php';
require_once __DIR__ . '/../src/Services/AssignmentService.php';
require_once __DIR__ . '/../src/Controllers/AssignmentController.php';

// Initialiser la base de données APRÈS avoir chargé les classes
\Config\Database::init($config['database']);

// Gérer les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit;
}

// Créer les instances
$request = new \Http\Request();
$response = new \Http\Response();
$router = new \Router\Router(''); // Pas de basePath car on est déjà dans api.php
$controller = new \Controllers\AssignmentController();

// Enregistrer les routes
$router->get('/assignments', [$controller, 'index']);
$router->get('/assignments/{id}', [$controller, 'show']);
$router->post('/assignments', [$controller, 'create']);
$router->put('/assignments/{id}', [$controller, 'update']);
$router->delete('/assignments/{id}', [$controller, 'delete']);

// Mode debug : logger les informations de la requête
if ($config['app']['debug']) {
    error_log('Request Method: ' . $request->getMethod());
    error_log('Request URI: ' . $request->getUri());
    error_log('Request Path: ' . $request->getPath());
}

// Dispatcher la requête
try {
    $router->dispatch($request, $response);
} catch (\Exception $e) {
    error_log('Application error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    
    // En mode debug, afficher plus d'informations
    if ($config['app']['debug']) {
        $response->setError('Internal server error: ' . $e->getMessage(), 500)->send();
    } else {
        $response->serverError('Internal server error')->send();
    }
}

