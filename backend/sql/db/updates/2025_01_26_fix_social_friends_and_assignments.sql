-- =========================================
-- Correction des erreurs SQL
-- Date: 2025-01-26
-- Description: 
--   1. Supprime la contrainte CHECK problématique de social_friends (si elle existe)
--   2. Corrige les données assignments avec des valeurs DATETIME invalides
-- =========================================

SET @dbname = DATABASE();

-- =========================================
-- PARTIE 1: Supprimer la contrainte CHECK de social_friends si elle existe
-- =========================================

-- Vérifier si la table social_friends existe
SET @tableExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = 'social_friends'
);

-- Si la table existe, supprimer la contrainte CHECK si elle existe
SET @constraintExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = 'social_friends'
    AND CONSTRAINT_NAME = 'chk_no_self_friend'
    AND CONSTRAINT_TYPE = 'CHECK'
);

SET @preparedStatement = (SELECT IF(
  @tableExists > 0 AND @constraintExists > 0,
  'ALTER TABLE social_friends DROP CHECK chk_no_self_friend',
  'SELECT 1'
));
PREPARE dropCheckConstraint FROM @preparedStatement;
EXECUTE dropCheckConstraint;
DEALLOCATE PREPARE dropCheckConstraint;

-- =========================================
-- PARTIE 2: Corriger les valeurs DATETIME invalides dans assignments
-- =========================================

-- Vérifier si la table assignments existe et si due_date existe
SET @tableExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = 'assignments'
);

SET @columnExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = 'assignments'
    AND COLUMN_NAME = 'due_date'
);

-- Si la table et la colonne existent, corriger les valeurs invalides
-- Mettre NULL pour les valeurs DATETIME invalides (chaînes vides, dates invalides)
SET @preparedStatement = (SELECT IF(
  @tableExists > 0 AND @columnExists > 0,
  'UPDATE assignments SET due_date = NULL WHERE due_date = ''0000-00-00 00:00:00'' OR due_date = ''''',
  'SELECT 1'
));
PREPARE fixInvalidDates FROM @preparedStatement;
EXECUTE fixInvalidDates;
DEALLOCATE PREPARE fixInvalidDates;

-- Copier due_at vers due_date pour les lignes où due_date est NULL
-- (correction de la requête originale qui comparait avec une chaîne vide)
SET @preparedStatement = (SELECT IF(
  @tableExists > 0 AND @columnExists > 0,
  'UPDATE assignments SET due_date = due_at WHERE due_date IS NULL AND due_at IS NOT NULL',
  'SELECT 1'
));
PREPARE copyDueAtToDueDate FROM @preparedStatement;
EXECUTE copyDueAtToDueDate;
DEALLOCATE PREPARE copyDueAtToDueDate;

-- =========================================
-- Notes
-- =========================================
-- 1. La validation owner_user_id != friend_user_id est gérée au niveau applicatif
--    dans SocialFriendService::addFriendByCode()
-- 2. Les valeurs DATETIME invalides ont été corrigées en NULL
-- 3. La migration des données due_at -> due_date a été corrigée

