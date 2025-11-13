<?php
/**
 * Sprint 11 - Content Creation Suite
 * API: Theme Preview & Testing (E11-PREVIEW)
 * Endpoints pour prévisualiser et tester les thèmes avant publication
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/_middleware_tenant.php';
require_once __DIR__ . '/_middleware_rbac.php';
require_once __DIR__ . '/../services/ThemeService.php';
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

// Initialiser les services
$db = getDBConnection();
$themeService = new ThemeService($db);
$linterService = new ThemeLinterService($db);

// Router les requêtes
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];

// Extraire le chemin après /api/preview
$pathPattern = '#^/api/preview(/.*)?$#';
if (preg_match($pathPattern, $path, $matches)) {
    $subPath = $matches[1] ?? '/';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

try {
    // ========================================================================
    // POST /api/preview/render - Prévisualiser un thème (sans sauvegarde)
    // ========================================================================
    if ($requestMethod === 'POST' && $subPath === '/render') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input)) {
            http_response_code(400);
            echo json_encode(['error' => 'Empty request body']);
            exit;
        }

        // Valider le schéma
        $validator = new SchemaValidator();
        $validation = $validator->validate($input);

        // Analyser la qualité
        $analysis = $linterService->analyzeTheme($input);

        // Générer un aperçu HTML/JSON
        $preview = generatePreview($input);

        echo json_encode([
            'success' => true,
            'preview' => $preview,
            'validation' => $validation,
            'analysis' => $analysis
        ]);
    }

    // ========================================================================
    // POST /api/preview/session/start - Démarrer une session de test
    // ========================================================================
    elseif ($requestMethod === 'POST' && $subPath === '/session/start') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['theme_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing theme_id']);
            exit;
        }

        $themeId = $input['theme_id'];
        $theme = $themeService->getTheme($themeId);

        if (!$theme) {
            http_response_code(404);
            echo json_encode(['error' => 'Theme not found']);
            exit;
        }

        // Créer une session de preview
        $sessionId = 'preview_' . bin2hex(random_bytes(16));
        $sessionType = $input['session_type'] ?? 'teacher_preview';

        $stmt = $db->prepare("
            INSERT INTO theme_preview_sessions (
                id, theme_id, user_id, session_type, started_at
            ) VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->bind_param('ssss', $sessionId, $themeId, $user['id'], $sessionType);
        $stmt->execute();

        // Retourner le thème et la session
        echo json_encode([
            'success' => true,
            'session_id' => $sessionId,
            'theme' => $theme['content'],
            'metadata' => [
                'title' => $theme['title'],
                'difficulty' => $theme['difficulty'],
                'content_type' => $theme['content_type']
            ]
        ]);
    }

    // ========================================================================
    // PUT /api/preview/session/{sessionId} - Mettre à jour une session
    // ========================================================================
    elseif ($requestMethod === 'PUT' && preg_match('#^/session/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $sessionId = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);

        // Mettre à jour les réponses et le score
        $stmt = $db->prepare("
            UPDATE theme_preview_sessions
            SET answers = ?,
                score = ?,
                duration_seconds = ?,
                feedback = ?,
                completed_at = NOW()
            WHERE id = ? AND user_id = ?
        ");

        $answers = json_encode($input['answers'] ?? []);
        $score = $input['score'] ?? null;
        $duration = $input['duration_seconds'] ?? null;
        $feedback = $input['feedback'] ?? null;

        $stmt->bind_param('siisss', $answers, $score, $duration, $feedback, $sessionId, $user['id']);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Session not found or access denied']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'session_id' => $sessionId,
            'updated' => true
        ]);
    }

    // ========================================================================
    // GET /api/preview/session/{sessionId} - Récupérer une session
    // ========================================================================
    elseif ($requestMethod === 'GET' && preg_match('#^/session/([a-z0-9_\-]+)$#', $subPath, $matches)) {
        $sessionId = $matches[1];

        $stmt = $db->prepare("
            SELECT * FROM theme_preview_sessions
            WHERE id = ? AND user_id = ?
        ");
        $stmt->bind_param('ss', $sessionId, $user['id']);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            $row['answers'] = json_decode($row['answers'], true);
            echo json_encode([
                'success' => true,
                'session' => $row
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Session not found']);
        }
    }

    // ========================================================================
    // GET /api/preview/sessions - Liste des sessions de test
    // ========================================================================
    elseif ($requestMethod === 'GET' && $subPath === '/sessions') {
        $themeId = $_GET['theme_id'] ?? null;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

        $sql = "
            SELECT ps.*, t.title as theme_title
            FROM theme_preview_sessions ps
            JOIN themes t ON ps.theme_id = t.id
            WHERE ps.user_id = ?
        ";
        $params = [$user['id']];
        $types = 's';

        if ($themeId) {
            $sql .= " AND ps.theme_id = ?";
            $params[] = $themeId;
            $types .= 's';
        }

        $sql .= " ORDER BY ps.started_at DESC LIMIT ?";
        $params[] = $limit;
        $types .= 'i';

        $stmt = $db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $sessions = [];
        while ($row = $result->fetch_assoc()) {
            $row['answers'] = json_decode($row['answers'], true);
            $sessions[] = $row;
        }

        echo json_encode([
            'success' => true,
            'sessions' => $sessions,
            'count' => count($sessions)
        ]);
    }

    // ========================================================================
    // POST /api/preview/validate - Valider un thème
    // ========================================================================
    elseif ($requestMethod === 'POST' && $subPath === '/validate') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input)) {
            http_response_code(400);
            echo json_encode(['error' => 'Empty request body']);
            exit;
        }

        // Validation complète du schéma
        $validator = new SchemaValidator();
        $validation = $validator->validate($input);

        // Analyse pédagogique
        $analysis = $linterService->analyzeTheme($input);

        // Générer des suggestions
        $suggestions = $linterService->generateSuggestions($input);

        echo json_encode([
            'success' => true,
            'validation' => $validation,
            'analysis' => $analysis,
            'suggestions' => $suggestions['suggestions'],
            'overall_quality' => [
                'schema_valid' => $validation['valid'],
                'pedagogical_score' => $analysis['overall_score'],
                'warnings_count' => count($analysis['warnings']),
                'estimated_level' => $analysis['estimated_level'],
                'difficulty_consistent' => $analysis['difficulty_consistency']
            ]
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
 * Générer un aperçu du thème pour la prévisualisation
 */
