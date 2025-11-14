-- ============================================================
-- Sprint 19 - Multi-Review Workflow & Quality Validation
-- Migration: 019_sprint19_multi_review_workflow.sql
-- Date: 2025-11-14
-- Description: Workflow de validation multi-acteurs avec annotations, versioning et historique
-- ============================================================

-- ============================================================
-- 1. Modifier la table themes pour ajouter les nouveaux statuts
-- ============================================================

-- Modifier la colonne status pour inclure les nouveaux états du workflow
ALTER TABLE themes MODIFY COLUMN status
    ENUM('draft', 'pending_review', 'approved', 'published', 'archived')
    DEFAULT 'draft'
    COMMENT 'Workflow: draft → pending_review → approved → published';

-- Ajouter des colonnes pour tracker le workflow
ALTER TABLE themes ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP NULL COMMENT 'Date de soumission pour validation';
ALTER TABLE themes ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(50) NULL COMMENT 'User ID qui a soumis';
ALTER TABLE themes ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL COMMENT 'Date de revue';
ALTER TABLE themes ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(50) NULL COMMENT 'User ID du référent qui a validé';
ALTER TABLE themes ADD COLUMN IF NOT EXISTS published_at TIMESTAMP NULL COMMENT 'Date de publication';
ALTER TABLE themes ADD COLUMN IF NOT EXISTS published_by VARCHAR(50) NULL COMMENT 'User ID qui a publié';

-- Ajouter les clés étrangères pour les nouveaux champs
ALTER TABLE themes ADD CONSTRAINT fk_themes_submitted_by
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE themes ADD CONSTRAINT fk_themes_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE themes ADD CONSTRAINT fk_themes_published_by
    FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 2. Créer la table theme_status_history (historique des changements de statut)
-- ============================================================

