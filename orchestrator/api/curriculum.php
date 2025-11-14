<?php
/**
 * API Curriculum - Sprint 18: Curriculum Builder & Séquences
 *
 * ENDPOINTS:
 * GET    /api/curriculum                           - Liste des curriculums (teacher/admin)
 * POST   /api/curriculum                           - Créer un curriculum
 * GET    /api/curriculum/{id}                      - Détails d'un curriculum
 * PATCH  /api/curriculum/{id}                      - Modifier un curriculum
 * DELETE /api/curriculum/{id}                      - Supprimer un curriculum (soft delete)
 *
 * GET    /api/curriculum/{id}/sequences            - Liste des séquences d'un curriculum
 * POST   /api/curriculum/{id}/sequences            - Créer une séquence
 * PATCH  /api/curriculum/sequence/{seq_id}         - Modifier une séquence
 * DELETE /api/curriculum/sequence/{seq_id}         - Supprimer une séquence
 * PATCH  /api/curriculum/sequence/{seq_id}/reorder - Réorganiser les séquences (drag-drop)
 *
 * POST   /api/curriculum/sequence/{seq_id}/link-assignment   - Lier une mission à une séquence
 * DELETE /api/curriculum/sequence/{seq_id}/unlink-assignment - Délier une mission
 * POST   /api/curriculum/sequence/{seq_id}/link-theme        - Lier un thème à une séquence
 * DELETE /api/curriculum/sequence/{seq_id}/unlink-theme      - Délier un thème
 *
 * GET    /api/curriculum/student/{student_uuid}    - Vue élève: progression dans le curriculum
 */

require_once __DIR__ . '/../.env.php';
require_once __DIR__ . '/_middleware_tenant.php';
require_once __DIR__ . '/_middleware_rbac.php';
require_once __DIR__ . '/_middleware_telemetry.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$start = microtime(true);
$uri = $_SERVER['REQUEST_URI'];

// Parser l'URI
$path = parse_url($uri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$curriculumId = $pathParts[3] ?? null; // /api/curriculum/{id}
$action = $pathParts[4] ?? null; // sequences, student, sequence
$subId = $pathParts[5] ?? null; // {seq_id}
$subAction = $pathParts[6] ?? null; // link-assignment, reorder

// ============================================================
// GET /api/curriculum - Liste des curriculums
// ============================================================
if ($method === 'GET' && !$curriculumId) {
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'read');

    $tenantId = $tenantContext->getTenantId();
    $limit = intval($_GET['limit'] ?? 50);
    $offset = intval($_GET['offset'] ?? 0);
    $classId = $_GET['class_id'] ?? null;
    $teacherId = $_GET['teacher_id'] ?? null;
    $status = $_GET['status'] ?? null;

    try {
        $db = getDbConnection();

        $sql = "SELECT c.*,
                       cl.name as class_name,
                       u.firstname as teacher_firstname,
                       u.lastname as teacher_lastname,
                       (SELECT COUNT(*) FROM curriculum_sequences WHERE curriculum_id = c.id) as sequence_count
                FROM curriculum c
                INNER JOIN classes cl ON c.class_id = cl.id
                INNER JOIN users u ON c.teacher_id = u.id
                WHERE c.tenant_id = ?";

        $params = [$tenantId];

        if ($classId) {
            $sql .= " AND c.class_id = ?";
            $params[] = $classId;
        }
        if ($teacherId) {
            $sql .= " AND c.teacher_id = ?";
            $params[] = $teacherId;
        }
        if ($status) {
            $sql .= " AND c.status = ?";
            $params[] = $status;
        }

        $sql .= " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Count total
        $countSql = "SELECT COUNT(*) as total FROM curriculum c WHERE c.tenant_id = ?";
        $countParams = [$tenantId];
        if ($classId) {
            $countSql .= " AND c.class_id = ?";
            $countParams[] = $classId;
        }
        if ($teacherId) {
            $countSql .= " AND c.teacher_id = ?";
            $countParams[] = $teacherId;
        }
        if ($status) {
            $countSql .= " AND c.status = ?";
            $countParams[] = $status;
        }

        $countStmt = $db->prepare($countSql);
        $countStmt->execute($countParams);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        jsonResponse([
            'success' => true,
            'data' => $results,
            'pagination' => [
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset
            ]
        ]);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// POST /api/curriculum - Créer un curriculum
// ============================================================
if ($method === 'POST' && !$curriculumId) {
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'write');

    $tenantId = $tenantContext->getTenantId();
    $data = getPostData();

    $requiredFields = ['class_id', 'title', 'year_start', 'year_end'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            jsonResponse(['success' => false, 'error' => "Missing required field: $field"], 400);
        }
    }

    try {
        $db = getDbConnection();

        $curriculumId = 'curr-' . bin2hex(random_bytes(8));
        $teacherId = $data['teacher_id'] ?? $auth->getUserId();
        $title = $data['title'];
        $description = $data['description'] ?? null;
        $classId = $data['class_id'];
        $yearStart = (int)$data['year_start'];
        $yearEnd = (int)$data['year_end'];
        $level = $data['level'] ?? null;
        $metadata = !empty($data['metadata']) ? json_encode($data['metadata']) : null;

        $sql = "INSERT INTO curriculum (id, tenant_id, class_id, teacher_id, title, description,
                                        year_start, year_end, level, status, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            $curriculumId, $tenantId, $classId, $teacherId,
            $title, $description, $yearStart, $yearEnd, $level, $metadata
        ]);

        // Log telemetry
        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_created', [
            'curriculum_id' => $curriculumId,
            'class_id' => $classId
        ]);

        jsonResponse([
            'success' => true,
            'curriculum_id' => $curriculumId,
            'message' => 'Curriculum created successfully'
        ], 201);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// GET /api/curriculum/{id} - Détails d'un curriculum
