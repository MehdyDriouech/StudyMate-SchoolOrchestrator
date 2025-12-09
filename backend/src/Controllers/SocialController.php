<?php
/**
 * Controller Social - Gestion des endpoints REST pour les entrées sociales
 * Point d'entrée pour toutes les requêtes liées aux entrées sociales
 */

namespace Controllers;

use Http\Request;
use Http\Response;
use Repositories\SocialEntryRepository;
use Repositories\SocialProfileRepository;
use Repositories\SocialFriendRepository;
use Services\SocialEntryService;
use Services\SocialFriendService;
use Services\AuthService;

class SocialController
{
    private SocialEntryService $service;
    private SocialFriendService $friendService;
    private ?AuthService $authService;

    public function __construct(?AuthService $authService = null)
    {
        $repository = new SocialEntryRepository();
        $this->service = new SocialEntryService($repository);
        
        $profileRepository = new SocialProfileRepository();
        $friendRepository = new SocialFriendRepository();
        $this->friendService = new SocialFriendService($profileRepository, $friendRepository);
        
        $this->authService = $authService;
    }

    /**
     * Vérifie que l'utilisateur est authentifié
     */
    private function requireAuth(Request $request, Response $response): ?array
    {
        if ($this->authService === null) {
            error_log('SocialController: AuthService not provided');
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
     */
    private function requireRole(array $user, array $allowedRoles): bool
    {
        return in_array($user['role'], $allowedRoles, true);
    }

    /**
     * GET /api/social
     * Liste les entrées sociales visibles par l'utilisateur
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés : autorisé (lecture)
     */
    public function index(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        try {
            $entries = $this->service->getEntriesForUser($user);
            
            // Formater les dates en ISO 8601
            $formattedEntries = array_map(function ($entry) {
                if (isset($entry['created_at'])) {
                    $date = new \DateTime($entry['created_at']);
                    $entry['created_at'] = $date->format('c');
                }
                if (isset($entry['updated_at'])) {
                    $date = new \DateTime($entry['updated_at']);
                    $entry['updated_at'] = $date->format('c');
                }
                // Parser le payload JSON si c'est une string
                if (isset($entry['payload']) && is_string($entry['payload'])) {
                    $entry['payload'] = json_decode($entry['payload'], true);
                }
                return $entry;
            }, $entries);

            $response->success($formattedEntries)->send();
        } catch (\Exception $e) {
            error_log('SocialController::index error: ' . $e->getMessage());
            $response->serverError('Failed to fetch social entries')->send();
        }
    }

    /**
     * GET /api/social/{id}
     * Récupère une entrée sociale par ID
     * 
     * Règles d'accès :
     * - Tous les rôles authentifiés : autorisé (lecture)
     */
    public function show(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid entry ID', 400)->send();
                return;
            }

            $entry = $this->service->getEntryById($id);

            if ($entry === null) {
                $response->notFound('Social entry not found')->send();
                return;
            }

            // Formater les dates
            if (isset($entry['created_at'])) {
                $date = new \DateTime($entry['created_at']);
                $entry['created_at'] = $date->format('c');
            }
            if (isset($entry['updated_at'])) {
                $date = new \DateTime($entry['updated_at']);
                $entry['updated_at'] = $date->format('c');
            }
            // Parser le payload JSON si c'est une string
            if (isset($entry['payload']) && is_string($entry['payload'])) {
                $entry['payload'] = json_decode($entry['payload'], true);
            }

            $response->success($entry)->send();
        } catch (\Exception $e) {
            error_log('SocialController::show error: ' . $e->getMessage());
            error_log('SocialController::show stack trace: ' . $e->getTraceAsString());
            // En mode développement, inclure plus de détails
            $errorMessage = 'Failed to fetch social entry';
            if (ini_get('display_errors')) {
                $errorMessage .= ': ' . $e->getMessage();
            }
            $response->serverError($errorMessage)->send();
        }
    }

    /**
     * POST /api/social
     * Crée une nouvelle entrée sociale
     * 
     * Règles d'accès :
     * - director : autorisé
     * - admin : autorisé
     * - pedago : autorisé
     * - teacher : refusé (403)
     * - student : refusé (403)
     */
    public function create(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions
        $allowedRoles = ['director', 'admin', 'pedago'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: You do not have permission to create social entries', 403)->send();
            return;
        }

        try {
            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $entry = $this->service->createEntry($body, $user);
            
            // Formater les dates
            if (isset($entry['created_at'])) {
                $date = new \DateTime($entry['created_at']);
                $entry['created_at'] = $date->format('c');
            }
            if (isset($entry['updated_at'])) {
                $date = new \DateTime($entry['updated_at']);
                $entry['updated_at'] = $date->format('c');
            }
            // Parser le payload JSON si c'est une string
            if (isset($entry['payload']) && is_string($entry['payload'])) {
                $entry['payload'] = json_decode($entry['payload'], true);
            }

            $response->success($entry, 201)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('SocialController::create error: ' . $e->getMessage());
            $response->serverError('Failed to create social entry')->send();
        }
    }