function generatePreview($themeData) {
    $preview = [
        'title' => $themeData['title'] ?? 'Sans titre',
        'description' => $themeData['description'] ?? '',
        'difficulty' => $themeData['difficulty'] ?? 'intermediate',
        'content_type' => $themeData['content_type'] ?? 'complete',
        'estimated_duration' => $themeData['estimated_duration_minutes'] ?? 0,
        'elements' => []
    ];

    // Compteurs
    $preview['counts'] = [
        'questions' => count($themeData['questions'] ?? []),
        'flashcards' => count($themeData['flashcards'] ?? []),
        'fiche_sections' => count($themeData['fiche']['sections'] ?? [])
    ];

    // Questions preview
    if (!empty($themeData['questions'])) {
        foreach ($themeData['questions'] as $q) {
            $preview['elements'][] = [
                'type' => 'question',
                'id' => $q['id'],
                'text' => $q['text'],
                'choices_count' => count($q['choices']),
                'has_explanation' => !empty($q['explanation']),
                'difficulty' => $q['difficulty'] ?? 'medium',
                'points' => $q['points'] ?? 10
            ];
        }
    }

    // Flashcards preview
    if (!empty($themeData['flashcards'])) {
        foreach ($themeData['flashcards'] as $f) {
            $preview['elements'][] = [
                'type' => 'flashcard',
                'id' => $f['id'],
                'front' => $f['front'],
                'back_length' => strlen($f['back']),
                'difficulty' => $f['difficulty'] ?? 'medium'
            ];
        }
    }

    // Fiche preview
    if (!empty($themeData['fiche'])) {
        $preview['fiche'] = [
            'summary' => $themeData['fiche']['summary'] ?? '',
            'sections_count' => count($themeData['fiche']['sections'] ?? []),
            'has_references' => !empty($themeData['fiche']['references'])
        ];
    }

    return $preview;
}

function authenticateJWT() {
    // Implémentation simplifiée
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
