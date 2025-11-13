<?php
/**
 * Sprint 8: Collaborative Sessions - Real-time Polling
 * Fallback polling system (15-30s) for collaborative sessions
 * Alternative to WebSocket for shared hosting compatibility
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/util.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $db = getDB();

    // Get session_id from query params
    $sessionId = $_GET['session_id'] ?? null;
    $studentId = $_GET['student_id'] ?? null;
    $lastPoll = $_GET['last_poll'] ?? null;

    if (!$sessionId || !$studentId) {
        http_response_code(400);
        echo json_encode(['error' => 'session_id et student_id requis']);
        exit;
    }

    // Verify student is participant
    $stmt = $db->prepare("SELECT id FROM collaborative_session_participants
        WHERE session_id = ? AND student_id = ?");
    $stmt->execute([$sessionId, $studentId]);

    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Vous n\'êtes pas participant de cette session']);
        exit;
    }

    // Get session state
    $stmt = $db->prepare("SELECT
            cs.*,
            t.title as theme_title
        FROM collaborative_sessions cs
        JOIN themes t ON cs.theme_id = t.id
        WHERE cs.id = ?");

    $stmt->execute([$sessionId]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(404);
        echo json_encode(['error' => 'Session non trouvée']);
        exit;
    }

    // Get all participants with their status
    $stmt = $db->prepare("SELECT
            csp.id,
            csp.student_id,
            csp.joined_at,
            csp.score,
            csp.is_ready,
            csp.status,
            s.firstname,
            s.lastname
        FROM collaborative_session_participants csp
        JOIN students s ON csp.student_id = s.id
        WHERE csp.session_id = ?
        ORDER BY csp.joined_at ASC");

    $stmt->execute([$sessionId]);
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get updates since last poll (if timestamp provided)
    $updates = [];
    if ($lastPoll) {
        $lastPollTime = date('Y-m-d H:i:s', intval($lastPoll));

        // Check for new participants
        $stmt = $db->prepare("SELECT
                csp.student_id,
                s.firstname,
                s.lastname,
                csp.joined_at
            FROM collaborative_session_participants csp
            JOIN students s ON csp.student_id = s.id
            WHERE csp.session_id = ? AND csp.joined_at > ?");

        $stmt->execute([$sessionId, $lastPollTime]);
        $newParticipants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($newParticipants) > 0) {
            $updates[] = [
                'type' => 'new_participants',
                'data' => $newParticipants
            ];
        }

        // Check if session status changed
        if ($session['updated_at'] > $lastPollTime) {
            $updates[] = [
                'type' => 'session_status_change',
                'data' => [
                    'status' => $session['status'],
                    'start_time' => $session['start_time']
                ]
            ];
        }

        // Check for ready status changes
        $stmt = $db->prepare("SELECT
                student_id,
                is_ready
            FROM collaborative_session_participants
            WHERE session_id = ? AND updated_at > ?");

        $stmt->execute([$sessionId, $lastPollTime]);
        $readyUpdates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($readyUpdates) > 0) {
            $updates[] = [
                'type' => 'ready_status_change',
                'data' => $readyUpdates
            ];
        }
    }

    // Prepare response
    $response = [
        'success' => true,
        'timestamp' => time(),
        'session' => [
            'id' => $session['id'],
            'code' => $session['session_code'],
            'title' => $session['title'],
            'theme_title' => $session['theme_title'],
            'status' => $session['status'],
            'start_time' => $session['start_time'],
            'end_time' => $session['end_time'],
            'duration_minutes' => $session['duration_minutes'],
            'current_participants' => $session['current_participants'],
            'max_participants' => $session['max_participants'],
            'collective_score' => floatval($session['collective_score']),
            'questions' => json_decode($session['questions'], true),
            'settings' => json_decode($session['settings'], true)
        ],
        'participants' => $participants,
        'updates' => $updates,
        'participant_count' => count($participants),
        'all_ready' => count(array_filter($participants, fn($p) => $p['is_ready'])) === count($participants)
    ];

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur serveur',
        'message' => $e->getMessage(),
        'timestamp' => time()
    ]);
}
