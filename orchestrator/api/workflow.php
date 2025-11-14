<?php
/**
 * Sprint 19 - Multi-Review Workflow
 * API: Theme Workflow Management
 * Endpoints pour gérer le workflow de validation des thèmes
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/_middleware_tenant.php';
require_once __DIR__ . '/_middleware_rbac.php';
require_once __DIR__ . '/../services/ThemeWorkflowService.php';

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
$workflowService = new ThemeWorkflowService($db);

// Router les requêtes
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];

// Extraire le chemin après /api/workflow
$pathPattern = '#^/api/workflow(/.*)?$#';
if (preg_match($pathPattern, $path, $matches)) {
    $subPath = $matches[1] ?? '/';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

try {
    // ========================================================================
    // POST /api/workflow/themes/{id}/submit - Soumettre pour validation
    // ========================================================================
    if ($requestMethod === 'POST' && preg_match('#^/themes/([a-z0-9_\-]+)/submit$#', $subPath, $matches)) {
        $themeId = $matches[1];

        // Vérifier les permissions
        if (!in_array($user['role'], ['teacher', 'admin', 'direction'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Insufficient permissions']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $comment = $input['comment'] ?? null;

        $result = $workflowService->submitForReview($themeId, $user['id'], $comment);

        if ($result['success']) {
            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // POST /api/workflow/themes/{id}/approve - Approuver un thème
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/themes/([a-z0-9_\-]+)/approve$#', $subPath, $matches)) {
        $themeId = $matches[1];

        // Vérifier les permissions (référent, direction, admin)
        if (!in_array($user['role'], ['referent', 'direction', 'admin'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Referent role required']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $comment = $input['comment'] ?? null;

        $result = $workflowService->approveTheme($themeId, $user['id'], $comment);

        if ($result['success']) {
            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // POST /api/workflow/themes/{id}/reject - Rejeter un thème
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/themes/([a-z0-9_\-]+)/reject$#', $subPath, $matches)) {
        $themeId = $matches[1];

        // Vérifier les permissions (référent, direction, admin)
        if (!in_array($user['role'], ['referent', 'direction', 'admin'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Referent role required']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $comment = $input['comment'] ?? null;

        if (empty($comment)) {
            http_response_code(400);
            echo json_encode(['error' => 'Comment is required for rejection']);
            exit;
        }

        $result = $workflowService->rejectTheme($themeId, $user['id'], $comment);

        if ($result['success']) {
            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // POST /api/workflow/themes/{id}/publish - Publier un thème
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/themes/([a-z0-9_\-]+)/publish$#', $subPath, $matches)) {
        $themeId = $matches[1];

        // Vérifier les permissions (direction, admin uniquement)
        if (!in_array($user['role'], ['direction', 'admin'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Direction role required']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $comment = $input['comment'] ?? null;

        $result = $workflowService->publishTheme($themeId, $user['id'], $comment);

        if ($result['success']) {
            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // POST /api/workflow/themes/{id}/archive - Archiver un thème
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/themes/([a-z0-9_\-]+)/archive$#', $subPath, $matches)) {
        $themeId = $matches[1];

        // Vérifier les permissions (direction, admin)
        if (!in_array($user['role'], ['direction', 'admin'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Admin or Direction role required']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $reason = $input['reason'] ?? null;

        $result = $workflowService->archiveTheme($themeId, $user['id'], $reason);

        if ($result['success']) {
            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // GET /api/workflow/themes/{id}/history - Historique du workflow
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/themes/([a-z0-9_\-]+)/history$#', $subPath, $matches)) {
        $themeId = $matches[1];

        $history = $workflowService->getWorkflowHistory($themeId);

        echo json_encode([
            'success' => true,
            'theme_id' => $themeId,
            'history' => $history,
            'count' => count($history)
        ]);
    }

    // ========================================================================
    // POST /api/workflow/themes/{id}/assign-reviewer - Assigner un référent
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/themes/([a-z0-9_\-]+)/assign-reviewer$#', $subPath, $matches)) {
        $themeId = $matches[1];

        // Vérifier les permissions (direction, admin)
        if (!in_array($user['role'], ['direction', 'admin'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Admin or Direction role required']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['reviewer_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'reviewer_id is required']);
            exit;
        }

        $options = [
            'priority' => $input['priority'] ?? 'normal',
            'due_date' => $input['due_date'] ?? null
        ];

        $result = $workflowService->assignReviewer(
            $themeId,
            $input['reviewer_id'],
            $user['id'],
            $options
        );

        if ($result['success']) {
            http_response_code(201);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // GET /api/workflow/stats - Statistiques du workflow
    // ========================================================================
    elseif ($requestMethod === 'GET' && $subPath === '/stats') {
        $stats = $workflowService->getWorkflowStats($tenantId);

        echo json_encode([
            'success' => true,
            'tenant_id' => $tenantId,
            'stats' => $stats
        ]);
    }

    // ========================================================================
    // GET /api/workflow/pending - Thèmes en attente de validation
    // ========================================================================
    elseif ($requestMethod === 'GET' && $subPath === '/pending') {
        // Récupérer les thèmes en attente de validation
        $stmt = $db->prepare("
            SELECT
                t.id,
                t.title,
                t.description,
                t.status,
                t.submitted_at,
                t.created_by,
                u.firstname AS author_firstname,
                u.lastname AS author_lastname,
                (SELECT COUNT(*) FROM annotations WHERE theme_id = t.id AND status = 'open') AS open_annotations
            FROM themes t
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.tenant_id = ?
              AND t.status = 'pending_review'
            ORDER BY t.submitted_at ASC
        ");

        $stmt->execute([$tenantId]);
        $themes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'themes' => $themes,
            'count' => count($themes)
        ]);
    }

    // ========================================================================
    // GET /api/workflow/my-reviews - Mes revues assignées
    // ========================================================================
    elseif ($requestMethod === 'GET' && $subPath === '/my-reviews') {
        // Récupérer les revues assignées à l'utilisateur
        $stmt = $db->prepare("
            SELECT
                ra.*,
                t.title AS theme_title,
                t.status AS theme_status,
                u.firstname AS assigned_by_firstname,
                u.lastname AS assigned_by_lastname
            FROM review_assignments ra
            JOIN themes t ON ra.theme_id = t.id
            LEFT JOIN users u ON ra.assigned_by = u.id
            WHERE ra.tenant_id = ?
              AND ra.reviewer_user_id = ?
              AND ra.status IN ('pending', 'in_progress')
            ORDER BY ra.due_date ASC, ra.priority DESC
        ");

        $stmt->execute([$tenantId, $user['id']]);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'reviews' => $reviews,
            'count' => count($reviews)
        ]);
    }

    // ========================================================================
    // GET /api/workflow/notifications - Mes notifications
    // ========================================================================
    elseif ($requestMethod === 'GET' && $subPath === '/notifications') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $unreadOnly = isset($_GET['unread_only']) && $_GET['unread_only'] === 'true';

        $sql = "
            SELECT * FROM workflow_notifications
            WHERE tenant_id = ?
              AND user_id = ?
        ";

        if ($unreadOnly) {
            $sql .= " AND is_read = FALSE";
        }

        $sql .= " ORDER BY created_at DESC LIMIT ?";

        $stmt = $db->prepare($sql);
        $stmt->execute([$tenantId, $user['id'], $limit]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Décoder les métadonnées JSON
        foreach ($notifications as &$notif) {
            if (!empty($notif['metadata'])) {
                $notif['metadata'] = json_decode($notif['metadata'], true);
            }
        }

        echo json_encode([
            'success' => true,
            'notifications' => $notifications,
            'count' => count($notifications)
        ]);
    }

    // ========================================================================
    // PATCH /api/workflow/notifications/{id}/read - Marquer comme lu
    // ========================================================================
    elseif ($requestMethod === 'PATCH' && preg_match('#^/notifications/([a-z0-9_\-]+)/read$#', $subPath, $matches)) {
        $notifId = $matches[1];

        $stmt = $db->prepare("
            UPDATE workflow_notifications
            SET is_read = TRUE,
                read_at = NOW()
            WHERE id = ?
              AND user_id = ?
              AND tenant_id = ?
        ");

        $stmt->execute([$notifId, $user['id'], $tenantId]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Notification not found']);
        }
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
