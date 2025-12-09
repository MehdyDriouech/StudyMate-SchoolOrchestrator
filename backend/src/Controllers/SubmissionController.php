<?php
/**
 * Controller Submission - Gestion des endpoints REST
 * Point d'entrée pour toutes les requêtes liées aux soumissions
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Repositories\SubmissionRepository;
use Services\SubmissionService;
use Services\AuthService;

class SubmissionController
{
    private SubmissionService $service;
    private ?AuthService $authService;

    public function __construct(?AuthService $authService = null)
    {
        $repository = new SubmissionRepository();
        $this->service = new SubmissionService($repository);
        $this->authService = $authService;
    }

    /**
     * Vérifie que l'utilisateur est authentifié
     * Retourne l'utilisateur authentifié ou null si non authentifié
     */
    private function requireAuth(Request $request, Response $response): ?array
    {
        if ($this->authService === null) {
            error_log('SubmissionController: AuthService not provided');
            $response->error('Authentication service not available', 500)->send();
            return null;
        }

        $user = $this->authService->getAuthenticatedUser($request);
        
        if ($user === null) {
            $response->error('Authentication required', 401)->send();
            return null;
        }

        return $user;
    }

    /**
     * POST /submissions
     * Crée ou met à jour une soumission (ErgoMate App)
     * 
     * Payload:
     * {
     *   "assignment_id": 12,
     *   "student_id": 45, // Ou dérivé du token
     *   "score": 85.5,
     *   "duration": 300,
     *   "responses": { ...json... }
     * }
     * 
     * Requiert une authentification (student)
     */
    public function create(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        try {
            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            // Si l'utilisateur est un étudiant, utiliser son ID depuis le token
            // Sinon, utiliser student_id depuis le body (pour les tests/admin)
            $studentId = null;
            if ($user['role'] === 'student') {
                $studentId = $user['id'];
            } else {
                // Pour les autres rôles (teacher, admin), permettre de spécifier student_id
                $studentId = $body['student_id'] ?? null;
            }

            // Créer ou mettre à jour la soumission
            $submission = $this->service->createOrUpdateSubmission($body, $studentId);

            $response->success($submission->toArray(), 201)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('SubmissionController::create error: ' . $e->getMessage());
            $response->serverError('Failed to save submission')->send();
        }
    }

    /**
     * GET /assignments/:id/submissions
     * Récupère toutes les soumissions pour un assignment (Gradebook Teacher)
     * 
     * Format de réponse (compatible FakeRouter):
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "student_id": 45,
     *       "student_name": "Jean Dupont",
     *       "status": "submitted", // ou "pending"
     *       "score": 85.5,
     *       "submitted_at": "2023-11-25 10:00:00",
     *       "details": { ...raw_response... }
     *     },
     *     ...
     *   ]
     * }
     * 
     * Requiert une authentification (teacher, pedago, director)
     */
    public function getByAssignment(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        try {
            $assignmentId = (int) $request->getRouteParam('id');

            if ($assignmentId <= 0) {
                $response->error('Invalid assignment ID', 400)->send();
                return;
            }

            // Récupérer l'assignment pour obtenir le class_id
            $assignmentRepo = new \Repositories\AssignmentRepository();
            $assignment = $assignmentRepo->findById($assignmentId);

            if ($assignment === null) {
                $response->error('Assignment not found', 404)->send();
                return;
            }

            // Récupérer les soumissions avec les informations des étudiants
            $submissions = $this->service->getSubmissionsForGradebook(
                $assignmentId,
                $assignment->classId
            );

            // Si aucune soumission, retourner une liste vide (pas d'erreur 500)
            $response->success($submissions)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('SubmissionController::getByAssignment error: ' . $e->getMessage());
            $response->serverError('Failed to fetch submissions')->send();
        }
    }
}

