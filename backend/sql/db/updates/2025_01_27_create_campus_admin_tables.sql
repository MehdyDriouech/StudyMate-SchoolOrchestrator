-- Migration: Ajout du rôle campus_admin et tables d'administration
-- Date: 2025-01-27
-- Description: Support du rôle Campus Administrator avec tables admin_settings, admin_imports, admin_audit_logs

-- =========================================
-- 1. Étendre la table schools
-- =========================================

SET @dbname = DATABASE();
SET @tablename = "schools";

-- Ajouter code (VARCHAR 50, NULL)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "code")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN code VARCHAR(50) DEFAULT NULL COMMENT 'Code unique de l''établissement (ex: IFER-MPL)' AFTER name")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter address (VARCHAR 255, NULL)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "address")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN address VARCHAR(255) DEFAULT NULL AFTER code")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter postal_code (VARCHAR 10, NULL)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "postal_code")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN postal_code VARCHAR(10) DEFAULT NULL AFTER address")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter country (VARCHAR 100, DEFAULT 'FR')
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "country")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN country VARCHAR(100) DEFAULT 'FR' AFTER postal_code")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter is_active (BOOLEAN, DEFAULT TRUE)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "is_active")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER country")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter updated_at (DATETIME, auto-update)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "updated_at")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =========================================
-- 2. Ajouter le rôle campus_admin dans users.role
-- =========================================
ALTER TABLE `users` 
  MODIFY COLUMN `role` ENUM('student','teacher','director','pedago','campus_admin') NOT NULL;

-- =========================================
-- 3. Table admin_settings : paramètres globaux
-- =========================================
CREATE TABLE IF NOT EXISTS `admin_settings` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT DEFAULT NULL COMMENT 'Valeur JSON ou texte simple',
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Paramètres globaux de l''administration';

-- Insertion des paramètres initiaux
INSERT INTO `admin_settings` (`key`, `value`, `description`) VALUES
  ('feature_social_enabled', 'true', 'Active/désactive la fonctionnalité Social'),
  ('feature_ai_theme_studio_enabled', 'true', 'Active/désactive l''AI Theme Studio'),
  ('feature_demo_mode_enabled', 'false', 'Active/désactive le mode démo'),
  ('data_retention_years', '5', 'Durée de rétention des données en années')
ON DUPLICATE KEY UPDATE `key` = `key`;

-- =========================================
-- 4. Table admin_imports : suivi des imports utilisateurs
-- =========================================
CREATE TABLE IF NOT EXISTS `admin_imports` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(50) NOT NULL COMMENT 'users_students, users_teachers, users_directors, etc.',
  `file_name` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'running', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  `created_by` INT(11) NOT NULL COMMENT 'ID de l''utilisateur qui a créé l''import',
  `summary` TEXT DEFAULT NULL COMMENT 'JSON avec stats et erreurs',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  CONSTRAINT `fk_admin_imports_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Suivi des imports utilisateurs';

-- =========================================
-- 5. Table admin_audit_logs : logs des actions admin
-- =========================================
CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL COMMENT 'ID de l''admin qui a fait l''action',
  `action` VARCHAR(100) NOT NULL COMMENT 'CREATE_SCHOOL, UPDATE_USER, IMPORT_USERS, UPDATE_SETTINGS, etc.',
  `entity_type` VARCHAR(50) DEFAULT NULL COMMENT 'school, user, settings, import, etc.',
  `entity_id` INT(11) DEFAULT NULL COMMENT 'ID de l''entité concernée',
  `metadata` JSON DEFAULT NULL COMMENT 'Diff old/new, paramètres, etc.',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_admin_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs d''audit des actions administratives';

