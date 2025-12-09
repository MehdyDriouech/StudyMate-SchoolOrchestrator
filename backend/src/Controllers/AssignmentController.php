<?php
/**
 * Controller Assignment - Gestion des endpoints REST
 * Point d'entrée pour toutes les requêtes liées aux assignments
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Repositories\AssignmentRepository;
use Services\AssignmentService;
use Services\AuthService;

class AssignmentController
{
    private AssignmentService $service;
    private ?AuthService $authService;

    public function __construct(?AuthService $authService = null)
    {
        $repository = new AssignmentRepository();
        $this->service = new AssignmentService($repository);
        $this->authService = $authService;
    }

    /**
     * Vérifie que l'utilisateur est authentifié
     * Retourne l'utilisateur authentifié ou null si non authentifié
     */
    private function requireAuth(Request $request, Response $response): ?array
    {
        if ($this->authService === null) {
            error_log('AssignmentController: AuthService not provided');
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
     * Vérifie que l'utilisateur a un des rôles autorisés
     * 
     * @param array $user - Utilisateur authentifié
     * @param array $allowedRoles - Liste des rôles autorisés
     * @return bool
     */
    private function requireRole(array $user, array $allowedRoles): bool
    {
        return in_array($user['role'], $allowedRoles, true);
    }

    /**
     * GET /api/assignments
     * Liste les assignments selon le rôle de l'utilisateur
     * 
     * Règles d'accès :
     * - student : uniquement ses propres assignments (via class_students)
     * - teacher : uniquement les assignments de ses classes (via themes.created_by)
     * - pedago : tous les assignments de son établissement
     * - director : tous les assignments de son établissement (read-only)
     * 
     * Requiert une authentification
     */
    public function index(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        try {
            // Filtrer les assignments selon le rôle
            $assignments = $this->service->getAssignmentsForUser($user);
            $data = array_map(function ($assignment) {
                return $assignment->toArray();
            }, $assignments);

            $response->success($data)->send();
        } catch (\Exception $e) {
            error_log('AssignmentController::index error: ' . $e->getMessage());
            $response->serverError('Failed to fetch assignments')->send();
        }
    }

    /**
     * GET /api/assignments/{id}
     * Récupère un assignment par ID
     * Requiert une authentification
     */
    public function show(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid assignment ID', 400)->send();
                return;
            }

            $assignment = $this->service->getAssignmentById($id);

            if ($assignment === null) {
                $response->notFound('Assignment not found')->send();
                return;
            }

            $response->success($assignment->toArray())->send();
        } catch (\Exception $e) {
            error_log('AssignmentController::show error: ' . $e->getMessage());
            $response->serverError('Failed to fetch assignment')->send();
        }
    }

    /**
     * POST /api/assignments
     * Crée un nouvel assignment
     * 
     * Règles d'accès :
     * - teacher : autorisé (pour ses classes)
     * - pedago : autorisé (global)
     * - student : refusé (403)
     * - director : refusé (403) - read-only en V1
     * 
     * Requiert une authentification
     */
    public function create(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to create assignments', 403)->send();
            return;
        }

        try {
            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            // Ajouter assigned_by depuis l'utilisateur authentifié
            $body['assigned_by'] = $user['id'];

            $assignment = $this->service->createAssignment($body, $user);
            $response->success($assignment->toArray(), 201)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('AssignmentController::create error: ' . $e->getMessage());
            error_log('AssignmentController::create stack trace: ' . $e->getTraceAsString());
            // En mode debug, afficher l'erreur détaillée
            if (defined('DEBUG_ROUTING') && DEBUG_ROUTING) {
                $response->error('Failed to create assignment: ' . $e->getMessage(), 500)->send();
            } else {
                $response->serverError('Failed to create assignment')->send();
            }
        }
    }

    /**
     * PUT /api/assignments/{id}
     * Met à jour un assignment existant
     * 
     * Règles d'accès :
     * - teacher : autorisé (pour ses classes)
     * - pedago : autorisé (global)
     * - student : refusé (403)
     * - director : refusé (403) - read-only en V1
     * 
     * Requiert une authentification
     */
    public function update(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to update assignments', 403)->send();
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid assignment ID', 400)->send();
                return;
            }

            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $assignment = $this->service->updateAssignment($id, $body, $user);

            if ($assignment === null) {
                $response->notFound('Assignment not found')->send();
                return;
            }

            $response->success($assignment->toArray())->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('AssignmentController::update error: ' . $e->getMessage());
            $response->serverError('Failed to update assignment')->send();
        }
    }

    /**
     * DELETE /api/assignments/{id}
     * Supprime un assignment
     * 
     * Règles d'accès :
     * - teacher : autorisé (pour ses classes)
     * - pedago : autorisé (global)
     * - student : refusé (403)
     * - director : refusé (403) - read-only en V1
     * 
     * Requiert une authentification
     */
    public function delete(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to delete assignments', 403)->send();
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid assignment ID', 400)->send();
                return;
            }

            $deleted = $this->service->deleteAssignment($id, $user);

            if (!$deleted) {
                $response->notFound('Assignment not found')->send();
                return;
            }

            $response->success(null)->send();
        } catch (\Exception $e) {
            error_log('AssignmentController::delete error: ' . $e->getMessage());
            $response->serverError('Failed to delete assignment')->send();
        }
    }
    
    /**
     * GET /api/assignments/sync
     * Synchronisation pour ErgoMate Student App
     * 
     * Retourne uniquement les assignments publiés (status='published') 
     * pour les classes de l'étudiant authentifié.
     * 
     * Format de réponse strict :
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "title": "Math Homework 1",
     *       "date": "2023-11-25T10:00:00Z",
     *       "matiere": "Mathematics",
     *       "description": "Exercises 1 to 10...",
     *       "available_at": "2023-11-20T08:00:00Z"
     *     }
     *   ]
     * }
     * 
     * Règles d'accès :
     * - student : autorisé (ses propres assignments)
     * - Autres rôles : refusé (403) - réservé aux étudiants
     * 
     * Requiert une authentification
     */
    public function sync(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        // Vérifier que l'utilisateur est un étudiant
        if (($user['role'] ?? '') !== 'student') {
            $response->error('Forbidden: This endpoint is reserved for students', 403)->send();
            return;
        }

        try {
            $studentId = (int) ($user['id'] ?? 0);
            
            if ($studentId <= 0) {
                $response->error('Invalid student ID', 400)->send();
                return;
            }

            // Récupérer les assignments publiés pour cet étudiant
            $assignments = $this->service->syncForStudent($studentId);

            $response->success($assignments)->send();
        } catch (\Exception $e) {
            error_log('AssignmentController::sync error: ' . $e->getMessage());
            error_log('AssignmentController::sync stack trace: ' . $e->getTraceAsString());
            $response->serverError('Failed to sync assignments')->send();
        }
    }
}

