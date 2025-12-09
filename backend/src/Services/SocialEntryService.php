<?php
/**
 * Service SocialEntry - Logique métier pour les entrées sociales
 * Valide les données et orchestre les opérations
 */

namespace Services;

use Repositories\SocialEntryRepository;

class SocialEntryService
{
    private SocialEntryRepository $repository;

    public function __construct(SocialEntryRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Récupère toutes les entrées sociales visibles par l'utilisateur
     * 
     * @param array $user - Utilisateur authentifié
     * @return array
     */
    public function getEntriesForUser(array $user): array
    {
        $schoolId = (int) ($user['school_id'] ?? 0);
        
        // Si admin/director, peut voir toutes les entrées
        if (in_array($user['role'] ?? '', ['admin', 'director'], true)) {
            return $this->repository->findAll(null);
        }
        
        // Sinon, filtrer par établissement
        return $this->repository->findAll($schoolId > 0 ? $schoolId : null);
    }

    /**
     * Récupère une entrée par ID
     * 
     * @param int $id - ID de l'entrée
     * @return array|null
     */
    public function getEntryById(int $id): ?array
    {
        return $this->repository->findById($id);
    }

    /**
     * Crée une nouvelle entrée sociale
     * 
     * @param array $data - Données de l'entrée
     * @param array $user - Utilisateur authentifié
     * @return array
     */
    public function createEntry(array $data, array $user): array
    {
        // Validation
        if (empty($data['title'])) {
            throw new \InvalidArgumentException('Le titre est requis');
        }

        if (empty($data['type'])) {
            throw new \InvalidArgumentException('Le type est requis');
        }

        $allowedTypes = ['rule', 'message', 'config'];
        if (!in_array($data['type'], $allowedTypes, true)) {
            throw new \InvalidArgumentException('Type invalide. Valeurs autorisées: ' . implode(', ', $allowedTypes));
        }

        // Ajouter created_by
        $data['created_by'] = (int) ($user['id'] ?? 0);
        
        // Si pas de school_id spécifié, utiliser celui de l'utilisateur (sauf admin)
        if (!isset($data['school_id'])) {
            if (in_array($user['role'] ?? '', ['admin', 'director'], true)) {
                $data['school_id'] = null; // Global pour admin/director
            } else {
                $data['school_id'] = (int) ($user['school_id'] ?? 0);
            }
        }

        return $this->repository->create($data);
    }

    /**
     * Met à jour une entrée sociale
     * 
     * @param int $id - ID de l'entrée
     * @param array $data - Nouvelles données
     * @return array|null
     */
    public function updateEntry(int $id, array $data): ?array
    {
        // Validation optionnelle
        if (isset($data['type'])) {
            $allowedTypes = ['rule', 'message', 'config'];
            if (!in_array($data['type'], $allowedTypes, true)) {
                throw new \InvalidArgumentException('Type invalide. Valeurs autorisées: ' . implode(', ', $allowedTypes));
            }
        }

        return $this->repository->update($id, $data);
    }

    /**
     * Supprime une entrée sociale
     * 
     * @param int $id - ID de l'entrée
     * @return bool
     */
    public function deleteEntry(int $id): bool
    {
        return $this->repository->delete($id);
    }
}