// ============================================================
if ($method === 'GET' && $curriculumId && !$action) {
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'read');

    $tenantId = $tenantContext->getTenantId();

    try {
        $db = getDbConnection();

        $sql = "SELECT c.*,
                       cl.name as class_name,
                       u.firstname as teacher_firstname,
                       u.lastname as teacher_lastname
                FROM curriculum c
                INNER JOIN classes cl ON c.class_id = cl.id
                INNER JOIN users u ON c.teacher_id = u.id
                WHERE c.id = ? AND c.tenant_id = ?";

        $stmt = $db->prepare($sql);
        $stmt->execute([$curriculumId, $tenantId]);
        $curriculum = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$curriculum) {
            jsonResponse(['success' => false, 'error' => 'Curriculum not found'], 404);
        }

        // Récupérer les séquences
        $seqSql = "SELECT cs.*,
                          (SELECT COUNT(*) FROM curriculum_sequence_assignments WHERE sequence_id = cs.id) as assignment_count,
                          (SELECT COUNT(*) FROM curriculum_sequence_themes WHERE sequence_id = cs.id) as theme_count
                   FROM curriculum_sequences cs
                   WHERE cs.curriculum_id = ?
                   ORDER BY cs.position ASC";

        $seqStmt = $db->prepare($seqSql);
        $seqStmt->execute([$curriculumId]);
        $sequences = $seqStmt->fetchAll(PDO::FETCH_ASSOC);

        // Décoder JSON
        foreach ($sequences as &$seq) {
            $seq['objectives'] = json_decode($seq['objectives'] ?? '[]', true);
            $seq['skills'] = json_decode($seq['skills'] ?? '[]', true);
            $seq['metadata'] = json_decode($seq['metadata'] ?? '{}', true);
        }

        $curriculum['metadata'] = json_decode($curriculum['metadata'] ?? '{}', true);
        $curriculum['sequences'] = $sequences;

        jsonResponse([
            'success' => true,
            'data' => $curriculum
        ]);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// PATCH /api/curriculum/{id} - Modifier un curriculum
