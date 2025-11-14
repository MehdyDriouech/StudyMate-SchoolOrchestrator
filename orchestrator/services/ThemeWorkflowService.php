<?php
/**
 * Sprint 19 - Multi-Review Workflow
 * Service: ThemeWorkflowService
 * Description: Gestion du workflow de validation des thèmes
 *
 * Workflow: draft → pending_review → approved → published
 *
 * Fonctionnalités:
 * - Soumission pour validation
 * - Approbation par référent
 * - Publication par direction
 * - Historique complet des transitions
 * - Affectation de reviewers
 *
 * @version 1.0.0
 * @date 2025-11-14
 */

class ThemeWorkflowService {
    private $db;

    // États du workflow
    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING_REVIEW = 'pending_review';
    const STATUS_APPROVED = 'approved';
    const STATUS_PUBLISHED = 'published';
    const STATUS_ARCHIVED = 'archived';

    // Transitions autorisées [from => [to states]]
    const ALLOWED_TRANSITIONS = [
        self::STATUS_DRAFT => [self::STATUS_PENDING_REVIEW, self::STATUS_ARCHIVED],
        self::STATUS_PENDING_REVIEW => [self::STATUS_APPROVED, self::STATUS_DRAFT],
        self::STATUS_APPROVED => [self::STATUS_PUBLISHED, self::STATUS_DRAFT],
        self::STATUS_PUBLISHED => [self::STATUS_ARCHIVED],
        self::STATUS_ARCHIVED => [self::STATUS_DRAFT]
    ];

    // Permissions par transition (rôles autorisés)
    const TRANSITION_PERMISSIONS = [
        self::STATUS_PENDING_REVIEW => ['teacher', 'admin', 'direction'],
        self::STATUS_APPROVED => ['referent', 'admin', 'direction'],
        self::STATUS_PUBLISHED => ['direction', 'admin'],
        self::STATUS_ARCHIVED => ['admin', 'direction'],
        self::STATUS_DRAFT => ['teacher', 'admin', 'direction', 'referent']
    ];

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Soumettre un thème pour validation
     *
     * @param string $themeId ID du thème
     * @param string $userId ID de l'utilisateur
     * @param string $comment Commentaire optionnel
     * @return array Résultat de l'opération
     */
    public function submitForReview($themeId, $userId, $comment = null) {
        try {
            $theme = $this->getTheme($themeId);

            if (!$theme) {
                return ['success' => false, 'error' => 'Theme not found'];
            }

            // Vérifier que c'est bien un draft
            if ($theme['status'] !== self::STATUS_DRAFT) {
                return [
                    'success' => false,
                    'error' => 'Only draft themes can be submitted for review'
                ];
            }

            // Vérifier ownership ou permissions admin
            if ($theme['created_by'] !== $userId) {
                return ['success' => false, 'error' => 'You can only submit your own themes'];
            }

            // Vérifier que le thème est complet (validation basique)
            $validation = $this->validateThemeCompleteness($theme);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'error' => 'Theme is incomplete',
                    'validation_errors' => $validation['errors']
                ];
            }

            // Transition vers pending_review
            $result = $this->transitionStatus(
                $themeId,
                $userId,
                self::STATUS_DRAFT,
                self::STATUS_PENDING_REVIEW,
                $comment ?? 'Submitted for review'
            );

