<?php
/**
 * API IA - Génération de contenu pédagogique
 *
 * POST /api/ai/theme-from-text  - Générer un thème depuis du texte
 * POST /api/ai/theme-from-pdf   - Générer un thème depuis un PDF (TODO)
 * GET  /api/ai/generations      - Liste des générations
 * GET  /api/ai/generations/{id} - Détails d'une génération
 */

require_once __DIR__ . '/../.env.php';
require_once __DIR__ . '/../lib/ai_service.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$start = microtime(true);
$uri = $_SERVER['REQUEST_URI'];

// Parser l'URI
$path = parse_url($uri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = $pathParts[3] ?? null; // /api/ai/{action}
$generationId = $pathParts[4] ?? null;

// ============================================================
// POST /api/ai/theme-from-text - Générer depuis du texte
// ============================================================
if ($method === 'POST' && $action === 'theme-from-text') {
    $auth = requireAuth();
    $tenantId = $auth->getTenantId();
    $user = $auth->getUser();
    $userId = $user['user_id'] ?? null;

    if (!$userId) {
        errorResponse('UNAUTHORIZED', 'User ID not found', 401);
    }

    $body = getRequestBody();

    // Validation
    validateRequired($body, ['text']);

    $text = $body['text'];
    $options = [
        'type' => $body['type'] ?? 'theme',
        'difficulty' => $body['difficulty'] ?? 'intermediate'
    ];

    // Valider le type
    if (!in_array($options['type'], ['theme', 'quiz', 'flashcards', 'fiche'])) {
        errorResponse('VALIDATION_ERROR', 'Invalid type', 400);
    }

    // Valider la difficulté
    if (!in_array($options['difficulty'], ['beginner', 'intermediate', 'advanced'])) {
        errorResponse('VALIDATION_ERROR', 'Invalid difficulty', 400);
    }

    // Récupérer la clé API Mistral du tenant (BYOK)
    $apiKey = null;
    $apiKeyRecord = db()->queryOne(
        'SELECT key_encrypted FROM api_keys
         WHERE tenant_id = :tenant_id AND user_id = :user_id AND provider = \'mistral\' AND status = \'active\'
         ORDER BY created_at DESC
         LIMIT 1',
        ['tenant_id' => $tenantId, 'user_id' => $userId]
    );

    if ($apiKeyRecord) {
        // TODO: Déchiffrer la clé
        // Pour l'instant, on suppose que la clé est stockée en clair (à améliorer)
        $apiKey = $apiKeyRecord['key_encrypted'];
    }

    try {
        $aiService = new AIService($apiKey);
        $result = $aiService->generateThemeFromText($text, $userId, $tenantId, $options);

        $duration = (microtime(true) - $start) * 1000;
        logger()->logRequest('/api/ai/theme-from-text', 200, $duration);

        jsonResponse($result, 200);

    } catch (Exception $e) {
        logError('AI generation failed', [
            'error' => $e->getMessage(),
            'tenant_id' => $tenantId
        ]);

        $duration = (microtime(true) - $start) * 1000;
        logger()->logRequest('/api/ai/theme-from-text', 500, $duration);

        errorResponse('AI_ERROR', $e->getMessage(), 500);
    }
}

// ============================================================
// POST /api/ai/theme-from-pdf - Générer depuis un PDF
// ============================================================
if ($method === 'POST' && $action === 'theme-from-pdf') {
    $auth = requireAuth();
    $tenantId = $auth->getTenantId();
    $user = $auth->getUser();
    $userId = $user['user_id'] ?? null;

    if (!$userId) {
        errorResponse('UNAUTHORIZED', 'User ID not found', 401);
    }

    // Vérifier qu'un fichier a été uploadé
    if (!isset($_FILES['pdf']) || $_FILES['pdf']['error'] !== UPLOAD_ERR_OK) {
        errorResponse('VALIDATION_ERROR', 'No PDF file uploaded', 400);
    }

    $file = $_FILES['pdf'];

    // Valider le type MIME
    $allowedTypes = ['application/pdf'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        errorResponse('VALIDATION_ERROR', 'Invalid file type. Only PDF allowed.', 400);
    }

    // Valider la taille (max 10 MB)
    $maxSize = 10 * 1024 * 1024; // 10 MB
    if ($file['size'] > $maxSize) {
        errorResponse('VALIDATION_ERROR', 'File too large. Max 10MB.', 400);
    }

    try {
        // Créer le répertoire uploads si nécessaire
        $uploadsDir = dirname(__DIR__) . '/uploads/pdf';
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }

        // Déplacer le fichier uploadé
        $filename = $userId . '_' . time() . '_' . basename($file['name']);
        $filepath = $uploadsDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            throw new Exception('Failed to move uploaded file');
        }

        // Extraire le texte du PDF (nécessite pdftotext ou une bibliothèque)
        // Pour l'instant, on retourne une erreur "non implémenté"
        errorResponse('NOT_IMPLEMENTED', 'PDF parsing not yet implemented. Use theme-from-text with extracted text.', 501);

        // TODO: Implémenter l'extraction de texte depuis PDF
        // $text = extractTextFromPDF($filepath);
        // $aiService = new AIService($apiKey);
        // $result = $aiService->generateThemeFromText($text, $userId, $tenantId, $options);

    } catch (Exception $e) {
        logError('PDF upload failed', [
            'error' => $e->getMessage(),
            'tenant_id' => $tenantId
        ]);

        errorResponse('SERVER_ERROR', $e->getMessage(), 500);
    }
}

