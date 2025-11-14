<?php
/**
 * GET /api/analytics/risk - Student Risk Detection Dashboard
 *
 * Sprint 16: Risk Analytics for Students
 * Detects students at risk based on delays, abandonment, low scores, etc.
 * Returns risk scores, heatmap data, and AI remediation recommendations
 * Requires referent, direction, admin, or teacher role
 */

require_once __DIR__ . '/../../.env.php';
require_once __DIR__ . '/../_middleware_telemetry.php';
require_once __DIR__ . '/../_middleware_tenant.php';
require_once __DIR__ . '/../_middleware_rbac.php';
require_once __DIR__ . '/../../lib/util.php';
require_once __DIR__ . '/../../lib/ai_service.php';

setCorsHeaders();

$telemetry = startTelemetry();
$method = $_SERVER['REQUEST_METHOD'];

// Support GET and POST methods
if (!in_array($method, ['GET', 'POST'])) {
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

    // POST: Update risk status or add notes
    if ($method === 'POST') {
        requireAnyPermission($rbac, 'analytics', ['read']);

        $body = getJsonBody();
        $riskId = $body['risk_id'] ?? null;
        $status = $body['status'] ?? null;
        $notes = $body['notes'] ?? null;

        if (!$riskId) {
            $telemetry->end(400);
            errorResponse('INVALID_INPUT', 'risk_id is required', 400);
        }

        // Update risk record
        $db->execute(
            "UPDATE risk_student
             SET status = COALESCE(:status, status),
                 notes = COALESCE(:notes, notes),
                 reviewed_at = NOW(),
                 reviewed_by = :reviewed_by,
                 updated_at = NOW()
             WHERE id = :risk_id AND tenant_id = :tenant_id",
            [
                'risk_id' => $riskId,
                'tenant_id' => $tenantId,
                'status' => $status,
                'notes' => $notes,
                'reviewed_by' => $currentUser['id']
            ]
        );

        logInfo("Risk status updated", [
            'risk_id' => $riskId,
            'status' => $status,
            'reviewed_by' => $currentUser['id']
        ]);

        $telemetry->end(200);
        jsonResponse([
            'success' => true,
            'message' => 'Risk status updated',
            'risk_id' => $riskId
        ]);
    }

    // GET: Retrieve risk data
    requireAnyPermission($rbac, 'analytics', ['read', 'export']);

    // Get query parameters
    $classId = $_GET['class_id'] ?? null;
    $riskLevel = $_GET['risk_level'] ?? null; // low, medium, high, critical
    $status = $_GET['status'] ?? 'detected'; // detected, in_review, remediation_planned, resolved
    $recalculate = isset($_GET['recalculate']) && $_GET['recalculate'] === 'true';

    // Recalculate risks if requested
    if ($recalculate) {
        $rbac->requirePermission('analytics', 'read');
        recalculateAllRisks($db, $tenantId, $classId);
        logInfo("Risk recalculation triggered", [
            'tenant_id' => $tenantId,
            'class_id' => $classId,
            'triggered_by' => $currentUser['id']
        ]);
    }

    // Build WHERE clause
    $whereConditions = ["r.tenant_id = :tenant_id"];
    $params = ['tenant_id' => $tenantId];

    // Teacher ownership: teachers can only see their own classes
    if ($currentUser['role'] === 'teacher') {
        $whereConditions[] = "c.teacher_id = :teacher_id";
        $params['teacher_id'] = $currentUser['id'];
    }

    if ($classId) {
        $whereConditions[] = "r.class_id = :class_id";
        $params['class_id'] = $classId;
    }

    if ($riskLevel) {
        $whereConditions[] = "r.risk_level = :risk_level";
        $params['risk_level'] = $riskLevel;
    }

    if ($status) {
        $whereConditions[] = "r.status = :status";
        $params['status'] = $status;
    }

    $whereClause = implode(' AND ', $whereConditions);

    // Get risk students
    $riskStudents = $db->query(
        "SELECT
            r.*,
            s.uuid_scolaire,
            s.firstname,
            s.lastname,
            c.name as class_name,
            c.id as class_id
         FROM risk_student r
         INNER JOIN students s ON s.id = r.student_id
         INNER JOIN classes c ON c.id = r.class_id
         WHERE {$whereClause}
         ORDER BY r.risk_score DESC, r.detected_at DESC
         LIMIT 100",
        $params
    );

    // Get heatmap data (risk distribution by class)
    $heatmapData = $db->query(
        "SELECT
            c.id as class_id,
            c.name as class_name,
            COUNT(DISTINCT s.id) as total_students,
            COUNT(DISTINCT r.id) as students_at_risk,
            COUNT(DISTINCT CASE WHEN r.risk_level = 'critical' THEN r.id END) as critical_count,
            COUNT(DISTINCT CASE WHEN r.risk_level = 'high' THEN r.id END) as high_count,
            COUNT(DISTINCT CASE WHEN r.risk_level = 'medium' THEN r.id END) as medium_count,
            COUNT(DISTINCT CASE WHEN r.risk_level = 'low' THEN r.id END) as low_count,
            AVG(r.risk_score) as avg_risk_score
         FROM classes c
         LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
         LEFT JOIN risk_student r ON r.student_id = s.id AND r.status IN ('detected', 'in_review', 'remediation_planned')
         WHERE c.tenant_id = :tenant_id
           " . ($currentUser['role'] === 'teacher' ? "AND c.teacher_id = :teacher_id" : "") . "
         GROUP BY c.id, c.name
         ORDER BY avg_risk_score DESC",
        $params
    );

    // Format risk students with AI recommendations
    $formattedRisks = array_map(function($risk) {
        return [
            'id' => $risk['id'],
            'student' => [
                'id' => $risk['student_id'],
                'uuid' => $risk['uuid_scolaire'],
                'name' => ($risk['firstname'] ?? '') . ' ' . ($risk['lastname'] ?? ''),
                'class_id' => $risk['class_id'],
                'class_name' => $risk['class_name']
            ],
            'risk' => [
                'score' => floatval($risk['risk_score']),
                'level' => $risk['risk_level'],
                'factors' => [
                    'delay' => floatval($risk['delay_score']),
                    'abandonment' => floatval($risk['abandonment_score']),
                    'low_performance' => floatval($risk['low_performance_score']),
                    'time_inefficiency' => floatval($risk['time_inefficiency_score']),
                    'engagement_drop' => floatval($risk['engagement_drop_score'])
                ]
            ],
            'metrics' => [
                'missions_late' => (int)$risk['missions_late_count'],
                'missions_abandoned' => (int)$risk['missions_abandoned_count'],
                'avg_score' => floatval($risk['avg_score']),
                'avg_time_minutes' => (int)$risk['avg_time_spent_minutes'],
                'last_activity_days_ago' => (int)$risk['last_activity_days_ago']
            ],
            'recommendations' => json_decode($risk['ai_recommendations'] ?? '[]', true),
            'priority' => (int)$risk['priority'],
            'status' => $risk['status'],
            'reviewed_at' => $risk['reviewed_at'],
            'reviewed_by' => $risk['reviewed_by'],
            'notes' => $risk['notes'],
            'detected_at' => $risk['detected_at']
        ];
    }, $riskStudents);

    // Format heatmap
    $formattedHeatmap = array_map(function($class) {
        $riskRate = $class['total_students'] > 0
            ? ($class['students_at_risk'] / $class['total_students']) * 100
            : 0;

        return [
            'class_id' => $class['class_id'],
            'class_name' => $class['class_name'],
            'total_students' => (int)$class['total_students'],
            'students_at_risk' => (int)$class['students_at_risk'],
            'risk_rate' => round($riskRate, 2),
            'avg_risk_score' => round(floatval($class['avg_risk_score'] ?? 0), 2),
            'breakdown' => [
                'critical' => (int)$class['critical_count'],
                'high' => (int)$class['high_count'],
                'medium' => (int)$class['medium_count'],
                'low' => (int)$class['low_count']
            ]
        ];
    }, $heatmapData);

    $telemetry->end(200);
    jsonResponse([
        'tenant_id' => $tenantId,
        'filters' => [
            'class_id' => $classId,
            'risk_level' => $riskLevel,
            'status' => $status
        ],
        'students_at_risk' => $formattedRisks,
        'heatmap' => $formattedHeatmap,
        'summary' => [
            'total_at_risk' => count($formattedRisks),
            'critical' => count(array_filter($formattedRisks, fn($r) => $r['risk']['level'] === 'critical')),
            'high' => count(array_filter($formattedRisks, fn($r) => $r['risk']['level'] === 'high')),
            'medium' => count(array_filter($formattedRisks, fn($r) => $r['risk']['level'] === 'medium')),
            'low' => count(array_filter($formattedRisks, fn($r) => $r['risk']['level'] === 'low'))
        ],
        'generated_at' => date('c')
    ]);

} catch (Exception $e) {
    $telemetry->end(500, $e->getMessage());
    logError("Risk analytics error", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    errorResponse('INTERNAL_ERROR', $e->getMessage(), 500);
}

/**
 * Recalculate all risk scores
 */
function recalculateAllRisks($db, $tenantId, $classId = null) {
    // Get all active students
    $whereConditions = ["s.tenant_id = :tenant_id", "s.status = 'active'"];
    $params = ['tenant_id' => $tenantId];

    if ($classId) {
        $whereConditions[] = "s.class_id = :class_id";
        $params['class_id'] = $classId;
    }

    $whereClause = implode(' AND ', $whereConditions);

    $students = $db->query(
        "SELECT s.id, s.class_id FROM students s WHERE {$whereClause}",
        $params
    );

    foreach ($students as $student) {
        calculateStudentRisk($db, $tenantId, $student['id'], $student['class_id']);
    }
}

/**
 * Calculate risk score for a single student
 */
function calculateStudentRisk($db, $tenantId, $studentId, $classId) {
    // Get student stats
    $stats = $db->queryOne(
        "SELECT
            AVG(score) as avg_score,
            AVG(time_spent) as avg_time_spent,
            COUNT(*) as total_attempts,
            DATEDIFF(NOW(), MAX(last_activity_at)) as days_since_activity
         FROM stats
         WHERE student_id = :student_id AND theme_id IS NOT NULL",
        ['student_id' => $studentId]
    );

    // Get assignment metrics
    $assignments = $db->queryOne(
        "SELECT
            COUNT(*) as total_assignments,
            COUNT(CASE WHEN due_at < NOW() THEN 1 END) as late_count
         FROM assignments a
         INNER JOIN assignment_targets at ON at.assignment_id = a.id
         WHERE at.target_type = 'student' AND at.target_id = :student_id",
        ['student_id' => $studentId]
    );

    // Calculate risk factors (0-100 scale)
    $delayScore = min(100, ($assignments['late_count'] ?? 0) * 20);
    $abandonmentScore = 0; // TODO: Track abandoned sessions
    $lowPerformanceScore = max(0, 100 - floatval($stats['avg_score'] ?? 0));
    $timeInefficiencyScore = 0; // TODO: Analyze time efficiency
    $engagementDropScore = min(100, floatval($stats['days_since_activity'] ?? 0) * 5);

    // Calculate overall risk score (weighted average)
    $riskScore = (
        $delayScore * 0.25 +
        $abandonmentScore * 0.20 +
        $lowPerformanceScore * 0.30 +
        $timeInefficiencyScore * 0.10 +
        $engagementDropScore * 0.15
    );

    // Determine risk level
    if ($riskScore >= 75) {
        $riskLevel = 'critical';
        $priority = 10;
    } elseif ($riskScore >= 50) {
        $riskLevel = 'high';
        $priority = 7;
    } elseif ($riskScore >= 25) {
        $riskLevel = 'medium';
        $priority = 4;
    } else {
        $riskLevel = 'low';
        $priority = 1;
    }

    // Generate AI recommendations
    $recommendations = generateRiskRecommendations($riskScore, [
        'delay' => $delayScore,
        'low_performance' => $lowPerformanceScore,
        'engagement_drop' => $engagementDropScore
    ]);

    // Insert or update risk record
    $riskId = generateId('risk');
    $db->execute(
        "INSERT INTO risk_student (
            id, tenant_id, student_id, class_id,
            risk_score, risk_level,
            delay_score, abandonment_score, low_performance_score,
            time_inefficiency_score, engagement_drop_score,
            missions_late_count, missions_abandoned_count,
            avg_score, avg_time_spent_minutes, last_activity_days_ago,
            ai_recommendations, priority, status,
            detected_at
         ) VALUES (
            :id, :tenant_id, :student_id, :class_id,
            :risk_score, :risk_level,
            :delay_score, :abandonment_score, :low_performance_score,
            :time_inefficiency_score, :engagement_drop_score,
            :missions_late_count, :missions_abandoned_count,
            :avg_score, :avg_time_spent_minutes, :last_activity_days_ago,
            :ai_recommendations, :priority, 'detected',
            NOW()
         )
         ON DUPLICATE KEY UPDATE
            risk_score = :risk_score,
            risk_level = :risk_level,
            delay_score = :delay_score,
            abandonment_score = :abandonment_score,
            low_performance_score = :low_performance_score,
            time_inefficiency_score = :time_inefficiency_score,
            engagement_drop_score = :engagement_drop_score,
            missions_late_count = :missions_late_count,
            missions_abandoned_count = :missions_abandoned_count,
            avg_score = :avg_score,
            avg_time_spent_minutes = :avg_time_spent_minutes,
            last_activity_days_ago = :last_activity_days_ago,
            ai_recommendations = :ai_recommendations,
            priority = :priority,
            updated_at = NOW()",
        [
            'id' => $riskId,
            'tenant_id' => $tenantId,
            'student_id' => $studentId,
            'class_id' => $classId,
            'risk_score' => $riskScore,
            'risk_level' => $riskLevel,
            'delay_score' => $delayScore,
            'abandonment_score' => $abandonmentScore,
            'low_performance_score' => $lowPerformanceScore,
            'time_inefficiency_score' => $timeInefficiencyScore,
            'engagement_drop_score' => $engagementDropScore,
            'missions_late_count' => $assignments['late_count'] ?? 0,
            'missions_abandoned_count' => 0,
            'avg_score' => floatval($stats['avg_score'] ?? 0),
            'avg_time_spent_minutes' => round(floatval($stats['avg_time_spent'] ?? 0) / 60),
            'last_activity_days_ago' => (int)($stats['days_since_activity'] ?? 0),
            'ai_recommendations' => json_encode($recommendations),
            'priority' => $priority
        ]
    );
}

