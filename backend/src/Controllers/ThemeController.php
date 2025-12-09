<?php
/**
 * Controller Theme - Gestion des endpoints REST
 * Point d'entrée pour toutes les requêtes liées aux thèmes
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Repositories\ThemeRepository;
use Services\ThemeService;
use Services\AuthService;

class ThemeController
{
    private ThemeService $service;
    private ?AuthService $authService;

    public function __construct(?AuthService $authService = null)
    {
        $repository = new ThemeRepository();
        $this->service = new ThemeService($repository);
        $this->authService = $authService;
    }

    /**
     * Vérifie que l'utilisateur est authentifié
     * Retourne l'utilisateur authentifié ou null si non authentifié
     */
    private function requireAuth(Request $request, Response $response): ?array
    {
        if ($this->authService === null) {
            error_log('ThemeController: AuthService not provided');
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
     * GET /api/themes
     * Liste les thèmes selon le rôle de l'utilisateur
     * 
     * Règles d'accès :
     * - student : uniquement les thèmes publiés
     * - teacher : tous les thèmes de l'établissement (y compris ses drafts)
     * - pedago : tous les thèmes de l'établissement
     * - director : tous les thèmes de l'établissement
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
            $themes = $this->service->getThemesForUser($user);
            $data = array_map(function ($theme) {
                return $theme->toArray();
            }, $themes);

            $response->success($data)->send();
        } catch (\Exception $e) {
            error_log('ThemeController::index error: ' . $e->getMessage());
            $response->serverError('Failed to fetch themes')->send();
        }
    }

    /**
     * GET /api/themes/{id}
     * Récupère un thème par ID avec ses questions
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
                $response->error('Invalid theme ID', 400)->send();
                return;
            }

            $theme = $this->service->getThemeById($id, $user);

            if ($theme === null) {
                $response->notFound('Theme not found')->send();
                return;
            }

            $response->success($theme->toArray())->send();
        } catch (\Exception $e) {
            error_log('ThemeController::show error: ' . $e->getMessage());
            $response->serverError('Failed to fetch theme')->send();
        }
    }

    /**
     * POST /api/themes
     * Crée un nouveau thème
     * 
     * Règles d'accès :
     * - teacher : autorisé
     * - pedago : autorisé
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
            $response->error('Forbidden: You do not have permission to create themes', 403)->send();
            return;
        }

        try {
            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $theme = $this->service->createTheme($body, $user);
            $response->success($theme->toArray(), 201)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('ThemeController::create error: ' . $e->getMessage());
            error_log('ThemeController::create stack trace: ' . $e->getTraceAsString());
            // En mode debug, afficher l'erreur détaillée
            if (defined('DEBUG_ROUTING') && DEBUG_ROUTING) {
                $response->error('Failed to create theme: ' . $e->getMessage(), 500)->send();
            } else {
                $response->serverError('Failed to create theme')->send();
            }
        }
    }

    /**
     * PUT /api/themes/{id}
     * Met à jour un thème existant
     * 
     * Règles d'accès :
     * - teacher : autorisé (pour ses thèmes ou tous si pedago)
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
            $response->error('Forbidden: You do not have permission to update themes', 403)->send();
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid theme ID', 400)->send();
                return;
            }

            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $theme = $this->service->updateTheme($id, $body, $user);

            if ($theme === null) {
                $response->notFound('Theme not found or you do not have permission to update it')->send();
                return;
            }

            $response->success($theme->toArray())->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('ThemeController::update error: ' . $e->getMessage());
            $response->serverError('Failed to update theme')->send();
        }
    }

    /**
     * DELETE /api/themes/{id}
     * Supprime un thème
     * 
     * Règles d'accès :
     * - teacher : autorisé (pour ses thèmes)
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
            $response->error('Forbidden: You do not have permission to delete themes', 403)->send();
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid theme ID', 400)->send();
                return;
            }

            $deleted = $this->service->deleteTheme($id, $user);

            if (!$deleted) {
                $response->notFound('Theme not found or you do not have permission to delete it')->send();
                return;
            }

            $response->success(null)->send();
        } catch (\Exception $e) {
            error_log('ThemeController::delete error: ' . $e->getMessage());
            $response->serverError('Failed to delete theme')->send();
        }
    }

    /**
     * POST /api/themes/generate
     * Génère un thème via IA
     * 
     * Règles d'accès :
     * - teacher : autorisé
     * - pedago : autorisé
     * - student : refusé (403)
     * - director : refusé (403)
     * 
     * Requiert une authentification
     */
    public function generate(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to generate themes', 403)->send();
            return;
        }

        try {
            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $theme = $this->service->generateTheme($body, $user);
            $response->success($theme->toArray(), 201)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('ThemeController::generate error: ' . $e->getMessage());
            $response->serverError('Failed to generate theme')->send();
        }
    }

    /**
     * POST /api/themes/import
     * Importe un thème depuis un PDF (mock)
     * 
     * Règles d'accès :
     * - teacher : autorisé
     * - pedago : autorisé
     * - student : refusé (403)
     * - director : refusé (403)
     * 
     * Requiert une authentification
     */
    public function import(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to import themes', 403)->send();
            return;
        }

        try {
            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $theme = $this->service->importThemeFromPdf($body, $user);
            $response->success($theme->toArray(), 201)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('ThemeController::import error: ' . $e->getMessage());
            $response->serverError('Failed to import theme')->send();
        }
    }

    /**
     * POST /api/themes/{id}/reviews
     * Crée une review (audit qualité) pour un thème
     * 
     * Règles d'accès :
     * - pedago : autorisé
     * - director : autorisé
     * - teacher : autorisé (peut soumettre pour review)
     * - student : refusé (403)
     * 
     * Requiert une authentification
     */
    public function createReview(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago', 'director'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to create reviews', 403)->send();
            return;
        }

        try {
            $themeId = (int) $request->getRouteParam('id');

            if ($themeId <= 0) {
                $response->error('Invalid theme ID', 400)->send();
                return;
            }

            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $action = $body['action'] ?? '';
            $comment = $body['comment'] ?? null;

            // Valider l'action
            $allowedActions = ['submitted', 'approved', 'rejected', 'needs_changes'];
            if (!in_array($action, $allowedActions, true)) {
                $response->error('Invalid action. Allowed values: ' . implode(', ', $allowedActions), 400)->send();
                return;
            }

            // Vérifier que le thème existe
            $theme = $this->service->getThemeById($themeId, $user);
            if ($theme === null) {
                $response->notFound('Theme not found')->send();
                return;
            }

            // Créer la review via le service
            $review = $this->service->createReview($themeId, $user['id'], $action, $comment);

            // Optionnel : mettre à jour le status du thème selon l'action
            if ($action === 'approved') {
                // Si approuvé, on peut mettre le status à 'approved'
                $this->service->updateTheme($themeId, ['status' => 'approved'], $user);
            } elseif ($action === 'rejected' || $action === 'needs_changes') {
                // Si rejeté ou nécessite des changements, on peut mettre à 'pending_review'
                $this->service->updateTheme($themeId, ['status' => 'pending_review'], $user);
            }

            $response->success($review, 201)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('ThemeController::createReview error: ' . $e->getMessage());
            $response->serverError('Failed to create review')->send();
        }
    }

    /**
     * GET /api/themes/{id}/reviews
     * Récupère toutes les reviews d'un thème
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés : autorisé (lecture seule)
     * 
     * Requiert une authentification
     */
    public function getReviews(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        try {
            $themeId = (int) $request->getRouteParam('id');

            if ($themeId <= 0) {
                $response->error('Invalid theme ID', 400)->send();
                return;
            }

            // Vérifier que le thème existe et que l'utilisateur y a accès
            $theme = $this->service->getThemeById($themeId, $user);
            if ($theme === null) {
                $response->notFound('Theme not found')->send();
                return;
            }

            // Récupérer les reviews
            $reviews = $this->service->getReviewsByThemeId($themeId);

            // Formater les dates en ISO 8601
            $formattedReviews = array_map(function ($review) {
                if (isset($review['created_at'])) {
                    $date = new \DateTime($review['created_at']);
                    $review['created_at'] = $date->format('c'); // ISO 8601
                }
                return $review;
            }, $reviews);

            $response->success($formattedReviews)->send();
        } catch (\Exception $e) {
            error_log('ThemeController::getReviews error: ' . $e->getMessage());
            $response->serverError('Failed to fetch reviews')->send();
        }
    }
}

