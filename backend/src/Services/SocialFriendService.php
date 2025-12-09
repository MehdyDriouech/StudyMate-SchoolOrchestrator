<?php
/**
 * Service SocialFriend - Logique métier
 * Gère les codes amis et les relations d'amitié
 */

namespace Services;

use Repositories\SocialProfileRepository;
use Repositories\SocialFriendRepository;

class SocialFriendService
{
    private SocialProfileRepository $profileRepository;
    private SocialFriendRepository $friendRepository;

    public function __construct(
        SocialProfileRepository $profileRepository,
        SocialFriendRepository $friendRepository
    ) {
        $this->profileRepository = $profileRepository;
        $this->friendRepository = $friendRepository;
    }

    /**
     * Génère un code social unique au format ABCD-1234-EFGH
     * 
     * @return string
     */
    public function generateSocialCode(): string
    {
        $maxAttempts = 10;
        $attempt = 0;

        do {
            // Format: 4 lettres majuscules - 4 chiffres - 4 lettres majuscules
            $part1 = $this->randomString(4, true); // Lettres
            $part2 = str_pad((string) rand(0, 9999), 4, '0', STR_PAD_LEFT); // Chiffres
            $part3 = $this->randomString(4, true); // Lettres
            
            $code = strtoupper($part1 . '-' . $part2 . '-' . $part3);
            $attempt++;
        } while ($this->profileRepository->codeExists($code) && $attempt < $maxAttempts);

        if ($attempt >= $maxAttempts) {
            throw new \RuntimeException('Impossible de générer un code social unique après ' . $maxAttempts . ' tentatives');
        }

        return $code;
    }

    /**
     * Génère une chaîne aléatoire
     * 
     * @param int $length - Longueur de la chaîne
     * @param bool $lettersOnly - Si true, uniquement des lettres
     * @return string
     */
    private function randomString(int $length, bool $lettersOnly = false): string
    {
        if ($lettersOnly) {
            $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        } else {
            $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        }
        
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, strlen($characters) - 1)];
        }
        return $randomString;
    }

    /**
     * Récupère ou crée le profil social actif d'un utilisateur
     * 
     * @param int $userId - ID de l'utilisateur
     * @param int|null $schoolId - ID de l'établissement
     * @return array
     */
    public function getOrCreateProfile(int $userId, ?int $schoolId = null): array
    {
        $profile = $this->profileRepository->findActiveByUserId($userId);
        
        if ($profile === null) {
            // Créer un nouveau profil
            $socialCode = $this->generateSocialCode();
            $profile = $this->profileRepository->create([
                'user_id' => $userId,
                'school_id' => $schoolId,
                'social_code' => $socialCode
            ]);
        }
        
        return $profile;
    }

    /**
     * Génère ou régénère le code ami d'un utilisateur
     * 
     * @param int $userId - ID de l'utilisateur
     * @param int|null $schoolId - ID de l'établissement
     * @param bool $regenerate - Si true, régénère le code (révoque l'ancien)
     * @return array
     */
    public function generateOrRegenerateCode(int $userId, ?int $schoolId = null, bool $regenerate = false): array
    {
        if ($regenerate) {
            // Révoquer l'ancien profil actif
            $this->profileRepository->revokeActiveProfile($userId);
        }

        // Générer un nouveau code
        $socialCode = $this->generateSocialCode();
        
        // Créer le nouveau profil
        $profile = $this->profileRepository->create([
            'user_id' => $userId,
            'school_id' => $schoolId,
            'social_code' => $socialCode
        ]);

        return $profile;
    }

    /**
     * Récupère le code ami actuel d'un utilisateur
     * 
     * @param int $userId - ID de l'utilisateur
     * @return array|null
     */
    public function getCurrentCode(int $userId): ?array
    {
        return $this->profileRepository->findActiveByUserId($userId);
    }

    /**
     * Ajoute un ami à partir de son code social
     * 
     * @param int $ownerUserId - ID de l'utilisateur qui ajoute l'ami
     * @param string $socialCode - Code social de l'ami
     * @param int|null $schoolId - ID de l'établissement
     * @return array
     * @throws \InvalidArgumentException Si le code est invalide ou si l'utilisateur essaie de s'ajouter lui-même
     */
    public function addFriendByCode(int $ownerUserId, string $socialCode, ?int $schoolId = null): array
    {
        // Trouver le profil correspondant au code
        $profile = $this->profileRepository->findBySocialCode($socialCode);
        
        if ($profile === null) {
            throw new \InvalidArgumentException('Code social introuvable', 404);
        }

        $friendUserId = (int) $profile['user_id'];

        // Vérifier qu'on ne s'ajoute pas soi-même
        if ($ownerUserId === $friendUserId) {
            throw new \InvalidArgumentException('Vous ne pouvez pas vous ajouter vous-même comme ami', 400);
        }

        // Vérifier si la relation existe déjà
        if ($this->friendRepository->friendshipExists($ownerUserId, $friendUserId)) {
            throw new \InvalidArgumentException('Cet utilisateur est déjà dans votre liste d\'amis', 409);
        }

        // Créer la relation
        $friendship = $this->friendRepository->create([
            'owner_user_id' => $ownerUserId,
            'friend_user_id' => $friendUserId,
            'school_id' => $schoolId
        ]);

        return $friendship;
    }

    /**
     * Récupère la liste des amis d'un utilisateur
     * 
     * @param int $ownerUserId - ID de l'utilisateur
     * @return array
     */
    public function getFriends(int $ownerUserId): array
    {
        return $this->friendRepository->findAllByOwner($ownerUserId);
    }

    /**
     * Supprime un ami de la liste
     * 
     * @param int $friendshipId - ID de la relation
     * @param int $ownerUserId - ID de l'utilisateur propriétaire (pour vérification)
     * @return bool
     * @throws \InvalidArgumentException Si la relation n'existe pas ou n'appartient pas à l'utilisateur
     */
    public function removeFriend(int $friendshipId, int $ownerUserId): bool
    {
        // Vérifier que la relation existe et appartient à l'utilisateur
        if (!$this->friendRepository->belongsToOwner($friendshipId, $ownerUserId)) {
            throw new \InvalidArgumentException('Relation d\'amitié introuvable', 404);
        }

        return $this->friendRepository->delete($friendshipId);
    }
}

