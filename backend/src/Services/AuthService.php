<?php
/**
 * Service Auth - Gestion de l'authentification
 * Génération et validation de tokens JWT, login, extraction de token
 */

namespace Services;

use Http\Request;
use Repositories\UserRepository;

class AuthService
{
    private UserRepository $userRepository;
    private string $jwtSecret;
    private int $jwtTtlHours;
    private string $authMode;

    public function __construct(UserRepository $userRepository, array $config)
    {
        $this->userRepository = $userRepository;
        $this->jwtSecret = $config['jwt_secret'];
        $this->jwtTtlHours = $config['jwt_ttl_hours'];
        $this->authMode = $config['mode'];
    }

    /**
     * Encode une chaîne en base64url (sans padding, avec remplacement des caractères)
     */
    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Décode une chaîne base64url
     */
    private function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Génère un identifiant de session unique
     */
    private function generateSessionId(): string
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Génère un token JWT pour un utilisateur
     * 
     * @param array $user Tableau associatif de l'utilisateur
     * @return string Token JWT
     */
    public function generateToken(array $user): string
    {
        // Header
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];
        $headerB64 = $this->base64UrlEncode(json_encode($header));

        // Payload
        $now = time();
        $payload = [
            'sub' => (int)$user['id'],
            'role' => $user['role'],
            'school_id' => $user['school_id'] ? (int)$user['school_id'] : null,
            'permissions' => [], // Pour l'instant vide, à compléter plus tard
            'session_id' => $this->generateSessionId(),
            'iat' => $now,
            'exp' => $now + ($this->jwtTtlHours * 3600)
        ];
        $payloadB64 = $this->base64UrlEncode(json_encode($payload));

        // Signature
        $signature = hash_hmac('sha256', "$headerB64.$payloadB64", $this->jwtSecret, true);
        $signatureB64 = $this->base64UrlEncode($signature);

        return "$headerB64.$payloadB64.$signatureB64";
    }

    /**
     * Valide et décode un token JWT
     * 
     * @param string $token
     * @return array|null Payload décodé ou null si invalide
     */
    public function validateToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        // Vérifier la signature
        $signature = $this->base64UrlDecode($signatureB64);
        $expectedSignature = hash_hmac('sha256', "$headerB64.$payloadB64", $this->jwtSecret, true);

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        // Décoder le payload
        $payloadJson = $this->base64UrlDecode($payloadB64);
        $payload = json_decode($payloadJson, true);

        if ($payload === null) {
            return null;
        }

        // Vérifier l'expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Extrait le token depuis la requête selon le mode configuré
     * Mode lenient : query > body > header
     * Mode jwt : header uniquement
     * 
     * @param Request $request
     * @return string|null Token extrait ou null
     */
    public function extractTokenFromRequest(Request $request): ?string
    {
        if ($this->authMode === 'jwt') {
            // Mode JWT strict : seulement le header Authorization
            $authHeader = $request->getHeader('authorization');
            if ($authHeader && preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
            return null;
        }

        // Mode lenient : priorité query > body > header
        // 1. Query string
        $token = $request->getQueryParam('token');
        if ($token) {
            return $token;
        }

        // 2. Body (JSON ou form-urlencoded)
        $body = $request->getParsedBody();
        if (isset($body['token'])) {
            return $body['token'];
        }

        // 3. Header Authorization Bearer (fallback)
        $authHeader = $request->getHeader('authorization');
        if ($authHeader && preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Authentifie un utilisateur avec email et password
     * 
     * @param string $email
     * @param string $password
     * @return array|null Tableau avec 'token', 'user', 'expires_in' ou null si échec
     */
    public function login(string $email, string $password): ?array
    {
        // Trouver l'utilisateur
        $user = $this->userRepository->findByEmail($email);
        if ($user === null) {
            return null;
        }

        // Vérifier le mot de passe
        if (!password_verify($password, $user['password_hash'])) {
            return null;
        }

        // Générer le token
        $token = $this->generateToken($user);
        $payload = $this->validateToken($token); // On peut aussi décoder pour avoir exp

        // Préparer les données utilisateur pour la réponse (sans password_hash)
        $userData = [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'full_name' => $user['full_name'],
            'school_id' => $user['school_id'] ? (int)$user['school_id'] : null,
            'permissions' => [],
            'session_id' => $payload['session_id'] ?? null
        ];

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtTtlHours * 3600,
            'user' => $userData
        ];
    }

    /**
     * Récupère l'utilisateur authentifié depuis la requête
     * 
     * @param Request $request
     * @return array|null Tableau associatif de l'utilisateur ou null si non authentifié
     */
    public function getAuthenticatedUser(Request $request): ?array
    {
        $token = $this->extractTokenFromRequest($request);
        if ($token === null) {
            return null;
        }

        $payload = $this->validateToken($token);
        if ($payload === null) {
            return null;
        }

        // Charger l'utilisateur depuis la DB
        $userId = (int)$payload['sub'];
        $user = $this->userRepository->findById($userId);

        if ($user === null) {
            return null;
        }

        // Retourner l'utilisateur (sans password_hash pour sécurité)
        unset($user['password_hash']);
        return $user;
    }

    /**
     * Change le mot de passe d'un utilisateur authentifié
     * 
     * @param Request $request
     * @param string $oldPassword Ancien mot de passe
     * @param string $newPassword Nouveau mot de passe
     * @return bool True si le changement a réussi, false sinon
     */
    public function changePassword(Request $request, string $oldPassword, string $newPassword): bool
    {
        // Vérifier que l'utilisateur est authentifié
        $user = $this->getAuthenticatedUser($request);
        if ($user === null) {
            return false;
        }

        // Charger l'utilisateur avec le password_hash pour vérifier l'ancien mot de passe
        $userWithHash = $this->userRepository->findById($user['id']);
        if ($userWithHash === null) {
            return false;
        }

        // Vérifier l'ancien mot de passe
        if (!password_verify($oldPassword, $userWithHash['password_hash'])) {
            return false;
        }

        // Valider le nouveau mot de passe (minimum 6 caractères)
        if (strlen($newPassword) < 6) {
            return false;
        }

        // Générer le nouveau hash
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        if ($newHash === false) {
            return false;
        }

        // Mettre à jour dans la base de données
        return $this->userRepository->updatePassword($user['id'], $newHash);
    }
}