// ============================================================
if ($method === 'PATCH' && $curriculumId && !$action) {
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'write');

    $tenantId = $tenantContext->getTenantId();
    $data = getPostData();

    try {
        $db = getDbConnection();

        // Vérifier que le curriculum existe
        $checkSql = "SELECT id FROM curriculum WHERE id = ? AND tenant_id = ?";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([$curriculumId, $tenantId]);
        if (!$checkStmt->fetch()) {
            jsonResponse(['success' => false, 'error' => 'Curriculum not found'], 404);
        }

        $updateFields = [];
        $params = [];

        $allowedFields = ['title', 'description', 'year_start', 'year_end', 'level', 'status'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (isset($data['metadata'])) {
            $updateFields[] = "metadata = ?";
            $params[] = json_encode($data['metadata']);
        }

        if (empty($updateFields)) {
            jsonResponse(['success' => false, 'error' => 'No valid fields to update'], 400);
        }

        $params[] = $curriculumId;
        $params[] = $tenantId;

        $sql = "UPDATE curriculum SET " . implode(', ', $updateFields) . " WHERE id = ? AND tenant_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_updated', [
            'curriculum_id' => $curriculumId
        ]);

        jsonResponse(['success' => true, 'message' => 'Curriculum updated successfully']);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// DELETE /api/curriculum/{id} - Supprimer un curriculum
// ============================================================
if ($method === 'DELETE' && $curriculumId && !$action) {
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'delete');

    $tenantId = $tenantContext->getTenantId();

    try {
        $db = getDbConnection();

        // Soft delete - passer en archived
        $sql = "UPDATE curriculum SET status = 'archived' WHERE id = ? AND tenant_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$curriculumId, $tenantId]);

        if ($stmt->rowCount() === 0) {
            jsonResponse(['success' => false, 'error' => 'Curriculum not found'], 404);
        }

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_deleted', [
            'curriculum_id' => $curriculumId
        ]);

        jsonResponse(['success' => true, 'message' => 'Curriculum archived successfully']);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// POST /api/curriculum/{id}/sequences - Créer une séquence
// ============================================================
if ($method === 'POST' && $curriculumId && $action === 'sequences') {
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'write');

    $tenantId = $tenantContext->getTenantId();
    $data = getPostData();

    if (empty($data['label'])) {
        jsonResponse(['success' => false, 'error' => 'Missing required field: label'], 400);
    }

    try {
        $db = getDbConnection();

        // Vérifier que le curriculum existe
        $checkSql = "SELECT id FROM curriculum WHERE id = ? AND tenant_id = ?";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([$curriculumId, $tenantId]);
        if (!$checkStmt->fetch()) {
            jsonResponse(['success' => false, 'error' => 'Curriculum not found'], 404);
        }

        // Trouver la prochaine position
        $posSql = "SELECT MAX(position) as max_pos FROM curriculum_sequences WHERE curriculum_id = ?";
        $posStmt = $db->prepare($posSql);
        $posStmt->execute([$curriculumId]);
        $maxPos = $posStmt->fetch(PDO::FETCH_ASSOC)['max_pos'] ?? 0;
        $nextPos = $maxPos + 1;

        $sequenceId = 'seq-' . bin2hex(random_bytes(8));
        $label = $data['label'];
        $description = $data['description'] ?? null;
        $durationWeeks = $data['duration_weeks'] ?? null;
        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;
        $objectives = !empty($data['objectives']) ? json_encode($data['objectives']) : null;
        $skills = !empty($data['skills']) ? json_encode($data['skills']) : null;
        $metadata = !empty($data['metadata']) ? json_encode($data['metadata']) : null;

        $sql = "INSERT INTO curriculum_sequences (id, curriculum_id, label, description, position,
                                                   duration_weeks, start_date, end_date, objectives, skills, metadata, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            $sequenceId, $curriculumId, $label, $description, $nextPos,
            $durationWeeks, $startDate, $endDate, $objectives, $skills, $metadata
        ]);

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_sequence_created', [
            'curriculum_id' => $curriculumId,
            'sequence_id' => $sequenceId
        ]);

        jsonResponse([
            'success' => true,
            'sequence_id' => $sequenceId,
            'message' => 'Sequence created successfully'
        ], 201);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// PATCH /api/curriculum/sequence/{seq_id} - Modifier une séquence
