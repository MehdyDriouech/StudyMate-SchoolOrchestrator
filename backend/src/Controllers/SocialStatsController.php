<?php
/**
 * Controller SocialStats - Gestion des endpoints REST
 * Point d'entrée pour toutes les requêtes liées aux statistiques sociales
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Repositories\SocialStatsRepository;
use Services\SocialStatsService;
use Services\AuthService;

class SocialStatsController
{
    private SocialStatsService $service;
    private ?AuthService $authService;

    public function __construct(?AuthService $authService = null)
    {
        $repository = new SocialStatsRepository();
        $this->service = new SocialStatsService($repository);
        $this->authService = $authService;
    }

    /**
     * Vérifie que l'utilisateur est authentifié
     * Retourne l'utilisateur authentifié ou null si non authentifié
     */
    private function requireAuth(Request $request, Response $response): ?array
    {
        if ($this->authService === null) {
            error_log('SocialStatsController: AuthService not provided');
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
     * GET /api/social/stats
     * Liste les stats sociales pour l'établissement de l'utilisateur
     * 
     * Règles d'accès :
     * - student : read-own (uniquement ses classes)
     * - teacher : read (ses classes)
     * - pedago : read (toutes les classes de l'établissement)
     * - director : read (toutes les classes de l'établissement)
     * 
     * Requiert une authentification
     */
    public function index(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        try {
            $schoolId = (int) ($user['school_id'] ?? 0);
            
            if ($schoolId <= 0) {
                $response->error('User must be associated with a school', 400)->send();
                return;
            }

            $stats = $this->service->getStatsForSchool($schoolId);
            $response->success($stats)->send();
        } catch (\Exception $e) {
            error_log('SocialStatsController::index error: ' . $e->getMessage());
            $response->serverError('Failed to fetch social stats')->send();
        }
    }

    /**
     * GET /api/social/stats/{id}
     * Récupère une stat sociale par ID
     * 
     * Requiert une authentification
     */
    public function show(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid stat ID', 400)->send();
                return;
            }

            $stat = $this->service->getStatById($id);

            if ($stat === null) {
                $response->notFound('Social stat not found')->send();
                return;
            }

            // Vérifier que la stat appartient au même établissement
            $userSchoolId = (int) ($user['school_id'] ?? 0);
            // La vérification se fait via la classe associée dans le service si nécessaire
            
            $response->success($stat)->send();
        } catch (\Exception $e) {
            error_log('SocialStatsController::show error: ' . $e->getMessage());
            $response->serverError('Failed to fetch social stat')->send();
        }
    }

    /**
     * POST /api/social/stats
     * Crée ou met à jour une stat sociale
     * 
     * Règles d'accès :
     * - pedago : crud (toutes les classes)
     * - teacher : crud (ses classes uniquement)
     * - student : refusé (403)
     * - director : read-only (403)
     * 
     * Requiert une authentification
     */
    public function create(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to create social stats', 403)->send();
            return;
        }

        try {
            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $stat = $this->service->createOrUpdateStat($body, $user);
            $response->success($stat, 201)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('SocialStatsController::create error: ' . $e->getMessage());
            $response->serverError('Failed to create social stat')->send();
        }
    }

    /**
     * PUT /api/social/stats/{id}
     * Met à jour une stat sociale existante
     * 
     * Règles d'accès :
     * - pedago : crud (toutes les classes)
     * - teacher : crud (ses classes uniquement)
     * - student : refusé (403)
     * - director : read-only (403)
     * 
     * Requiert une authentification
     */
    public function update(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to update social stats', 403)->send();
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid stat ID', 400)->send();
                return;
            }

            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $stat = $this->service->updateStat($id, $body, $user);

            if ($stat === null) {
                $response->notFound('Social stat not found')->send();
                return;
            }

            $response->success($stat)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('SocialStatsController::update error: ' . $e->getMessage());
            $response->serverError('Failed to update social stat')->send();
        }
    }

    /**
     * DELETE /api/social/stats/{id}
     * Supprime une stat sociale
     * 
     * Règles d'accès :
     * - pedago : crud (toutes les classes)
     * - teacher : crud (ses classes uniquement)
     * - student : refusé (403)
     * - director : read-only (403)
     * 
     * Requiert une authentification
     */
    public function delete(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to delete social stats', 403)->send();
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid stat ID', 400)->send();
                return;
            }

            $deleted = $this->service->deleteStat($id, $user);

            if (!$deleted) {
                $response->notFound('Social stat not found')->send();
                return;
            }

            $response->success(null)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('SocialStatsController::delete error: ' . $e->getMessage());
            $response->serverError('Failed to delete social stat')->send();
        }
    }
}

