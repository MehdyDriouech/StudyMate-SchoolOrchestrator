<?php
/**
 * Sprint 11 - Content Creation Suite
 * Service: ThemeService
 * Description: Gestion centralisée des thèmes pédagogiques
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/SchemaValidator.php';
require_once __DIR__ . '/VersionService.php';

class ThemeService {
    private $db;
    private $validator;
    private $versionService;

    public function __construct($db) {
        $this->db = $db;
        $this->validator = new SchemaValidator();
        $this->versionService = new VersionService($db);
    }

    /**
     * Créer un nouveau thème
     */
    public function createTheme($tenantId, $userId, $themeData) {
        // Validation du schéma
        $validation = $this->validator->validate($themeData);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'error' => 'Validation schema failed',
                'details' => $validation['errors']
            ];
        }

        // Générer un ID unique
        $themeId = 'theme_' . bin2hex(random_bytes(16));

        // Initialiser les métadonnées
        if (!isset($themeData['metadata'])) {
            $themeData['metadata'] = [];
        }

        $themeData['metadata']['author_id'] = $userId;
        $themeData['metadata']['generation_date'] = date('c');
        $themeData['metadata']['version_number'] = 1;
        $themeData['metadata']['version'] = '1.0.0';
        $themeData['metadata']['workflow_status'] = 'draft';
        $themeData['metadata']['collaborators'] = [[
            'user_id' => $userId,
            'role' => 'owner',
            'added_at' => date('c')
        ]];

        // Calculer le hash du contenu
        $contentHash = $this->calculateContentHash($themeData);

        // Insérer dans la base de données
        $stmt = $this->db->prepare("
            INSERT INTO themes (
                id, tenant_id, created_by, title, description,
                difficulty, content_type, subject, tags,
                estimated_duration_minutes, content, content_hash,
                source, ergomate_compliant, ergomate_validated_at,
                workflow_status, version_number, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $tags = isset($themeData['tags']) ? json_encode($themeData['tags']) : null;
        $source = $themeData['metadata']['source'] ?? 'manual';
        $workflowStatus = $themeData['metadata']['workflow_status'];

        $stmt->bind_param(
            'sssssssssississs',
            $themeId,
            $tenantId,
            $userId,
            $themeData['title'],
            $themeData['description'],
            $themeData['difficulty'],
            $themeData['content_type'],
            $themeData['subject'] ?? null,
            $tags,
            $themeData['estimated_duration_minutes'] ?? null,
            $content = json_encode($themeData),
            $contentHash,
            $source,
            $validation['valid'] ? 1 : 0,
            $validatedAt = $validation['valid'] ? date('Y-m-d H:i:s') : null,
            $workflowStatus,
            $versionNumber = 1
        );

        if (!$stmt->execute()) {
            return [
                'success' => false,
                'error' => 'Database insert failed: ' . $stmt->error
            ];
        }

        // Créer la première version dans l'historique
        $this->versionService->createVersion($themeId, $userId, $themeData, 'Création initiale');

        return [
            'success' => true,
            'theme_id' => $themeId,
            'version' => 1,
            'validation' => $validation
        ];
    }

    /**
     * Mettre à jour un thème existant
     */
    public function updateTheme($themeId, $userId, $themeData, $changeSummary = null) {
        // Récupérer le thème actuel
        $currentTheme = $this->getTheme($themeId);
        if (!$currentTheme) {
            return ['success' => false, 'error' => 'Theme not found'];
        }

        // Validation du schéma
        $validation = $this->validator->validate($themeData);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'error' => 'Validation schema failed',
                'details' => $validation['errors']
            ];
        }

        // Incrémenter le numéro de version
        $newVersionNumber = ($currentTheme['version_number'] ?? 0) + 1;
        $themeData['metadata']['version_number'] = $newVersionNumber;
        $themeData['metadata']['version'] = "1.{$newVersionNumber}.0";
        $themeData['metadata']['last_modified_by'] = $userId;
        $themeData['metadata']['last_modified_at'] = date('c');
        $themeData['metadata']['parent_version_id'] = $currentTheme['id'] . '_v' . $currentTheme['version_number'];

        if ($changeSummary) {
            $themeData['metadata']['change_summary'] = $changeSummary;
        }

        // Calculer le nouveau hash
        $contentHash = $this->calculateContentHash($themeData);

        // Mettre à jour la base de données
        $stmt = $this->db->prepare("
            UPDATE themes
            SET content = ?,
                content_hash = ?,
                title = ?,
                description = ?,
                difficulty = ?,
                workflow_status = ?,
                version_number = ?,
                ergomate_compliant = ?,
                ergomate_validated_at = ?,
                updated_at = NOW()
            WHERE id = ?
        ");

        $workflowStatus = $themeData['metadata']['workflow_status'] ?? 'draft';

        $stmt->bind_param(
            'ssssssisss',
            $content = json_encode($themeData),
            $contentHash,
            $themeData['title'],
            $themeData['description'],
            $themeData['difficulty'],
            $workflowStatus,
            $newVersionNumber,
            $validation['valid'] ? 1 : 0,
            $validatedAt = $validation['valid'] ? date('Y-m-d H:i:s') : null,
            $themeId
        );

        if (!$stmt->execute()) {
            return [
                'success' => false,
                'error' => 'Database update failed: ' . $stmt->error
            ];
        }

        // Créer une nouvelle version dans l'historique
        $this->versionService->createVersion($themeId, $userId, $themeData, $changeSummary ?? 'Modification');

        return [
            'success' => true,
            'theme_id' => $themeId,
            'version' => $newVersionNumber,
            'validation' => $validation
        ];
    }

    /**
     * Récupérer un thème par ID
     */
    public function getTheme($themeId) {
        $stmt = $this->db->prepare("
            SELECT * FROM themes WHERE id = ?
        ");
        $stmt->bind_param('s', $themeId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            $row['content'] = json_decode($row['content'], true);
            $row['tags'] = json_decode($row['tags'], true);
            return $row;
        }

        return null;
    }

    /**
     * Liste des thèmes d'un enseignant avec filtres
     */
    public function listThemes($tenantId, $userId = null, $filters = []) {
        $conditions = ["t.tenant_id = ?"];
        $params = [$tenantId];
        $types = 's';

        if ($userId) {
            $conditions[] = "(t.created_by = ? OR JSON_SEARCH(t.content, 'one', ?, NULL, '$.metadata.collaborators[*].user_id') IS NOT NULL)";
            $params[] = $userId;
            $params[] = $userId;
            $types .= 'ss';
        }

        if (!empty($filters['content_type'])) {
            $conditions[] = "t.content_type = ?";
            $params[] = $filters['content_type'];
            $types .= 's';
        }

        if (!empty($filters['difficulty'])) {
            $conditions[] = "t.difficulty = ?";
            $params[] = $filters['difficulty'];
            $types .= 's';
        }

        if (!empty($filters['workflow_status'])) {
            $conditions[] = "t.workflow_status = ?";
            $params[] = $filters['workflow_status'];
            $types .= 's';
        }

        if (!empty($filters['search'])) {
            $conditions[] = "(t.title LIKE ? OR t.description LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $types .= 'ss';
        }

        $whereClause = implode(' AND ', $conditions);
        $orderBy = $filters['order_by'] ?? 'updated_at';
        $orderDir = $filters['order_dir'] ?? 'DESC';
        $limit = $filters['limit'] ?? 50;
        $offset = $filters['offset'] ?? 0;

        $sql = "
            SELECT t.*,
                   u.name as creator_name,
                   COUNT(DISTINCT v.id) as version_count
            FROM themes t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN theme_versions v ON t.id = v.theme_id
            WHERE $whereClause
            GROUP BY t.id
            ORDER BY t.$orderBy $orderDir
            LIMIT ? OFFSET ?
        ";

        $stmt = $this->db->prepare($sql);
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';

        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $themes = [];
        while ($row = $result->fetch_assoc()) {
            // Ne pas retourner le contenu complet dans la liste
            $content = json_decode($row['content'], true);
            $row['metadata'] = $content['metadata'] ?? [];
            unset($row['content']);
            $themes[] = $row;
        }

        return $themes;
    }

    /**
     * Dupliquer un thème
     */
    public function duplicateTheme($themeId, $userId, $newTitle = null) {
        $theme = $this->getTheme($themeId);
        if (!$theme) {
            return ['success' => false, 'error' => 'Theme not found'];
        }

        $themeData = $theme['content'];
        $themeData['title'] = $newTitle ?? ($themeData['title'] . ' (Copie)');
        $themeData['metadata']['source'] = 'manual';
        unset($themeData['metadata']['version_number']);
        unset($themeData['metadata']['parent_version_id']);
        unset($themeData['metadata']['ai_improvements']);

        return $this->createTheme($theme['tenant_id'], $userId, $themeData);
    }

    /**
     * Changer le statut workflow d'un thème
     */
    public function updateWorkflowStatus($themeId, $userId, $newStatus, $comment = null) {
        $validStatuses = ['draft', 'in_review', 'approved', 'published', 'archived'];
        if (!in_array($newStatus, $validStatuses)) {
            return ['success' => false, 'error' => 'Invalid workflow status'];
        }

        $stmt = $this->db->prepare("
            UPDATE themes
            SET workflow_status = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->bind_param('ss', $newStatus, $themeId);

        if (!$stmt->execute()) {
            return ['success' => false, 'error' => 'Database update failed'];
        }

        // Logger le changement de statut
        $this->logWorkflowChange($themeId, $userId, $newStatus, $comment);

        return ['success' => true, 'status' => $newStatus];
    }

    /**
     * Ajouter un collaborateur à un thème
     */
    public function addCollaborator($themeId, $userId, $collaboratorId, $role = 'editor') {
        $theme = $this->getTheme($themeId);
        if (!$theme) {
            return ['success' => false, 'error' => 'Theme not found'];
        }

        $themeData = $theme['content'];
        if (!isset($themeData['metadata']['collaborators'])) {
            $themeData['metadata']['collaborators'] = [];
        }

        // Vérifier si le collaborateur existe déjà
        foreach ($themeData['metadata']['collaborators'] as &$collab) {
            if ($collab['user_id'] === $collaboratorId) {
                $collab['role'] = $role;
                return $this->updateTheme($themeId, $userId, $themeData, "Modification du rôle de collaborateur");
            }
        }

        // Ajouter le nouveau collaborateur
        $themeData['metadata']['collaborators'][] = [
            'user_id' => $collaboratorId,
            'role' => $role,
            'added_at' => date('c')
        ];

        return $this->updateTheme($themeId, $userId, $themeData, "Ajout d'un collaborateur");
    }

    /**
     * Calculer le hash du contenu (pour détection de doublons)
     */
    private function calculateContentHash($themeData) {
        // Hash basé sur le contenu pédagogique uniquement (pas les métadonnées)
        $contentForHash = [
            'questions' => $themeData['questions'] ?? [],
            'flashcards' => $themeData['flashcards'] ?? [],
            'fiche' => $themeData['fiche'] ?? null
        ];
        return hash('sha256', json_encode($contentForHash));
    }

    /**
     * Logger un changement de workflow
     */
    private function logWorkflowChange($themeId, $userId, $newStatus, $comment) {
        $stmt = $this->db->prepare("
            INSERT INTO theme_workflow_log (id, theme_id, user_id, status, comment, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $logId = 'wflog_' . bin2hex(random_bytes(8));
        $stmt->bind_param('sssss', $logId, $themeId, $userId, $newStatus, $comment);
        $stmt->execute();
    }

    /**
     * Rechercher des thèmes similaires (détection de doublons)
     */
    public function findSimilarThemes($tenantId, $contentHash) {
        $stmt = $this->db->prepare("
            SELECT id, title, created_by, created_at
            FROM themes
            WHERE tenant_id = ? AND content_hash = ?
            ORDER BY created_at DESC
        ");
        $stmt->bind_param('ss', $tenantId, $contentHash);
        $stmt->execute();
        $result = $stmt->get_result();

        $similar = [];
        while ($row = $result->fetch_assoc()) {
            $similar[] = $row;
        }

        return $similar;
    }

    /**
     * Archiver un thème (soft delete)
     */
    public function archiveTheme($themeId, $userId) {
        return $this->updateWorkflowStatus($themeId, $userId, 'archived', 'Theme archived by user');
    }

    /**
     * Statistiques d'utilisation d'un thème
     */
    public function getThemeStats($themeId) {
        $stmt = $this->db->prepare("
            SELECT
                COUNT(DISTINCT v.id) as version_count,
                COUNT(DISTINCT p.id) as publication_count,
                COUNT(DISTINCT a.id) as assignment_count
            FROM themes t
            LEFT JOIN theme_versions v ON t.id = v.theme_id
            LEFT JOIN ergomate_publications p ON t.id = p.theme_id
            LEFT JOIN assignments a ON t.id = a.theme_id
            WHERE t.id = ?
        ");
        $stmt->bind_param('s', $themeId);
        $stmt->execute();
        $result = $stmt->get_result();

        return $result->fetch_assoc();
    }
}
