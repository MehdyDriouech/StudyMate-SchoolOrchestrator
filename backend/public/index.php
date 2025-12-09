<?php
/**
 * Point d'entrée principal de l'API
 * StudyMate School Orchestrator - Backend
 */

// Configuration de l'environnement
error_reporting(E_ALL);
// Activer l'affichage des erreurs en développement (désactiver en production)
ini_set('display_errors', '1');
ini_set('log_errors', '1');

// Activer le debug du routing
define('DEBUG_ROUTING', true);

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
require_once __DIR__ . '/../src/Models/Theme.php';
require_once __DIR__ . '/../src/Models/Submission.php';
require_once __DIR__ . '/../src/Repositories/AssignmentRepository.php';
require_once __DIR__ . '/../src/Repositories/ThemeRepository.php';
require_once __DIR__ . '/../src/Repositories/ThemeReviewRepository.php';
require_once __DIR__ . '/../src/Repositories/SubmissionRepository.php';
require_once __DIR__ . '/../src/Repositories/ClassesRepository.php';
require_once __DIR__ . '/../src/Repositories/UserRepository.php';
require_once __DIR__ . '/../src/Repositories/SocialStatsRepository.php';
require_once __DIR__ . '/../src/Repositories/SocialEntryRepository.php';
require_once __DIR__ . '/../src/Repositories/SocialProfileRepository.php';
require_once __DIR__ . '/../src/Repositories/SocialFriendRepository.php';
require_once __DIR__ . '/../src/Repositories/CurriculumRepository.php';
require_once __DIR__ . '/../src/Repositories/SchoolRepository.php';
require_once __DIR__ . '/../src/Repositories/AdminSettingsRepository.php';
require_once __DIR__ . '/../src/Repositories/AdminImportsRepository.php';
require_once __DIR__ . '/../src/Repositories/AdminAuditRepository.php';
require_once __DIR__ . '/../src/Services/AssignmentService.php';
require_once __DIR__ . '/../src/Services/ThemeService.php';
require_once __DIR__ . '/../src/Services/SubmissionService.php';
require_once __DIR__ . '/../src/Services/ClassesService.php';
require_once __DIR__ . '/../src/Services/AuthService.php';
require_once __DIR__ . '/../src/Services/StatsService.php';
require_once __DIR__ . '/../src/Services/SocialStatsService.php';
require_once __DIR__ . '/../src/Services/SocialEntryService.php';
require_once __DIR__ . '/../src/Services/SocialFriendService.php';
require_once __DIR__ . '/../src/Services/CurriculumService.php';
require_once __DIR__ . '/../src/Services/SchoolService.php';
require_once __DIR__ . '/../src/Services/UserAdminService.php';
require_once __DIR__ . '/../src/Services/AdminSettingsService.php';
require_once __DIR__ . '/../src/Services/AdminImportsService.php';
require_once __DIR__ . '/../src/Services/AdminAuditService.php';
require_once __DIR__ . '/../src/Controllers/AssignmentController.php';
require_once __DIR__ . '/../src/Controllers/ThemeController.php';
require_once __DIR__ . '/../src/Controllers/SubmissionController.php';
require_once __DIR__ . '/../src/Controllers/ClassesController.php';
require_once __DIR__ . '/../src/Controllers/AuthController.php';
require_once __DIR__ . '/../src/Controllers/StatsController.php';
require_once __DIR__ . '/../src/Controllers/SocialStatsController.php';
require_once __DIR__ . '/../src/Controllers/SocialController.php';
require_once __DIR__ . '/../src/Controllers/CurriculumController.php';
require_once __DIR__ . '/../src/Controllers/SchoolController.php';
require_once __DIR__ . '/../src/Controllers/UserAdminController.php';
require_once __DIR__ . '/../src/Controllers/AdminSettingsController.php';
require_once __DIR__ . '/../src/Controllers/AdminImportsController.php';
require_once __DIR__ . '/../src/Controllers/AdminAuditController.php';

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
$router = new \Router\Router($config['api']['base_path']);

