<?php
/**
 * Controller Classes - Gestion des endpoints REST
 * Point d'entrée pour toutes les requêtes liées aux classes et étudiants
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Repositories\ClassesRepository;
use Services\ClassesService;
use Services\AuthService;

class ClassesController
{
    private ClassesService $service;
    private ?AuthService $authService;

    public function __construct(?AuthService $authService = null)
    {
        $repository = new ClassesRepository();
        $this->service = new ClassesService($repository);
        $this->authService = $authService;
    }

    /**
     * Vérifie que l'utilisateur est authentifié
     * Retourne l'utilisateur authentifié ou null si non authentifié
     */
    private function requireAuth(Request $request, Response $response): ?array
    {
        if ($this->authService === null) {
            error_log('ClassesController: AuthService not provided');
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
     * GET /api/classes
     * Liste toutes les classes de l'établissement de l'utilisateur
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés : autorisé
     * - Filtrage automatique par school_id
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
            $classes = $this->service->getClassesForUser($user);
            $response->success($classes)->send();
        } catch (\Exception $e) {
            error_log('ClassesController::index error: ' . $e->getMessage());
            $response->serverError('Failed to fetch classes')->send();
        }
    }

    /**
     * GET /api/classes/{id}
     * Récupère une classe par ID
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés : autorisé
     * - Vérification que la classe appartient au même établissement
     * 
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
                $response->error('Invalid class ID', 400)->send();
                return;
            }

            $class = $this->service->getClassById($id, $user);

            if ($class === null) {
                $response->notFound('Class not found')->send();
                return;
            }

            $response->success($class)->send();
        } catch (\Exception $e) {
            error_log('ClassesController::show error: ' . $e->getMessage());
            $response->serverError('Failed to fetch class')->send();
        }
    }

    /**
     * GET /api/classes/{id}/students
     * Récupère les étudiants d'une classe
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés : autorisé
     * - Vérification que la classe appartient au même établissement
     * 
     * Requiert une authentification
     */
    public function getStudents(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid class ID', 400)->send();
                return;
            }

            $students = $this->service->getStudentsByClassId($id, $user);

            // Si la classe n'existe pas ou n'appartient pas à l'établissement, retourner un tableau vide
            // (le service retourne déjà un tableau vide dans ce cas)
            $response->success($students)->send();
        } catch (\Exception $e) {
            error_log('ClassesController::getStudents error: ' . $e->getMessage());
            $response->serverError('Failed to fetch students')->send();
        }
    }

    /**
     * GET /api/students/{id}
     * Récupère un étudiant par ID
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés : autorisé
     * - Vérification que l'étudiant appartient au même établissement
     * 
     * Requiert une authentification
     */
    public function getStudent(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return; // La réponse d'erreur a déjà été envoyée
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid student ID', 400)->send();
                return;
            }

            $student = $this->service->getStudentById($id, $user);

            if ($student === null) {
                $response->notFound('Student not found')->send();
                return;
            }

            $response->success($student)->send();
        } catch (\Exception $e) {
            error_log('ClassesController::getStudent error: ' . $e->getMessage());
            $response->serverError('Failed to fetch student')->send();
        }
    }
}

