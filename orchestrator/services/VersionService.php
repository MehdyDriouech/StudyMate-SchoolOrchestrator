<?php
/**
 * Sprint 11 - Content Creation Suite
 * Service: VersionService
 * Description: Gestion du versioning des thèmes
 */

class VersionService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Créer une nouvelle version d'un thème
     */
    public function createVersion($themeId, $userId, $themeData, $changeSummary = null) {
        $versionId = 'ver_' . bin2hex(random_bytes(16));
        $versionNumber = $themeData['metadata']['version_number'] ?? 1;

        $stmt = $this->db->prepare("
            INSERT INTO theme_versions (
                id, theme_id, version_number, content,
                changed_by, change_summary, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");

        $content = json_encode($themeData);

        $stmt->bind_param(
            'ssisss',
            $versionId,
            $themeId,
            $versionNumber,
            $content,
            $userId,
            $changeSummary
        );

        if (!$stmt->execute()) {
            return [
                'success' => false,
                'error' => 'Failed to create version: ' . $stmt->error
            ];
        }

        return [
            'success' => true,
            'version_id' => $versionId,
            'version_number' => $versionNumber
        ];
    }

    /**
     * Récupérer l'historique des versions d'un thème
     */
    public function getVersionHistory($themeId, $limit = 20) {
        $stmt = $this->db->prepare("
            SELECT
                v.id, v.version_number, v.change_summary,
                v.created_at, v.changed_by,
                u.name as changed_by_name,
                LENGTH(v.content) as content_size
            FROM theme_versions v
            LEFT JOIN users u ON v.changed_by = u.id
            WHERE v.theme_id = ?
            ORDER BY v.version_number DESC
            LIMIT ?
        ");

        $stmt->bind_param('si', $themeId, $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $versions = [];
        while ($row = $result->fetch_assoc()) {
            $versions[] = $row;
        }

        return $versions;
    }

    /**
     * Récupérer une version spécifique d'un thème
     */
    public function getVersion($versionId) {
        $stmt = $this->db->prepare("
            SELECT * FROM theme_versions WHERE id = ?
        ");
        $stmt->bind_param('s', $versionId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            $row['content'] = json_decode($row['content'], true);
            return $row;
        }

        return null;
    }

    /**
     * Restaurer une version antérieure d'un thème
     */
    public function restoreVersion($themeId, $versionId, $userId) {
        $version = $this->getVersion($versionId);
        if (!$version) {
            return ['success' => false, 'error' => 'Version not found'];
        }

        if ($version['theme_id'] !== $themeId) {
            return ['success' => false, 'error' => 'Version does not belong to this theme'];
        }

        // Créer une nouvelle version avec le contenu restauré
        $themeData = $version['content'];

        // Mettre à jour le numéro de version
        $currentMaxVersion = $this->getMaxVersionNumber($themeId);
        $newVersionNumber = $currentMaxVersion + 1;

        $themeData['metadata']['version_number'] = $newVersionNumber;
        $themeData['metadata']['version'] = "1.{$newVersionNumber}.0";
        $themeData['metadata']['last_modified_by'] = $userId;
        $themeData['metadata']['last_modified_at'] = date('c');

        // Marquer comme restauration
        $changeSummary = "Restauration de la version {$version['version_number']}";

        return $this->createVersion($themeId, $userId, $themeData, $changeSummary);
    }

    /**
     * Comparer deux versions d'un thème
     */
    public function compareVersions($versionId1, $versionId2) {
        $version1 = $this->getVersion($versionId1);
        $version2 = $this->getVersion($versionId2);

        if (!$version1 || !$version2) {
            return ['success' => false, 'error' => 'One or both versions not found'];
        }

        $diff = [
            'version1' => [
                'number' => $version1['version_number'],
                'date' => $version1['created_at'],
                'changed_by' => $version1['changed_by']
            ],
            'version2' => [
                'number' => $version2['version_number'],
                'date' => $version2['created_at'],
                'changed_by' => $version2['changed_by']
            ],
            'changes' => $this->calculateDiff($version1['content'], $version2['content'])
        ];

        return $diff;
    }

    /**
     * Calculer les différences entre deux contenus
     */
    private function calculateDiff($content1, $content2) {
        $changes = [];

        // Comparer le titre
        if ($content1['title'] !== $content2['title']) {
            $changes[] = [
                'field' => 'title',
                'from' => $content1['title'],
                'to' => $content2['title']
            ];
        }

        // Comparer les questions
        $q1Count = count($content1['questions'] ?? []);
        $q2Count = count($content2['questions'] ?? []);
        if ($q1Count !== $q2Count) {
            $changes[] = [
                'field' => 'questions_count',
                'from' => $q1Count,
                'to' => $q2Count
            ];
        }

        // Comparer les flashcards
        $f1Count = count($content1['flashcards'] ?? []);
        $f2Count = count($content2['flashcards'] ?? []);
        if ($f1Count !== $f2Count) {
            $changes[] = [
                'field' => 'flashcards_count',
                'from' => $f1Count,
                'to' => $f2Count
            ];
        }

        // Comparer la difficulté
        if ($content1['difficulty'] !== $content2['difficulty']) {
            $changes[] = [
                'field' => 'difficulty',
                'from' => $content1['difficulty'],
                'to' => $content2['difficulty']
            ];
        }

        return $changes;
    }

    /**
     * Obtenir le numéro de version maximum pour un thème
     */
    private function getMaxVersionNumber($themeId) {
        $stmt = $this->db->prepare("
            SELECT MAX(version_number) as max_version
            FROM theme_versions
            WHERE theme_id = ?
        ");
        $stmt->bind_param('s', $themeId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        return (int)($row['max_version'] ?? 0);
    }

    /**
     * Nettoyer les anciennes versions (garder les N dernières)
     */
    public function cleanOldVersions($themeId, $keepLast = 10) {
        $stmt = $this->db->prepare("
            DELETE FROM theme_versions
            WHERE theme_id = ?
            AND version_number NOT IN (
                SELECT version_number FROM (
                    SELECT version_number
                    FROM theme_versions
                    WHERE theme_id = ?
                    ORDER BY version_number DESC
                    LIMIT ?
                ) as keep_versions
            )
        ");
        $stmt->bind_param('ssi', $themeId, $themeId, $keepLast);
        $stmt->execute();

        return ['success' => true, 'deleted' => $stmt->affected_rows];
    }
}