// ============================================================
// GET /api/ai/generations - Liste des générations
// ============================================================
if ($method === 'GET' && $action === 'generations' && !$generationId) {
    $auth = requireAuth();
    $tenantId = $auth->getTenantId();

    $limit = intval($_GET['limit'] ?? 50);
    $offset = intval($_GET['offset'] ?? 0);
    $status = $_GET['status'] ?? null;
    $validationStatus = $_GET['validation_status'] ?? null;

    // Construire la requête
    $where = ['tenant_id = :tenant_id'];
    $params = ['tenant_id' => $tenantId];

    if ($status) {
        $where[] = 'status = :status';
        $params['status'] = $status;
    }

    if ($validationStatus) {
        $where[] = 'validation_status = :validation_status';
        $params['validation_status'] = $validationStatus;
    }

    $sql = "SELECT g.*,
                   CONCAT(u.firstname, ' ', u.lastname) as user_name,
                   t.title as theme_title
            FROM ai_generations g
            JOIN users u ON g.user_id = u.id
            LEFT JOIN themes t ON g.theme_id = t.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY g.created_at DESC
            LIMIT :limit OFFSET :offset";

    $params['limit'] = $limit;
    $params['offset'] = $offset;

    $stmt = db()->getPdo()->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(":$key", $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stmt->execute();
    $generations = $stmt->fetchAll();

    // Compter le total
    $whereClause = implode(' AND ', $where);
    $countSql = "SELECT COUNT(*) as total FROM ai_generations WHERE $whereClause";
    $countStmt = db()->getPdo()->prepare($countSql);
    foreach ($params as $key => $value) {
        if ($key !== 'limit' && $key !== 'offset') {
            $countStmt->bindValue(":$key", $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
    }
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];

    $duration = (microtime(true) - $start) * 1000;
    logger()->logRequest('/api/ai/generations', 200, $duration);

    jsonResponse([
        'generations' => $generations,
        'pagination' => [
            'total' => (int)$total,
            'limit' => $limit,
            'offset' => $offset
        ]
    ]);
}

// ============================================================
// GET /api/ai/generations/{id} - Détails d'une génération
// ============================================================
if ($method === 'GET' && $action === 'generations' && $generationId) {
    $auth = requireAuth();
    $tenantId = $auth->getTenantId();

    $generation = db()->queryOne(
        'SELECT g.*,
                CONCAT(u.firstname, \' \', u.lastname) as user_name,
                t.title as theme_title,
                t.status as theme_status
         FROM ai_generations g
         JOIN users u ON g.user_id = u.id
         LEFT JOIN themes t ON g.theme_id = t.id
         WHERE g.id = :id AND g.tenant_id = :tenant_id',
        ['id' => $generationId, 'tenant_id' => $tenantId]
    );

    if (!$generation) {
        errorResponse('NOT_FOUND', 'Generation not found', 404);
    }

    // Décoder le JSON
    if ($generation['result_json']) {
        $generation['result'] = json_decode($generation['result_json'], true);
        unset($generation['result_json']);
    }

    if ($generation['validation_errors']) {
        $generation['validation_errors'] = json_decode($generation['validation_errors'], true);
    }

    $duration = (microtime(true) - $start) * 1000;
    logger()->logRequest('/api/ai/generations/' . $generationId, 200, $duration);

    jsonResponse($generation);
}

errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
