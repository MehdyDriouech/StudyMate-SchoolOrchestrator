<?php
/**
 * Service de notifications
 *
 * Gère l'envoi de notifications aux étudiants et professeurs
 * - Notifications in-app (bannières)
 * - Emails (optionnel)
 * - Push vers Ergo-Mate
 */

class NotificationService {
    private $db;

    public function __construct() {
        $this->db = db();
    }

    /**
     * Notifier la création d'un assignment
     *
     * @param string $assignmentId ID de l'assignment
     * @param array $targets Liste des cibles [{type: 'student|class|promo', id: 'xxx'}]
     */
    public function notifyAssignmentCreated($assignmentId, $targets) {
        try {
            // Récupérer les détails de l'assignment
            $assignment = $this->db->queryOne(
                'SELECT a.*, t.title as theme_title, u.firstname as teacher_firstname, u.lastname as teacher_lastname
                 FROM assignments a
                 JOIN themes t ON a.theme_id = t.id
                 JOIN users u ON a.teacher_id = u.id
                 WHERE a.id = :id',
                ['id' => $assignmentId]
            );

            if (!$assignment) {
                logError('Assignment not found for notification', ['assignment_id' => $assignmentId]);
                return false;
            }

            // Résoudre les cibles en liste d'étudiants
            $students = $this->resolveTargets($targets, $assignment['tenant_id']);

            if (empty($students)) {
                logWarn('No students found for assignment notification', [
                    'assignment_id' => $assignmentId,
                    'targets' => $targets
                ]);
                return false;
            }

            $teacherName = $assignment['teacher_firstname'] . ' ' . $assignment['teacher_lastname'];
            $title = "Nouvelle mission : " . $assignment['title'];
            $message = sprintf(
                "%s vous a assigné un %s sur le thème '%s'.",
                $teacherName,
                $this->getTypeName($assignment['type']),
                $assignment['theme_title']
            );

            if ($assignment['due_at']) {
                $dueDate = date('d/m/Y', strtotime($assignment['due_at']));
                $message .= " À rendre avant le $dueDate.";
            }

            // Créer les notifications pour chaque étudiant
            foreach ($students as $student) {
                $this->createNotification(
                    $assignment['tenant_id'],
                    'student',
                    $student['id'],
                    'assignment',
                    $title,
                    $message,
                    '/assignments/' . $assignmentId,
                    'both' // in-app + email
                );
            }

            // Push vers Ergo-Mate (webhook)
            $this->pushToErgoMate($assignment, $students);

            logInfo('Assignment notifications sent', [
                'assignment_id' => $assignmentId,
                'student_count' => count($students)
            ]);

            return true;

        } catch (Exception $e) {
            logError('Failed to send assignment notifications', [
                'assignment_id' => $assignmentId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Résoudre les cibles en liste d'étudiants
     *
     * @param array $targets [{type: 'student|class|promo', id: 'xxx'}]
     * @param string $tenantId
     * @return array Liste des étudiants
     */
    private function resolveTargets($targets, $tenantId) {
        $students = [];
        $studentIds = [];

        foreach ($targets as $target) {
            $type = $target['type'];
            $id = $target['id'];

            if ($type === 'student') {
                // Récupérer l'étudiant directement
                $student = $this->db->queryOne(
                    'SELECT * FROM students WHERE id = :id AND tenant_id = :tenant_id',
                    ['id' => $id, 'tenant_id' => $tenantId]
                );
                if ($student && !in_array($student['id'], $studentIds)) {
                    $students[] = $student;
                    $studentIds[] = $student['id'];
                }

            } elseif ($type === 'class') {
                // Récupérer tous les étudiants de la classe
                $classStudents = $this->db->query(
                    'SELECT * FROM students WHERE class_id = :class_id AND tenant_id = :tenant_id AND status = \'active\'',
                    ['class_id' => $id, 'tenant_id' => $tenantId]
                );
                foreach ($classStudents as $student) {
                    if (!in_array($student['id'], $studentIds)) {
                        $students[] = $student;
                        $studentIds[] = $student['id'];
                    }
                }

            } elseif ($type === 'promo') {
                // Récupérer tous les étudiants de la promo
                $promoStudents = $this->db->query(
                    'SELECT * FROM students WHERE promo_id = :promo_id AND tenant_id = :tenant_id AND status = \'active\'',
                    ['promo_id' => $id, 'tenant_id' => $tenantId]
                );
                foreach ($promoStudents as $student) {
                    if (!in_array($student['id'], $studentIds)) {
                        $students[] = $student;
                        $studentIds[] = $student['id'];
                    }
                }
            }
        }

        return $students;
    }

    /**
     * Créer une notification
     */
    private function createNotification($tenantId, $recipientType, $recipientId, $notificationType, $title, $message, $linkUrl = null, $deliveryMethod = 'in-app') {
        $notificationId = generateId('notif');

        $this->db->execute(
            'INSERT INTO notifications
             (id, tenant_id, recipient_type, recipient_id, notification_type, title, message, link_url, delivery_method, status, created_at)
             VALUES (:id, :tenant_id, :recipient_type, :recipient_id, :notification_type, :title, :message, :link_url, :delivery_method, :status, NOW())',
            [
                'id' => $notificationId,
                'tenant_id' => $tenantId,
                'recipient_type' => $recipientType,
                'recipient_id' => $recipientId,
                'notification_type' => $notificationType,
                'title' => $title,
                'message' => $message,
                'link_url' => $linkUrl,
                'delivery_method' => $deliveryMethod,
                'status' => 'pending'
            ]
        );

        // En mode LIVE, envoyer l'email immédiatement (async recommandé en production)
        if ($deliveryMethod === 'email' || $deliveryMethod === 'both') {
            // TODO: Implémenter l'envoi d'email
            // $this->sendEmail($recipientId, $title, $message);
        }

        return $notificationId;
    }

    /**
     * Push vers Ergo-Mate
     *
     * Envoie un webhook à Ergo-Mate pour notifier la nouvelle mission
     */
    private function pushToErgoMate($assignment, $students) {
        // URL du webhook Ergo-Mate (configurable)
        $ergoWebhookUrl = ERGO_MATE_WEBHOOK_URL ?? null;

        if (!$ergoWebhookUrl) {
            logWarn('Ergo-Mate webhook URL not configured');
            return false;
        }

        // En mode MOCK, ne pas envoyer réellement
        if (defined('MOCK_MODE') && MOCK_MODE === true) {
            logInfo('MOCK: Would push to Ergo-Mate', [
                'assignment_id' => $assignment['id'],
                'student_count' => count($students)
            ]);

            // Simuler l'envoi et mettre à jour le statut
            $this->db->execute(
                'UPDATE assignments SET status = :status, ergo_push_at = NOW() WHERE id = :id',
                ['id' => $assignment['id'], 'status' => 'pushed']
            );

            return true;
        }

        // Construire le payload
        $payload = [
            'assignment_id' => $assignment['id'],
            'title' => $assignment['title'],
            'type' => $assignment['type'],
            'theme_id' => $assignment['theme_id'],
            'instructions' => $assignment['instructions'],
            'due_at' => $assignment['due_at'],
            'mode' => $assignment['mode'],
            'students' => array_map(function($student) {
                return [
                    'student_id' => $student['id'],
                    'uuid_scolaire' => $student['uuid_scolaire'],
                    'email_scolaire' => $student['email_scolaire']
                ];
            }, $students)
        ];

        // Envoyer le webhook
        try {
            $ch = curl_init($ergoWebhookUrl . '/api/v1/assignments/push');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'X-Orchestrator-Id: ' . $assignment['tenant_id']
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 202 || $httpCode === 200) {
                // Succès
                $this->db->execute(
                    'UPDATE assignments SET status = :status, ergo_push_at = NOW() WHERE id = :id',
                    ['id' => $assignment['id'], 'status' => 'pushed']
                );

                logInfo('Assignment pushed to Ergo-Mate', [
                    'assignment_id' => $assignment['id'],
                    'http_code' => $httpCode
                ]);

                return true;
            } else {
                // Erreur
                logError('Failed to push assignment to Ergo-Mate', [
                    'assignment_id' => $assignment['id'],
                    'http_code' => $httpCode,
                    'response' => $response
                ]);

                $this->db->execute(
                    'UPDATE assignments SET status = :status WHERE id = :id',
                    ['id' => $assignment['id'], 'status' => 'error']
                );

                return false;
            }

        } catch (Exception $e) {
            logError('Exception pushing to Ergo-Mate', [
                'assignment_id' => $assignment['id'],
                'error' => $e->getMessage()
            ]);

            $this->db->execute(
                'UPDATE assignments SET status = :status WHERE id = :id',
                ['id' => $assignment['id'], 'status' => 'error']
            );

            return false;
        }
    }

    /**
     * Obtenir le nom français du type
     */
    private function getTypeName($type) {
        $types = [
            'quiz' => 'quiz',
            'flashcards' => 'jeu de flashcards',
            'fiche' => 'fiche de révision',
            'annales' => 'annales'
        ];

        return $types[$type] ?? $type;
    }

    /**
     * Récupérer les notifications d'un utilisateur
     */
    public function getNotifications($recipientType, $recipientId, $limit = 20, $offset = 0) {
        return $this->db->query(
            'SELECT * FROM notifications
             WHERE recipient_type = :recipient_type AND recipient_id = :recipient_id
             ORDER BY created_at DESC
             LIMIT :limit OFFSET :offset',
            [
                'recipient_type' => $recipientType,
                'recipient_id' => $recipientId,
                'limit' => $limit,
                'offset' => $offset
            ]
        );
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead($notificationId) {
        return $this->db->execute(
            'UPDATE notifications SET read_at = NOW() WHERE id = :id',
            ['id' => $notificationId]
        );
    }
}
