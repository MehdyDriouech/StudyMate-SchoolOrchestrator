<?php
/**
 * GET /api/analytics/teacher-kpi - Teacher Quality Dashboard
 *
 * Sprint 16: Teacher Performance Analytics
 * Returns teacher performance metrics, quality indicators, and comparisons
 * Requires direction, admin, or inspector role
 */

require_once __DIR__ . '/../../.env.php';
require_once __DIR__ . '/../_middleware_telemetry.php';
require_once __DIR__ . '/../_middleware_tenant.php';
require_once __DIR__ . '/../_middleware_rbac.php';
require_once __DIR__ . '/../../lib/util.php';

setCorsHeaders();

$telemetry = startTelemetry();
$method = $_SERVER['REQUEST_METHOD'];

// Only GET method allowed
if ($method !== 'GET') {
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

    // Check permissions - direction, admin, and inspector can view teacher KPIs
    $rbac = enforceRBAC($auth);
    requireAnyPermission($rbac, 'analytics', ['read', 'export']);

    $tenantId = $tenantContext->getTenantId();
    $currentUser = $auth->getUser();

    // Get query parameters
    $teacherId = $_GET['teacher_id'] ?? null;
    $periodStart = $_GET['period_start'] ?? date('Y-m-d', strtotime('-30 days'));
    $periodEnd = $_GET['period_end'] ?? date('Y-m-d');
    $exportPdf = isset($_GET['export']) && $_GET['export'] === 'pdf';

    $db = db();

    // If no teacher_id specified, return all teachers summary
    if (!$teacherId) {
        $allTeachers = getAllTeachersKPI($db, $tenantId, $periodStart, $periodEnd);

        $telemetry->end(200);
        jsonResponse([
            'tenant_id' => $tenantId,
            'period' => [
                'start' => $periodStart,
                'end' => $periodEnd
            ],
            'teachers' => $allTeachers,
            'generated_at' => date('c')
        ]);
    }

    // Get specific teacher KPI
    $teacherKPI = calculateTeacherKPI($db, $tenantId, $teacherId, $periodStart, $periodEnd);

    if (!$teacherKPI) {
        $telemetry->end(404);
        errorResponse('NOT_FOUND', 'Teacher not found or no data available', 404);
    }

    // If PDF export requested
    if ($exportPdf) {
        require_once __DIR__ . '/../../services/pdf_generator.php';
        $pdf = generateTeacherKPIPDF($teacherKPI, $tenantId);

        $telemetry->end(200);
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="teacher_kpi_' . $teacherId . '.pdf"');
        echo $pdf;
        exit;
    }

    // Log sync_logs for observability
    logSyncOperation($db, [
        'tenant_id' => $tenantId,
        'triggered_by' => $currentUser['id'],
        'direction' => 'pull',
        'type' => 'teacher_kpi',
        'status' => 'ok',
        'payload' => json_encode(['teacher_id' => $teacherId, 'period' => compact('periodStart', 'periodEnd')])
    ]);

    $telemetry->end(200);
    jsonResponse([
        'tenant_id' => $tenantId,
        'teacher_id' => $teacherId,
        'period' => [
            'start' => $periodStart,
            'end' => $periodEnd
        ],
        'kpi' => $teacherKPI,
        'generated_at' => date('c')
    ]);

} catch (Exception $e) {
    $telemetry->end(500, $e->getMessage());
    logError("Teacher KPI error", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    errorResponse('INTERNAL_ERROR', $e->getMessage(), 500);
}

/**
 * Calculate Teacher KPI for a specific teacher
 */
function calculateTeacherKPI($db, $tenantId, $teacherId, $periodStart, $periodEnd) {
    // Verify teacher exists
    $teacher = $db->queryOne(
        "SELECT id, firstname, lastname, email FROM users
         WHERE id = :teacher_id AND tenant_id = :tenant_id AND role IN ('teacher', 'intervenant')",
        ['teacher_id' => $teacherId, 'tenant_id' => $tenantId]
    );

    if (!$teacher) {
        return null;
    }

    // 1. Student Engagement Metrics
    $engagementMetrics = $db->queryOne(
        "SELECT
            COUNT(DISTINCT s.id) as total_students,
            COUNT(DISTINCT CASE
                WHEN st.last_activity_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                THEN s.id
            END) as active_students,
            AVG(st.mastery) * 100 as avg_engagement
         FROM students s
         INNER JOIN classes c ON c.id = s.class_id
         LEFT JOIN stats st ON st.student_id = s.id
         WHERE c.teacher_id = :teacher_id
           AND c.tenant_id = :tenant_id
           AND s.status = 'active'",
        ['teacher_id' => $teacherId, 'tenant_id' => $tenantId]
    );

    // 2. Mission Completion Rate
    $missionMetrics = $db->queryOne(
        "SELECT
            COUNT(DISTINCT a.id) as total_assignments,
            COUNT(DISTINCT CASE WHEN a.status IN ('pushed', 'ack') THEN a.id END) as pushed_assignments,
            AVG(CASE
                WHEN a.status IN ('pushed', 'ack') THEN 100
                ELSE 0
            END) as completion_rate
         FROM assignments a
         WHERE a.teacher_id = :teacher_id
           AND a.tenant_id = :tenant_id
           AND DATE(a.created_at) BETWEEN :period_start AND :period_end",
        ['teacher_id' => $teacherId, 'tenant_id' => $tenantId, 'period_start' => $periodStart, 'period_end' => $periodEnd]
    );

    // 3. Theme Quality Metrics
    $themeMetrics = $db->queryOne(
        "SELECT
            COUNT(*) as themes_created,
            AVG(
                CASE
                    WHEN JSON_LENGTH(content->'$.questions') > 5 THEN 100
                    WHEN JSON_LENGTH(content->'$.questions') > 2 THEN 70
                    ELSE 40
                END
            ) as avg_quality
         FROM themes t
         WHERE t.created_by = :teacher_id
           AND t.tenant_id = :tenant_id
           AND DATE(t.created_at) BETWEEN :period_start AND :period_end",
        ['teacher_id' => $teacherId, 'tenant_id' => $tenantId, 'period_start' => $periodStart, 'period_end' => $periodEnd]
    );

    // 4. Student Performance Metrics
    $performanceMetrics = $db->queryOne(
        "SELECT
            AVG(st.score) as avg_score,
            AVG(st.mastery) * 100 as avg_mastery
         FROM stats st
         INNER JOIN students s ON s.id = st.student_id
         INNER JOIN classes c ON c.id = s.class_id
         WHERE c.teacher_id = :teacher_id
           AND c.tenant_id = :tenant_id
           AND st.theme_id IS NOT NULL
           AND DATE(st.synced_at) BETWEEN :period_start AND :period_end",
        ['teacher_id' => $teacherId, 'tenant_id' => $tenantId, 'period_start' => $periodStart, 'period_end' => $periodEnd]
    );

    // 5. AI Issues Count
    $aiIssues = $db->queryOne(
        "SELECT COUNT(*) as issues_count
         FROM quality_feed qf
         WHERE qf.teacher_id = :teacher_id
           AND qf.tenant_id = :tenant_id
           AND qf.status IN ('open', 'in_progress')
           AND DATE(qf.created_at) BETWEEN :period_start AND :period_end",
        ['teacher_id' => $teacherId, 'tenant_id' => $tenantId, 'period_start' => $periodStart, 'period_end' => $periodEnd]
    );

    // 6. Calculate Tenant Averages for Comparison
    $tenantAvg = $db->queryOne(
        "SELECT
            AVG(st.mastery) * 100 as avg_engagement,
            AVG(st.score) as avg_score
         FROM stats st
         INNER JOIN students s ON s.id = st.student_id
         WHERE s.tenant_id = :tenant_id
           AND st.theme_id IS NOT NULL
           AND DATE(st.synced_at) BETWEEN :period_start AND :period_end",
        ['tenant_id' => $tenantId, 'period_start' => $periodStart, 'period_end' => $periodEnd]
    );

    // Calculate overall score (weighted average)
    $engagementScore = floatval($engagementMetrics['avg_engagement'] ?? 0);
    $completionScore = floatval($missionMetrics['completion_rate'] ?? 0);
    $qualityScore = floatval($themeMetrics['avg_quality'] ?? 0);
    $performanceScore = floatval($performanceMetrics['avg_score'] ?? 0);

    $overallScore = (
        $engagementScore * 0.3 +
        $completionScore * 0.25 +
        $qualityScore * 0.25 +
        $performanceScore * 0.2
    );

    // Build response
    return [
        'teacher' => [
            'id' => $teacher['id'],
            'name' => $teacher['firstname'] . ' ' . $teacher['lastname'],
            'email' => $teacher['email']
        ],
        'engagement' => [
            'total_students' => (int)($engagementMetrics['total_students'] ?? 0),
            'active_students' => (int)($engagementMetrics['active_students'] ?? 0),
            'engagement_rate' => round($engagementScore, 2),
            'vs_tenant_avg' => round($engagementScore - floatval($tenantAvg['avg_engagement'] ?? 0), 2)
        ],
        'missions' => [
            'total_created' => (int)($missionMetrics['total_assignments'] ?? 0),
            'total_pushed' => (int)($missionMetrics['pushed_assignments'] ?? 0),
            'completion_rate' => round($completionScore, 2)
        ],
        'themes' => [
            'created_count' => (int)($themeMetrics['themes_created'] ?? 0),
            'avg_quality' => round($qualityScore, 2),
            'ai_issues_count' => (int)($aiIssues['issues_count'] ?? 0)
        ],
        'student_performance' => [
            'avg_score' => round(floatval($performanceMetrics['avg_score'] ?? 0), 2),
            'avg_mastery' => round(floatval($performanceMetrics['avg_mastery'] ?? 0), 2),
            'vs_tenant_avg' => round(floatval($performanceMetrics['avg_score'] ?? 0) - floatval($tenantAvg['avg_score'] ?? 0), 2)
        ],
        'overall_score' => round($overallScore, 2),
        'period' => [
            'start' => $periodStart,
            'end' => $periodEnd
        ]
    ];
}

/**
 * Get all teachers KPI summary
 */
function getAllTeachersKPI($db, $tenantId, $periodStart, $periodEnd) {
    $teachers = $db->query(
        "SELECT id, firstname, lastname, email
         FROM users
         WHERE tenant_id = :tenant_id
           AND role IN ('teacher', 'intervenant')
           AND status = 'active'
         ORDER BY lastname, firstname",
        ['tenant_id' => $tenantId]
    );

    $results = [];
    foreach ($teachers as $teacher) {
        $kpi = calculateTeacherKPI($db, $tenantId, $teacher['id'], $periodStart, $periodEnd);
        if ($kpi) {
            $results[] = [
                'teacher_id' => $teacher['id'],
                'teacher_name' => $teacher['firstname'] . ' ' . $teacher['lastname'],
                'overall_score' => $kpi['overall_score'],
                'active_students' => $kpi['engagement']['active_students'],
                'missions_created' => $kpi['missions']['total_created'],
                'themes_created' => $kpi['themes']['created_count']
            ];
        }
    }

    // Sort by overall_score DESC
    usort($results, function($a, $b) {
        return $b['overall_score'] <=> $a['overall_score'];
    });

    return $results;
}

/**
 * Log sync operation for observability
 */
function logSyncOperation($db, $data) {
    $id = generateId('sync');
    $db->execute(
        "INSERT INTO sync_logs (id, tenant_id, triggered_by, direction, type, status, payload, started_at, ended_at)
         VALUES (:id, :tenant_id, :triggered_by, :direction, :type, :status, :payload, NOW(), NOW())",
        [
            'id' => $id,
            'tenant_id' => $data['tenant_id'],
            'triggered_by' => $data['triggered_by'],
            'direction' => $data['direction'],
            'type' => $data['type'],
            'status' => $data['status'],
            'payload' => $data['payload']
        ]
    );
}
