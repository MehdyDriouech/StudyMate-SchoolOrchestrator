<?php
/**
 * GET/POST /api/feed/quality - Quality Feed for Pedagogical Issues
 *
 * Sprint 16: Quality Feed
 * Lists AI-detected issues, student feedback, and structural problems
 * Allows teachers and referents to track and resolve quality issues
 * Requires teacher, referent, or direction role
 */

require_once __DIR__ . '/../../.env.php';
require_once __DIR__ . '/../_middleware_telemetry.php';
require_once __DIR__ . '/../_middleware_tenant.php';
require_once __DIR__ . '/../_middleware_rbac.php';
require_once __DIR__ . '/../../lib/util.php';

setCorsHeaders();

$telemetry = startTelemetry();
$method = $_SERVER['REQUEST_METHOD'];

// Support GET and POST methods
if (!in_array($method, ['GET', 'POST', 'PATCH'])) {
    $telemetry->end(405);
    errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
}

try {
    // Enforce authentication and RBAC
    $auth = requireAuth();
    $telemetry->setUser($auth->getUser()['id'] ?? null);

    // Enforce tenant isolation
    $tenantContext = enforceTenantIsolation();
    $telemetry->setTenant($tenantContext->getTenantId());

    $rbac = enforceRBAC($auth);
    $tenantId = $tenantContext->getTenantId();
    $currentUser = $auth->getUser();

    $db = db();

    // POST: Create new quality issue
    if ($method === 'POST') {
        requireAnyPermission($rbac, 'catalog', ['read', 'validate']);

        $body = getJsonBody();
        $themeId = $body['theme_id'] ?? null;
        $issueType = $body['issue_type'] ?? 'other';
        $severity = $body['severity'] ?? 'warning';
        $title = $body['title'] ?? '';
        $description = $body['description'] ?? '';
        $source = $body['source'] ?? 'manual';

        if (!$title || !$description) {
            $telemetry->end(400);
            errorResponse('INVALID_INPUT', 'title and description are required', 400);
        }

        // Get teacher_id from theme if provided
        $teacherId = null;
        if ($themeId) {
            $theme = $db->queryOne(
                "SELECT created_by FROM themes WHERE id = :theme_id AND tenant_id = :tenant_id",
                ['theme_id' => $themeId, 'tenant_id' => $tenantId]
            );
            $teacherId = $theme['created_by'] ?? null;
        }

        // Create quality issue
        $issueId = generateId('qfeed');
        $db->execute(
            "INSERT INTO quality_feed (
                id, tenant_id, theme_id, teacher_id,
                issue_type, severity, title, description,
                source, detected_by, status, created_at
             ) VALUES (
                :id, :tenant_id, :theme_id, :teacher_id,
                :issue_type, :severity, :title, :description,
                :source, :detected_by, 'open', NOW()
             )",
            [
                'id' => $issueId,
                'tenant_id' => $tenantId,
                'theme_id' => $themeId,
                'teacher_id' => $teacherId,
                'issue_type' => $issueType,
                'severity' => $severity,
                'title' => $title,
                'description' => $description,
                'source' => $source,
                'detected_by' => $currentUser['id']
            ]
        );

        logInfo("Quality issue created", [
            'issue_id' => $issueId,
            'theme_id' => $themeId,
            'issue_type' => $issueType,
            'created_by' => $currentUser['id']
        ]);

        $telemetry->end(201);
        jsonResponse([
            'success' => true,
            'message' => 'Quality issue created',
            'issue_id' => $issueId
        ], 201);
    }

    // PATCH: Update quality issue status
    if ($method === 'PATCH') {
        requireAnyPermission($rbac, 'catalog', ['read', 'validate']);

        $body = getJsonBody();
        $issueId = $body['issue_id'] ?? null;
        $status = $body['status'] ?? null;
        $assignedTo = $body['assigned_to'] ?? null;
        $resolutionNotes = $body['resolution_notes'] ?? null;

        if (!$issueId) {
            $telemetry->end(400);
            errorResponse('INVALID_INPUT', 'issue_id is required', 400);
        }

        // Build update query
        $updates = [];
        $params = ['issue_id' => $issueId, 'tenant_id' => $tenantId];

        if ($status) {
            $updates[] = "status = :status";
            $params['status'] = $status;

            if ($status === 'resolved') {
                $updates[] = "resolved_at = NOW()";
                $updates[] = "resolved_by = :resolved_by";
                $params['resolved_by'] = $currentUser['id'];
            }
        }

        if ($assignedTo) {
            $updates[] = "assigned_to = :assigned_to";
            $params['assigned_to'] = $assignedTo;
        }

        if ($resolutionNotes) {
            $updates[] = "resolution_notes = :resolution_notes";
            $params['resolution_notes'] = $resolutionNotes;
        }

        if (empty($updates)) {
            $telemetry->end(400);
            errorResponse('INVALID_INPUT', 'No updates provided', 400);
        }

        $updateClause = implode(', ', $updates);

        $db->execute(
            "UPDATE quality_feed
             SET {$updateClause}, updated_at = NOW()
             WHERE id = :issue_id AND tenant_id = :tenant_id",
            $params
        );

        logInfo("Quality issue updated", [
            'issue_id' => $issueId,
            'status' => $status,
            'updated_by' => $currentUser['id']
        ]);

        $telemetry->end(200);
        jsonResponse([
            'success' => true,
            'message' => 'Quality issue updated',
            'issue_id' => $issueId
        ]);
    }

    // GET: Retrieve quality feed
    requireAnyPermission($rbac, 'catalog', ['read', 'validate']);

    // Get query parameters
    $themeId = $_GET['theme_id'] ?? null;
    $teacherId = $_GET['teacher_id'] ?? null;
    $status = $_GET['status'] ?? null;
    $severity = $_GET['severity'] ?? null;
    $issueType = $_GET['issue_type'] ?? null;
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $offset = (int)($_GET['offset'] ?? 0);

    // Build WHERE clause
    $whereConditions = ["qf.tenant_id = :tenant_id"];
    $params = ['tenant_id' => $tenantId];

    // Teacher ownership: teachers can only see issues related to their themes
    if ($currentUser['role'] === 'teacher') {
        $whereConditions[] = "qf.teacher_id = :teacher_id";
        $params['teacher_id'] = $currentUser['id'];
    } elseif ($teacherId) {
        $whereConditions[] = "qf.teacher_id = :teacher_id";
        $params['teacher_id'] = $teacherId;
    }

    if ($themeId) {
        $whereConditions[] = "qf.theme_id = :theme_id";
        $params['theme_id'] = $themeId;
    }

    if ($status) {
        $whereConditions[] = "qf.status = :status";
        $params['status'] = $status;
    }

    if ($severity) {
        $whereConditions[] = "qf.severity = :severity";
        $params['severity'] = $severity;
    }

    if ($issueType) {
        $whereConditions[] = "qf.issue_type = :issue_type";
        $params['issue_type'] = $issueType;
    }

    $whereClause = implode(' AND ', $whereConditions);

    // Get total count
    $totalCount = $db->queryOne(
        "SELECT COUNT(*) as count FROM quality_feed qf WHERE {$whereClause}",
        $params
    )['count'];

    // Get quality issues
    $issues = $db->query(
        "SELECT
            qf.*,
            t.title as theme_title,
            u_teacher.firstname as teacher_firstname,
            u_teacher.lastname as teacher_lastname,
            u_detected.firstname as detected_by_firstname,
            u_detected.lastname as detected_by_lastname,
            u_assigned.firstname as assigned_to_firstname,
            u_assigned.lastname as assigned_to_lastname,
            u_resolved.firstname as resolved_by_firstname,
            u_resolved.lastname as resolved_by_lastname
         FROM quality_feed qf
         LEFT JOIN themes t ON t.id = qf.theme_id
         LEFT JOIN users u_teacher ON u_teacher.id = qf.teacher_id
         LEFT JOIN users u_detected ON u_detected.id = qf.detected_by
         LEFT JOIN users u_assigned ON u_assigned.id = qf.assigned_to
         LEFT JOIN users u_resolved ON u_resolved.id = qf.resolved_by
         WHERE {$whereClause}
         ORDER BY
            CASE qf.severity
                WHEN 'critical' THEN 1
                WHEN 'error' THEN 2
                WHEN 'warning' THEN 3
                WHEN 'info' THEN 4
            END,
            qf.created_at DESC
         LIMIT :limit OFFSET :offset",
        array_merge($params, ['limit' => $limit, 'offset' => $offset])
    );

    // Format issues
    $formattedIssues = array_map(function($issue) {
        return [
            'id' => $issue['id'],
            'theme' => $issue['theme_id'] ? [
                'id' => $issue['theme_id'],
                'title' => $issue['theme_title']
            ] : null,
            'teacher' => $issue['teacher_id'] ? [
                'id' => $issue['teacher_id'],
                'name' => ($issue['teacher_firstname'] ?? '') . ' ' . ($issue['teacher_lastname'] ?? '')
            ] : null,
            'issue' => [
                'type' => $issue['issue_type'],
                'severity' => $issue['severity'],
                'title' => $issue['title'],
                'description' => $issue['description'],
                'source' => $issue['source']
            ],
            'status' => $issue['status'],
            'affected_students_count' => (int)$issue['affected_students_count'],
            'related_data' => json_decode($issue['related_data'] ?? '{}', true),
            'detected_by' => $issue['detected_by'] ? [
                'id' => $issue['detected_by'],
                'name' => ($issue['detected_by_firstname'] ?? '') . ' ' . ($issue['detected_by_lastname'] ?? '')
            ] : null,
            'assigned_to' => $issue['assigned_to'] ? [
                'id' => $issue['assigned_to'],
                'name' => ($issue['assigned_to_firstname'] ?? '') . ' ' . ($issue['assigned_to_lastname'] ?? '')
            ] : null,
            'resolved' => $issue['resolved_at'] ? [
                'at' => $issue['resolved_at'],
                'by' => $issue['resolved_by'] ? [
                    'id' => $issue['resolved_by'],
                    'name' => ($issue['resolved_by_firstname'] ?? '') . ' ' . ($issue['resolved_by_lastname'] ?? '')
                ] : null,
                'notes' => $issue['resolution_notes']
            ] : null,
            'created_at' => $issue['created_at'],
            'updated_at' => $issue['updated_at']
        ];
    }, $issues);

    // Get summary statistics
    $summary = $db->queryOne(
        "SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
            COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
            COUNT(CASE WHEN severity = 'error' THEN 1 END) as error,
            COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warning
         FROM quality_feed qf
         WHERE {$whereClause}",
        $params
    );

    $telemetry->end(200);
    jsonResponse([
        'tenant_id' => $tenantId,
        'filters' => [
            'theme_id' => $themeId,
            'teacher_id' => $teacherId,
            'status' => $status,
            'severity' => $severity,
            'issue_type' => $issueType
        ],
        'issues' => $formattedIssues,
        'pagination' => [
            'total' => (int)$totalCount,
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + $limit) < $totalCount
        ],
        'summary' => [
            'total' => (int)($summary['total'] ?? 0),
            'open' => (int)($summary['open'] ?? 0),
            'in_progress' => (int)($summary['in_progress'] ?? 0),
            'resolved' => (int)($summary['resolved'] ?? 0),
            'by_severity' => [
                'critical' => (int)($summary['critical'] ?? 0),
                'error' => (int)($summary['error'] ?? 0),
                'warning' => (int)($summary['warning'] ?? 0)
            ]
        ],
        'generated_at' => date('c')
    ]);

} catch (Exception $e) {
    $telemetry->end(500, $e->getMessage());
    logError("Quality feed error", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    errorResponse('INTERNAL_ERROR', $e->getMessage(), 500);
}