// ============================================================
if ($method === 'PATCH' && $curriculumId === 'sequence' && $action && !$subAction) {
    $sequenceId = $action;
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'write');

    $tenantId = $tenantContext->getTenantId();
    $data = getPostData();

    try {
        $db = getDbConnection();

        // Vérifier que la séquence existe et appartient au tenant
        $checkSql = "SELECT cs.id FROM curriculum_sequences cs
                     INNER JOIN curriculum c ON cs.curriculum_id = c.id
                     WHERE cs.id = ? AND c.tenant_id = ?";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([$sequenceId, $tenantId]);
        if (!$checkStmt->fetch()) {
            jsonResponse(['success' => false, 'error' => 'Sequence not found'], 404);
        }

        $updateFields = [];
        $params = [];

        $allowedFields = ['label', 'description', 'duration_weeks', 'start_date', 'end_date', 'status', 'completion_percent'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        $jsonFields = ['objectives', 'skills', 'metadata'];
        foreach ($jsonFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = json_encode($data[$field]);
            }
        }

        if (empty($updateFields)) {
            jsonResponse(['success' => false, 'error' => 'No valid fields to update'], 400);
        }

        $params[] = $sequenceId;

        $sql = "UPDATE curriculum_sequences SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_sequence_updated', [
            'sequence_id' => $sequenceId
        ]);

        jsonResponse(['success' => true, 'message' => 'Sequence updated successfully']);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// DELETE /api/curriculum/sequence/{seq_id} - Supprimer une séquence
// ============================================================
if ($method === 'DELETE' && $curriculumId === 'sequence' && $action && !$subAction) {
    $sequenceId = $action;
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'delete');

    $tenantId = $tenantContext->getTenantId();

    try {
        $db = getDbConnection();

        // Vérifier que la séquence existe
        $checkSql = "SELECT cs.id FROM curriculum_sequences cs
                     INNER JOIN curriculum c ON cs.curriculum_id = c.id
                     WHERE cs.id = ? AND c.tenant_id = ?";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([$sequenceId, $tenantId]);
        if (!$checkStmt->fetch()) {
            jsonResponse(['success' => false, 'error' => 'Sequence not found'], 404);
        }

        // Soft delete
        $sql = "UPDATE curriculum_sequences SET status = 'archived' WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$sequenceId]);

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_sequence_deleted', [
            'sequence_id' => $sequenceId
        ]);

        jsonResponse(['success' => true, 'message' => 'Sequence archived successfully']);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// PATCH /api/curriculum/sequence/{seq_id}/reorder - Réorganiser les séquences
// ============================================================
if ($method === 'PATCH' && $curriculumId === 'sequence' && $action && $subAction === 'reorder') {
    $sequenceId = $action;
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'write');

    $tenantId = $tenantContext->getTenantId();
    $data = getPostData();

    if (!isset($data['new_position'])) {
        jsonResponse(['success' => false, 'error' => 'Missing required field: new_position'], 400);
    }

    try {
        $db = getDbConnection();

        // Récupérer la séquence
        $seqSql = "SELECT cs.id, cs.curriculum_id, cs.position
                   FROM curriculum_sequences cs
                   INNER JOIN curriculum c ON cs.curriculum_id = c.id
                   WHERE cs.id = ? AND c.tenant_id = ?";
        $seqStmt = $db->prepare($seqSql);
        $seqStmt->execute([$sequenceId, $tenantId]);
        $sequence = $seqStmt->fetch(PDO::FETCH_ASSOC);

        if (!$sequence) {
            jsonResponse(['success' => false, 'error' => 'Sequence not found'], 404);
        }

        $oldPos = (int)$sequence['position'];
        $newPos = (int)$data['new_position'];
        $currId = $sequence['curriculum_id'];

        if ($oldPos === $newPos) {
            jsonResponse(['success' => true, 'message' => 'Position unchanged']);
        }

        // Réorganiser les positions
        $db->beginTransaction();

        if ($newPos > $oldPos) {
            // Déplacer vers le bas - décaler les autres vers le haut
            $updateSql = "UPDATE curriculum_sequences
                         SET position = position - 1
                         WHERE curriculum_id = ? AND position > ? AND position <= ?";
            $updateStmt = $db->prepare($updateSql);
            $updateStmt->execute([$currId, $oldPos, $newPos]);
        } else {
            // Déplacer vers le haut - décaler les autres vers le bas
            $updateSql = "UPDATE curriculum_sequences
                         SET position = position + 1
                         WHERE curriculum_id = ? AND position >= ? AND position < ?";
            $updateStmt = $db->prepare($updateSql);
            $updateStmt->execute([$currId, $newPos, $oldPos]);
        }

        // Mettre à jour la position de la séquence déplacée
        $finalSql = "UPDATE curriculum_sequences SET position = ? WHERE id = ?";
        $finalStmt = $db->prepare($finalSql);
        $finalStmt->execute([$newPos, $sequenceId]);

        $db->commit();

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_sequence_reordered', [
            'sequence_id' => $sequenceId,
            'old_position' => $oldPos,
            'new_position' => $newPos
        ]);

        jsonResponse(['success' => true, 'message' => 'Sequence reordered successfully']);

    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// POST /api/curriculum/sequence/{seq_id}/link-assignment