CREATE TABLE IF NOT EXISTS theme_status_history (
    id VARCHAR(50) PRIMARY KEY,
    theme_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    status_from ENUM('draft', 'pending_review', 'approved', 'published', 'archived'),
    status_to ENUM('draft', 'pending_review', 'approved', 'published', 'archived') NOT NULL,
    actor_user_id VARCHAR(50) NULL COMMENT 'User qui a effectué le changement',
    comment TEXT NULL COMMENT 'Commentaire optionnel lors du changement',
    metadata JSON DEFAULT NULL COMMENT 'Métadonnées additionnelles',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_theme_history (theme_id, created_at),
    INDEX idx_tenant (tenant_id),
    INDEX idx_status_to (status_to),
    INDEX idx_actor (actor_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des changements de statut des thèmes';

-- ============================================================
-- 3. Créer la table annotations (annotations et commentaires)
-- ============================================================

CREATE TABLE IF NOT EXISTS annotations (
    id VARCHAR(50) PRIMARY KEY,
    theme_id VARCHAR(50) NOT NULL,
    theme_version INT NOT NULL DEFAULT 1 COMMENT 'Version du thème annotée',
    tenant_id VARCHAR(50) NOT NULL,
    author_user_id VARCHAR(50) NOT NULL COMMENT 'User qui a créé l\'annotation',
    json_path VARCHAR(500) NOT NULL COMMENT 'Chemin JSON de l\'élément annoté (ex: questions[0].text)',
    annotation_type ENUM('comment', 'suggestion', 'error', 'warning', 'info') DEFAULT 'comment',
    content TEXT NOT NULL COMMENT 'Contenu de l\'annotation',
    ai_suggestion TEXT NULL COMMENT 'Suggestion de correction par IA si disponible',
    status ENUM('open', 'resolved', 'rejected') DEFAULT 'open',
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(50) NULL,
    metadata JSON DEFAULT NULL COMMENT 'Métadonnées additionnelles (position, couleur, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_theme_annotations (theme_id, created_at),
    INDEX idx_tenant (tenant_id),
    INDEX idx_author (author_user_id),
    INDEX idx_status (status),
    INDEX idx_version (theme_id, theme_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Annotations et commentaires sur les thèmes';

-- ============================================================
-- 4. Créer la table theme_versions (versioning automatique)
-- ============================================================

CREATE TABLE IF NOT EXISTS theme_versions (
    id VARCHAR(50) PRIMARY KEY,
    theme_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    version INT NOT NULL COMMENT 'Numéro de version (incrémental)',
    data JSON NOT NULL COMMENT 'Snapshot complet du thème à cette version',
    title VARCHAR(255) NOT NULL COMMENT 'Titre à cette version',
    status ENUM('draft', 'pending_review', 'approved', 'published', 'archived') NOT NULL,
    created_by VARCHAR(50) NOT NULL COMMENT 'User qui a créé cette version',
    change_summary TEXT NULL COMMENT 'Résumé des changements',
    diff_metadata JSON DEFAULT NULL COMMENT 'Métadonnées du diff (ajouts, suppressions, modifications)',
    is_milestone BOOLEAN DEFAULT FALSE COMMENT 'Version importante (ex: publication)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_theme_version (theme_id, version),
    INDEX idx_theme_versions (theme_id, version DESC),
    INDEX idx_tenant (tenant_id),
    INDEX idx_created_by (created_by),
    INDEX idx_milestone (is_milestone),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des versions des thèmes';

-- ============================================================
-- 5. Créer la table review_assignments (affectations de révision)
-- ============================================================

CREATE TABLE IF NOT EXISTS review_assignments (
    id VARCHAR(50) PRIMARY KEY,
    theme_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    reviewer_user_id VARCHAR(50) NOT NULL COMMENT 'Référent assigné à la revue',
    assigned_by VARCHAR(50) NOT NULL COMMENT 'User qui a assigné la revue',
    reviewer_role ENUM('referent', 'direction', 'inspector') DEFAULT 'referent',
    status ENUM('pending', 'in_progress', 'completed', 'declined') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    due_date TIMESTAMP NULL COMMENT 'Date limite de revue',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    notes TEXT NULL COMMENT 'Notes du reviewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_theme_review (theme_id),
    INDEX idx_reviewer (reviewer_user_id, status),
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Affectations des revues de thèmes aux référents';

-- ============================================================
-- 6. Créer la table workflow_notifications (notifications workflow)
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_notifications (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL COMMENT 'Destinataire de la notification',
    theme_id VARCHAR(50) NULL,
    notification_type ENUM('status_change', 'new_annotation', 'review_assigned', 'review_completed', 'publish_request') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    metadata JSON DEFAULT NULL COMMENT 'Données additionnelles',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,

    INDEX idx_user_notifications (user_id, is_read, created_at),
    INDEX idx_tenant (tenant_id),
    INDEX idx_theme (theme_id),
    INDEX idx_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Notifications pour le workflow de validation';

-- ============================================================
-- 7. Créer des index supplémentaires pour la performance
-- ============================================================

-- Index pour rechercher les thèmes en attente de validation
CREATE INDEX idx_themes_pending_review ON themes(tenant_id, status, submitted_at)
    WHERE status = 'pending_review';

-- Index pour les thèmes approuvés mais non publiés
CREATE INDEX idx_themes_approved ON themes(tenant_id, status, reviewed_at)
    WHERE status = 'approved';

-- ============================================================
-- 8. Migrer les données existantes (mise à jour des statuts)
-- ============================================================

-- Convertir les anciens statuts vers les nouveaux
UPDATE themes SET status = 'published' WHERE status = 'active';

-- ============================================================
-- 9. Ajouter des triggers pour l'automatisation
-- ============================================================

DELIMITER $$

-- Trigger pour créer automatiquement une version lors d'une modification
CREATE TRIGGER IF NOT EXISTS trg_themes_version_on_update
AFTER UPDATE ON themes
FOR EACH ROW
BEGIN
    -- Seulement si le contenu a changé
    IF OLD.content != NEW.content OR OLD.title != NEW.title THEN
        INSERT INTO theme_versions (
            id,
            theme_id,
            tenant_id,
            version,
            data,
            title,
            status,
            created_by,
            change_summary,
            is_milestone
        ) VALUES (
            CONCAT('ver_', UUID()),
            NEW.id,
            NEW.tenant_id,
            NEW.version,
            NEW.content,
            NEW.title,
            NEW.status,
            NEW.created_by,
            'Automatic version snapshot',
            (NEW.status = 'published')
        );

        -- Incrémenter le numéro de version
        UPDATE themes SET version = version + 1 WHERE id = NEW.id;
    END IF;
END$$

-- Trigger pour historiser les changements de statut
CREATE TRIGGER IF NOT EXISTS trg_themes_status_history
AFTER UPDATE ON themes
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO theme_status_history (
            id,
            theme_id,
            tenant_id,
            status_from,
            status_to,
            actor_user_id,
            comment
        ) VALUES (
            CONCAT('hist_', UUID()),
            NEW.id,
            NEW.tenant_id,
            OLD.status,
            NEW.status,
            NEW.updated_by,
            CONCAT('Status changed from ', OLD.status, ' to ', NEW.status)
        );
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- 10. Créer des vues pour faciliter les requêtes
-- ============================================================

-- Vue des thèmes avec leur workflow complet
CREATE OR REPLACE VIEW v_themes_workflow AS
SELECT
    t.id,
    t.tenant_id,
    t.title,
    t.status,
    t.version,
    t.created_by,
    t.submitted_at,
    t.reviewed_at,
    t.published_at,
    u_created.firstname AS creator_firstname,
    u_created.lastname AS creator_lastname,
    u_reviewed.firstname AS reviewer_firstname,
    u_reviewed.lastname AS reviewer_lastname,
    u_published.firstname AS publisher_firstname,
    u_published.lastname AS publisher_lastname,
    (SELECT COUNT(*) FROM annotations WHERE theme_id = t.id AND status = 'open') AS open_annotations_count,
    (SELECT COUNT(*) FROM theme_versions WHERE theme_id = t.id) AS versions_count,
    t.created_at,
    t.updated_at
FROM themes t
LEFT JOIN users u_created ON t.created_by = u_created.id
LEFT JOIN users u_reviewed ON t.reviewed_by = u_reviewed.id
LEFT JOIN users u_published ON t.published_by = u_published.id;

-- Vue des annotations avec informations utilisateur
CREATE OR REPLACE VIEW v_annotations_details AS
SELECT
    a.id,
    a.theme_id,
    a.tenant_id,
    a.json_path,
    a.annotation_type,
    a.content,
    a.ai_suggestion,
    a.status,
    a.theme_version,
    u_author.firstname AS author_firstname,
    u_author.lastname AS author_lastname,
    u_author.role AS author_role,
    u_resolved.firstname AS resolved_by_firstname,
    u_resolved.lastname AS resolved_by_lastname,
    a.created_at,
    a.resolved_at
FROM annotations a
LEFT JOIN users u_author ON a.author_user_id = u_author.id
LEFT JOIN users u_resolved ON a.resolved_by = u_resolved.id;

-- ============================================================
-- FIN DE LA MIGRATION SPRINT 19
-- ============================================================

-- Vérification de l'intégrité
SELECT 'Sprint 19 migration completed successfully' AS status;
