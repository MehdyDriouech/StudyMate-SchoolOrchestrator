-- =========================================
-- Migration: Mise à jour de la table submissions pour la fonctionnalité Submissions
-- Date: 2025-01-25
-- Description: 
--   1. Vérifie que la table submissions existe avec toutes les colonnes requises
--   2. Ajoute la contrainte UNIQUE sur (assignment_id, student_id) pour garantir une soumission par étudiant/assignment
--   3. Ajoute updated_at si nécessaire
--   4. Assure l'intégrité des données
-- =========================================

SET @dbname = DATABASE();
SET @tablename = "submissions";

-- =========================================
-- PARTIE 1: Vérifier que la table existe
-- =========================================

SET @tableExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
);

-- Si la table n'existe pas, la créer
SET @preparedStatement = (SELECT IF(
  @tableExists = 0,
  CONCAT("CREATE TABLE ", @tablename, " (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    score DECIMAL(5,2) NULL,
    duration_seconds INT NULL,
    raw_response JSON NULL,
    completed_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),
  "SELECT 1"
));
PREPARE createTableIfNotExists FROM @preparedStatement;
EXECUTE createTableIfNotExists;
DEALLOCATE PREPARE createTableIfNotExists;

-- =========================================
-- PARTIE 2: Ajouter les colonnes manquantes (idempotent)
-- =========================================

-- Ajouter updated_at si elle n'existe pas
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
-- PARTIE 3: Ajouter la contrainte UNIQUE sur (assignment_id, student_id)
-- =========================================

-- Vérifier si la contrainte UNIQUE existe déjà
SET @uniqueConstraintExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND CONSTRAINT_TYPE = 'UNIQUE'
    AND CONSTRAINT_NAME LIKE '%assignment_id%'
);

-- Si la contrainte n'existe pas, l'ajouter
SET @preparedStatement = (SELECT IF(
  @uniqueConstraintExists = 0,
  CONCAT("ALTER TABLE ", @tablename, " ADD UNIQUE KEY unique_assignment_student (assignment_id, student_id)"),
  "SELECT 1"
));
PREPARE addUniqueConstraint FROM @preparedStatement;
EXECUTE addUniqueConstraint;
DEALLOCATE PREPARE addUniqueConstraint;

-- =========================================
-- PARTIE 4: Vérifier et ajuster les types de colonnes si nécessaire
-- =========================================

-- Vérifier que score est DECIMAL(5,2)
SET @columnType = (
  SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'score'
);

SET @preparedStatement = (SELECT IF(
  @columnType IS NOT NULL AND @columnType != 'decimal(5,2)',
  CONCAT("ALTER TABLE ", @tablename, " MODIFY COLUMN score DECIMAL(5,2) NULL"),
  "SELECT 1"
));
PREPARE modifyScoreType FROM @preparedStatement;
EXECUTE modifyScoreType;
DEALLOCATE PREPARE modifyScoreType;

-- Vérifier que duration_seconds est INT
SET @columnType = (
  SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'duration_seconds'
);

SET @preparedStatement = (SELECT IF(
  @columnType IS NOT NULL AND @columnType NOT LIKE 'int%',
  CONCAT("ALTER TABLE ", @tablename, " MODIFY COLUMN duration_seconds INT NULL"),
  "SELECT 1"
));
PREPARE modifyDurationType FROM @preparedStatement;
EXECUTE modifyDurationType;
DEALLOCATE PREPARE modifyDurationType;

-- =========================================
-- Notes de compatibilité
-- =========================================
-- La contrainte UNIQUE sur (assignment_id, student_id) garantit qu'un étudiant
-- ne peut avoir qu'une seule soumission valide par assignment.
-- 
-- Pour gérer les nouvelles tentatives, on utilisera INSERT ... ON DUPLICATE KEY UPDATE
-- dans le code PHP pour mettre à jour la soumission existante.
--
-- Le champ score accepte des valeurs de 0 à 100 (ou 0 à 20 selon l'échelle utilisée).
-- Le champ raw_response stocke le JSON complet des réponses de l'étudiant.