            if ($result['success']) {
                // Mettre à jour les timestamps
                $stmt = $this->db->prepare("
                    UPDATE themes
                    SET submitted_at = NOW(),
                        submitted_by = ?
                    WHERE id = ?
                ");
                $stmt->execute([$userId, $themeId]);

                // Notifier les référents pédagogiques
                $this->notifyReferents($themeId, $theme['tenant_id']);
            }

            return $result;

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Approuver un thème (par référent)
     *
     * @param string $themeId ID du thème
     * @param string $userId ID du référent
     * @param string $comment Commentaire de validation
     * @return array Résultat de l'opération
     */
    public function approveTheme($themeId, $userId, $comment = null) {
        try {
            $theme = $this->getTheme($themeId);

            if (!$theme) {
                return ['success' => false, 'error' => 'Theme not found'];
            }

            // Vérifier que le thème est en pending_review
            if ($theme['status'] !== self::STATUS_PENDING_REVIEW) {
                return [
                    'success' => false,
                    'error' => 'Only themes pending review can be approved'
                ];
            }

            // Vérifier qu'il n'y a pas d'annotations ouvertes critiques
            $openAnnotations = $this->getOpenCriticalAnnotations($themeId);
            if (!empty($openAnnotations)) {
                return [
                    'success' => false,
                    'error' => 'Theme has unresolved critical annotations',
                    'open_annotations' => $openAnnotations
                ];
            }

            // Transition vers approved
            $result = $this->transitionStatus(
                $themeId,
                $userId,
                self::STATUS_PENDING_REVIEW,
                self::STATUS_APPROVED,
                $comment ?? 'Theme approved'
            );

            if ($result['success']) {
                // Mettre à jour les timestamps
                $stmt = $this->db->prepare("
                    UPDATE themes
                    SET reviewed_at = NOW(),
                        reviewed_by = ?
                    WHERE id = ?
                ");
                $stmt->execute([$userId, $themeId]);

                // Notifier l'auteur
                $this->notifyThemeAuthor($themeId, $theme['created_by'], 'approved');

                // Marquer la revue comme complétée
                $this->completeReviewAssignment($themeId, $userId);
            }

            return $result;

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Rejeter un thème et le remettre en draft
     *
     * @param string $themeId ID du thème
     * @param string $userId ID du référent
     * @param string $comment Commentaire de rejet (obligatoire)
     * @return array Résultat de l'opération
     */
    public function rejectTheme($themeId, $userId, $comment) {
        try {
            if (empty($comment)) {
                return [
                    'success' => false,
                    'error' => 'Rejection comment is required'
                ];
            }

            $theme = $this->getTheme($themeId);

            if (!$theme) {
                return ['success' => false, 'error' => 'Theme not found'];
            }

            if ($theme['status'] !== self::STATUS_PENDING_REVIEW) {
                return [
                    'success' => false,
                    'error' => 'Only themes pending review can be rejected'
                ];
            }

            // Transition vers draft
            $result = $this->transitionStatus(
                $themeId,
                $userId,
                self::STATUS_PENDING_REVIEW,
                self::STATUS_DRAFT,
                $comment
            );

            if ($result['success']) {
                // Notifier l'auteur
                $this->notifyThemeAuthor($themeId, $theme['created_by'], 'rejected', $comment);

                // Marquer la revue comme complétée
                $this->completeReviewAssignment($themeId, $userId);
            }

            return $result;

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Publier un thème approuvé
     *
     * @param string $themeId ID du thème
     * @param string $userId ID de l'utilisateur (direction/admin)
     * @param string $comment Commentaire optionnel
     * @return array Résultat de l'opération
     */
    public function publishTheme($themeId, $userId, $comment = null) {
        try {
            $theme = $this->getTheme($themeId);

            if (!$theme) {
                return ['success' => false, 'error' => 'Theme not found'];
            }

            // Vérifier que le thème est approuvé
            if ($theme['status'] !== self::STATUS_APPROVED) {
                return [
                    'success' => false,
                    'error' => 'Only approved themes can be published'
                ];
            }

            // Transition vers published
            $result = $this->transitionStatus(
                $themeId,
                $userId,
                self::STATUS_APPROVED,
                self::STATUS_PUBLISHED,
                $comment ?? 'Theme published'
            );

            if ($result['success']) {
                // Mettre à jour les timestamps
                $stmt = $this->db->prepare("
                    UPDATE themes
                    SET published_at = NOW(),
                        published_by = ?,
                        is_public = TRUE
                    WHERE id = ?
                ");
                $stmt->execute([$userId, $themeId]);

                // Notifier l'auteur
                $this->notifyThemeAuthor($themeId, $theme['created_by'], 'published');

                // Créer une version milestone
                $this->createMilestoneVersion($themeId, $userId, 'Publication');
            }

            return $result;

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Archiver un thème
     *
     * @param string $themeId ID du thème
     * @param string $userId ID de l'utilisateur
     * @param string $reason Raison de l'archivage
     * @return array Résultat de l'opération
     */
    public function archiveTheme($themeId, $userId, $reason = null) {
        try {
            $theme = $this->getTheme($themeId);

            if (!$theme) {
                return ['success' => false, 'error' => 'Theme not found'];
            }

            $result = $this->transitionStatus(
                $themeId,
                $userId,
                $theme['status'],
                self::STATUS_ARCHIVED,
                $reason ?? 'Theme archived'
            );

            return $result;

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Affecter un référent à la revue d'un thème
     *
     * @param string $themeId ID du thème
     * @param string $reviewerId ID du référent
     * @param string $assignedBy ID de l'utilisateur qui affecte
     * @param array $options Options (priority, due_date)
     * @return array Résultat de l'opération
     */
    public function assignReviewer($themeId, $reviewerId, $assignedBy, $options = []) {
        try {
            $theme = $this->getTheme($themeId);

            if (!$theme) {
                return ['success' => false, 'error' => 'Theme not found'];
            }

            // Vérifier que le reviewer existe et a le bon rôle
            $reviewer = $this->getUser($reviewerId);
            if (!$reviewer || !in_array($reviewer['role'], ['referent', 'direction', 'admin'])) {
                return ['success' => false, 'error' => 'Invalid reviewer'];
            }

            $assignmentId = 'rev_' . bin2hex(random_bytes(16));
            $priority = $options['priority'] ?? 'normal';
            $dueDate = $options['due_date'] ?? null;

            $stmt = $this->db->prepare("
                INSERT INTO review_assignments (
                    id, theme_id, tenant_id, reviewer_user_id,
                    assigned_by, reviewer_role, priority, due_date,
                    status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
            ");

            $stmt->execute([
                $assignmentId,
                $themeId,
                $theme['tenant_id'],
                $reviewerId,
                $assignedBy,
                $reviewer['role'],
                $priority,
                $dueDate
            ]);

            // Notifier le reviewer
            $this->notifyReviewAssignment($assignmentId, $reviewerId);

            return [
                'success' => true,
                'assignment_id' => $assignmentId
            ];

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Effectuer une transition de statut
     *
     * @param string $themeId ID du thème
     * @param string $userId ID de l'utilisateur
     * @param string $fromStatus Statut actuel
     * @param string $toStatus Nouveau statut
     * @param string $comment Commentaire
     * @return array Résultat
     */
    private function transitionStatus($themeId, $userId, $fromStatus, $toStatus, $comment) {
        try {
            // Vérifier que la transition est autorisée
            if (!$this->isTransitionAllowed($fromStatus, $toStatus)) {
                return [
                    'success' => false,
                    'error' => "Transition from {$fromStatus} to {$toStatus} is not allowed"
                ];
            }

            $this->db->beginTransaction();

            // Récupérer le tenant_id
            $theme = $this->getTheme($themeId);

            // Mettre à jour le statut
            $stmt = $this->db->prepare("
                UPDATE themes
                SET status = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$toStatus, $themeId]);

            // Enregistrer la transition dans l'historique
            $this->logStatusTransition(
                $themeId,
                $theme['tenant_id'],
                $fromStatus,
                $toStatus,
                $userId,
                $comment
            );

            $this->db->commit();

            return [
                'success' => true,
                'theme_id' => $themeId,
                'previous_status' => $fromStatus,
                'new_status' => $toStatus,
                'comment' => $comment
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Vérifier si une transition est autorisée
     */
    public function isTransitionAllowed($fromStatus, $toStatus) {
        if (!isset(self::ALLOWED_TRANSITIONS[$fromStatus])) {
            return false;
        }
        return in_array($toStatus, self::ALLOWED_TRANSITIONS[$fromStatus]);
    }

    /**
     * Vérifier si un utilisateur peut effectuer une transition
     */
    public function canUserTransition($toStatus, $userRole) {
        if (!isset(self::TRANSITION_PERMISSIONS[$toStatus])) {
            return false;
        }
        return in_array($userRole, self::TRANSITION_PERMISSIONS[$toStatus]);
    }

    /**
     * Enregistrer une transition dans l'historique
     */
    private function logStatusTransition($themeId, $tenantId, $fromStatus, $toStatus, $userId, $comment) {
        $historyId = 'hist_' . bin2hex(random_bytes(16));

        $stmt = $this->db->prepare("
            INSERT INTO theme_status_history (
                id, theme_id, tenant_id, status_from, status_to,
                actor_user_id, comment, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            $historyId,
            $themeId,
            $tenantId,
            $fromStatus,
            $toStatus,
            $userId,
            $comment
        ]);
    }

    /**
     * Récupérer l'historique du workflow d'un thème
     */
    public function getWorkflowHistory($themeId) {
        $stmt = $this->db->prepare("
            SELECT
                h.*,
                u.firstname AS actor_firstname,
                u.lastname AS actor_lastname,
                u.role AS actor_role
            FROM theme_status_history h
            LEFT JOIN users u ON h.actor_user_id = u.id
            WHERE h.theme_id = ?
            ORDER BY h.created_at DESC
        ");

        $stmt->execute([$themeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Valider que le thème est complet avant soumission
     */
    private function validateThemeCompleteness($theme) {
        $errors = [];

        if (empty($theme['title'])) {
            $errors[] = 'Title is required';
        }

        if (empty($theme['content'])) {
            $errors[] = 'Content is required';
        } else {
            $content = json_decode($theme['content'], true);

            // Vérifier qu'il y a au moins des questions ou des flashcards
            $hasQuestions = !empty($content['questions']) && is_array($content['questions']);
            $hasFlashcards = !empty($content['flashcards']) && is_array($content['flashcards']);

            if (!$hasQuestions && !$hasFlashcards) {
                $errors[] = 'Theme must have at least questions or flashcards';
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Récupérer les annotations critiques ouvertes
     */
    private function getOpenCriticalAnnotations($themeId) {
        $stmt = $this->db->prepare("
            SELECT * FROM annotations
            WHERE theme_id = ?
              AND status = 'open'
              AND annotation_type IN ('error', 'warning')
        ");

        $stmt->execute([$themeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Marquer une affectation de revue comme complétée
     */
    private function completeReviewAssignment($themeId, $reviewerId) {
        $stmt = $this->db->prepare("
            UPDATE review_assignments
            SET status = 'completed',
                completed_at = NOW()
            WHERE theme_id = ?
              AND reviewer_user_id = ?
              AND status = 'in_progress'
        ");

        $stmt->execute([$themeId, $reviewerId]);
    }

    /**
     * Créer une version milestone
     */
    private function createMilestoneVersion($themeId, $userId, $summary) {
        $theme = $this->getTheme($themeId);
        if (!$theme) return;

        $versionId = 'ver_' . bin2hex(random_bytes(16));

        $stmt = $this->db->prepare("
            INSERT INTO theme_versions (
                id, theme_id, tenant_id, version, data,
                title, status, created_by, change_summary,
                is_milestone, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())
        ");

        $stmt->execute([
            $versionId,
            $themeId,
            $theme['tenant_id'],
            $theme['version'],
            $theme['content'],
            $theme['title'],
            $theme['status'],
            $userId,
            $summary
        ]);
    }

    /**
     * Notifier les référents pédagogiques
     */
    private function notifyReferents($themeId, $tenantId) {
        $theme = $this->getTheme($themeId);
        if (!$theme) return;

        // Récupérer tous les référents du tenant
        $stmt = $this->db->prepare("
            SELECT id FROM users
            WHERE tenant_id = ?
              AND role IN ('referent', 'direction')
              AND status = 'active'
        ");

        $stmt->execute([$tenantId]);
        $referents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($referents as $referent) {
            $notifId = 'notif_' . bin2hex(random_bytes(16));

            $insertStmt = $this->db->prepare("
                INSERT INTO workflow_notifications (
                    id, tenant_id, user_id, theme_id,
                    notification_type, title, message, created_at
                ) VALUES (?, ?, ?, ?, 'review_assigned', ?, ?, NOW())
            ");

            $title = "Nouveau thème à valider";
            $message = "Le thème '{$theme['title']}' a été soumis pour validation";

            $insertStmt->execute([
                $notifId, $tenantId, $referent['id'], $themeId, $title, $message
            ]);
        }
    }

    /**
     * Notifier l'auteur d'un thème
     */
    private function notifyThemeAuthor($themeId, $authorId, $action, $comment = null) {
        $theme = $this->getTheme($themeId);
        if (!$theme) return;

        $notifId = 'notif_' . bin2hex(random_bytes(16));

        $titles = [
            'approved' => "Thème approuvé",
            'rejected' => "Thème à réviser",
            'published' => "Thème publié"
        ];

        $messages = [
            'approved' => "Votre thème '{$theme['title']}' a été approuvé",
            'rejected' => "Votre thème '{$theme['title']}' nécessite des modifications",
            'published' => "Votre thème '{$theme['title']}' a été publié"
        ];

        $stmt = $this->db->prepare("
            INSERT INTO workflow_notifications (
                id, tenant_id, user_id, theme_id,
                notification_type, title, message, metadata, created_at
            ) VALUES (?, ?, ?, ?, 'status_change', ?, ?, ?, NOW())
        ");

        $metadata = json_encode(['action' => $action, 'comment' => $comment]);

        $stmt->execute([
            $notifId,
            $theme['tenant_id'],
            $authorId,
            $themeId,
            $titles[$action] ?? "Mise à jour du thème",
            ($messages[$action] ?? "Votre thème a été mis à jour") . ($comment ? ": {$comment}" : ""),
            $metadata
        ]);
    }

    /**
     * Notifier une affectation de revue
     */
    private function notifyReviewAssignment($assignmentId, $reviewerId) {
        $stmt = $this->db->prepare("
            SELECT ra.*, t.title, t.tenant_id
            FROM review_assignments ra
            JOIN themes t ON ra.theme_id = t.id
            WHERE ra.id = ?
        ");

        $stmt->execute([$assignmentId]);
        $assignment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$assignment) return;

        $notifId = 'notif_' . bin2hex(random_bytes(16));

        $insertStmt = $this->db->prepare("
            INSERT INTO workflow_notifications (
                id, tenant_id, user_id, theme_id,
                notification_type, title, message, metadata, created_at
            ) VALUES (?, ?, ?, ?, 'review_assigned', ?, ?, ?, NOW())
        ");

        $title = "Revue de thème assignée";
        $message = "Vous avez été assigné à la revue du thème '{$assignment['title']}'";
        $metadata = json_encode(['assignment_id' => $assignmentId, 'priority' => $assignment['priority']]);

        $insertStmt->execute([
            $notifId,
            $assignment['tenant_id'],
            $reviewerId,
            $assignment['theme_id'],
            $title,
            $message,
            $metadata
        ]);
    }

    /**
     * Récupérer un thème
     */
    private function getTheme($themeId) {
        $stmt = $this->db->prepare("SELECT * FROM themes WHERE id = ?");
        $stmt->execute([$themeId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Récupérer un utilisateur
     */
    private function getUser($userId) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Obtenir les statistiques du workflow
     */
    public function getWorkflowStats($tenantId) {
        $stmt = $this->db->prepare("
            SELECT status, COUNT(*) as count
            FROM themes
            WHERE tenant_id = ?
            GROUP BY status
        ");

        $stmt->execute([$tenantId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats = [];
        foreach ($rows as $row) {
            $stats[$row['status']] = (int)$row['count'];
        }

        return $stats;
    }
}