// ============================================================
if ($method === 'POST' && $curriculumId === 'sequence' && $action && $subAction === 'link-assignment') {
    $sequenceId = $action;
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'write');

    $tenantId = $tenantContext->getTenantId();
    $data = getPostData();

    if (empty($data['assignment_id'])) {
        jsonResponse(['success' => false, 'error' => 'Missing required field: assignment_id'], 400);
    }

    try {
        $db = getDbConnection();

        // Vérifier que la séquence existe
        $checkSeqSql = "SELECT cs.id FROM curriculum_sequences cs
                        INNER JOIN curriculum c ON cs.curriculum_id = c.id
                        WHERE cs.id = ? AND c.tenant_id = ?";
        $checkSeqStmt = $db->prepare($checkSeqSql);
        $checkSeqStmt->execute([$sequenceId, $tenantId]);
        if (!$checkSeqStmt->fetch()) {
            jsonResponse(['success' => false, 'error' => 'Sequence not found'], 404);
        }

        // Vérifier que l'assignment existe
        $assignmentId = $data['assignment_id'];
        $checkAssSql = "SELECT id FROM assignments WHERE id = ? AND tenant_id = ?";
        $checkAssStmt = $db->prepare($checkAssSql);
        $checkAssStmt->execute([$assignmentId, $tenantId]);
        if (!$checkAssStmt->fetch()) {
            jsonResponse(['success' => false, 'error' => 'Assignment not found'], 404);
        }

        $position = $data['position'] ?? 0;
        $isRequired = isset($data['is_required']) ? (bool)$data['is_required'] : true;

        // Insérer le lien
        $sql = "INSERT INTO curriculum_sequence_assignments (sequence_id, assignment_id, position, is_required)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE position = ?, is_required = ?";

        $stmt = $db->prepare($sql);
        $stmt->execute([$sequenceId, $assignmentId, $position, $isRequired, $position, $isRequired]);

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_assignment_linked', [
            'sequence_id' => $sequenceId,
            'assignment_id' => $assignmentId
        ]);

        jsonResponse(['success' => true, 'message' => 'Assignment linked to sequence successfully']);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// DELETE /api/curriculum/sequence/{seq_id}/unlink-assignment
// ============================================================
if ($method === 'DELETE' && $curriculumId === 'sequence' && $action && $subAction === 'unlink-assignment') {
    $sequenceId = $action;
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'write');

    $tenantId = $tenantContext->getTenantId();
    $data = getPostData();

    if (empty($data['assignment_id'])) {
        jsonResponse(['success' => false, 'error' => 'Missing required field: assignment_id'], 400);
    }

    try {
        $db = getDbConnection();

        $assignmentId = $data['assignment_id'];

        $sql = "DELETE csa FROM curriculum_sequence_assignments csa
                INNER JOIN curriculum_sequences cs ON csa.sequence_id = cs.id
                INNER JOIN curriculum c ON cs.curriculum_id = c.id
                WHERE csa.sequence_id = ? AND csa.assignment_id = ? AND c.tenant_id = ?";

        $stmt = $db->prepare($sql);
        $stmt->execute([$sequenceId, $assignmentId, $tenantId]);

        if ($stmt->rowCount() === 0) {
            jsonResponse(['success' => false, 'error' => 'Link not found'], 404);
        }

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_assignment_unlinked', [
            'sequence_id' => $sequenceId,
            'assignment_id' => $assignmentId
        ]);

        jsonResponse(['success' => true, 'message' => 'Assignment unlinked from sequence successfully']);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// POST /api/curriculum/sequence/{seq_id}/link-theme
