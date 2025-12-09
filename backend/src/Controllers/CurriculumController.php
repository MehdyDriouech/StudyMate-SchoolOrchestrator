<?php
/**
 * Controller Curriculum - Gestion des endpoints REST
 * Point d'entrée pour toutes les requêtes liées au curriculum
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Repositories\CurriculumRepository;
use Services\CurriculumService;
use Services\AuthService;

class CurriculumController
{
    private CurriculumService $service;
    private ?AuthService $authService;

    public function __construct(?AuthService $authService = null)
    {
        $repository = new CurriculumRepository();
        $this->service = new CurriculumService($repository);
        $this->authService = $authService;
    }

    /**
     * Vérifie que l'utilisateur est authentifié
     * Retourne l'utilisateur authentifié ou null si non authentifié
     */
    private function requireAuth(Request $request, Response $response): ?array
    {
        if ($this->authService === null) {
            error_log('CurriculumController: AuthService not provided');
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
     * GET /api/curriculum
     * Récupère la vue globale du curriculum pour l'établissement actif
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés peuvent consulter le curriculum
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
            $schoolId = (int) ($user['school_id'] ?? 0);
            if ($schoolId <= 0) {
                $response->error('Invalid school ID', 400)->send();
                return;
            }

            $curriculum = $this->service->getCurriculumForSchool($schoolId);
            $response->success($curriculum)->send();
        } catch (\Exception $e) {
            error_log('CurriculumController::index error: ' . $e->getMessage());
            $response->serverError('Failed to fetch curriculum')->send();
        }
    }

    /**
     * GET /api/curriculum/subjects
     * Liste les matières du curriculum
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés peuvent consulter les matières
     * 
     * Requiert une authentification
     */
    public function subjects(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        try {
            $schoolId = (int) ($user['school_id'] ?? 0);
            if ($schoolId <= 0) {
                $response->error('Invalid school ID', 400)->send();
                return;
            }

            $subjects = $this->service->getSubjects($schoolId);
            $response->success(['subjects' => $subjects])->send();
        } catch (\Exception $e) {
            error_log('CurriculumController::subjects error: ' . $e->getMessage());
            $response->serverError('Failed to fetch subjects')->send();
        }
    }

    /**
     * GET /api/curriculum/subjects/{id}
     * Récupère une matière spécifique avec ses chapitres
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés peuvent consulter une matière
     * 
     * Requiert une authentification
     */
    public function showSubject(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        try {
            $subjectId = $request->getRouteParam('id');
            if (empty($subjectId)) {
                $response->error('Invalid subject ID', 400)->send();
                return;
            }

            $schoolId = (int) ($user['school_id'] ?? 0);
            if ($schoolId <= 0) {
                $response->error('Invalid school ID', 400)->send();
                return;
            }

            $subject = $this->service->getSubjectById($subjectId, $schoolId);

            if ($subject === null) {
                $response->notFound('Subject not found')->send();
                return;
            }

            $response->success($subject)->send();
        } catch (\Exception $e) {
            error_log('CurriculumController::showSubject error: ' . $e->getMessage());
            $response->serverError('Failed to fetch subject')->send();
        }
    }

    /**
     * GET /api/curriculum/subjects/{subjectId}/chapters/{chapterId}
     * Récupère un chapitre spécifique
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés peuvent consulter un chapitre
     * 
     * Requiert une authentification
     */
    public function showChapter(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        try {
            $subjectId = $request->getRouteParam('subjectId');
            $chapterId = $request->getRouteParam('chapterId');

            if (empty($subjectId) || empty($chapterId)) {
                $response->error('Invalid subject ID or chapter ID', 400)->send();
                return;
            }

            $schoolId = (int) ($user['school_id'] ?? 0);
            if ($schoolId <= 0) {
                $response->error('Invalid school ID', 400)->send();
                return;
            }

            $chapter = $this->service->getChapterById($subjectId, $chapterId, $schoolId);

            if ($chapter === null) {
                $response->notFound('Chapter not found')->send();
                return;
            }

            $response->success($chapter)->send();
        } catch (\Exception $e) {
            error_log('CurriculumController::showChapter error: ' . $e->getMessage());
            $response->serverError('Failed to fetch chapter')->send();
        }
    }

    /**
     * PUT /api/curriculum/subjects/{subjectId}/chapters/{chapterId}
     * Met à jour la progression d'un chapitre
     * 
     * Règles d'accès :
     * - teacher : autorisé
     * - pedago : autorisé
     * - director : autorisé
     * - student : refusé (403)
     * 
     * Requiert une authentification
     */
    public function updateChapter(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        // Vérifier les permissions selon le rôle
        $allowedRoles = ['teacher', 'pedago', 'director'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to update chapter progress', 403)->send();
            return;
        }

        try {
            $subjectId = $request->getRouteParam('subjectId');
            $chapterId = $request->getRouteParam('chapterId');

            if (empty($subjectId) || empty($chapterId)) {
                $response->error('Invalid subject ID or chapter ID', 400)->send();
                return;
            }

            $body = $request->getBody();

            if (empty($body) || !isset($body['progress'])) {
                $response->error('Request body must contain a "progress" field (0-100)', 400)->send();
                return;
            }

            $progress = (int) $body['progress'];
            if ($progress < 0 || $progress > 100) {
                $response->error('Progress must be between 0 and 100', 400)->send();
                return;
            }

            $schoolId = (int) ($user['school_id'] ?? 0);
            if ($schoolId <= 0) {
                $response->error('Invalid school ID', 400)->send();
                return;
            }

            $chapter = $this->service->updateChapterProgress($subjectId, $chapterId, $progress, $schoolId);

            if ($chapter === null) {
                $response->notFound('Chapter not found')->send();
                return;
            }

            $response->success($chapter, 200)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('CurriculumController::updateChapter error: ' . $e->getMessage());
            $response->serverError('Failed to update chapter progress')->send();
        }
    }
}

