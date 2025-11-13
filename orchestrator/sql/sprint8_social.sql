-- ============================================================
-- Sprint 8: Social & Collaborative Learning
-- Tables pour classements, partages, feedback, révision collective, modération
-- Date: 2025-11-13
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS moderation_actions;
DROP TABLE IF EXISTS moderation_queue;
DROP TABLE IF EXISTS collaborative_sessions;
DROP TABLE IF EXISTS collaborative_session_participants;
DROP TABLE IF EXISTS peer_comments;
DROP TABLE IF EXISTS shared_content;
DROP TABLE IF EXISTS leaderboard_entries;
DROP TABLE IF EXISTS leaderboard_settings;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- E8-LB: Leaderboards / Classements
-- ============================================================

-- Table des paramètres de classement par tenant
CREATE TABLE leaderboard_settings (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    class_id VARCHAR(50) NULL COMMENT 'NULL = tous les élèves du tenant',
    theme_id VARCHAR(50) NULL COMMENT 'NULL = tous les thèmes',
    period_type ENUM('weekly', 'monthly', 'all_time') DEFAULT 'all_time',
    anonymize_enabled BOOLEAN DEFAULT FALSE COMMENT 'Anonymisation ON/OFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE SET NULL,
    INDEX idx_tenant (tenant_id),
    INDEX idx_period (period_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des entrées de classement (calculées périodiquement)
CREATE TABLE leaderboard_entries (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    class_id VARCHAR(50) NULL,
    theme_id VARCHAR(50) NULL,
    period_type ENUM('weekly', 'monthly', 'all_time') NOT NULL,
    period_start DATE NOT NULL COMMENT 'Début de la période',
    period_end DATE NOT NULL COMMENT 'Fin de la période',
    rank INT NOT NULL,
    total_score DECIMAL(10,2) DEFAULT 0.00,
    total_sessions INT DEFAULT 0,
    avg_mastery DECIMAL(3,2) DEFAULT 0.00,
    total_time_spent INT DEFAULT 0 COMMENT 'Temps total en secondes',
    is_anonymized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE SET NULL,
    UNIQUE KEY unique_leaderboard (tenant_id, student_id, theme_id, period_type, period_start),
    INDEX idx_rank (tenant_id, period_type, rank),
    INDEX idx_student (student_id),
    INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- E8-SHARE: Partage de contenus créés par élèves
-- ============================================================

CREATE TABLE shared_content (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL COMMENT 'Élève qui partage',
    theme_id VARCHAR(50) NULL,
    content_type ENUM('flashcard', 'note', 'summary', 'mnemo', 'quiz') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSON NOT NULL COMMENT 'Contenu partagé',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Visible par tout le tenant',
    target_class_id VARCHAR(50) NULL COMMENT 'Partage limité à une classe',
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
    moderated_at TIMESTAMP NULL,
    moderated_by VARCHAR(50) NULL COMMENT 'User ID du modérateur',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE SET NULL,
    FOREIGN KEY (target_class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_student (student_id),
    INDEX idx_public (is_public, status),
    INDEX idx_class (target_class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- E8-PEER: Feedback entre pairs / Commentaires
-- ============================================================

CREATE TABLE peer_comments (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    shared_content_id VARCHAR(50) NULL COMMENT 'Commentaire sur contenu partagé',
    parent_comment_id VARCHAR(50) NULL COMMENT 'Pour les threads/réponses',
    student_id VARCHAR(50) NOT NULL COMMENT 'Auteur du commentaire',
    comment_text TEXT NOT NULL,
    is_helpful BOOLEAN DEFAULT FALSE COMMENT 'Marqué comme utile',
    helpful_count INT DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'approved',
    moderated_at TIMESTAMP NULL,
    moderated_by VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_content_id) REFERENCES shared_content(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES peer_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_content (shared_content_id),
    INDEX idx_parent (parent_comment_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- E8-COLLAB: Révision collective / Sessions synchronisées
-- ============================================================

CREATE TABLE collaborative_sessions (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    session_code VARCHAR(20) NOT NULL COMMENT 'Code unique pour rejoindre',
    creator_student_id VARCHAR(50) NOT NULL,
    theme_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_participants INT DEFAULT 10,
    current_participants INT DEFAULT 1,
    session_type ENUM('quiz_battle', 'flashcard_review', 'study_group') DEFAULT 'study_group',
    status ENUM('waiting', 'active', 'completed', 'cancelled') DEFAULT 'waiting',
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    duration_minutes INT DEFAULT 30,
    collective_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score collectif moyen',
    questions JSON NULL COMMENT 'Questions communes',
    settings JSON NULL COMMENT 'Paramètres de session',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_code (session_code),
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_code (session_code),
    INDEX idx_creator (creator_student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Participants des sessions collaboratives
CREATE TABLE collaborative_session_participants (
    id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    answers JSON NULL COMMENT 'Réponses du participant',
    is_ready BOOLEAN DEFAULT FALSE,
    status ENUM('joined', 'active', 'disconnected', 'completed') DEFAULT 'joined',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_student (session_id, student_id),
    INDEX idx_session (session_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- E8-MOD: Modération (IA + Enseignant)
-- ============================================================

-- File d'attente de modération
CREATE TABLE moderation_queue (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    content_type ENUM('shared_content', 'peer_comment', 'session') NOT NULL,
    content_id VARCHAR(50) NOT NULL COMMENT 'ID du contenu à modérer',
    student_id VARCHAR(50) NOT NULL COMMENT 'Auteur du contenu',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    reason TEXT COMMENT 'Raison de la mise en file',
    ai_score DECIMAL(3,2) NULL COMMENT 'Score IA (0-1) - suspicion',
    ai_flags JSON NULL COMMENT 'Flags détectés par IA',
    status ENUM('pending', 'in_review', 'approved', 'rejected') DEFAULT 'pending',
    assigned_to VARCHAR(50) NULL COMMENT 'Enseignant assigné',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_priority (priority, created_at),
    INDEX idx_assigned (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Actions de modération (historique)
CREATE TABLE moderation_actions (
    id VARCHAR(50) PRIMARY KEY,
    queue_id VARCHAR(50) NOT NULL,
    moderator_id VARCHAR(50) NOT NULL COMMENT 'Enseignant modérateur',
    action ENUM('approve', 'reject', 'flag', 'edit', 'delete') NOT NULL,
    reason TEXT,
    notes TEXT COMMENT 'Notes du modérateur',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (queue_id) REFERENCES moderation_queue(id) ON DELETE CASCADE,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_queue (queue_id),
    INDEX idx_moderator (moderator_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INDEXES & PERFORMANCE OPTIMIZATION
-- ============================================================

-- Index pour les requêtes fréquentes de leaderboard
CREATE INDEX idx_leaderboard_lookup ON leaderboard_entries(tenant_id, period_type, theme_id, rank);

-- Index pour les sessions actives
CREATE INDEX idx_active_sessions ON collaborative_sessions(status, start_time) WHERE status IN ('waiting', 'active');

-- Index pour le contenu public approuvé
CREATE INDEX idx_public_content ON shared_content(tenant_id, is_public, status) WHERE is_public = TRUE AND status = 'approved';

-- ============================================================
-- FIN DU SCHEMA SPRINT 8
-- ============================================================