// ============================================================
if ($method === 'POST' && $curriculumId === 'sequence' && $action && $subAction === 'link-theme') {
    $sequenceId = $action;
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'write');

    $tenantId = $tenantContext->getTenantId();
    $data = getPostData();

    if (empty($data['theme_id'])) {
        jsonResponse(['success' => false, 'error' => 'Missing required field: theme_id'], 400);
    }

    try {
        $db = getDbConnection();

        // Vérifier que la séquence et le thème existent
        $checkSeqSql = "SELECT cs.id FROM curriculum_sequences cs
                        INNER JOIN curriculum c ON cs.curriculum_id = c.id
                        WHERE cs.id = ? AND c.tenant_id = ?";
        $checkSeqStmt = $db->prepare($checkSeqSql);
        $checkSeqStmt->execute([$sequenceId, $tenantId]);
        if (!$checkSeqStmt->fetch()) {
            jsonResponse(['success' => false, 'error' => 'Sequence not found'], 404);
        }

        $themeId = $data['theme_id'];
        $checkThemeSql = "SELECT id FROM themes WHERE id = ? AND tenant_id = ?";
        $checkThemeStmt = $db->prepare($checkThemeSql);
        $checkThemeStmt->execute([$themeId, $tenantId]);
        if (!$checkThemeStmt->fetch()) {
            jsonResponse(['success' => false, 'error' => 'Theme not found'], 404);
        }

        $position = $data['position'] ?? 0;

        $sql = "INSERT INTO curriculum_sequence_themes (sequence_id, theme_id, position)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE position = ?";

        $stmt = $db->prepare($sql);
        $stmt->execute([$sequenceId, $themeId, $position, $position]);

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_theme_linked', [
            'sequence_id' => $sequenceId,
            'theme_id' => $themeId
        ]);

        jsonResponse(['success' => true, 'message' => 'Theme linked to sequence successfully']);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// DELETE /api/curriculum/sequence/{seq_id}/unlink-theme
