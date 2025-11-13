<?php
/**
 * Sprint 8: Collaborative Sessions - Update State
 * POST updates for collaborative sessions (ready status, answers, etc.)
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/util.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $db = getDB();
    $input = getJsonInput();

    $sessionId = $input['session_id'] ?? null;
    $studentId = $input['student_id'] ?? null;
    $updateType = $input['update_type'] ?? null;

    if (!$sessionId || !$studentId || !$updateType) {
        http_response_code(400);
        echo json_encode(['error' => 'session_id, student_id et update_type requis']);
        exit;
    }

    // Verify student is participant
    $stmt = $db->prepare("SELECT id FROM collaborative_session_participants
        WHERE session_id = ? AND student_id = ?");
    $stmt->execute([$sessionId, $studentId]);
    $participant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$participant) {
        http_response_code(403);
        echo json_encode(['error' => 'Vous n\'êtes pas participant de cette session']);
        exit;
    }

    $response = ['success' => true];

    switch ($updateType) {
        case 'ready':
            // Mark participant as ready
            $isReady = $input['is_ready'] ?? true;
            $stmt = $db->prepare("UPDATE collaborative_session_participants
                SET is_ready = ?, updated_at = NOW()
                WHERE id = ?");
            $stmt->execute([$isReady, $participant['id']]);

            $response['message'] = $isReady ? 'Marqué comme prêt' : 'Marqué comme non prêt';
            break;

        case 'answer':
            // Submit answer to question
            $questionIndex = $input['question_index'] ?? null;
            $answer = $input['answer'] ?? null;

            if ($questionIndex === null || $answer === null) {
                http_response_code(400);
                echo json_encode(['error' => 'question_index et answer requis']);
                exit;
            }

            // Get current answers
            $stmt = $db->prepare("SELECT answers FROM collaborative_session_participants WHERE id = ?");
            $stmt->execute([$participant['id']]);
            $currentAnswers = json_decode($stmt->fetchColumn(), true) ?? [];

            // Add new answer
            $currentAnswers[$questionIndex] = [
                'answer' => $answer,
                'timestamp' => date('c')
            ];

            // Update
            $stmt = $db->prepare("UPDATE collaborative_session_participants
                SET answers = ?, updated_at = NOW()
                WHERE id = ?");
            $stmt->execute([json_encode($currentAnswers), $participant['id']]);

            $response['message'] = 'Réponse enregistrée';
            break;

        case 'score':
            // Update participant score
            $score = floatval($input['score'] ?? 0);
            $stmt = $db->prepare("UPDATE collaborative_session_participants
                SET score = ?, updated_at = NOW()
                WHERE id = ?");
            $stmt->execute([$score, $participant['id']]);

            // Update collective score
            $stmt = $db->prepare("SELECT AVG(score) as avg_score
                FROM collaborative_session_participants
                WHERE session_id = ?");
            $stmt->execute([$sessionId]);
            $avgScore = floatval($stmt->fetchColumn());

            $stmt = $db->prepare("UPDATE collaborative_sessions
                SET collective_score = ?
                WHERE id = ?");
            $stmt->execute([$avgScore, $sessionId]);

            $response['message'] = 'Score mis à jour';
            $response['collective_score'] = $avgScore;
            break;

        case 'leave':
            // Leave session
            $stmt = $db->prepare("UPDATE collaborative_session_participants
                SET status = 'disconnected', left_at = NOW()
                WHERE id = ?");
            $stmt->execute([$participant['id']]);

            // Decrement participant count
            $stmt = $db->prepare("UPDATE collaborative_sessions
                SET current_participants = GREATEST(0, current_participants - 1)
                WHERE id = ?");
            $stmt->execute([$sessionId]);

            $response['message'] = 'Session quittée';
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'update_type invalide']);
            exit;
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur serveur',
        'message' => $e->getMessage()
    ]);
}
