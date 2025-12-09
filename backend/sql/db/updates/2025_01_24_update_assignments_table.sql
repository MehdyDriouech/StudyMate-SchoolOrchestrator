-- =========================================
-- Migration: Mise à jour de la table assignments pour supporter le nouveau modèle
-- Date: 2025-01-24
-- Description: 
--   1. Ajoute les nouveaux champs (title, description, subject, due_date, available_at, status, updated_at)
--   2. Assouplit les contraintes (theme_id et start_at deviennent NULLABLE)
--   3. Migre les données legacy (due_at -> due_date, status = 'published', titre par défaut)
-- =========================================

SET @dbname = DATABASE();
SET @tablename = "assignments";

-- =========================================
-- PARTIE 1: Ajouter les nouvelles colonnes (idempotent)
-- =========================================

-- Ajouter title (VARCHAR 255, NULL)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "title")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN title VARCHAR(255) NULL AFTER class_id")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter description (TEXT, NULL)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "description")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN description TEXT NULL AFTER title")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter subject (VARCHAR 100, NULL)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "subject")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN subject VARCHAR(100) NULL AFTER description")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter due_date (DATETIME, NULL)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "due_date")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN due_date DATETIME NULL AFTER subject")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter available_at (DATETIME, NULL)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "available_at")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN available_at DATETIME NULL AFTER due_date")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter status (ENUM 'draft', 'published', 'archived', default 'draft')
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = "status")
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft' AFTER available_at")
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
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =========================================
-- PARTIE 2: 🚨 CRITIQUE - Assouplir les contraintes existantes
-- =========================================

-- Rendre theme_id NULLABLE (actuellement NOT NULL)
-- Vérifier si la colonne existe et si elle est NOT NULL
SET @columnExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE
    (TABLE_SCHEMA = @dbname)
    AND (TABLE_NAME = @tablename)
    AND (COLUMN_NAME = "theme_id")
    AND (IS_NULLABLE = "NO")
);

SET @preparedStatement = (SELECT IF(
  @columnExists > 0,
  CONCAT("ALTER TABLE ", @tablename, " MODIFY COLUMN theme_id INT NULL"),
  "SELECT 1"
));
PREPARE alterIfNotNull FROM @preparedStatement;
EXECUTE alterIfNotNull;
DEALLOCATE PREPARE alterIfNotNull;

-- Rendre start_at NULLABLE (actuellement NOT NULL)
SET @columnExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE
    (TABLE_SCHEMA = @dbname)
    AND (TABLE_NAME = @tablename)
    AND (COLUMN_NAME = "start_at")
    AND (IS_NULLABLE = "NO")
);

SET @preparedStatement = (SELECT IF(
  @columnExists > 0,
  CONCAT("ALTER TABLE ", @tablename, " MODIFY COLUMN start_at DATETIME NULL"),
  "SELECT 1"
));
PREPARE alterIfNotNull FROM @preparedStatement;
EXECUTE alterIfNotNull;
DEALLOCATE PREPARE alterIfNotNull;

-- =========================================
-- PARTIE 3: Migration des données legacy
-- =========================================

-- 3.1: Copier due_at vers due_date pour les lignes existantes
-- Note: due_date est un DATETIME, donc on ne peut pas comparer avec une chaîne vide ''
UPDATE assignments 
SET due_date = due_at 
WHERE due_date IS NULL 
  AND due_at IS NOT NULL;

-- 3.2: Mettre status = 'published' pour tous les assignments existants
-- (pour que les étudiants actuels ne perdent pas l'accès)
UPDATE assignments 
SET status = 'published'
WHERE status IS NULL OR status = 'draft';

-- 3.3: Définir un titre par défaut pour les assignments legacy sans titre
UPDATE assignments 
SET title = CONCAT('Devoir du ', DATE_FORMAT(COALESCE(due_date, due_at, created_at), '%d/%m/%Y'))
WHERE (title IS NULL OR title = '');

-- Alternative: Si la date n'est pas disponible, utiliser un titre générique
UPDATE assignments 
SET title = 'Devoir (Legacy)'
WHERE (title IS NULL OR title = '');

-- =========================================
-- Notes de compatibilité
-- =========================================
-- Les champs suivants sont conservés pour compatibilité avec l'ancien modèle:
-- - theme_id (maintenant NULLABLE)
-- - assigned_by (reste NOT NULL pour l'instant)
-- - start_at (maintenant NULLABLE)
-- - end_at (déjà NULLABLE)
-- - due_at (conservé, mais due_date est le nouveau champ principal)
--
-- Le nouveau modèle permet de créer des assignments "génériques" sans thème,
-- ce qui est requis pour la nouvelle fonctionnalité.
