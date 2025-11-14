<?php
/**
 * Sprint 19 - Multi-Review Workflow
 * API: Annotations Management
 * Endpoints pour gérer les annotations et commentaires sur les thèmes
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/_middleware_tenant.php';
require_once __DIR__ . '/_middleware_rbac.php';
require_once __DIR__ . '/../services/AnnotationService.php';

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

// Initialiser le service
$db = getDBConnection();
$annotationService = new AnnotationService($db);

// Router les requêtes
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];

// Extraire le chemin après /api/annotations
$pathPattern = '#^/api/annotations(/.*)?$#';
if (preg_match($pathPattern, $path, $matches)) {
    $subPath = $matches[1] ?? '/';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

try {
    // ========================================================================
    // POST /api/annotations - Créer une annotation
    // ========================================================================
    if ($requestMethod === 'POST' && $subPath === '/') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input)) {
            http_response_code(400);
            echo json_encode(['error' => 'Empty request body']);
            exit;
        }

        // Ajouter tenant_id et author_user_id
        $input['tenant_id'] = $tenantId;
        $input['author_user_id'] = $user['id'];

        $result = $annotationService->createAnnotation($input);

        if ($result['success']) {
            http_response_code(201);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // GET /api/annotations/{id} - Récupérer une annotation
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $annotationId = $matches[1];

        $annotation = $annotationService->getAnnotation($annotationId);

        if ($annotation) {
            // Vérifier l'isolation tenant
            if ($annotation['tenant_id'] !== $tenantId) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied']);
                exit;
            }

            echo json_encode([
                'success' => true,
                'annotation' => $annotation
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Annotation not found']);
        }
    }

    // ========================================================================
    // PUT /api/annotations/{id} - Mettre à jour une annotation
    // ========================================================================
    elseif ($requestMethod === 'PUT' && preg_match('#^/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $annotationId = $matches[1];

        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input)) {
            http_response_code(400);
            echo json_encode(['error' => 'Empty request body']);
            exit;
        }

        $result = $annotationService->updateAnnotation($annotationId, $input, $user['id']);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // PATCH /api/annotations/{id}/resolve - Résoudre une annotation
    // ========================================================================
    elseif ($requestMethod === 'PATCH' && preg_match('#^/([a-z0-9_\-]+)/resolve$#', $subPath, $matches)) {
        $annotationId = $matches[1];

        $result = $annotationService->resolveAnnotation($annotationId, $user['id']);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // PATCH /api/annotations/{id}/reject - Rejeter une annotation
    // ========================================================================
    elseif ($requestMethod === 'PATCH' && preg_match('#^/([a-z0-9_\-]+)/reject$#', $subPath, $matches)) {
        $annotationId = $matches[1];

        $result = $annotationService->rejectAnnotation($annotationId, $user['id']);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // DELETE /api/annotations/{id} - Supprimer une annotation
    // ========================================================================
    elseif ($requestMethod === 'DELETE' && preg_match('#^/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $annotationId = $matches[1];

        // Vérifier les permissions (admin ou auteur)
        $annotation = $annotationService->getAnnotation($annotationId);

        if (!$annotation) {
            http_response_code(404);
            echo json_encode(['error' => 'Annotation not found']);
            exit;
        }

        if ($annotation['author_user_id'] !== $user['id'] && !in_array($user['role'], ['admin', 'direction'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: You can only delete your own annotations']);
            exit;
        }

        $result = $annotationService->deleteAnnotation($annotationId, $user['id']);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // GET /api/annotations/themes/{themeId} - Annotations d'un thème
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/themes/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $themeId = $matches[1];

        $filters = [
            'status' => $_GET['status'] ?? null,
            'annotation_type' => $_GET['annotation_type'] ?? null,
            'theme_version' => isset($_GET['theme_version']) ? (int)$_GET['theme_version'] : null
        ];

        // Nettoyer les filtres vides
        $filters = array_filter($filters, function($value) {
            return $value !== null;
        });

        $annotations = $annotationService->getThemeAnnotations($themeId, $filters);

        echo json_encode([
            'success' => true,
            'theme_id' => $themeId,
            'annotations' => $annotations,
            'count' => count($annotations),
            'filters' => $filters
        ]);
    }

    // ========================================================================
    // GET /api/annotations/themes/{themeId}/stats - Stats annotations
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/themes/([a-z0-9_\-]+)/stats$#', $subPath, $matches)) {
        $themeId = $matches[1];

        $stats = $annotationService->getAnnotationStats($themeId);

        echo json_encode([
            'success' => true,
            'theme_id' => $themeId,
            'stats' => $stats
        ]);
    }

    // ========================================================================
    // POST /api/annotations/{id}/ai-suggestion - Générer suggestion IA
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/([a-z0-9_\-]+)/ai-suggestion$#', $subPath, $matches)) {
        $annotationId = $matches[1];

        // Vérifier que l'IA est activée pour le tenant
        // TODO: Vérifier les settings du tenant

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $context = $input['context'] ?? [];

        $result = $annotationService->generateAISuggestion($annotationId, $context);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // GET /api/annotations/my-annotations - Mes annotations
    // ========================================================================
    elseif ($requestMethod === 'GET' && $subPath === '/my-annotations') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $status = $_GET['status'] ?? null;

        $sql = "
            SELECT
                a.*,
                t.title AS theme_title,
                t.status AS theme_status
            FROM annotations a
            JOIN themes t ON a.theme_id = t.id
            WHERE a.tenant_id = ?
              AND a.author_user_id = ?
        ";

        $params = [$tenantId, $user['id']];

        if ($status) {
            $sql .= " AND a.status = ?";
            $params[] = $status;
        }

        $sql .= " ORDER BY a.created_at DESC LIMIT ?";
        $params[] = $limit;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $annotations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Décoder les métadonnées JSON
        foreach ($annotations as &$annotation) {
            if (!empty($annotation['metadata'])) {
                $annotation['metadata'] = json_decode($annotation['metadata'], true);
            }
        }

        echo json_encode([
            'success' => true,
            'annotations' => $annotations,
            'count' => count($annotations)
        ]);
    }

    // ========================================================================
    // Route non trouvée
    // ========================================================================
    else {
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