// ============================================================
if ($method === 'DELETE' && $curriculumId === 'sequence' && $action && $subAction === 'unlink-theme') {
    $sequenceId = $action;
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'write');

    $tenantId = $tenantContext->getTenantId();
    $data = getPostData();

    if (empty($data['theme_id'])) {
        jsonResponse(['success' => false, 'error' => 'Missing required field: theme_id'], 400);
    }

    try {
        $db = getDbConnection();

        $themeId = $data['theme_id'];

        $sql = "DELETE cst FROM curriculum_sequence_themes cst
                INNER JOIN curriculum_sequences cs ON cst.sequence_id = cs.id
                INNER JOIN curriculum c ON cs.curriculum_id = c.id
                WHERE cst.sequence_id = ? AND cst.theme_id = ? AND c.tenant_id = ?";

        $stmt = $db->prepare($sql);
        $stmt->execute([$sequenceId, $themeId, $tenantId]);

        if ($stmt->rowCount() === 0) {
            jsonResponse(['success' => false, 'error' => 'Link not found'], 404);
        }

        logTelemetry($tenantId, $auth->getUserId(), 'curriculum_theme_unlinked', [
            'sequence_id' => $sequenceId,
            'theme_id' => $themeId
        ]);

        jsonResponse(['success' => true, 'message' => 'Theme unlinked from sequence successfully']);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// GET /api/curriculum/student/{student_uuid} - Vue élève
// ============================================================
if ($method === 'GET' && $curriculumId === 'student' && $action) {
    $studentUuid = $action;
    $tenantContext = enforceTenantIsolation();
    $auth = requireAuth();
    enforceTenantAuthMatch($tenantContext, $auth);
    // Les élèves peuvent voir leur propre progression
    $rbac = enforceRBAC($auth);
    $rbac->requirePermission('curriculum', 'read');

    $tenantId = $tenantContext->getTenantId();

    try {
        $db = getDbConnection();

        // Récupérer l'élève
        $studentSql = "SELECT id, class_id FROM students WHERE uuid_scolaire = ? AND tenant_id = ?";
        $studentStmt = $db->prepare($studentSql);
        $studentStmt->execute([$studentUuid, $tenantId]);
        $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            jsonResponse(['success' => false, 'error' => 'Student not found'], 404);
        }

        $studentId = $student['id'];
        $classId = $student['class_id'];

        // Récupérer le curriculum de la classe
        $currSql = "SELECT c.* FROM curriculum c
                    WHERE c.class_id = ? AND c.tenant_id = ? AND c.status = 'active'
                    ORDER BY c.created_at DESC LIMIT 1";
        $currStmt = $db->prepare($currSql);
        $currStmt->execute([$classId, $tenantId]);
        $curriculum = $currStmt->fetch(PDO::FETCH_ASSOC);

        if (!$curriculum) {
            jsonResponse(['success' => false, 'error' => 'No active curriculum for this class'], 404);
        }

        $curriculumId = $curriculum['id'];

        // Récupérer les séquences avec progression de l'élève
        $seqSql = "SELECT cs.*,
                          csp.completion_percent as student_completion,
                          csp.status as student_status,
                          csp.last_activity_at as student_last_activity
                   FROM curriculum_sequences cs
                   LEFT JOIN curriculum_student_progress csp ON cs.id = csp.sequence_id AND csp.student_id = ?
                   WHERE cs.curriculum_id = ?
                   ORDER BY cs.position ASC";

        $seqStmt = $db->prepare($seqSql);
        $seqStmt->execute([$studentId, $curriculumId]);
        $sequences = $seqStmt->fetchAll(PDO::FETCH_ASSOC);

        // Enrichir avec missions et thèmes
        foreach ($sequences as &$seq) {
            $seq['objectives'] = json_decode($seq['objectives'] ?? '[]', true);
            $seq['skills'] = json_decode($seq['skills'] ?? '[]', true);

            // Récupérer les missions liées
            $assignSql = "SELECT a.id, a.title, a.type, a.due_at,
                                 s.completion_percent, s.status, s.started_at, s.completed_at
                          FROM curriculum_sequence_assignments csa
                          INNER JOIN assignments a ON csa.assignment_id = a.id
                          LEFT JOIN stats s ON a.id = s.assignment_id AND s.student_id = ?
                          WHERE csa.sequence_id = ?
                          ORDER BY csa.position ASC";

            $assignStmt = $db->prepare($assignSql);
            $assignStmt->execute([$studentId, $seq['id']]);
            $seq['assignments'] = $assignStmt->fetchAll(PDO::FETCH_ASSOC);

            // Récupérer les thèmes liés
            $themeSql = "SELECT t.id, t.title, t.description, t.difficulty
                         FROM curriculum_sequence_themes cst
                         INNER JOIN themes t ON cst.theme_id = t.id
                         WHERE cst.sequence_id = ?
                         ORDER BY cst.position ASC";

            $themeStmt = $db->prepare($themeSql);
            $themeStmt->execute([$seq['id']]);
            $seq['themes'] = $themeStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        $curriculum['metadata'] = json_decode($curriculum['metadata'] ?? '{}', true);
        $curriculum['sequences'] = $sequences;

        jsonResponse([
            'success' => true,
            'data' => [
                'student_uuid' => $studentUuid,
                'curriculum' => $curriculum
            ]
        ]);

    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ============================================================
// Route non trouvée
// ============================================================
jsonResponse(['success' => false, 'error' => 'Route not found'], 404);

// ============================================================
// Helper Functions
// ============================================================

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getPostData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    // URL-encoded (default)
    if (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
        return $_POST;
    }

    // JSON
    if (strpos($contentType, 'application/json') !== false) {
        $json = file_get_contents('php://input');
        return json_decode($json, true) ?? [];
    }

    // Fallback to POST
    return $_POST;
}

function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id, X-Orchestrator-Id');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
