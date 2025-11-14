-- ============================================================
-- Sprint 18: Curriculum Builder & Séquences Pédagogiques
-- Date: 2025-11-14
-- Description: Structurer un programme annuel en séquences avec objectifs et missions
-- ============================================================

-- ============================================================
-- TABLE: curriculum (Programmes annuels)
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum (
    id VARCHAR(50) PRIMARY KEY COMMENT 'UUID du curriculum',
    tenant_id VARCHAR(50) NOT NULL,
    class_id VARCHAR(50) NOT NULL COMMENT 'Classe associée',
    teacher_id VARCHAR(50) NOT NULL COMMENT 'Enseignant responsable',
    title VARCHAR(255) NOT NULL COMMENT 'Titre du programme',
    description TEXT COMMENT 'Description générale du programme',
    year_start INT NOT NULL COMMENT 'Année de début (ex: 2025)',
    year_end INT NOT NULL COMMENT 'Année de fin (ex: 2026)',
    level VARCHAR(50) COMMENT 'Niveau scolaire (L1, L2, M1...)',
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    metadata JSON DEFAULT NULL COMMENT 'Données supplémentaires (compétences globales, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_tenant_class (tenant_id, class_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_status (status),
    INDEX idx_year (year_start, year_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Programmes annuels structurés par enseignant';

-- ============================================================
-- TABLE: curriculum_sequences (Séquences pédagogiques)
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_sequences (
    id VARCHAR(50) PRIMARY KEY COMMENT 'UUID de la séquence',
    curriculum_id VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL COMMENT 'Titre de la séquence',
    description TEXT COMMENT 'Description détaillée',
    position INT NOT NULL DEFAULT 0 COMMENT 'Ordre dans le curriculum (pour drag-drop)',
    duration_weeks INT DEFAULT NULL COMMENT 'Durée estimée en semaines',
    start_date DATE DEFAULT NULL COMMENT 'Date de début prévue',
    end_date DATE DEFAULT NULL COMMENT 'Date de fin prévue',
    objectives JSON DEFAULT NULL COMMENT 'Liste des objectifs pédagogiques [{id, label, description}]',
    skills JSON DEFAULT NULL COMMENT 'Compétences visées',
    status ENUM('draft', 'in_progress', 'completed', 'archived') DEFAULT 'draft',
    completion_percent DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Taux d\'avancement (calculé)',
    metadata JSON DEFAULT NULL COMMENT 'Données supplémentaires',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE,

    INDEX idx_curriculum (curriculum_id),
    INDEX idx_position (curriculum_id, position),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Séquences pédagogiques structurant un curriculum';

-- ============================================================
-- TABLE: curriculum_sequence_assignments (Lien séquence ↔ missions)
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_sequence_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sequence_id VARCHAR(50) NOT NULL,
    assignment_id VARCHAR(50) NOT NULL,
    position INT DEFAULT 0 COMMENT 'Ordre dans la séquence',
    is_required BOOLEAN DEFAULT TRUE COMMENT 'Mission obligatoire ou optionnelle',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sequence_id) REFERENCES curriculum_sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,

    UNIQUE KEY unique_sequence_assignment (sequence_id, assignment_id),
    INDEX idx_sequence (sequence_id),
    INDEX idx_assignment (assignment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Association entre séquences et missions/thèmes';

-- ============================================================
-- TABLE: curriculum_sequence_themes (Lien séquence ↔ thèmes IA)
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_sequence_themes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sequence_id VARCHAR(50) NOT NULL,
    theme_id VARCHAR(50) NOT NULL,
    position INT DEFAULT 0 COMMENT 'Ordre dans la séquence',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sequence_id) REFERENCES curriculum_sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,

    UNIQUE KEY unique_sequence_theme (sequence_id, theme_id),
    INDEX idx_sequence (sequence_id),
    INDEX idx_theme (theme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Association entre séquences et thèmes pédagogiques générés par IA';

-- ============================================================
-- TABLE: curriculum_student_progress (Progression élève par séquence)
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sequence_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    completion_percent DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Taux d\'avancement de l\'élève',
    completed_objectives JSON DEFAULT NULL COMMENT 'Liste des objectifs validés',
    status ENUM('not_started', 'in_progress', 'completed', 'behind') DEFAULT 'not_started',
    last_activity_at TIMESTAMP NULL COMMENT 'Dernière activité de l\'élève',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (sequence_id) REFERENCES curriculum_sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

    UNIQUE KEY unique_sequence_student (sequence_id, student_id),
    INDEX idx_sequence (sequence_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Suivi de la progression des élèves par séquence';

-- ============================================================
-- Ajout de colonnes pour sync_logs (observabilité)
-- ============================================================
ALTER TABLE sync_logs
ADD COLUMN IF NOT EXISTS curriculum_id VARCHAR(50) DEFAULT NULL COMMENT 'Référence au curriculum si applicable',
ADD INDEX idx_curriculum (curriculum_id);

-- ============================================================
-- Données de test (optionnel - mode démo)
-- ============================================================

-- Exemple de curriculum
INSERT INTO curriculum (id, tenant_id, class_id, teacher_id, title, description, year_start, year_end, level, status)
VALUES (
    'curr-demo-2025',
    'demo-school',
    'class-l1-info',
    'teacher-1',
    'Programme de L1 Informatique 2025-2026',
    'Curriculum annuel couvrant les fondamentaux de l\'informatique et de la programmation',
    2025,
    2026,
    'L1',
    'active'
) ON DUPLICATE KEY UPDATE title=title;

-- Exemple de séquences
INSERT INTO curriculum_sequences (id, curriculum_id, label, description, position, duration_weeks, objectives, status) VALUES
('seq-1-bases', 'curr-demo-2025', 'Séquence 1: Bases de la programmation', 'Introduction aux concepts fondamentaux', 1, 4,
    JSON_ARRAY(
        JSON_OBJECT('id', 'obj-1-1', 'label', 'Comprendre les variables et types de données'),
        JSON_OBJECT('id', 'obj-1-2', 'label', 'Maîtriser les structures de contrôle'),
        JSON_OBJECT('id', 'obj-1-3', 'label', 'Écrire des fonctions simples')
    ), 'in_progress'),
('seq-2-algo', 'curr-demo-2025', 'Séquence 2: Algorithmique', 'Apprentissage des algorithmes classiques', 2, 5,
    JSON_ARRAY(
        JSON_OBJECT('id', 'obj-2-1', 'label', 'Comprendre la complexité algorithmique'),
        JSON_OBJECT('id', 'obj-2-2', 'label', 'Implémenter des algorithmes de tri'),
        JSON_OBJECT('id', 'obj-2-3', 'label', 'Résoudre des problèmes avec des structures de données')
    ), 'draft'),
('seq-3-poo', 'curr-demo-2025', 'Séquence 3: Programmation Orientée Objet', 'Concepts de POO et design patterns', 3, 6,
    JSON_ARRAY(
        JSON_OBJECT('id', 'obj-3-1', 'label', 'Maîtriser les classes et objets'),
        JSON_OBJECT('id', 'obj-3-2', 'label', 'Appliquer l\'héritage et le polymorphisme'),
        JSON_OBJECT('id', 'obj-3-3', 'label', 'Utiliser les design patterns de base')
    ), 'draft')
ON DUPLICATE KEY UPDATE label=label;

-- ============================================================
-- Procédures stockées utilitaires
-- ============================================================

DELIMITER $$

-- Procédure pour recalculer le taux d'avancement d'une séquence
CREATE PROCEDURE IF NOT EXISTS UpdateSequenceCompletion(IN p_sequence_id VARCHAR(50))
BEGIN
    DECLARE avg_completion DECIMAL(5,2);

    SELECT AVG(completion_percent) INTO avg_completion
    FROM curriculum_student_progress
    WHERE sequence_id = p_sequence_id;

    UPDATE curriculum_sequences
    SET completion_percent = COALESCE(avg_completion, 0)
    WHERE id = p_sequence_id;
END$$

-- Procédure pour recalculer la progression d'un élève sur une séquence
CREATE PROCEDURE IF NOT EXISTS UpdateStudentSequenceProgress(
    IN p_sequence_id VARCHAR(50),
    IN p_student_id VARCHAR(50)
)
BEGIN
    DECLARE total_assignments INT;
    DECLARE completed_assignments INT;
    DECLARE progress_percent DECIMAL(5,2);

    -- Compter les missions associées à la séquence
    SELECT COUNT(*) INTO total_assignments
    FROM curriculum_sequence_assignments
    WHERE sequence_id = p_sequence_id AND is_required = TRUE;

    -- Compter les missions complétées par l'élève (via stats)
    SELECT COUNT(DISTINCT csa.assignment_id) INTO completed_assignments
    FROM curriculum_sequence_assignments csa
    INNER JOIN stats s ON s.assignment_id = csa.assignment_id
    WHERE csa.sequence_id = p_sequence_id
      AND s.student_id = p_student_id
      AND s.completion_percent >= 80; -- Seuil de validation

    -- Calculer le pourcentage
    IF total_assignments > 0 THEN
        SET progress_percent = (completed_assignments * 100.0) / total_assignments;
    ELSE
        SET progress_percent = 0;
    END IF;

    -- Mettre à jour ou insérer la progression
    INSERT INTO curriculum_student_progress (sequence_id, student_id, completion_percent, status, last_activity_at)
    VALUES (p_sequence_id, p_student_id, progress_percent,
            CASE
                WHEN progress_percent >= 100 THEN 'completed'
                WHEN progress_percent > 0 THEN 'in_progress'
                ELSE 'not_started'
            END,
            NOW())
    ON DUPLICATE KEY UPDATE
        completion_percent = progress_percent,
        status = CASE
            WHEN progress_percent >= 100 THEN 'completed'
            WHEN progress_percent > 0 THEN 'in_progress'
            ELSE 'not_started'
        END,
        last_activity_at = NOW();
END$$

DELIMITER ;

-- ============================================================
-- Fin de la migration Sprint 18
-- ============================================================
