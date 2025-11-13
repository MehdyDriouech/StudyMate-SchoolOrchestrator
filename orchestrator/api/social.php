<?php
/**
 * Sprint 8: Social & Collaborative Learning API
 * Endpoints pour classements, partages, feedback, révision collective, modération
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/logger.php';

// Middleware
require_once __DIR__ . '/_middleware_tenant.php';
require_once __DIR__ . '/_middleware_rbac.php';
require_once __DIR__ . '/_middleware_rate_limit.php';
require_once __DIR__ . '/_middleware_telemetry.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Extract route after /api/social
$route = str_replace('/api/social', '', $path);

try {
    $db = getDB();

    // ============================================================
    // E8-LB: LEADERBOARD ENDPOINTS
    // ============================================================

    if ($route === '/leaderboard' && $method === 'GET') {
        // GET /api/social/leaderboard
        // Query params: theme_id, class_id, period (weekly|monthly|all_time), anonymize

        $themeId = $_GET['theme_id'] ?? null;
        $classId = $_GET['class_id'] ?? null;
        $period = $_GET['period'] ?? 'all_time';
        $anonymize = isset($_GET['anonymize']) ? filter_var($_GET['anonymize'], FILTER_VALIDATE_BOOLEAN) : false;
        $limit = min(intval($_GET['limit'] ?? 50), 100);

        // Calculate period dates
        $periodEnd = date('Y-m-d');
        $periodStart = match($period) {
            'weekly' => date('Y-m-d', strtotime('-7 days')),
            'monthly' => date('Y-m-d', strtotime('-30 days')),
            'all_time' => date('Y-m-d', strtotime('-10 years')),
            default => date('Y-m-d', strtotime('-30 days'))
        };

        $sql = "SELECT
                    le.*,
                    s.firstname,
                    s.lastname,
                    s.email_scolaire,
                    c.name as class_name,
                    t.title as theme_title
                FROM leaderboard_entries le
                JOIN students s ON le.student_id = s.id
                LEFT JOIN classes c ON le.class_id = c.id
                LEFT JOIN themes t ON le.theme_id = t.id
                WHERE le.tenant_id = ?
                AND le.period_type = ?
                AND le.period_start >= ?
                AND le.period_end <= ?";

        $params = [$TENANT_ID, $period, $periodStart, $periodEnd];

        if ($themeId) {
            $sql .= " AND le.theme_id = ?";
            $params[] = $themeId;
        }

        if ($classId) {
            $sql .= " AND le.class_id = ?";
            $params[] = $classId;
        }

        $sql .= " ORDER BY le.rank ASC LIMIT ?";
        $params[] = $limit;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Apply anonymization if requested
        if ($anonymize) {
            foreach ($entries as &$entry) {
                $entry['firstname'] = 'Étudiant';
                $entry['lastname'] = sprintf('#%03d', $entry['rank']);
                $entry['email_scolaire'] = null;
                $entry['is_anonymized'] = true;
            }
        }

        echo json_encode([
            'success' => true,
            'period' => $period,
            'theme_id' => $themeId,
            'class_id' => $classId,
            'anonymized' => $anonymize,
            'data' => $entries,
            'count' => count($entries)
        ]);

    } elseif ($route === '/leaderboard/settings' && $method === 'GET') {
        // GET /api/social/leaderboard/settings
        // Get leaderboard settings for tenant

        $stmt = $db->prepare("SELECT * FROM leaderboard_settings WHERE tenant_id = ?");
        $stmt->execute([$TENANT_ID]);
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $settings
        ]);

    } elseif ($route === '/leaderboard/settings' && $method === 'POST') {
        // POST /api/social/leaderboard/settings
        // Create/update leaderboard settings (teacher/admin only)

        requireRole(['teacher', 'admin', 'direction']);

        $input = getJsonInput();
        $id = 'LB_SET_' . uniqid();

        $stmt = $db->prepare("INSERT INTO leaderboard_settings
            (id, tenant_id, class_id, theme_id, period_type, anonymize_enabled)
            VALUES (?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $id,
            $TENANT_ID,
            $input['class_id'] ?? null,
            $input['theme_id'] ?? null,
            $input['period_type'] ?? 'all_time',
            $input['anonymize_enabled'] ?? false
        ]);

        logSyncEvent($db, $TENANT_ID, $USER_ID, 'push', 'leaderboard_settings', 'ok');

        echo json_encode([
            'success' => true,
            'id' => $id,
            'message' => 'Paramètres de classement enregistrés'
        ]);

    }

    // ============================================================
    // E8-SHARE: SHARED CONTENT ENDPOINTS
    // ============================================================

    elseif ($route === '/content/share' && $method === 'POST') {
        // POST /api/social/content/share
        // Share content created by student

        $input = getJsonInput();
        $id = 'SHARE_' . uniqid();

        $stmt = $db->prepare("INSERT INTO shared_content
            (id, tenant_id, student_id, theme_id, content_type, title, content, description, is_public, target_class_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");

        $stmt->execute([
            $id,
            $TENANT_ID,
            $input['student_id'],
            $input['theme_id'] ?? null,
            $input['content_type'],
            $input['title'],
            json_encode($input['content']),
            $input['description'] ?? null,
            $input['is_public'] ?? false,
            $input['target_class_id'] ?? null
        ]);

        // Add to moderation queue for AI check
        $queueId = 'MOD_' . uniqid();
        $stmt = $db->prepare("INSERT INTO moderation_queue
            (id, tenant_id, content_type, content_id, student_id, priority, reason, status)
            VALUES (?, ?, 'shared_content', ?, ?, 'medium', 'Auto-modération IA', 'pending')");

        $stmt->execute([$queueId, $TENANT_ID, $id, $input['student_id']]);

        logSyncEvent($db, $TENANT_ID, $input['student_id'], 'push', 'shared_content', 'ok');

        echo json_encode([
            'success' => true,
            'id' => $id,
            'message' => 'Contenu partagé (en attente de modération)'
        ]);

    } elseif (preg_match('#^/content/shared$#', $route) && $method === 'GET') {
        // GET /api/social/content/shared
        // Get shared content (approved only, unless moderator)

        $classId = $_GET['class_id'] ?? null;
        $themeId = $_GET['theme_id'] ?? null;
        $contentType = $_GET['content_type'] ?? null;
        $limit = min(intval($_GET['limit'] ?? 20), 100);

        $sql = "SELECT
                    sc.*,
                    s.firstname,
                    s.lastname,
                    t.title as theme_title
                FROM shared_content sc
                JOIN students s ON sc.student_id = s.id
                LEFT JOIN themes t ON sc.theme_id = t.id
                WHERE sc.tenant_id = ?
                AND sc.status = 'approved'";

        $params = [$TENANT_ID];

        if ($classId) {
            $sql .= " AND (sc.is_public = TRUE OR sc.target_class_id = ?)";
            $params[] = $classId;
        } else {
            $sql .= " AND sc.is_public = TRUE";
        }

        if ($themeId) {
            $sql .= " AND sc.theme_id = ?";
            $params[] = $themeId;
        }

        if ($contentType) {
            $sql .= " AND sc.content_type = ?";
            $params[] = $contentType;
        }

        $sql .= " ORDER BY sc.created_at DESC LIMIT ?";
        $params[] = $limit;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $content = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Parse JSON content field
        foreach ($content as &$item) {
            $item['content'] = json_decode($item['content'], true);
        }

        echo json_encode([
            'success' => true,
            'data' => $content,
            'count' => count($content)
        ]);

    } elseif (preg_match('#^/content/shared/([^/]+)$#', $route, $matches) && $method === 'GET') {
        // GET /api/social/content/shared/{id}
        // Get specific shared content

        $contentId = $matches[1];

        $stmt = $db->prepare("SELECT
                sc.*,
                s.firstname,
                s.lastname,
                t.title as theme_title
            FROM shared_content sc
            JOIN students s ON sc.student_id = s.id
            LEFT JOIN themes t ON sc.theme_id = t.id
            WHERE sc.id = ? AND sc.tenant_id = ?");

        $stmt->execute([$contentId, $TENANT_ID]);
        $content = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$content) {
            http_response_code(404);
            echo json_encode(['error' => 'Contenu non trouvé']);
            exit;
        }

        $content['content'] = json_decode($content['content'], true);

        // Increment views
        $stmt = $db->prepare("UPDATE shared_content SET views_count = views_count + 1 WHERE id = ?");
        $stmt->execute([$contentId]);

        echo json_encode([
            'success' => true,
            'data' => $content
        ]);

    }

    // ============================================================
    // E8-PEER: PEER COMMENTS/FEEDBACK ENDPOINTS
    // ============================================================

    elseif ($route === '/comments' && $method === 'POST') {
        // POST /api/social/comments
        // Post a comment on shared content

        $input = getJsonInput();
        $id = 'COMMENT_' . uniqid();

        $stmt = $db->prepare("INSERT INTO peer_comments
            (id, tenant_id, shared_content_id, parent_comment_id, student_id, comment_text, status)
            VALUES (?, ?, ?, ?, ?, ?, 'approved')");

        $stmt->execute([
            $id,
            $TENANT_ID,
            $input['shared_content_id'] ?? null,
            $input['parent_comment_id'] ?? null,
            $input['student_id'],
            $input['comment_text']
        ]);

        logSyncEvent($db, $TENANT_ID, $input['student_id'], 'push', 'peer_comment', 'ok');

        echo json_encode([
            'success' => true,
            'id' => $id,
            'message' => 'Commentaire publié'
        ]);

    } elseif (preg_match('#^/content/([^/]+)/comments$#', $route, $matches) && $method === 'GET') {
        // GET /api/social/content/{id}/comments
        // Get comments for shared content

        $contentId = $matches[1];
        $limit = min(intval($_GET['limit'] ?? 50), 200);

        $stmt = $db->prepare("SELECT
                pc.*,
                s.firstname,
                s.lastname
            FROM peer_comments pc
            JOIN students s ON pc.student_id = s.id
            WHERE pc.shared_content_id = ?
            AND pc.tenant_id = ?
            AND pc.status = 'approved'
            ORDER BY pc.created_at ASC
            LIMIT ?");

        $stmt->execute([$contentId, $TENANT_ID, $limit]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Build threads (nested comments)
        $commentsByParent = [];
        foreach ($comments as $comment) {
            $parentId = $comment['parent_comment_id'] ?? 'root';
            if (!isset($commentsByParent[$parentId])) {
                $commentsByParent[$parentId] = [];
            }
            $commentsByParent[$parentId][] = $comment;
        }

        echo json_encode([
            'success' => true,
            'data' => $commentsByParent['root'] ?? [],
            'threads' => $commentsByParent,
            'count' => count($comments)
        ]);

    }

    // ============================================================
    // E8-COLLAB: COLLABORATIVE SESSIONS ENDPOINTS
    // ============================================================

    elseif ($route === '/sessions/collaborative' && $method === 'POST') {
        // POST /api/social/sessions/collaborative
        // Create a collaborative study session

        $input = getJsonInput();
        $id = 'COLLAB_' . uniqid();
        $code = strtoupper(substr(md5(uniqid()), 0, 8)); // 8-char code

        $stmt = $db->prepare("INSERT INTO collaborative_sessions
            (id, tenant_id, session_code, creator_student_id, theme_id, title, description,
             max_participants, session_type, status, duration_minutes, questions, settings)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', ?, ?, ?)");

        $stmt->execute([
            $id,
            $TENANT_ID,
            $code,
            $input['creator_student_id'],
            $input['theme_id'],
            $input['title'],
            $input['description'] ?? null,
            $input['max_participants'] ?? 10,
            $input['session_type'] ?? 'study_group',
            $input['duration_minutes'] ?? 30,
            isset($input['questions']) ? json_encode($input['questions']) : null,
            isset($input['settings']) ? json_encode($input['settings']) : null
        ]);

        // Add creator as first participant
        $participantId = 'PART_' . uniqid();
        $stmt = $db->prepare("INSERT INTO collaborative_session_participants
            (id, session_id, student_id, status, is_ready)
            VALUES (?, ?, ?, 'joined', TRUE)");

        $stmt->execute([$participantId, $id, $input['creator_student_id']]);

        logSyncEvent($db, $TENANT_ID, $input['creator_student_id'], 'push', 'collaborative_session', 'ok');

        echo json_encode([
            'success' => true,
            'session_id' => $id,
            'session_code' => $code,
            'message' => 'Session créée avec succès'
        ]);

    } elseif (preg_match('#^/sessions/collaborative/join$#', $route) && $method === 'POST') {
        // POST /api/social/sessions/collaborative/join
        // Join a collaborative session with code

        $input = getJsonInput();
        $code = strtoupper($input['session_code']);
        $studentId = $input['student_id'];

        // Find session
        $stmt = $db->prepare("SELECT * FROM collaborative_sessions
            WHERE session_code = ? AND tenant_id = ? AND status IN ('waiting', 'active')");
        $stmt->execute([$code, $TENANT_ID]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            http_response_code(404);
            echo json_encode(['error' => 'Session non trouvée ou terminée']);
            exit;
        }

        // Check if already joined
        $stmt = $db->prepare("SELECT id FROM collaborative_session_participants
            WHERE session_id = ? AND student_id = ?");
        $stmt->execute([$session['id'], $studentId]);
        if ($stmt->fetch()) {
            echo json_encode([
                'success' => true,
                'session_id' => $session['id'],
                'message' => 'Déjà dans la session'
            ]);
            exit;
        }

        // Check capacity
        if ($session['current_participants'] >= $session['max_participants']) {
            http_response_code(409);
            echo json_encode(['error' => 'Session complète']);
            exit;
        }

        // Add participant
        $participantId = 'PART_' . uniqid();
        $stmt = $db->prepare("INSERT INTO collaborative_session_participants
            (id, session_id, student_id, status)
            VALUES (?, ?, ?, 'joined')");
        $stmt->execute([$participantId, $session['id'], $studentId]);

        // Update participant count
        $stmt = $db->prepare("UPDATE collaborative_sessions
            SET current_participants = current_participants + 1
            WHERE id = ?");
        $stmt->execute([$session['id']]);

        echo json_encode([
            'success' => true,
            'session_id' => $session['id'],
            'participant_id' => $participantId,
            'message' => 'Rejoint la session'
        ]);

    } elseif (preg_match('#^/sessions/collaborative/([^/]+)$#', $route, $matches) && $method === 'GET') {
        // GET /api/social/sessions/collaborative/{id}
        // Get session details and participants

        $sessionId = $matches[1];

        $stmt = $db->prepare("SELECT cs.*, t.title as theme_title, s.firstname, s.lastname
            FROM collaborative_sessions cs
            JOIN themes t ON cs.theme_id = t.id
            JOIN students s ON cs.creator_student_id = s.id
            WHERE cs.id = ? AND cs.tenant_id = ?");

        $stmt->execute([$sessionId, $TENANT_ID]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            http_response_code(404);
            echo json_encode(['error' => 'Session non trouvée']);
            exit;
        }

        // Get participants
        $stmt = $db->prepare("SELECT
                csp.*,
                s.firstname,
                s.lastname
            FROM collaborative_session_participants csp
            JOIN students s ON csp.student_id = s.id
            WHERE csp.session_id = ?
            ORDER BY csp.joined_at ASC");

        $stmt->execute([$sessionId]);
        $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $session['questions'] = json_decode($session['questions'], true);
        $session['settings'] = json_decode($session['settings'], true);
        $session['participants'] = $participants;

        echo json_encode([
            'success' => true,
            'data' => $session
        ]);

    } elseif (preg_match('#^/sessions/collaborative/([^/]+)/start$#', $route, $matches) && $method === 'POST') {
        // POST /api/social/sessions/collaborative/{id}/start
        // Start the collaborative session

        $sessionId = $matches[1];

        $stmt = $db->prepare("UPDATE collaborative_sessions
            SET status = 'active', start_time = NOW()
            WHERE id = ? AND tenant_id = ? AND status = 'waiting'");

        $stmt->execute([$sessionId, $TENANT_ID]);

        if ($stmt->rowCount() === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Impossible de démarrer la session']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Session démarrée'
        ]);

    }

    // ============================================================
    // E8-MOD: MODERATION ENDPOINTS
    // ============================================================

    elseif ($route === '/moderation/queue' && $method === 'GET') {
        // GET /api/social/moderation/queue
        // Get moderation queue (teachers/admins only)

        requireRole(['teacher', 'admin', 'direction']);

        $status = $_GET['status'] ?? 'pending';
        $limit = min(intval($_GET['limit'] ?? 50), 200);

        $stmt = $db->prepare("SELECT
                mq.*,
                s.firstname,
                s.lastname,
                s.email_scolaire
            FROM moderation_queue mq
            JOIN students s ON mq.student_id = s.id
            WHERE mq.tenant_id = ? AND mq.status = ?
            ORDER BY mq.priority DESC, mq.created_at ASC
            LIMIT ?");

        $stmt->execute([$TENANT_ID, $status, $limit]);
        $queue = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($queue as &$item) {
            $item['ai_flags'] = json_decode($item['ai_flags'], true);
        }

        echo json_encode([
            'success' => true,
            'data' => $queue,
            'count' => count($queue)
        ]);

    } elseif (preg_match('#^/moderation/queue/([^/]+)/approve$#', $route, $matches) && $method === 'POST') {
        // POST /api/social/moderation/queue/{id}/approve
        // Approve moderation item

        requireRole(['teacher', 'admin', 'direction']);

        $queueId = $matches[1];
        $input = getJsonInput();

        $db->beginTransaction();

        try {
            // Get queue item
            $stmt = $db->prepare("SELECT * FROM moderation_queue WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$queueId, $TENANT_ID]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$item) {
                throw new Exception('Item non trouvé');
            }

            // Update content status
            if ($item['content_type'] === 'shared_content') {
                $stmt = $db->prepare("UPDATE shared_content
                    SET status = 'approved', moderated_at = NOW(), moderated_by = ?
                    WHERE id = ?");
                $stmt->execute([$USER_ID, $item['content_id']]);
            } elseif ($item['content_type'] === 'peer_comment') {
                $stmt = $db->prepare("UPDATE peer_comments
                    SET status = 'approved', moderated_at = NOW(), moderated_by = ?
                    WHERE id = ?");
                $stmt->execute([$USER_ID, $item['content_id']]);
            }

            // Update queue
            $stmt = $db->prepare("UPDATE moderation_queue SET status = 'approved' WHERE id = ?");
            $stmt->execute([$queueId]);

            // Log action
            $actionId = 'MODACT_' . uniqid();
            $stmt = $db->prepare("INSERT INTO moderation_actions
                (id, queue_id, moderator_id, action, reason, notes)
                VALUES (?, ?, ?, 'approve', ?, ?)");
            $stmt->execute([
                $actionId,
                $queueId,
                $USER_ID,
                $input['reason'] ?? 'Approuvé',
                $input['notes'] ?? null
            ]);

            $db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Contenu approuvé'
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

    } elseif (preg_match('#^/moderation/queue/([^/]+)/reject$#', $route, $matches) && $method === 'POST') {
        // POST /api/social/moderation/queue/{id}/reject
        // Reject moderation item

        requireRole(['teacher', 'admin', 'direction']);

        $queueId = $matches[1];
        $input = getJsonInput();

        $db->beginTransaction();

        try {
            // Get queue item
            $stmt = $db->prepare("SELECT * FROM moderation_queue WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$queueId, $TENANT_ID]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$item) {
                throw new Exception('Item non trouvé');
            }

            // Update content status
            if ($item['content_type'] === 'shared_content') {
                $stmt = $db->prepare("UPDATE shared_content
                    SET status = 'rejected', moderated_at = NOW(), moderated_by = ?
                    WHERE id = ?");
                $stmt->execute([$USER_ID, $item['content_id']]);
            } elseif ($item['content_type'] === 'peer_comment') {
                $stmt = $db->prepare("UPDATE peer_comments
                    SET status = 'rejected', moderated_at = NOW(), moderated_by = ?
                    WHERE id = ?");
                $stmt->execute([$USER_ID, $item['content_id']]);
            }

            // Update queue
            $stmt = $db->prepare("UPDATE moderation_queue SET status = 'rejected' WHERE id = ?");
            $stmt->execute([$queueId]);

            // Log action
            $actionId = 'MODACT_' . uniqid();
            $stmt = $db->prepare("INSERT INTO moderation_actions
                (id, queue_id, moderator_id, action, reason, notes)
                VALUES (?, ?, ?, 'reject', ?, ?)");
            $stmt->execute([
                $actionId,
                $queueId,
                $USER_ID,
                $input['reason'] ?? 'Rejeté',
                $input['notes'] ?? null
            ]);

            $db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Contenu rejeté'
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

    }

    // ============================================================
    // 404 - Route not found
    // ============================================================

    else {
        http_response_code(404);
        echo json_encode([
            'error' => 'Endpoint non trouvé',
            'path' => $route,
            'method' => $method
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur serveur',
        'message' => $e->getMessage(),
        'timestamp' => date('c')
    ]);

    logError($e->getMessage(), ['route' => $route, 'method' => $method]);
}

/**
 * Helper: Require specific role
 */
function requireRole(array $allowedRoles) {
    global $USER_ROLE;
    if (!in_array($USER_ROLE, $allowedRoles)) {
        http_response_code(403);
        echo json_encode([
            'error' => 'Accès refusé',
            'required_role' => $allowedRoles,
            'your_role' => $USER_ROLE
        ]);
        exit;
    }
}
