-- schema.sql
-- Schéma MySQL pour StudyMate School Orchestrator (SMSO)
-- MySQL 8+ recommandé

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS activity_logs;
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TABLE classes : classes pédagogiques
-- =========================================
CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,       -- "Terminale 2 – Spé Maths"
  short_name VARCHAR(50) NOT NULL,  -- "Tle2"
  level VARCHAR(50),                -- "Terminale", "1ère", etc.
  academic_year VARCHAR(9),         -- "2024-2025"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TABLE class_students : relation classes ↔ élèves
-- =========================================
CREATE TABLE class_students (
  class_id INT NOT NULL,
  student_id INT NOT NULL,
  PRIMARY KEY (class_id, student_id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TABLE themes : thèmes d’apprentissage (quiz / flashcards / fiches)
-- =========================================
CREATE TABLE themes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  created_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),  -- "Maths", "Physique", etc.
  type ENUM('quiz','flashcards','sheet') NOT NULL,
  status ENUM('draft','pending_review','approved','published')
    NOT NULL DEFAULT 'draft',
  source ENUM('manual','ai_studio','pdf_import') NOT NULL DEFAULT 'manual',
  source_file_name VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TABLE theme_questions : questions d’un thème
-- =========================================
CREATE TABLE theme_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  theme_id INT NOT NULL,
  question_type ENUM('mcq','true_false','open') NOT NULL,
  prompt TEXT NOT NULL,
  data JSON NULL,          -- structure de réponses selon le type
  order_index INT NOT NULL DEFAULT 0,
  FOREIGN KEY (theme_id) REFERENCES themes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TABLE assignments : assignation de thème à une classe
-- =========================================
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  theme_id INT NOT NULL,
  assigned_by INT NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NULL,
  due_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (theme_id) REFERENCES themes(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TABLE submissions : rendus élèves
-- =========================================
CREATE TABLE submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  score DECIMAL(5,2) NULL,          -- note sur 100
  completed_at DATETIME NULL,
  duration_seconds INT NULL,
  raw_response JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TABLE social_stats : stats sociales / classements
-- =========================================
CREATE TABLE social_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  metric_date DATE NOT NULL,
  rank_in_class INT NULL,
  percentile DECIMAL(5,2) NULL,
  avg_speed_seconds INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