// Instances des repositories et services
$userRepository = new \Repositories\UserRepository();
$authService = new \Services\AuthService($userRepository, $config['auth']);

// Repositories pour Campus Admin
$schoolRepository = new \Repositories\SchoolRepository();
$adminSettingsRepository = new \Repositories\AdminSettingsRepository();
$adminImportsRepository = new \Repositories\AdminImportsRepository();
$adminAuditRepository = new \Repositories\AdminAuditRepository();

// Instances des controllers
$assignmentController = new \Controllers\AssignmentController($authService);
$themeController = new \Controllers\ThemeController($authService);
$submissionController = new \Controllers\SubmissionController($authService);
$classesController = new \Controllers\ClassesController($authService);
$authController = new \Controllers\AuthController($authService);
$statsController = new \Controllers\StatsController($authService);
$socialStatsController = new \Controllers\SocialStatsController($authService);
$curriculumController = new \Controllers\CurriculumController($authService);

// Services pour Campus Admin
$schoolService = new \Services\SchoolService($schoolRepository, $adminAuditRepository);
$userAdminService = new \Services\UserAdminService($userRepository, $adminAuditRepository);
$adminSettingsService = new \Services\AdminSettingsService($adminSettingsRepository, $adminAuditRepository);
$adminImportsService = new \Services\AdminImportsService($adminImportsRepository, $userRepository, $adminAuditRepository);
$adminAuditService = new \Services\AdminAuditService($adminAuditRepository);

// Controllers pour Campus Admin
$schoolController = new \Controllers\SchoolController($authService, $schoolService);
$userAdminController = new \Controllers\UserAdminController($authService, $userAdminService);
$adminSettingsController = new \Controllers\AdminSettingsController($authService, $adminSettingsService);
$adminImportsController = new \Controllers\AdminImportsController($authService, $adminImportsService);
$adminAuditController = new \Controllers\AdminAuditController($authService, $adminAuditService);

// Route d'accueil - informations sur l'API
$router->get('/', function($request, $response) {
    $response->success([
        'message' => 'StudyMate School Orchestrator API',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => [
                'POST /api/auth/login' => 'Connexion utilisateur',
                'POST /api/auth/change-password' => 'Changer le mot de passe',
            ],
            'stats' => [
                'GET /api/stats/overview' => 'Statistiques d\'aperçu (tous les rôles)',
                'GET /api/stats/schools' => 'Statistiques multi-écoles pour la direction (director, admin)',
            ],
            'assignments' => [
                'GET /api/assignments' => 'Liste les assignments selon le rôle',
                'GET /api/assignments/sync' => 'Synchronisation ErgoMate (student uniquement) - Retourne les assignments publiés',
                'GET /api/assignments/{id}' => 'Récupère un assignment par ID',
                'GET /api/assignments/{id}/submissions' => 'Récupère les soumissions pour un assignment (gradebook teacher)',
                'POST /api/assignments' => 'Crée un nouvel assignment (teacher, pedago)',
                'PUT /api/assignments/{id}' => 'Met à jour un assignment (teacher, pedago)',
                'DELETE /api/assignments/{id}' => 'Supprime un assignment (teacher, pedago)',
            ],
            'submissions' => [
                'POST /api/submissions' => 'Crée ou met à jour une soumission (ErgoMate App - student)',
            ],
            'social' => [
                'GET /api/social/stats' => 'Liste les stats sociales (tous les rôles)',
                'GET /api/social/stats/{id}' => 'Récupère une stat sociale par ID',
                'POST /api/social/stats' => 'Crée ou met à jour une stat sociale (teacher, pedago)',
                'PUT /api/social/stats/{id}' => 'Met à jour une stat sociale (teacher, pedago)',
                'DELETE /api/social/stats/{id}' => 'Supprime une stat sociale (teacher, pedago)',
            ],
            'themes' => [
                'GET /api/themes' => 'Liste les thèmes selon le rôle',
                'GET /api/themes/{id}' => 'Récupère un thème par ID avec ses questions',
                'POST /api/themes' => 'Crée un nouveau thème (teacher, pedago)',
                'PUT /api/themes/{id}' => 'Met à jour un thème (teacher, pedago)',
                'DELETE /api/themes/{id}' => 'Supprime un thème (teacher, pedago)',
                'POST /api/themes/generate' => 'Génère un thème via IA (teacher, pedago)',
                'POST /api/themes/import' => 'Importe un thème depuis un PDF (teacher, pedago)',
                'GET /api/themes/{id}/reviews' => 'Récupère l\'historique des reviews d\'un thème (tous les rôles)',
                'POST /api/themes/{id}/reviews' => 'Crée une review (audit qualité) pour un thème (teacher, pedago, director)',
            ],
            'classes' => [
                'GET /api/classes' => 'Liste toutes les classes de l\'établissement (tous les rôles)',
                'GET /api/classes/{id}' => 'Récupère une classe par ID (tous les rôles)',
                'GET /api/classes/{id}/students' => 'Récupère les étudiants d\'une classe (tous les rôles)',
                'GET /api/students/{id}' => 'Récupère un étudiant par ID (tous les rôles)',
            ],
            'curriculum' => [
                'GET /api/curriculum' => 'Vue globale du curriculum (tous les rôles)',
                'GET /api/curriculum/subjects' => 'Liste les matières (tous les rôles)',
                'GET /api/curriculum/subjects/{id}' => 'Récupère une matière par ID (tous les rôles)',
                'GET /api/curriculum/subjects/{subjectId}/chapters/{chapterId}' => 'Récupère un chapitre (tous les rôles)',
                'PUT /api/curriculum/subjects/{subjectId}/chapters/{chapterId}' => 'Met à jour la progression d\'un chapitre (teacher, pedago, director)',
            ],
        ],
        'ui' => [
            'test_endpoint' => '/SMSO/backend/ui/testendpoint.html',
        ],
    ])->send();
});

