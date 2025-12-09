<?php
/**
 * Controller Stats - Gestion des endpoints de statistiques
 * Point d'entrée pour toutes les requêtes liées aux statistiques
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Services\StatsService;
use Services\AuthService;

class StatsController
{
    private StatsService $statsService;
    private ?AuthService $authService;

    public function __construct(?AuthService $authService = null)
    {
        $this->statsService = new StatsService();
        $this->authService = $authService;
    }

    /**
     * Vérifie que l'utilisateur est authentifié
     * Retourne l'utilisateur authentifié ou null si non authentifié
     */
    private function requireAuth(Request $request, Response $response): ?array
    {
        if ($this->authService === null) {
            error_log('StatsController: AuthService not provided');
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
     * GET /api/stats/overview
     * Récupère les statistiques d'aperçu pour l'établissement de l'utilisateur
     * 
     * Règles d'accès :
     * - Tous les rôles peuvent accéder (student, teacher, director, pedago)
     * - Les données sont limitées à l'établissement (school_id) de l'utilisateur
     */
    public function overview(Request $request, Response $response): void
    {
        // Vérifier l'authentification
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        // Tous les rôles peuvent accéder (pas de vérification de rôle spécifique)
        // Les données seront automatiquement limitées au school_id de l'utilisateur

        try {
            // Récupérer le school_id de l'utilisateur
            $schoolId = (int) ($user['school_id'] ?? 0);
            
            if ($schoolId <= 0) {
                $response->error('User must be associated with a school', 400)->send();
                return;
            }

            // Récupérer les statistiques pour cet établissement
            $stats = $this->statsService->getOverviewForSchool($schoolId);

            $response->success($stats)->send();
        } catch (\Exception $e) {
            error_log('StatsController::overview error: ' . $e->getMessage());
            $response->serverError('Failed to fetch stats overview')->send();
        }
    }

    /**
     * GET /api/stats/schools
     * Récupère les statistiques agrégées par établissement
     * 
     * Règles d'accès :
     * - director : autorisé
     * - pedago : autorisé (peut voir les stats multi-écoles)
     * - teacher : refusé (403) - vue mono-établissement uniquement
     * - student : refusé (403)
     */
    public function schools(Request $request, Response $response): void
    {
        // Vérifier l'authentification
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['director', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to view multi-school statistics', 403)->send();
            return;
        }

        try {
            // Récupérer les statistiques pour tous les établissements
            $stats = $this->statsService->getStatsBySchools();

            $response->success($stats)->send();
        } catch (\Exception $e) {
            error_log('StatsController::schools error: ' . $e->getMessage());
            $response->serverError('Failed to fetch schools statistics')->send();
        }
    }
}

