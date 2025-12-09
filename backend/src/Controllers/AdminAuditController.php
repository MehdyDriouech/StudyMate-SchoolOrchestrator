<?php
/**
 * Controller AdminAudit - Gestion des logs d'audit
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Services\AuthService;
use Services\AdminAuditService;

class AdminAuditController
{
    private AuthService $authService;
    private AdminAuditService $auditService;

    public function __construct(AuthService $authService, AdminAuditService $auditService)
    {
        $this->authService = $authService;
        $this->auditService = $auditService;
    }

    /**
     * GET /admin/audit/logs
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
            if ($request->getQueryParam('action')) {
                $filters['action'] = $request->getQueryParam('action');
            }
            if ($request->getQueryParam('user_id')) {
                $filters['user_id'] = (int)$request->getQueryParam('user_id');
            }
            if ($request->getQueryParam('date_from')) {
                $filters['date_from'] = $request->getQueryParam('date_from');
            }
            if ($request->getQueryParam('date_to')) {
                $filters['date_to'] = $request->getQueryParam('date_to');
            }

            $limit = $request->getQueryParam('limit') ? (int)$request->getQueryParam('limit') : null;
            $offset = $request->getQueryParam('offset') ? (int)$request->getQueryParam('offset') : null;

            $logs = $this->auditService->getLogs($filters, $limit, $offset);
            $response->success($logs)->send();
        } catch (\Exception $e) {
            error_log('AdminAuditController::index error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }
}