// Enregistrer les routes d'authentification
$router->post('/auth/login', [$authController, 'login']);
$router->post('/auth/change-password', [$authController, 'changePassword']);

// Enregistrer les routes de statistiques
$router->get('/stats/overview', [$statsController, 'overview']);
$router->get('/stats/schools', [$statsController, 'schools']);

// Enregistrer les routes d'assignments
$router->get('/assignments', [$assignmentController, 'index']);
$router->get('/assignments/sync', [$assignmentController, 'sync']); // Route de synchronisation (doit être avant /assignments/{id})
$router->get('/assignments/{id}/submissions', [$submissionController, 'getByAssignment']); // Gradebook (doit être avant /assignments/{id} pour éviter les conflits)
$router->get('/assignments/{id}', [$assignmentController, 'show']);
$router->post('/assignments', [$assignmentController, 'create']);
$router->put('/assignments/{id}', [$assignmentController, 'update']);
$router->delete('/assignments/{id}', [$assignmentController, 'delete']);

// Enregistrer les routes de submissions
$router->post('/submissions', [$submissionController, 'create']);

// Enregistrer les routes de social stats
$router->get('/social/stats', [$socialStatsController, 'index']);
$router->get('/social/stats/{id}', [$socialStatsController, 'show']);
$router->post('/social/stats', [$socialStatsController, 'create']);
$router->put('/social/stats/{id}', [$socialStatsController, 'update']);
$router->delete('/social/stats/{id}', [$socialStatsController, 'delete']);

// Enregistrer les routes de social entries et friend code & friends
use Controllers\SocialController;
$socialController = new SocialController($authService);

// Routes friend code & friends (doivent être avant /social/{id} pour éviter les conflits)
$router->post('/social/friend-code', [$socialController, 'postFriendCode']);
$router->get('/social/friend-code', [$socialController, 'getFriendCode']);
$router->post('/social/friends', [$socialController, 'postFriend']);
$router->get('/social/friends', [$socialController, 'getFriends']);
$router->delete('/social/friends/{id}', [$socialController, 'deleteFriend']);

