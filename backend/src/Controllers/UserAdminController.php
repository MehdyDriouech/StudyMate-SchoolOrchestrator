<?php
/**
 * Controller UserAdmin - Gestion admin des utilisateurs
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Services\AuthService;
use Services\UserAdminService;

class UserAdminController
{
    private AuthService $authService;
    private UserAdminService $userService;

    public function __construct(AuthService $authService, UserAdminService $userService)
    {
        $this->authService = $authService;
        $this->userService = $userService;
    }

    /**
     * GET /users
     */
    public function index(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user || ($user['role'] ?? '') !== 'campus_admin') {
                $response->error('Forbidden', 403)->send();
                return;
            }

            $filters = [];
            if ($request->getQueryParam('role')) {
                $filters['role'] = $request->getQueryParam('role');
            }
            if ($request->getQueryParam('school_id')) {
                $filters['school_id'] = (int)$request->getQueryParam('school_id');
            }

            $limit = $request->getQueryParam('limit') ? (int)$request->getQueryParam('limit') : null;
            $offset = $request->getQueryParam('offset') ? (int)$request->getQueryParam('offset') : null;

            $users = $this->userService->getUsers($filters, $limit, $offset);
            $response->success($users)->send();
        } catch (\Exception $e) {
            error_log('UserAdminController::index error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * GET /users/{id}
     */
    public function show(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user || ($user['role'] ?? '') !== 'campus_admin') {
                $response->error('Forbidden', 403)->send();
                return;
            }

            $params = $request->getRouteParams();
            $id = (int)($params['id'] ?? 0);
            $targetUser = $this->userService->getUserById($id);

            if ($targetUser === null) {
                $response->error('User not found', 404)->send();
                return;
            }

            $response->success($targetUser)->send();
        } catch (\Exception $e) {
            error_log('UserAdminController::show error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * POST /users
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
            if (empty($body['email']) || empty($body['role']) || empty($body['full_name'])) {
                $response->error('Email, role and full_name are required', 400)->send();
                return;
            }

            $newUser = $this->userService->createUser($body, $user);
            $response->success($newUser, 201)->send();
        } catch (\Exception $e) {
            error_log('UserAdminController::create error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * PUT /users/{id}
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

            $updatedUser = $this->userService->updateUser($id, $body, $user);
            if ($updatedUser === null) {
                $response->error('User not found', 404)->send();
                return;
            }

            $response->success($updatedUser)->send();
        } catch (\Exception $e) {
            error_log('UserAdminController::update error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * DELETE /users/{id}
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
            $success = $this->userService->deleteUser($id, $user);

            if (!$success) {
                $response->error('User not found', 404)->send();
                return;
            }

            $response->success(['message' => 'User deleted successfully'])->send();
        } catch (\Exception $e) {
            error_log('UserAdminController::delete error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }
}

