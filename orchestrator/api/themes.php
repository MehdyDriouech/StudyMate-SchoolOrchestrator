<?php
/**
 * Sprint 11 - Content Creation Suite
 * API: Themes Management (E11-EDITOR, E11-LIB)
 * Endpoints pour CRUD, versioning, bibliothèque personnelle
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/_middleware_tenant.php';
require_once __DIR__ . '/_middleware_rbac.php';
require_once __DIR__ . '/../services/ThemeService.php';
require_once __DIR__ . '/../services/VersionService.php';
require_once __DIR__ . '/../services/ThemeLinterService.php';

// Récupération du tenant
$tenantId = getTenantFromRequest();
if (!$tenantId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing tenant_id']);
    exit;
}

// Vérification de l'authentification JWT
$user = authenticateJWT();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Vérifier que l'utilisateur est un enseignant
if (!in_array($user['role'], ['teacher', 'admin', 'direction'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Teacher role required']);
    exit;
}

// Initialiser les services
$db = getDBConnection();
$themeService = new ThemeService($db);
$versionService = new VersionService($db);
$linterService = new ThemeLinterService($db);

// Router les requêtes
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];

// Extraire le chemin après /api/themes
$pathPattern = '#^/api/themes(/.*)?$#';
if (preg_match($pathPattern, $path, $matches)) {
    $subPath = $matches[1] ?? '/';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

try {
    // ========================================================================
    // GET /api/themes - Liste des thèmes
    // ========================================================================
    if ($requestMethod === 'GET' && $subPath === '/') {
        $filters = [
            'content_type' => $_GET['content_type'] ?? null,
            'difficulty' => $_GET['difficulty'] ?? null,
            'workflow_status' => $_GET['workflow_status'] ?? null,
            'search' => $_GET['search'] ?? null,
            'order_by' => $_GET['order_by'] ?? 'updated_at',
            'order_dir' => $_GET['order_dir'] ?? 'DESC',
            'limit' => isset($_GET['limit']) ? (int)$_GET['limit'] : 50,
            'offset' => isset($_GET['offset']) ? (int)$_GET['offset'] : 0
        ];

        // Si my_themes=true, filtrer par utilisateur
        $userId = (!empty($_GET['my_themes']) && $_GET['my_themes'] === 'true') ? $user['id'] : null;

        $themes = $themeService->listThemes($tenantId, $userId, $filters);

        echo json_encode([
            'success' => true,
            'themes' => $themes,
            'count' => count($themes),
            'filters' => $filters
        ]);
    }

    // ========================================================================
    // POST /api/themes - Créer un nouveau thème
    // ========================================================================
    elseif ($requestMethod === 'POST' && $subPath === '/') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input)) {
            http_response_code(400);
            echo json_encode(['error' => 'Empty request body']);
            exit;
        }

        // Auto-save mode (sauvegarde automatique sans validation stricte)
        $autoSave = !empty($input['auto_save']) && $input['auto_save'] === true;
        unset($input['auto_save']);

        $result = $themeService->createTheme($tenantId, $user['id'], $input);

        if ($result['success']) {
            // Analyser la qualité si demandé
            if (!$autoSave && !empty($input['analyze'])) {
                $analysis = $linterService->analyzeTheme($input);
                $result['analysis'] = $analysis;
            }

            http_response_code(201);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // GET /api/themes/{id} - Détails d'un thème
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $theme = $themeService->getTheme($themeId);

        if (!$theme) {
            http_response_code(404);
            echo json_encode(['error' => 'Theme not found']);
            exit;
        }

        // Vérifier les permissions (tenant + collaborateur)
        if ($theme['tenant_id'] !== $tenantId) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            exit;
        }

        // Ajouter les statistiques
        $theme['stats'] = $themeService->getThemeStats($themeId);

        echo json_encode([
            'success' => true,
            'theme' => $theme
        ]);
    }

    // ========================================================================
    // PUT /api/themes/{id} - Mettre à jour un thème
    // ========================================================================
    elseif ($requestMethod === 'PUT' && preg_match('#^/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input)) {
            http_response_code(400);
            echo json_encode(['error' => 'Empty request body']);
            exit;
        }

        $changeSummary = $input['change_summary'] ?? null;
        unset($input['change_summary']);
        unset($input['auto_save']);

        $result = $themeService->updateTheme($themeId, $user['id'], $input, $changeSummary);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // DELETE /api/themes/{id} - Archiver un thème
    // ========================================================================
    elseif ($requestMethod === 'DELETE' && preg_match('#^/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $result = $themeService->archiveTheme($themeId, $user['id']);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // POST /api/themes/{id}/duplicate - Dupliquer un thème
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/([a-z0-9_\-]+)/duplicate$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        $newTitle = $input['title'] ?? null;

        $result = $themeService->duplicateTheme($themeId, $user['id'], $newTitle);

        if ($result['success']) {
            http_response_code(201);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // PUT /api/themes/{id}/workflow - Changer le statut workflow
    // ========================================================================
    elseif ($requestMethod === 'PUT' && preg_match('#^/([a-z0-9_\-]+)/workflow$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['status'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing status']);
            exit;
        }

        $result = $themeService->updateWorkflowStatus(
            $themeId,
            $user['id'],
            $input['status'],
            $input['comment'] ?? null
        );

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // POST /api/themes/{id}/collaborators - Ajouter un collaborateur
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/([a-z0-9_\-]+)/collaborators$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing user_id']);
            exit;
        }

        $result = $themeService->addCollaborator(
            $themeId,
            $user['id'],
            $input['user_id'],
            $input['role'] ?? 'editor'
        );

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // GET /api/themes/{id}/versions - Historique des versions
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/([a-z0-9_\-]+)/versions$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

        $versions = $versionService->getVersionHistory($themeId, $limit);

        echo json_encode([
            'success' => true,
            'theme_id' => $themeId,
            'versions' => $versions,
            'count' => count($versions)
        ]);
    }

    // ========================================================================
    // GET /api/themes/{id}/versions/{versionId} - Détails d'une version
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/([a-z0-9_\-]+)/versions/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $versionId = $matches[2];

        $version = $versionService->getVersion($versionId);

        if (!$version) {
            http_response_code(404);
            echo json_encode(['error' => 'Version not found']);
            exit;
        }

        if ($version['theme_id'] !== $themeId) {
            http_response_code(400);
            echo json_encode(['error' => 'Version does not belong to this theme']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'version' => $version
        ]);
    }

    // ========================================================================
    // POST /api/themes/{id}/versions/{versionId}/restore - Restaurer une version
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/([a-z0-9_\-]+)/versions/([a-z0-9_\-]+)/restore$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $versionId = $matches[2];

        $result = $versionService->restoreVersion($themeId, $versionId, $user['id']);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // GET /api/themes/{id}/similar - Rechercher des thèmes similaires
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/([a-z0-9_\-]+)/similar$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $theme = $themeService->getTheme($themeId);

        if (!$theme) {
            http_response_code(404);
            echo json_encode(['error' => 'Theme not found']);
            exit;
        }

        $similar = $themeService->findSimilarThemes($tenantId, $theme['content_hash']);

        echo json_encode([
            'success' => true,
            'theme_id' => $themeId,
            'similar_themes' => $similar,
            'count' => count($similar)
        ]);
    }

    // ========================================================================
    // POST /api/themes/{id}/analyze - Analyser la qualité pédagogique
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/([a-z0-9_\-]+)/analyze$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $theme = $themeService->getTheme($themeId);

        if (!$theme) {
            http_response_code(404);
            echo json_encode(['error' => 'Theme not found']);
            exit;
        }

        $analysis = $linterService->analyzeTheme($theme['content']);

        echo json_encode([
            'success' => true,
            'theme_id' => $themeId,
            'analysis' => $analysis
        ]);
    }

    // ========================================================================
    // Endpoint non trouvé
    // ========================================================================
    else {
        http_response_code(404);
        echo json_encode([
            'error' => 'Endpoint not found',
            'method' => $requestMethod,
            'path' => $subPath
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'trace' => DEBUG_MODE ? $e->getTraceAsString() : null
    ]);
}

function authenticateJWT() {
    // Implémentation simplifiée - à adapter selon votre système JWT
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }

    $token = $matches[1];

    // TODO: Valider le JWT et extraire les claims
    // Pour l'instant, retour d'un utilisateur de test
    return [
        'id' => 'user_' . substr(md5($token), 0, 8),
        'role' => 'teacher',
        'name' => 'Test Teacher'
    ];
}