// Routes social entries (génériques)
$router->get('/social', [$socialController, 'index']);
$router->get('/social/{id}', [$socialController, 'show']);
$router->post('/social', [$socialController, 'create']);
$router->put('/social/{id}', [$socialController, 'update']);
$router->delete('/social/{id}', [$socialController, 'delete']);

// Enregistrer les routes de friend code & friends (doivent être avant /social/{id} pour éviter les conflits)
$router->post('/social/friend-code', [$socialController, 'postFriendCode']);
$router->get('/social/friend-code', [$socialController, 'getFriendCode']);
$router->post('/social/friends', [$socialController, 'postFriend']);
$router->get('/social/friends', [$socialController, 'getFriends']);
$router->delete('/social/friends/{id}', [$socialController, 'deleteFriend']);

// Enregistrer les routes de themes
$router->get('/themes', [$themeController, 'index']);
$router->get('/themes/{id}', [$themeController, 'show']);
$router->post('/themes', [$themeController, 'create']);
$router->put('/themes/{id}', [$themeController, 'update']);
$router->delete('/themes/{id}', [$themeController, 'delete']);
$router->post('/themes/generate', [$themeController, 'generate']);
$router->post('/themes/import', [$themeController, 'import']);
// Routes pour les reviews de thèmes (doivent être avant /themes/{id} pour éviter les conflits)
$router->get('/themes/{id}/reviews', [$themeController, 'getReviews']);
$router->post('/themes/{id}/reviews', [$themeController, 'createReview']);

// Enregistrer les routes de classes
$router->get('/classes', [$classesController, 'index']);
$router->get('/classes/{id}', [$classesController, 'show']);
$router->get('/classes/{id}/students', [$classesController, 'getStudents']);
$router->get('/students/{id}', [$classesController, 'getStudent']);

// Enregistrer les routes de curriculum
$router->get('/curriculum', [$curriculumController, 'index']);
$router->get('/curriculum/subjects', [$curriculumController, 'subjects']);
$router->get('/curriculum/subjects/{id}', [$curriculumController, 'showSubject']);
$router->get('/curriculum/subjects/{subjectId}/chapters/{chapterId}', [$curriculumController, 'showChapter']);
$router->put('/curriculum/subjects/{subjectId}/chapters/{chapterId}', [$curriculumController, 'updateChapter']);

// Enregistrer les routes Campus Admin - Schools
$router->get('/schools', [$schoolController, 'index']);
$router->get('/schools/{id}', [$schoolController, 'show']);
$router->post('/schools', [$schoolController, 'create']);
$router->put('/schools/{id}', [$schoolController, 'update']);
$router->delete('/schools/{id}', [$schoolController, 'delete']);

// Enregistrer les routes Campus Admin - Users
$router->get('/users', [$userAdminController, 'index']);
$router->get('/users/{id}', [$userAdminController, 'show']);
$router->post('/users', [$userAdminController, 'create']);
$router->put('/users/{id}', [$userAdminController, 'update']);
$router->delete('/users/{id}', [$userAdminController, 'delete']);

// Enregistrer les routes Campus Admin - Settings
$router->get('/admin/settings', [$adminSettingsController, 'index']);
$router->put('/admin/settings', [$adminSettingsController, 'update']);

// Enregistrer les routes Campus Admin - Imports
$router->post('/admin/imports/users', [$adminImportsController, 'importUsers']);
$router->get('/admin/imports/{id}', [$adminImportsController, 'show']);

// Enregistrer les routes Campus Admin - Audit
$router->get('/admin/audit/logs', [$adminAuditController, 'index']);

// Mode debug : logger les informations de la requête
if ($config['app']['debug']) {
    error_log('=== DEBUG ROUTING ===');
    error_log('Request Method: ' . $request->getMethod());
    error_log('Request URI: ' . $request->getUri());
    error_log('Request Path (raw): ' . $request->getPath());
    error_log('Base Path config: ' . $config['api']['base_path']);
    error_log('====================');
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

