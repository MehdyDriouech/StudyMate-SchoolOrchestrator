<?php
/**
 * Sprint 19 - Multi-Review Workflow
 * Service: AnnotationService
 * Description: Gestion des annotations et commentaires sur les thèmes
 *
 * Fonctionnalités:
 * - Créer des annotations sur des éléments spécifiques du JSON
 * - Suggérer des corrections IA
 * - Résoudre/rejeter des annotations
 * - Récupérer les annotations par thème/version
 *
 * @version 1.0.0
 * @date 2025-11-14
 */

class AnnotationService {
    private $db;

    // Types d'annotation
    const TYPE_COMMENT = 'comment';
    const TYPE_SUGGESTION = 'suggestion';
    const TYPE_ERROR = 'error';
    const TYPE_WARNING = 'warning';
    const TYPE_INFO = 'info';

    // Statuts d'annotation
    const STATUS_OPEN = 'open';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_REJECTED = 'rejected';

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Créer une nouvelle annotation sur un thème
     *
     * @param array $params Paramètres de l'annotation
     * @return array Résultat de l'opération
     */
    public function createAnnotation($params) {
        try {
            // Validation des paramètres requis
            $required = ['theme_id', 'tenant_id', 'author_user_id', 'json_path', 'content'];
            foreach ($required as $field) {
                if (empty($params[$field])) {
                    return ['success' => false, 'error' => "Missing required field: {$field}"];
                }
            }

            // Vérifier que le thème existe
            $theme = $this->getTheme($params['theme_id']);
            if (!$theme) {
                return ['success' => false, 'error' => 'Theme not found'];
            }

            // Vérifier l'isolation tenant
            if ($theme['tenant_id'] !== $params['tenant_id']) {
                return ['success' => false, 'error' => 'Access denied: tenant mismatch'];
            }

            $annotationId = 'ann_' . bin2hex(random_bytes(16));
            $annotationType = $params['annotation_type'] ?? self::TYPE_COMMENT;
            $themeVersion = $params['theme_version'] ?? $theme['version'];
            $aiSuggestion = $params['ai_suggestion'] ?? null;
            $metadata = isset($params['metadata']) ? json_encode($params['metadata']) : null;

            $stmt = $this->db->prepare("
                INSERT INTO annotations (
                    id, theme_id, theme_version, tenant_id, author_user_id,
                    json_path, annotation_type, content, ai_suggestion,
                    status, metadata, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, NOW())
            ");

            $stmt->execute([
                $annotationId,
                $params['theme_id'],
                $themeVersion,
                $params['tenant_id'],
                $params['author_user_id'],
                $params['json_path'],
                $annotationType,
                $params['content'],
                $aiSuggestion,
                $metadata
            ]);

            // Notifier l'auteur du thème
            $this->notifyThemeAuthor($params['theme_id'], $annotationId, $annotationType);

            return [
                'success' => true,
                'annotation_id' => $annotationId,
                'annotation' => $this->getAnnotation($annotationId)
            ];

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Récupérer une annotation par ID
     *
     * @param string $annotationId ID de l'annotation
     * @return array|null Annotation ou null si non trouvée
     */
    public function getAnnotation($annotationId) {
        $stmt = $this->db->prepare("
            SELECT
                a.*,
                u_author.firstname AS author_firstname,
                u_author.lastname AS author_lastname,
                u_author.role AS author_role,
                u_resolved.firstname AS resolved_by_firstname,
                u_resolved.lastname AS resolved_by_lastname
            FROM annotations a
            LEFT JOIN users u_author ON a.author_user_id = u_author.id
            LEFT JOIN users u_resolved ON a.resolved_by = u_resolved.id
            WHERE a.id = ?
        ");

        $stmt->execute([$annotationId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result && !empty($result['metadata'])) {
            $result['metadata'] = json_decode($result['metadata'], true);
        }

        return $result;
    }

    /**
     * Récupérer toutes les annotations d'un thème
     *
     * @param string $themeId ID du thème
     * @param array $filters Filtres optionnels (status, annotation_type, version)
     * @return array Liste des annotations
     */
    public function getThemeAnnotations($themeId, $filters = []) {
        $sql = "
            SELECT
                a.*,
                u_author.firstname AS author_firstname,
                u_author.lastname AS author_lastname,
                u_author.role AS author_role,
                u_resolved.firstname AS resolved_by_firstname,
                u_resolved.lastname AS resolved_by_lastname
            FROM annotations a
            LEFT JOIN users u_author ON a.author_user_id = u_author.id
            LEFT JOIN users u_resolved ON a.resolved_by = u_resolved.id
            WHERE a.theme_id = ?
        ";

        $params = [$themeId];

        // Filtrer par statut
        if (!empty($filters['status'])) {
            $sql .= " AND a.status = ?";
            $params[] = $filters['status'];
        }

        // Filtrer par type
        if (!empty($filters['annotation_type'])) {
            $sql .= " AND a.annotation_type = ?";
            $params[] = $filters['annotation_type'];
        }

        // Filtrer par version
        if (isset($filters['theme_version'])) {
            $sql .= " AND a.theme_version = ?";
            $params[] = $filters['theme_version'];
        }

        $sql .= " ORDER BY a.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $annotations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Décoder les métadonnées JSON
        foreach ($annotations as &$annotation) {
            if (!empty($annotation['metadata'])) {
                $annotation['metadata'] = json_decode($annotation['metadata'], true);
            }
        }

        return $annotations;
    }

    /**
     * Mettre à jour une annotation
     *
     * @param string $annotationId ID de l'annotation
     * @param array $updates Champs à mettre à jour
     * @param string $userId ID de l'utilisateur effectuant la mise à jour
     * @return array Résultat de l'opération
     */
    public function updateAnnotation($annotationId, $updates, $userId) {
        try {
            $annotation = $this->getAnnotation($annotationId);
            if (!$annotation) {
                return ['success' => false, 'error' => 'Annotation not found'];
            }

            // Vérifier les permissions (seul l'auteur peut modifier)
            if ($annotation['author_user_id'] !== $userId) {
                return ['success' => false, 'error' => 'Only the author can update this annotation'];
            }

            $allowedFields = ['content', 'annotation_type', 'metadata'];
            $setClauses = [];
            $params = [];

            foreach ($updates as $field => $value) {
                if (in_array($field, $allowedFields)) {
                    $setClauses[] = "{$field} = ?";
                    if ($field === 'metadata' && is_array($value)) {
                        $params[] = json_encode($value);
                    } else {
                        $params[] = $value;
                    }
                }
            }

            if (empty($setClauses)) {
                return ['success' => false, 'error' => 'No valid fields to update'];
            }

            $params[] = $annotationId;

            $sql = "UPDATE annotations SET " . implode(', ', $setClauses) . ", updated_at = NOW() WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return [
                'success' => true,
                'annotation' => $this->getAnnotation($annotationId)
            ];

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Résoudre une annotation
     *
     * @param string $annotationId ID de l'annotation
     * @param string $userId ID de l'utilisateur qui résout
     * @return array Résultat de l'opération
     */
    public function resolveAnnotation($annotationId, $userId) {
        try {
            $annotation = $this->getAnnotation($annotationId);
            if (!$annotation) {
                return ['success' => false, 'error' => 'Annotation not found'];
            }

            if ($annotation['status'] === self::STATUS_RESOLVED) {
                return ['success' => false, 'error' => 'Annotation is already resolved'];
            }

            $stmt = $this->db->prepare("
                UPDATE annotations
                SET status = 'resolved',
                    resolved_at = NOW(),
                    resolved_by = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([$userId, $annotationId]);

            // Notifier l'auteur de l'annotation
            $this->notifyAnnotationResolved($annotationId, $userId);

            return [
                'success' => true,
                'annotation' => $this->getAnnotation($annotationId)
            ];

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Rejeter une annotation
     *
     * @param string $annotationId ID de l'annotation
     * @param string $userId ID de l'utilisateur qui rejette
     * @return array Résultat de l'opération
     */
    public function rejectAnnotation($annotationId, $userId) {
        try {
            $annotation = $this->getAnnotation($annotationId);
            if (!$annotation) {
                return ['success' => false, 'error' => 'Annotation not found'];
            }

            $stmt = $this->db->prepare("
                UPDATE annotations
                SET status = 'rejected',
                    resolved_at = NOW(),
                    resolved_by = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([$userId, $annotationId]);

            return [
                'success' => true,
                'annotation' => $this->getAnnotation($annotationId)
            ];

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Supprimer une annotation
     *
     * @param string $annotationId ID de l'annotation
     * @param string $userId ID de l'utilisateur
     * @return array Résultat de l'opération
     */
    public function deleteAnnotation($annotationId, $userId) {
        try {
            $annotation = $this->getAnnotation($annotationId);
            if (!$annotation) {
                return ['success' => false, 'error' => 'Annotation not found'];
            }

            // Seul l'auteur ou un admin peut supprimer
            // Cette vérification devrait être faite par le contrôleur avec RBAC

            $stmt = $this->db->prepare("DELETE FROM annotations WHERE id = ?");
            $stmt->execute([$annotationId]);

            return ['success' => true];

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Générer une suggestion IA pour une annotation
     *
     * @param string $annotationId ID de l'annotation
     * @param array $context Contexte pour l'IA
     * @return array Résultat avec suggestion
     */
    public function generateAISuggestion($annotationId, $context = []) {
        try {
            $annotation = $this->getAnnotation($annotationId);
            if (!$annotation) {
                return ['success' => false, 'error' => 'Annotation not found'];
            }

            // TODO: Intégrer avec un service IA (Mistral, GPT, etc.)
            // Pour l'instant, retourner un placeholder
            $suggestion = $this->callAIService($annotation, $context);

            // Sauvegarder la suggestion dans l'annotation
            $stmt = $this->db->prepare("
                UPDATE annotations
                SET ai_suggestion = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([$suggestion, $annotationId]);

            return [
                'success' => true,
                'suggestion' => $suggestion,
                'annotation' => $this->getAnnotation($annotationId)
            ];

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Obtenir les statistiques des annotations pour un thème
     *
     * @param string $themeId ID du thème
     * @return array Statistiques
     */
    public function getAnnotationStats($themeId) {
        $stmt = $this->db->prepare("
            SELECT
                status,
                annotation_type,
                COUNT(*) as count
            FROM annotations
            WHERE theme_id = ?
            GROUP BY status, annotation_type
        ");

        $stmt->execute([$themeId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats = [
            'total' => 0,
            'by_status' => [],
            'by_type' => [],
            'open_count' => 0,
            'resolved_count' => 0
        ];

        foreach ($rows as $row) {
            $count = (int)$row['count'];
            $stats['total'] += $count;
            $stats['by_status'][$row['status']] = ($stats['by_status'][$row['status']] ?? 0) + $count;
            $stats['by_type'][$row['annotation_type']] = ($stats['by_type'][$row['annotation_type']] ?? 0) + $count;

            if ($row['status'] === self::STATUS_OPEN) {
                $stats['open_count'] += $count;
            } elseif ($row['status'] === self::STATUS_RESOLVED) {
                $stats['resolved_count'] += $count;
            }
        }

        return $stats;
    }

    /**
     * Récupérer un thème (méthode helper)
     */
    private function getTheme($themeId) {
        $stmt = $this->db->prepare("SELECT * FROM themes WHERE id = ?");
        $stmt->execute([$themeId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Notifier l'auteur du thème d'une nouvelle annotation
     */
    private function notifyThemeAuthor($themeId, $annotationId, $annotationType) {
        $theme = $this->getTheme($themeId);
        if (!$theme) return;

        $notifId = 'notif_' . bin2hex(random_bytes(16));

        $stmt = $this->db->prepare("
            INSERT INTO workflow_notifications (
                id, tenant_id, user_id, theme_id,
                notification_type, title, message,
                metadata, created_at
            ) VALUES (?, ?, ?, ?, 'new_annotation', ?, ?, ?, NOW())
        ");

        $title = "Nouvelle annotation sur votre thème";
        $message = "Une annotation de type '{$annotationType}' a été ajoutée sur le thème '{$theme['title']}'";
        $metadata = json_encode(['annotation_id' => $annotationId]);

        $stmt->execute([
            $notifId,
            $theme['tenant_id'],
            $theme['created_by'],
            $themeId,
            $title,
            $message,
            $metadata
        ]);
    }

    /**
     * Notifier la résolution d'une annotation
     */
    private function notifyAnnotationResolved($annotationId, $resolvedBy) {
        $annotation = $this->getAnnotation($annotationId);
        if (!$annotation) return;

        $notifId = 'notif_' . bin2hex(random_bytes(16));

        $stmt = $this->db->prepare("
            INSERT INTO workflow_notifications (
                id, tenant_id, user_id, theme_id,
                notification_type, title, message,
                metadata, created_at
            ) VALUES (?, ?, ?, ?, 'annotation_resolved', ?, ?, ?, NOW())
        ");

        $title = "Annotation résolue";
        $message = "Votre annotation a été résolue";
        $metadata = json_encode(['annotation_id' => $annotationId, 'resolved_by' => $resolvedBy]);

        $stmt->execute([
            $notifId,
            $annotation['tenant_id'],
            $annotation['author_user_id'],
            $annotation['theme_id'],
            $title,
            $message,
            $metadata
        ]);
    }

    /**
     * Appeler le service IA pour générer une suggestion
     * TODO: Implémenter l'intégration avec Mistral ou autre IA
     */
    private function callAIService($annotation, $context) {
        // Placeholder pour l'intégration IA
        return "Suggestion IA: Vérifier l'orthographe et la grammaire du contenu";
    }
}
