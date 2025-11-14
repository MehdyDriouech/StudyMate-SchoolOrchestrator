<?php
/**
 * Sprint 19 - Multi-Review Workflow
 * API: Theme Versions Management
 * Endpoints pour gérer les versions et comparer les modifications
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/_middleware_tenant.php';
require_once __DIR__ . '/_middleware_rbac.php';

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

// Initialiser la connexion DB
$db = getDBConnection();

// Router les requêtes
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];

// Extraire le chemin après /api/versions
$pathPattern = '#^/api/versions(/.*)?$#';
if (preg_match($pathPattern, $path, $matches)) {
    $subPath = $matches[1] ?? '/';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

try {
    // ========================================================================
    // GET /api/versions/themes/{themeId} - Historique des versions
    // ========================================================================
    if ($requestMethod === 'GET' && preg_match('#^/themes/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $themeId = $matches[1];
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $milestonesOnly = isset($_GET['milestones_only']) && $_GET['milestones_only'] === 'true';

        $sql = "
            SELECT
                v.id,
                v.version,
                v.title,
                v.status,
                v.is_milestone,
                v.change_summary,
                v.created_at,
                u.firstname AS created_by_firstname,
                u.lastname AS created_by_lastname,
                LENGTH(v.data) AS data_size
            FROM theme_versions v
            LEFT JOIN users u ON v.created_by = u.id
            WHERE v.theme_id = ?
              AND v.tenant_id = ?
        ";

        $params = [$themeId, $tenantId];

        if ($milestonesOnly) {
            $sql .= " AND v.is_milestone = TRUE";
        }

        $sql .= " ORDER BY v.version DESC LIMIT ?";
        $params[] = $limit;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $versions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'theme_id' => $themeId,
            'versions' => $versions,
            'count' => count($versions)
        ]);
    }

    // ========================================================================
    // GET /api/versions/{versionId} - Détails d'une version
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $versionId = $matches[1];

        $stmt = $db->prepare("
            SELECT
                v.*,
                u.firstname AS created_by_firstname,
                u.lastname AS created_by_lastname,
                u.role AS created_by_role
            FROM theme_versions v
            LEFT JOIN users u ON v.created_by = u.id
            WHERE v.id = ?
              AND v.tenant_id = ?
        ");

        $stmt->execute([$versionId, $tenantId]);
        $version = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$version) {
            http_response_code(404);
            echo json_encode(['error' => 'Version not found']);
            exit;
        }

        // Décoder les données JSON
        if (!empty($version['data'])) {
            $version['data'] = json_decode($version['data'], true);
        }

        if (!empty($version['diff_metadata'])) {
            $version['diff_metadata'] = json_decode($version['diff_metadata'], true);
        }

        echo json_encode([
            'success' => true,
            'version' => $version
        ]);
    }

    // ========================================================================
    // GET /api/versions/compare - Comparer deux versions
    // ========================================================================
    elseif ($requestMethod === 'GET' && $subPath === '/compare') {
        $version1Id = $_GET['version1'] ?? null;
        $version2Id = $_GET['version2'] ?? null;

        if (!$version1Id || !$version2Id) {
            http_response_code(400);
            echo json_encode(['error' => 'Both version1 and version2 are required']);
            exit;
        }

        // Récupérer les deux versions
        $stmt = $db->prepare("
            SELECT * FROM theme_versions
            WHERE id IN (?, ?)
              AND tenant_id = ?
        ");

        $stmt->execute([$version1Id, $version2Id, $tenantId]);
        $versions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($versions) !== 2) {
            http_response_code(404);
            echo json_encode(['error' => 'One or both versions not found']);
            exit;
        }

        $v1 = null;
        $v2 = null;

        foreach ($versions as $v) {
            if ($v['id'] === $version1Id) {
                $v1 = $v;
            } else {
                $v2 = $v;
            }
        }

        // Vérifier qu'elles appartiennent au même thème
        if ($v1['theme_id'] !== $v2['theme_id']) {
            http_response_code(400);
            echo json_encode(['error' => 'Versions must belong to the same theme']);
            exit;
        }

        // Décoder les données
        $data1 = json_decode($v1['data'], true);
        $data2 = json_decode($v2['data'], true);

        // Calculer les différences
        $diff = calculateDiff($data1, $data2);

        echo json_encode([
            'success' => true,
            'version1' => [
                'id' => $v1['id'],
                'version' => $v1['version'],
                'title' => $v1['title'],
                'status' => $v1['status'],
                'created_at' => $v1['created_at']
            ],
            'version2' => [
                'id' => $v2['id'],
                'version' => $v2['version'],
                'title' => $v2['title'],
                'status' => $v2['status'],
                'created_at' => $v2['created_at']
            ],
            'diff' => $diff
        ]);
    }

    // ========================================================================
    // POST /api/versions/{versionId}/restore - Restaurer une version
    // ========================================================================
    elseif ($requestMethod === 'POST' && preg_match('#^/([a-z0-9_\-]+)/restore$#', $subPath, $matches)) {
        $versionId = $matches[1];

        // Vérifier les permissions
        if (!in_array($user['role'], ['teacher', 'admin', 'direction'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Insufficient permissions']);
            exit;
        }

        // Récupérer la version
        $stmt = $db->prepare("
            SELECT * FROM theme_versions
            WHERE id = ?
              AND tenant_id = ?
        ");

        $stmt->execute([$versionId, $tenantId]);
        $version = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$version) {
            http_response_code(404);
            echo json_encode(['error' => 'Version not found']);
            exit;
        }

        // Vérifier que l'utilisateur a accès au thème
        $themeStmt = $db->prepare("
            SELECT * FROM themes
            WHERE id = ?
              AND tenant_id = ?
        ");

        $themeStmt->execute([$version['theme_id'], $tenantId]);
        $theme = $themeStmt->fetch(PDO::FETCH_ASSOC);

        if (!$theme) {
            http_response_code(404);
            echo json_encode(['error' => 'Theme not found']);
            exit;
        }

        // Vérifier ownership ou permissions admin
        if ($theme['created_by'] !== $user['id'] && !in_array($user['role'], ['admin', 'direction'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: You can only restore your own themes']);
            exit;
        }

        $db->beginTransaction();

        try {
            // Mettre à jour le thème avec les données de la version
            $updateStmt = $db->prepare("
                UPDATE themes
                SET content = ?,
                    title = ?,
                    version = version + 1,
                    updated_at = NOW()
                WHERE id = ?
            ");

            $updateStmt->execute([
                $version['data'],
                $version['title'],
                $version['theme_id']
            ]);

            // Créer une nouvelle entrée de version pour la restauration
            $newVersionId = 'ver_' . bin2hex(random_bytes(16));
            $newVersionNumber = $theme['version'] + 1;

            $insertStmt = $db->prepare("
                INSERT INTO theme_versions (
                    id, theme_id, tenant_id, version, data,
                    title, status, created_by, change_summary,
                    is_milestone, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW())
            ");

            $changeSummary = "Restauration de la version {$version['version']}";

            $insertStmt->execute([
                $newVersionId,
                $version['theme_id'],
                $tenantId,
                $newVersionNumber,
                $version['data'],
                $version['title'],
                $theme['status'],
                $user['id'],
                $changeSummary
            ]);

            $db->commit();

            echo json_encode([
                'success' => true,
                'theme_id' => $version['theme_id'],
                'restored_from_version' => $version['version'],
                'new_version' => $newVersionNumber
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    // ========================================================================
    // GET /api/versions/themes/{themeId}/milestones - Versions milestones
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/themes/([a-z0-9_\-]+)/milestones$#', $subPath, $matches)) {
        $themeId = $matches[1];

        $stmt = $db->prepare("
            SELECT
                v.id,
                v.version,
                v.title,
                v.status,
                v.change_summary,
                v.created_at,
                u.firstname AS created_by_firstname,
                u.lastname AS created_by_lastname
            FROM theme_versions v
            LEFT JOIN users u ON v.created_by = u.id
            WHERE v.theme_id = ?
              AND v.tenant_id = ?
              AND v.is_milestone = TRUE
            ORDER BY v.version DESC
        ");

        $stmt->execute([$themeId, $tenantId]);
        $milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'theme_id' => $themeId,
            'milestones' => $milestones,
            'count' => count($milestones)
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

/**
 * Calculer les différences entre deux versions de thème
 */