    /**
     * PUT /api/social/{id}
     * Met à jour une entrée sociale
     * 
     * Règles d'accès :
     * - director : autorisé
     * - admin : autorisé (peut-être, selon les besoins)
     * - pedago : refusé (403)
     * - teacher : refusé (403)
     * - student : refusé (403)
     */
    public function update(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions - PUT réservé au Directeur uniquement
        $allowedRoles = ['director'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: Only directors can update social entries', 403)->send();
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid entry ID', 400)->send();
                return;
            }

            $body = $request->getBody();

            if (empty($body)) {
                $response->error('Request body is required', 400)->send();
                return;
            }

            $entry = $this->service->updateEntry($id, $body);

            if ($entry === null) {
                $response->notFound('Social entry not found')->send();
                return;
            }

            // Formater les dates
            if (isset($entry['created_at'])) {
                $date = new \DateTime($entry['created_at']);
                $entry['created_at'] = $date->format('c');
            }
            if (isset($entry['updated_at'])) {
                $date = new \DateTime($entry['updated_at']);
                $entry['updated_at'] = $date->format('c');
            }
            // Parser le payload JSON si c'est une string
            if (isset($entry['payload']) && is_string($entry['payload'])) {
                $entry['payload'] = json_decode($entry['payload'], true);
            }

            $response->success($entry)->send();
        } catch (\InvalidArgumentException $e) {
            $response->error($e->getMessage(), 400)->send();
        } catch (\Exception $e) {
            error_log('SocialController::update error: ' . $e->getMessage());
            $response->serverError('Failed to update social entry')->send();
        }
    }

    /**
     * DELETE /api/social/{id}
     * Supprime une entrée sociale
     * 
     * Règles d'accès :
     * - director : autorisé
     * - admin : autorisé (peut-être, selon les besoins)
     * - pedago : refusé (403)
     * - teacher : refusé (403)
     * - student : refusé (403)
     */
    public function delete(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions - DELETE réservé au Directeur uniquement
        $allowedRoles = ['director'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: Only directors can delete social entries', 403)->send();
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid entry ID', 400)->send();
                return;
            }

            $deleted = $this->service->deleteEntry($id);

            if (!$deleted) {
                $response->notFound('Social entry not found')->send();
                return;
            }

            $response->success(null)->send();
        } catch (\Exception $e) {
            error_log('SocialController::delete error: ' . $e->getMessage());
            $response->serverError('Failed to delete social entry')->send();
        }
    }

    /**
     * POST /api/social/friend-code
     * Génère ou régénère le "code ami" de l'utilisateur courant
     * 
     * Règles d'accès :
     * - student : autorisé
     * - Autres rôles : à définir selon les besoins
     */
    public function postFriendCode(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions - student uniquement pour l'instant
        $allowedRoles = ['student'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: Only students can generate friend codes', 403)->send();
            return;
        }

        try {
            $body = $request->getBody();
            $regenerate = isset($body['regenerate']) && $body['regenerate'] === true;

            $userId = (int) $user['id'];
            $schoolId = isset($user['school_id']) ? (int) $user['school_id'] : null;

            $profile = $this->friendService->generateOrRegenerateCode($userId, $schoolId, $regenerate);

            // Formater les dates
            if (isset($profile['created_at'])) {
                $date = new \DateTime($profile['created_at']);
                $profile['created_at'] = $date->format('c');
            }
            if (isset($profile['revoked_at'])) {
                $profile['revoked_at'] = $profile['revoked_at'] ? (new \DateTime($profile['revoked_at']))->format('c') : null;
            }

            // Retourner uniquement les champs pertinents
            $responseData = [
                'user_id' => (int) $profile['user_id'],
                'school_id' => $profile['school_id'] ? (int) $profile['school_id'] : null,
                'social_code' => $profile['social_code'],
                'created_at' => $profile['created_at']
            ];

            $response->success($responseData, 201)->send();
        } catch (\Exception $e) {
            error_log('SocialController::postFriendCode error: ' . $e->getMessage());
            $response->serverError('Failed to generate friend code')->send();
        }
    }

    /**
     * GET /api/social/friend-code
     * Récupère le code ami actuel de l'utilisateur courant
     * 
     * Règles d'accès :
     * - student : autorisé
     */
    public function getFriendCode(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions - student uniquement
        $allowedRoles = ['student'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: Only students can view friend codes', 403)->send();
            return;
        }

        try {
            $userId = (int) $user['id'];
            $profile = $this->friendService->getCurrentCode($userId);

            if ($profile === null) {
                // Générer automatiquement un code si aucun n'existe
                $schoolId = isset($user['school_id']) ? (int) $user['school_id'] : null;
                $profile = $this->friendService->getOrCreateProfile($userId, $schoolId);
            }

            // Formater les dates
            if (isset($profile['created_at'])) {
                $date = new \DateTime($profile['created_at']);
                $profile['created_at'] = $date->format('c');
            }

            // Retourner uniquement le code
            $response->success([
                'social_code' => $profile['social_code']
            ])->send();
        } catch (\Exception $e) {
            error_log('SocialController::getFriendCode error: ' . $e->getMessage());
            $response->serverError('Failed to fetch friend code')->send();
        }
    }

    /**
     * POST /api/social/friends
     * Ajoute un ami à partir de son friend code
     * 
     * Règles d'accès :
     * - student : autorisé
     */
    public function postFriend(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions - student uniquement
        $allowedRoles = ['student'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: Only students can add friends', 403)->send();
            return;
        }

        try {
            $body = $request->getBody();

            if (empty($body) || !isset($body['social_code'])) {
                $response->error('social_code is required', 400)->send();
                return;
            }

            $socialCode = trim($body['social_code']);
            if (empty($socialCode)) {
                $response->error('social_code cannot be empty', 400)->send();
                return;
            }

            $userId = (int) $user['id'];
            $schoolId = isset($user['school_id']) ? (int) $user['school_id'] : null;

            $friendship = $this->friendService->addFriendByCode($userId, $socialCode, $schoolId);

            // Formater les dates
            if (isset($friendship['created_at'])) {
                $date = new \DateTime($friendship['created_at']);
                $friendship['created_at'] = $date->format('c');
            }

            // Retourner uniquement les champs pertinents
            $responseData = [
                'id' => (int) $friendship['id'],
                'owner_user_id' => (int) $friendship['owner_user_id'],
                'friend_user_id' => (int) $friendship['friend_user_id'],
                'created_at' => $friendship['created_at']
            ];

            $response->success($responseData, 201)->send();
        } catch (\InvalidArgumentException $e) {
            $code = $e->getCode();
            if ($code === 404) {
                $response->error('Code social introuvable', 404)->send();
            } elseif ($code === 400) {
                $response->error($e->getMessage(), 400)->send();
            } elseif ($code === 409) {
                $response->error($e->getMessage(), 409)->send();
            } else {
                $response->error($e->getMessage(), 400)->send();
            }
        } catch (\Exception $e) {
            error_log('SocialController::postFriend error: ' . $e->getMessage());
            $response->serverError('Failed to add friend')->send();
        }
    }

    /**
     * GET /api/social/friends
     * Liste les amis de l'utilisateur courant
     * 
     * Règles d'accès :
     * - student : autorisé
     */
    public function getFriends(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions - student uniquement
        $allowedRoles = ['student'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: Only students can view friends', 403)->send();
            return;
        }

        try {
            $userId = (int) $user['id'];
            $friends = $this->friendService->getFriends($userId);

            // Formater les dates et préparer la réponse
            $formattedFriends = array_map(function ($friend) {
                if (isset($friend['created_at'])) {
                    $date = new \DateTime($friend['created_at']);
                    $friend['created_at'] = $date->format('c');
                }
                return [
                    'id' => (int) $friend['id'],
                    'friend_user_id' => (int) $friend['friend_user_id'],
                    'friend_name' => $friend['friend_name'] ?? null,
                    'school_id' => $friend['school_id'] ? (int) $friend['school_id'] : null,
                    'created_at' => $friend['created_at']
                ];
            }, $friends);

            $response->success($formattedFriends)->send();
        } catch (\Exception $e) {
            error_log('SocialController::getFriends error: ' . $e->getMessage());
            $response->serverError('Failed to fetch friends')->send();
        }
    }

    /**
     * DELETE /api/social/friends/{id}
     * Retire un ami de sa liste
     * 
     * Règles d'accès :
     * - student : autorisé (uniquement ses propres amis)
     */
    public function deleteFriend(Request $request, Response $response): void
    {
        $user = $this->requireAuth($request, $response);
        if ($user === null) {
            return;
        }

        // Vérifier les permissions - student uniquement
        $allowedRoles = ['student'];
        if (!$this->requireRole($user, $allowedRoles)) {
            $response->error('Forbidden: Only students can remove friends', 403)->send();
            return;
        }

        try {
            $id = (int) $request->getRouteParam('id');

            if ($id <= 0) {
                $response->error('Invalid friendship ID', 400)->send();
                return;
            }

            $userId = (int) $user['id'];
            $deleted = $this->friendService->removeFriend($id, $userId);

            if (!$deleted) {
                $response->notFound('Friendship not found')->send();
                return;
            }

            $response->success(null)->send();
        } catch (\InvalidArgumentException $e) {
            $code = $e->getCode();
            if ($code === 404) {
                $response->notFound($e->getMessage())->send();
            } else {
                $response->error($e->getMessage(), 400)->send();
            }
        } catch (\Exception $e) {
            error_log('SocialController::deleteFriend error: ' . $e->getMessage());
            $response->serverError('Failed to remove friend')->send();
        }
    }
}

