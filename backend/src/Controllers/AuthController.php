<?php
/**
 * Controller Auth - Gestion des endpoints d'authentification
 * Point d'entrée pour les requêtes liées à l'authentification
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Services\AuthService;

class AuthController
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * POST /api/auth/login
     * Authentifie un utilisateur avec email et password
     */
    public function login(Request $request, Response $response): void
    {
        try {
            // Récupérer le body (JSON ou form-urlencoded)
            $body = $request->getParsedBody();
            
            $email = trim($body['email'] ?? '');
            $password = $body['password'] ?? '';

            // Validation
            if (empty($email) || empty($password)) {
                $response->error('Email and password are required', 400)->send();
                return;
            }

            // Tentative de login
            $result = $this->authService->login($email, $password);

            if ($result === null) {
                $response->error('Invalid credentials', 401)->send();
                return;
            }

            // Succès
            $response->success($result, 200)->send();
        } catch (\Exception $e) {
            error_log('AuthController::login error: ' . $e->getMessage());
            $response->serverError('An error occurred during authentication')->send();
        }
    }

    /**
     * POST /api/auth/change-password
     * Change le mot de passe de l'utilisateur authentifié
     */
    public function changePassword(Request $request, Response $response): void
    {
        try {
            // Récupérer le body (JSON ou form-urlencoded)
            $body = $request->getParsedBody();
            
            $oldPassword = $body['old_password'] ?? '';
            $newPassword = $body['new_password'] ?? '';

            // Validation
            if (empty($oldPassword) || empty($newPassword)) {
                $response->error('Old password and new password are required', 400)->send();
                return;
            }

            // Validation du nouveau mot de passe (minimum 6 caractères)
            if (strlen($newPassword) < 6) {
                $response->error('New password must be at least 6 characters long', 400)->send();
                return;
            }

            // Tentative de changement de mot de passe
            $success = $this->authService->changePassword($request, $oldPassword, $newPassword);

            if (!$success) {
                $response->error('Failed to change password. Please check your old password.', 400)->send();
                return;
            }

            // Succès
            $response->success(['message' => 'Password changed successfully'], 200)->send();
        } catch (\Exception $e) {
            error_log('AuthController::changePassword error: ' . $e->getMessage());
            $response->serverError('An error occurred while changing password')->send();
        }
    }
}

