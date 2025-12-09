<?php
/**
 * Controller AdminImports - Gestion des imports utilisateurs
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Services\AuthService;
use Services\AdminImportsService;

class AdminImportsController
{
    private AuthService $authService;
    private AdminImportsService $importsService;

    public function __construct(AuthService $authService, AdminImportsService $importsService)
    {
        $this->authService = $authService;
        $this->importsService = $importsService;
    }

    /**
     * POST /admin/imports/users
     */
    public function importUsers(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user || ($user['role'] ?? '') !== 'campus_admin') {
                $response->error('Forbidden', 403)->send();
                return;
            }

            $body = $request->getParsedBody();
            if (empty($body['type']) || empty($body['users']) || !is_array($body['users'])) {
                $response->error('Type and users array are required', 400)->send();
                return;
            }

            $import = $this->importsService->importUsers($body, $user);
            $response->success($import, 201)->send();
        } catch (\Exception $e) {
            error_log('AdminImportsController::importUsers error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * GET /admin/imports/{id}
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
            $import = $this->importsService->getImportById($id);

            if ($import === null) {
                $response->error('Import not found', 404)->send();
                return;
            }

            $response->success($import)->send();
        } catch (\Exception $e) {
            error_log('AdminImportsController::show error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }
}

