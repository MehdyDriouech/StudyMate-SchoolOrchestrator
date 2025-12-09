<?php
/**
 * Controller AdminSettings - Gestion des paramètres admin
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Services\AuthService;
use Services\AdminSettingsService;

class AdminSettingsController
{
    private AuthService $authService;
    private AdminSettingsService $settingsService;

    public function __construct(AuthService $authService, AdminSettingsService $settingsService)
    {
        $this->authService = $authService;
        $this->settingsService = $settingsService;
    }

    /**
     * GET /admin/settings
     */
    public function index(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user || ($user['role'] ?? '') !== 'campus_admin') {
                $response->error('Forbidden', 403)->send();
                return;
            }

            $settings = $this->settingsService->getSettings();
            $response->success($settings)->send();
        } catch (\Exception $e) {
            error_log('AdminSettingsController::index error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }

    /**
     * PUT /admin/settings
     */
    public function update(Request $request, Response $response): void
    {
        try {
            $user = $this->authService->getAuthenticatedUser($request);
            if (!$user || ($user['role'] ?? '') !== 'campus_admin') {
                $response->error('Forbidden', 403)->send();
                return;
            }

            $body = $request->getParsedBody();
            if (empty($body) || !is_array($body)) {
                $response->error('Settings data is required', 400)->send();
                return;
            }

            $settings = $this->settingsService->updateSettings($body, $user);
            $response->success($settings)->send();
        } catch (\Exception $e) {
            error_log('AdminSettingsController::update error: ' . $e->getMessage());
            $response->serverError('An error occurred')->send();
        }
    }
}

