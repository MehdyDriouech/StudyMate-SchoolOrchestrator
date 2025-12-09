<?php
/**
 * Controller School - Gestion des établissements
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Services\AuthService;
use Services\SchoolService;

class SchoolController
{
    private AuthService $authService;
    private SchoolService $schoolService;

    public function __construct(AuthService $authService, SchoolService $schoolService)
    {
        $this->authService = $authService;
        $this->schoolService = $schoolService;
    }

    /**
     * GET /schools
     */
    public function index(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user) {
                $response->error('Unauthorized', 401)->send();
                return;
            }

            $role = $user['role'] ?? '';
            if ($role !== 'campus_admin' && $role !== 'director') {
                $response->error('Forbidden', 403)->send();
                return;
            }

            $filters = [];
            if ($request->getQueryParam('is_active') !== null) {
                $filters['is_active'] = $request->getQueryParam('is_active') === 'true' || $request->getQueryParam('is_active') === '1';
            }

            $limit = $request->getQueryParam('limit') ? (int)$request->getQueryParam('limit') : null;
            $offset = $request->getQueryParam('offset') ? (int)$request->getQueryParam('offset') : null;

            $schools = $this->schoolService->getSchoolsForUser($user, $filters, $limit, $offset);
            $response->success($schools)->send();
        } catch (\Exception $e) {
            error_log('SchoolController::index error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * GET /schools/{id}
     */
    public function show(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user) {
                $response->error('Unauthorized', 401)->send();
                return;
            }

            $params = $request->getRouteParams();
            $id = (int)($params['id'] ?? 0);
            $school = $this->schoolService->getSchoolById($id, $user);

            if ($school === null) {
                $response->error('School not found', 404)->send();
                return;
            }

            $response->success($school)->send();
        } catch (\Exception $e) {
            error_log('SchoolController::show error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * POST /schools
     */
    public function create(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user || ($user['role'] ?? '') !== 'campus_admin') {
                $response->error('Forbidden', 403)->send();
                return;
            }

            $body = $request->getParsedBody();
            if (empty($body['name'])) {
                $response->error('Name is required', 400)->send();
                return;
            }

            $school = $this->schoolService->createSchool($body, $user);
            $response->success($school, 201)->send();
        } catch (\Exception $e) {
            error_log('SchoolController::create error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * PUT /schools/{id}
     */
    public function update(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user || ($user['role'] ?? '') !== 'campus_admin') {
                $response->error('Forbidden', 403)->send();
                return;
            }

            $params = $request->getRouteParams();
            $id = (int)($params['id'] ?? 0);
            $body = $request->getParsedBody();

            $school = $this->schoolService->updateSchool($id, $body, $user);
            if ($school === null) {
                $response->error('School not found', 404)->send();
                return;
            }

            $response->success($school)->send();
        } catch (\Exception $e) {
            error_log('SchoolController::update error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * DELETE /schools/{id}
     */
    public function delete(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user || ($user['role'] ?? '') !== 'campus_admin') {
                $response->error('Forbidden', 403)->send();
                return;
            }

            $params = $request->getRouteParams();
            $id = (int)($params['id'] ?? 0);
            $success = $this->schoolService->deleteSchool($id, $user);

            if (!$success) {
                $response->error('School not found', 404)->send();
                return;
            }

            $response->success(['message' => 'School archived successfully'])->send();
        } catch (\Exception $e) {
            error_log('SchoolController::delete error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }
}

