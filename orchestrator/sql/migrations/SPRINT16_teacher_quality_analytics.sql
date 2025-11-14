-- ============================================================
-- Sprint 16: Teacher Quality & Risk Analytics
-- Date: 2025-11-14
-- ============================================================

-- TABLE: teacher_kpi (Teacher Performance Metrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_kpi (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    teacher_id VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL COMMENT 'Début période de calcul',
    period_end DATE NOT NULL COMMENT 'Fin période de calcul',

    -- Engagement metrics
    student_engagement_avg DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Engagement moyen élèves (0-100)',
    missions_completion_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Taux complétion missions (%)',
    active_students_count INT DEFAULT 0 COMMENT 'Nombre élèves actifs',
    total_students_count INT DEFAULT 0 COMMENT 'Nombre total élèves',

    -- Content quality metrics
    themes_created_count INT DEFAULT 0 COMMENT 'Nombre thèmes créés',
    themes_quality_avg DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Qualité moyenne thèmes (0-100)',
    themes_coherence_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score cohérence pédagogique (0-100)',
    ai_issues_count INT DEFAULT 0 COMMENT 'Nombre problèmes détectés par IA',

    -- Student performance metrics
    student_scores_avg DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score moyen élèves (0-100)',
    student_mastery_avg DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Maîtrise moyenne élèves (0-100)',
    student_progression_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Taux progression (%)',

    -- Activity metrics
    assignments_created_count INT DEFAULT 0 COMMENT 'Nombre missions créées',
    assignments_pushed_count INT DEFAULT 0 COMMENT 'Nombre missions publiées',
    time_spent_creating_hours DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Temps création contenus (heures)',

    -- Comparisons (vs tenant average)
    engagement_vs_avg DECIMAL(6,2) DEFAULT 0.00 COMMENT 'Écart engagement vs moyenne (%)',
    quality_vs_avg DECIMAL(6,2) DEFAULT 0.00 COMMENT 'Écart qualité vs moyenne (%)',
    performance_vs_avg DECIMAL(6,2) DEFAULT 0.00 COMMENT 'Écart performance vs moyenne (%)',

    -- Global score
    overall_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score global enseignant (0-100)',
    rank_in_tenant INT DEFAULT NULL COMMENT 'Classement dans établissement',

    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_tenant_teacher (tenant_id, teacher_id),
    INDEX idx_period (period_start, period_end),
    INDEX idx_overall_score (overall_score DESC),
    INDEX idx_calculated (calculated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: risk_student (Student Risk Detection)
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_student (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    class_id VARCHAR(50) NOT NULL,

    -- Risk scores (0-100, higher = more risk)
    risk_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score de risque global (0-100)',
    risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',

    -- Risk factors
    delay_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score retards (0-100)',
    abandonment_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score abandons (0-100)',
    low_performance_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score performance faible (0-100)',
    time_inefficiency_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score temps inefficace (0-100)',
    engagement_drop_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score baisse engagement (0-100)',

    -- Metrics basis
    missions_late_count INT DEFAULT 0 COMMENT 'Nombre missions en retard',
    missions_abandoned_count INT DEFAULT 0 COMMENT 'Nombre missions abandonnées',
    avg_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score moyen (0-100)',
    avg_time_spent_minutes INT DEFAULT 0 COMMENT 'Temps moyen par mission (minutes)',
    last_activity_days_ago INT DEFAULT 0 COMMENT 'Jours depuis dernière activité',

    -- Recommendations
    ai_recommendations JSON DEFAULT NULL COMMENT 'Recommandations IA pour remédiation',
    priority INT DEFAULT 0 COMMENT 'Priorité intervention (0-10)',

    -- Tracking
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL COMMENT 'Date review par référent',
    reviewed_by VARCHAR(50) NULL COMMENT 'User ID référent',
    status ENUM('detected', 'in_review', 'remediation_planned', 'resolved', 'false_positive') DEFAULT 'detected',
    notes TEXT NULL COMMENT 'Notes référent pédagogique',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_tenant_risk (tenant_id, risk_level),
    INDEX idx_student (student_id),
    INDEX idx_class (class_id),
    INDEX idx_risk_score (risk_score DESC),
    INDEX idx_status (status),
    INDEX idx_detected (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: quality_feed (Quality Issues Feed)
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_feed (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    theme_id VARCHAR(50) NULL COMMENT 'Thème concerné',
    teacher_id VARCHAR(50) NULL COMMENT 'Enseignant concerné',

    -- Issue details
    issue_type ENUM('ai_incoherence', 'student_feedback', 'structure_problem', 'content_error', 'other') NOT NULL,
    severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'warning',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Source
    source ENUM('ai_analysis', 'student_report', 'auto_detection', 'manual') DEFAULT 'ai_analysis',
    detected_by VARCHAR(50) NULL COMMENT 'User ID si détection manuelle',

    -- Related data
    affected_students_count INT DEFAULT 0 COMMENT 'Nombre élèves impactés',
    related_data JSON DEFAULT NULL COMMENT 'Données contextuelles',

    -- Resolution
    status ENUM('open', 'in_progress', 'resolved', 'ignored', 'wont_fix') DEFAULT 'open',
    assigned_to VARCHAR(50) NULL COMMENT 'User ID assigné',
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(50) NULL COMMENT 'User ID résoluteur',
    resolution_notes TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (detected_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_theme (theme_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_severity (severity),
    INDEX idx_issue_type (issue_type),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: class_risk_aggregate (Agrégation risques par classe)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_risk_aggregate (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Risk metrics
    total_students INT DEFAULT 0,
    students_at_risk_count INT DEFAULT 0,
    risk_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Taux élèves à risque (%)',
    avg_risk_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score risque moyen classe',

    -- Risk breakdown
    high_risk_count INT DEFAULT 0,
    medium_risk_count INT DEFAULT 0,
    low_risk_count INT DEFAULT 0,

    -- Class health
    class_health_score DECIMAL(5,2) DEFAULT 100.00 COMMENT 'Score santé classe (0-100)',
    class_status ENUM('healthy', 'at_risk', 'critical') DEFAULT 'healthy',

    -- Top issues
    top_issues JSON DEFAULT NULL COMMENT 'Top 3 problèmes classe',

    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,

    INDEX idx_tenant_class (tenant_id, class_id),
    INDEX idx_period (period_start, period_end),
    INDEX idx_risk_rate (risk_rate DESC),
    INDEX idx_status (class_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Update RBAC permissions for Sprint 16
-- ============================================================

-- Add referent role permissions if not exists
INSERT IGNORE INTO roles_matrix (tenant_id, role, permission_key, allowed) VALUES
    ('default', 'referent', 'analytics:read', TRUE),
    ('default', 'referent', 'analytics:export', TRUE),
    ('default', 'referent', 'risk:read', TRUE),
    ('default', 'referent', 'risk:update', TRUE),
    ('default', 'referent', 'quality_feed:read', TRUE),
    ('default', 'referent', 'quality_feed:update', TRUE);

-- Add inspector permissions for analytics
INSERT IGNORE INTO roles_matrix (tenant_id, role, permission_key, allowed) VALUES
    ('default', 'inspector', 'teacher_kpi:read', TRUE),
    ('default', 'inspector', 'risk:read', TRUE),
    ('default', 'inspector', 'quality_feed:read', TRUE);

-- Add direction permissions
INSERT IGNORE INTO roles_matrix (tenant_id, role, permission_key, allowed) VALUES
    ('default', 'direction', 'teacher_kpi:read', TRUE),
    ('default', 'direction', 'teacher_kpi:export', TRUE),
    ('default', 'direction', 'risk:read', TRUE),
    ('default', 'direction', 'risk:update', TRUE),
    ('default', 'direction', 'quality_feed:read', TRUE),
    ('default', 'direction', 'quality_feed:update', TRUE);

-- ============================================================
-- END Sprint 16 Migration
-- ============================================================
