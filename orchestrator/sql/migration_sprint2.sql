-- ============================================================
-- Study-mate School Orchestrator - Sprint 2 Migration
-- Date: 2025-11-12
-- Description: Tables for assignment tracking & events
-- ============================================================

-- Table pour tracking des événements d'assignments (ACK, ouverture, progression, completion)
CREATE TABLE IF NOT EXISTS assignment_events (
    id VARCHAR(50) PRIMARY KEY,
    assignment_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    event_type ENUM('received', 'opened', 'started', 'in_progress', 'completed', 'error') NOT NULL,
    metadata JSON DEFAULT NULL COMMENT 'Données additionnelles (score, temps passé, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_assignment_student (assignment_id, student_id),
    INDEX idx_student (student_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour stocker les résultats de génération IA (thèmes, quiz, etc.)
CREATE TABLE IF NOT EXISTS ai_generations (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    generation_type ENUM('theme', 'quiz', 'flashcards', 'fiche') NOT NULL,
    source_type ENUM('text', 'pdf', 'audio', 'url') NOT NULL,
    source_path VARCHAR(500) NULL COMMENT 'Chemin du fichier source si applicable',
    source_hash VARCHAR(64) NULL COMMENT 'Hash du contenu source pour déduplication',
    prompt TEXT NULL COMMENT 'Prompt utilisé pour la génération',
    result_json JSON DEFAULT NULL COMMENT 'Résultat de la génération',
    validation_status ENUM('pending', 'valid', 'invalid', 'error') DEFAULT 'pending',
    validation_errors JSON DEFAULT NULL COMMENT 'Erreurs de validation du schéma',
    theme_id VARCHAR(50) NULL COMMENT 'ID du thème créé après validation',
    status ENUM('queued', 'processing', 'completed', 'error') DEFAULT 'queued',
    error_message TEXT NULL,
    processing_time_ms INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE SET NULL,
    INDEX idx_tenant_user (tenant_id, user_id),
    INDEX idx_status (status),
    INDEX idx_validation (validation_status),
    INDEX idx_source_hash (source_hash),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les notifications (email, in-app, push)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    recipient_type ENUM('student', 'teacher', 'class', 'promo') NOT NULL,
    recipient_id VARCHAR(50) NOT NULL COMMENT 'ID de l\'étudiant, professeur, classe ou promo',
    notification_type ENUM('assignment', 'reminder', 'result', 'info') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(500) NULL COMMENT 'Lien vers la ressource concernée',
    delivery_method ENUM('in-app', 'email', 'both') DEFAULT 'in-app',
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    email_sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    metadata JSON DEFAULT NULL COMMENT 'Données additionnelles',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_recipient (recipient_type, recipient_id),
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Ajout de colonnes manquantes dans assignments si nécessaire
-- ============================================================

-- Ajouter colonne pour le hash du payload (idempotence)
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(64) NULL COMMENT 'Hash SHA256 du payload pour idempotence' AFTER status,
ADD INDEX IF NOT EXISTS idx_payload_hash (payload_hash);

-- Ajouter colonne pour tracking du nombre de cibles
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS target_count INT DEFAULT 0 COMMENT 'Nombre total de cibles' AFTER payload_hash,
ADD COLUMN IF NOT EXISTS received_count INT DEFAULT 0 COMMENT 'Nombre d\'accusés de réception' AFTER target_count,
ADD COLUMN IF NOT EXISTS completed_count INT DEFAULT 0 COMMENT 'Nombre de complétions' AFTER received_count;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