function calculateDiff($data1, $data2) {
    $changes = [
        'added' => [],
        'removed' => [],
        'modified' => []
    ];

    // Comparer le titre
    if (($data1['title'] ?? '') !== ($data2['title'] ?? '')) {
        $changes['modified'][] = [
            'field' => 'title',
            'from' => $data1['title'] ?? '',
            'to' => $data2['title'] ?? ''
        ];
    }

    // Comparer la description
    if (($data1['description'] ?? '') !== ($data2['description'] ?? '')) {
        $changes['modified'][] = [
            'field' => 'description',
            'from' => $data1['description'] ?? '',
            'to' => $data2['description'] ?? ''
        ];
    }

    // Comparer les questions
    $q1 = $data1['questions'] ?? [];
    $q2 = $data2['questions'] ?? [];

    if (count($q1) !== count($q2)) {
        $changes['modified'][] = [
            'field' => 'questions_count',
            'from' => count($q1),
            'to' => count($q2)
        ];
    }

    // Comparer les flashcards
    $f1 = $data1['flashcards'] ?? [];
    $f2 = $data2['flashcards'] ?? [];

    if (count($f1) !== count($f2)) {
        $changes['modified'][] = [
            'field' => 'flashcards_count',
            'from' => count($f1),
            'to' => count($f2)
        ];
    }

    // Comparer la difficulté
    if (($data1['difficulty'] ?? '') !== ($data2['difficulty'] ?? '')) {
        $changes['modified'][] = [
            'field' => 'difficulty',
            'from' => $data1['difficulty'] ?? '',
            'to' => $data2['difficulty'] ?? ''
        ];
    }

    // Comparer les tags
    $tags1 = $data1['tags'] ?? [];
    $tags2 = $data2['tags'] ?? [];

    $addedTags = array_diff($tags2, $tags1);
    $removedTags = array_diff($tags1, $tags2);

    if (!empty($addedTags)) {
        $changes['added'][] = [
            'field' => 'tags',
            'items' => array_values($addedTags)
        ];
    }

    if (!empty($removedTags)) {
        $changes['removed'][] = [
            'field' => 'tags',
            'items' => array_values($removedTags)
        ];
    }

    // Calcul du nombre total de changements
    $totalChanges = count($changes['added']) + count($changes['removed']) + count($changes['modified']);

    return [
        'changes' => $changes,
        'total_changes' => $totalChanges,
        'has_changes' => $totalChanges > 0
    ];
}
