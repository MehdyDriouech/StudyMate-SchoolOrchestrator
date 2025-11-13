<?php
/**
 * Sprint 11 - Content Creation Suite
 * API: AI Improvement (E11-IA-REWRITE)
 * Endpoints pour améliorer les éléments de thèmes via IA
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/_middleware_tenant.php';
require_once __DIR__ . '/_middleware_rbac.php';
require_once __DIR__ . '/../services/ThemeLinterService.php';

// Récupération du tenant
$tenantId = getTenantFromRequest();
if (!$tenantId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing tenant_id']);
    exit;
}

// Vérification de l'authentification
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
$linterService = new ThemeLinterService($db);

// Router les requêtes
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];

// Extraire le chemin après /api/improve
$pathPattern = '#^/api/improve(/.*)?$#';
if (preg_match($pathPattern, $path, $matches)) {
    $subPath = $matches[1] ?? '/';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

try {
    // ========================================================================
    // POST /api/improve/element - Améliorer un élément spécifique
    // ========================================================================
    if ($requestMethod === 'POST' && $subPath === '/element') {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validation des paramètres requis
        $required = ['element_type', 'element_id', 'original_text', 'action'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Missing required field: {$field}"]);
                exit;
            }
        }

        // Appeler le service d'amélioration IA
        $result = $linterService->improveElement(
            $input['element_type'],
            $input['element_id'],
            $input['original_text'],
            $input['action'],
            $input['context'] ?? []
        );

        if ($result['success']) {
            // Logger l'amélioration
            logImprovement($db, $user['id'], $input, $result);

            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    }

    // ========================================================================
    // POST /api/improve/batch - Améliorer plusieurs éléments
    // ========================================================================
    elseif ($requestMethod === 'POST' && $subPath === '/batch') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['elements']) || !is_array($input['elements'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing or invalid elements array']);
            exit;
        }

        $results = [];
        $successCount = 0;
        $failureCount = 0;

        foreach ($input['elements'] as $element) {
            $result = $linterService->improveElement(
                $element['element_type'],
                $element['element_id'],
                $element['original_text'],
                $element['action'],
                $element['context'] ?? []
            );

            $results[] = [
                'element_id' => $element['element_id'],
                'result' => $result
            ];

            if ($result['success']) {
                $successCount++;
                logImprovement($db, $user['id'], $element, $result);
            } else {
                $failureCount++;
            }
        }

        echo json_encode([
            'success' => true,
            'total' => count($input['elements']),
            'succeeded' => $successCount,
            'failed' => $failureCount,
            'results' => $results
        ]);
    }

    // ========================================================================
    // POST /api/improve/question - Améliorer une question entière
    // ========================================================================
    elseif ($requestMethod === 'POST' && $subPath === '/question') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['question'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing question object']);
            exit;
        }

        $question = $input['question'];
        $action = $input['action'] ?? 'clarify';

        // Améliorer le texte de la question
        $questionResult = $linterService->improveElement(
            'question',
            $question['id'],
            $question['text'],
            $action
        );

        // Améliorer l'explication si demandé
        $explanationResult = null;
        if (!empty($input['improve_explanation']) && !empty($question['explanation'])) {
            $explanationResult = $linterService->improveElement(
                'explanation',
                $question['id'],
                $question['explanation'],
                'clarify'
            );
        }

        // Améliorer les distracteurs si demandé
        $choicesResults = [];
        if (!empty($input['improve_choices']) && !empty($question['choices'])) {
            foreach ($question['choices'] as $index => $choice) {
                if ($index !== $question['correctAnswer']) {
                    $choiceResult = $linterService->improveElement(
                        'choice',
                        $question['id'] . '_choice_' . $index,
                        $choice,
                        'clarify',
                        ['question_text' => $question['text']]
                    );
                    $choicesResults[$index] = $choiceResult;
                }
            }
        }

        echo json_encode([
            'success' => true,
            'question_id' => $question['id'],
            'improvements' => [
                'question_text' => $questionResult,
                'explanation' => $explanationResult,
                'choices' => $choicesResults
            ]
        ]);
    }

    // ========================================================================
    // POST /api/improve/flashcard - Améliorer une flashcard
    // ========================================================================
    elseif ($requestMethod === 'POST' && $subPath === '/flashcard') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['flashcard'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing flashcard object']);
            exit;
        }

        $flashcard = $input['flashcard'];
        $action = $input['action'] ?? 'clarify';

        // Améliorer le recto
        $frontResult = $linterService->improveElement(
            'flashcard',
            $flashcard['id'] . '_front',
            $flashcard['front'],
            $action
        );

        // Améliorer le verso
        $backResult = $linterService->improveElement(
            'flashcard',
            $flashcard['id'] . '_back',
            $flashcard['back'],
            $action,
            ['front_text' => $flashcard['front']]
        );

        echo json_encode([
            'success' => true,
            'flashcard_id' => $flashcard['id'],
            'improvements' => [
                'front' => $frontResult,
                'back' => $backResult
            ]
        ]);
    }

    // ========================================================================
    // POST /api/improve/generate-explanation - Générer une explication manquante
    // ========================================================================
    elseif ($requestMethod === 'POST' && $subPath === '/generate-explanation') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['question_text']) || !isset($input['correct_answer'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing question_text or correct_answer']);
            exit;
        }

        // Utiliser l'IA pour générer une explication
        $context = [
            'question' => $input['question_text'],
            'choices' => $input['choices'] ?? [],
            'correct_answer' => $input['correct_answer']
        ];

        $correctChoice = $context['choices'][$context['correct_answer']] ?? 'la réponse correcte';
        $prompt = "Question: {$context['question']}\nRéponse correcte: {$correctChoice}\n\nGénère une explication pédagogique claire expliquant pourquoi cette réponse est correcte.";

        $result = $linterService->improveElement(
            'explanation',
            $input['question_id'] ?? 'q_temp',
            $prompt,
            'expand',
            $context
        );

        echo json_encode($result);
    }

    // ========================================================================
    // GET /api/improve/history - Historique des améliorations
    // ========================================================================
    elseif ($requestMethod === 'GET' && $subPath === '/history') {
        $themeId = $_GET['theme_id'] ?? null;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

        $sql = "
            SELECT * FROM ai_improvements
            WHERE user_id = ?
        ";
        $params = [$user['id']];
        $types = 's';

        if ($themeId) {
            $sql .= " AND theme_id = ?";
            $params[] = $themeId;
            $types .= 's';
        }

        $sql .= " ORDER BY created_at DESC LIMIT ?";
        $params[] = $limit;
        $types .= 'i';

        $stmt = $db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $improvements = [];
        while ($row = $result->fetch_assoc()) {
            $improvements[] = $row;
        }

        echo json_encode([
            'success' => true,
            'improvements' => $improvements,
            'count' => count($improvements)
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

/**
 * Logger une amélioration IA dans la base de données
 */
function logImprovement($db, $userId, $input, $result) {
    $logId = 'improve_' . bin2hex(random_bytes(16));

    $stmt = $db->prepare("
        INSERT INTO ai_improvements (
            id, user_id, theme_id, element_type, element_id,
            action, original_text, improved_text, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $themeId = $input['theme_id'] ?? null;
    $elementType = $input['element_type'];
    $elementId = $input['element_id'];
    $action = $input['action'];
    $originalText = $input['original_text'];
    $improvedText = $result['improved_text'] ?? '';

    $stmt->bind_param(
        'ssssssss',
        $logId,
        $userId,
        $themeId,
        $elementType,
        $elementId,
        $action,
        $originalText,
        $improvedText
    );

    $stmt->execute();
}

function authenticateJWT() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }

    $token = $matches[1];

    return [
        'id' => 'user_' . substr(md5($token), 0, 8),
        'role' => 'teacher',
        'name' => 'Test Teacher'
    ];
}