/**
 * Generate AI-powered remediation recommendations
 */
function generateRiskRecommendations($riskScore, $factors) {
    $recommendations = [];

    if ($factors['delay'] > 50) {
        $recommendations[] = [
            'type' => 'delay_management',
            'title' => 'Gestion du retard',
            'description' => 'L\'élève accumule des retards. Proposer un plan de rattrapage adapté.',
            'actions' => [
                'Organiser un entretien individuel',
                'Créer un planning de rattrapage personnalisé',
                'Réduire temporairement la charge de travail'
            ]
        ];
    }

    if ($factors['low_performance'] > 50) {
        $recommendations[] = [
            'type' => 'academic_support',
            'title' => 'Soutien pédagogique',
            'description' => 'Les scores sont en dessous de la moyenne. Un accompagnement est nécessaire.',
            'actions' => [
                'Proposer des séances de tutorat',
                'Réviser les concepts fondamentaux',
                'Adapter le niveau de difficulté des missions'
            ]
        ];
    }

    if ($factors['engagement_drop'] > 50) {
        $recommendations[] = [
            'type' => 'engagement_boost',
            'title' => 'Réengagement',
            'description' => 'L\'élève montre des signes de désengagement.',
            'actions' => [
                'Contacter l\'élève rapidement',
                'Identifier les blocages ou difficultés',
                'Proposer des contenus plus ludiques et variés'
            ]
        ];
    }

    if (empty($recommendations)) {
        $recommendations[] = [
            'type' => 'monitoring',
            'title' => 'Surveillance continue',
            'description' => 'Continuer à surveiller l\'évolution de l\'élève.',
            'actions' => [
                'Maintenir un suivi régulier',
                'Encourager les bonnes pratiques'
            ]
        ];
    }

    return $recommendations;
}
