<?php
/**
 * Service AdminAudit - Logique métier pour les logs d'audit
 */

namespace Services;

use Repositories\AdminAuditRepository;

class AdminAuditService
{
    private AdminAuditRepository $repository;

    public function __construct(AdminAuditRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Récupère les logs d'audit avec filtres
     */
    public function getLogs(array $filters = [], ?int $limit = null, ?int $offset = null): array
    {
        return $this->repository->findAll($filters, $limit, $offset);
    }
}

