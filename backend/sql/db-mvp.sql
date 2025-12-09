-- =========================================
-- StudyMate School Orchestrator (SMSO) - Base de données MVP
-- Fichier SQL complet pour créer la base de données au format final
-- Date: 2025-01-25
-- MySQL 8+ recommandé
-- =========================================
-- 
-- Ce fichier consolide toutes les migrations et crée la base de données
-- dans son état final, sans avoir besoin d'exécuter les updates un par un.
-- 
-- Tables incluses:
-- - schools (établissements)
-- - users (utilisateurs: étudiants, profs, direction, pédago)
-- - classes (classes pédagogiques)
-- - class_students (relation classes ↔ élèves)
-- - themes (thèmes d'apprentissage)
-- - theme_questions (questions des thèmes)
-- - theme_reviews (audit qualité des thèmes) [NOUVEAU]
-- - assignments (devoirs avec nouveau modèle)
-- - submissions (soumissions élèves avec contrainte UNIQUE)
-- - social_stats (statistiques sociales des classes)
-- - activity_logs (timeline / événements)
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================
-- Suppression des tables existantes (ordre inverse des dépendances)
-- =========================================
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS theme_reviews;
DROP TABLE IF EXISTS social_stats;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS theme_questions;
DROP TABLE IF EXISTS themes;
DROP TABLE IF EXISTS class_students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schools;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================
-- TABLE schools : établissements
-- =========================================
CREATE TABLE schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE users : utilisateurs (élèves, profs, direction, pédago)
-- =========================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','teacher','director','pedago') NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  social_uuid VARCHAR(64) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_school_id (school_id),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE classes : classes pédagogiques
-- =========================================
CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  level VARCHAR(50),
  academic_year VARCHAR(9),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_school_id (school_id),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE class_students : relation classes ↔ élèves
-- =========================================
CREATE TABLE class_students (
  class_id INT NOT NULL,
  student_id INT NOT NULL,
  PRIMARY KEY (class_id, student_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE themes : thèmes d'apprentissage (quiz / flashcards / fiches)
-- =========================================
CREATE TABLE themes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  created_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  type ENUM('quiz','flashcards','sheet') NOT NULL,
  status ENUM('draft','pending_review','approved','published') NOT NULL DEFAULT 'draft',
  source ENUM('manual','ai_studio','pdf_import') NOT NULL DEFAULT 'manual',
  source_file_name VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_school_id (school_id),
  INDEX idx_created_by (created_by),
  INDEX idx_status (status),
  INDEX idx_subject (subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE theme_questions : questions d'un thème
-- =========================================
CREATE TABLE theme_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  theme_id INT NOT NULL,
  question_type ENUM('mcq','true_false','open') NOT NULL,
  prompt TEXT NOT NULL,
  data JSON NULL,
  order_index INT NOT NULL DEFAULT 0,
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_theme_id (theme_id),
  INDEX idx_order_index (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE theme_reviews : audit qualité des thèmes
-- =========================================
CREATE TABLE theme_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  theme_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  action VARCHAR(50) NOT NULL COMMENT 'submitted, approved, rejected, needs_changes',
  comment TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_theme_id (theme_id),
  INDEX idx_reviewer_id (reviewer_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE assignments : assignation de thème à une classe
-- Modèle mis à jour avec support des assignments génériques
-- =========================================
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  theme_id INT NULL COMMENT 'NULLABLE pour permettre les assignments génériques',
  assigned_by INT NOT NULL,
  -- Nouveaux champs du modèle mis à jour
  title VARCHAR(255) NULL COMMENT 'Titre du devoir (peut être généré si NULL)',
  description TEXT NULL COMMENT 'Description détaillée du devoir',
  subject VARCHAR(100) NULL COMMENT 'Matière (Maths, Philosophie, etc.)',
  due_date DATETIME NULL COMMENT 'Date limite de rendu',
  available_at DATETIME NULL COMMENT 'Date de disponibilité du devoir',
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  -- Champs legacy (conservés pour compatibilité)
  start_at DATETIME NULL COMMENT 'Date de début (legacy, maintenant NULLABLE)',
  end_at DATETIME NULL,
  due_at DATETIME NULL COMMENT 'Legacy: conservé pour compatibilité, utiliser due_date de préférence',
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_class_id (class_id),
  INDEX idx_theme_id (theme_id),
  INDEX idx_assigned_by (assigned_by),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE submissions : rendus élèves
-- Avec contrainte UNIQUE pour garantir une soumission par étudiant/assignment
-- =========================================
CREATE TABLE submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  score DECIMAL(5,2) NULL COMMENT 'Note sur 100 (ou sur 20 selon l''échelle)',
  duration_seconds INT NULL COMMENT 'Durée en secondes',
  raw_response JSON NULL COMMENT 'Réponses complètes de l''étudiant au format JSON',
  completed_at DATETIME NULL COMMENT 'Date de complétion (NULL si en cours)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_assignment_student (assignment_id, student_id),
  INDEX idx_assignment_id (assignment_id),
  INDEX idx_student_id (student_id),
  INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE social_stats : statistiques sociales des classes
-- =========================================
CREATE TABLE social_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  metric_date DATE NOT NULL,
  collaboration_score DECIMAL(5,2) NULL COMMENT 'Score de collaboration (0-100)',
  participation_rate DECIMAL(5,2) NULL COMMENT 'Taux de participation (0-100)',
  engagement_level ENUM('low','medium','high') NULL COMMENT 'Niveau d''engagement',
  notes TEXT NULL COMMENT 'Notes additionnelles',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_class_date (class_id, metric_date),
  INDEX idx_class_id (class_id),
  INDEX idx_metric_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABLE activity_logs : timeline / événements
-- =========================================
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  school_id INT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_school_id (school_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- Notes importantes
-- =========================================
-- 
-- 1. Assignments:
--    - theme_id est NULLABLE pour permettre les assignments génériques
--    - Les champs title, description, subject, due_date, available_at, status sont les nouveaux champs principaux
--    - Les champs start_at, end_at, due_at sont conservés pour compatibilité legacy
-- 
-- 2. Submissions:
--    - Contrainte UNIQUE sur (assignment_id, student_id) garantit une seule soumission par étudiant/assignment
--    - Utiliser INSERT ... ON DUPLICATE KEY UPDATE pour gérer les nouvelles tentatives
-- 
-- 3. Theme Reviews:
--    - Action peut être: 'submitted', 'approved', 'rejected', 'needs_changes'
--    - Les valeurs sont contrôlées au niveau applicatif
-- 
-- 4. Social Stats:
--    - Contrainte UNIQUE sur (class_id, metric_date) garantit une seule stat par classe/date
-- 
-- 5. Foreign Keys:
--    - ON DELETE CASCADE pour les relations dépendantes (ex: theme_questions, submissions)
--    - ON DELETE SET NULL pour les relations optionnelles (ex: assignments.theme_id)
--    - ON DELETE RESTRICT pour les relations critiques (ex: assignments.assigned_by)
-- 
-- =========================================
-- Fin du script
-- =========================================

