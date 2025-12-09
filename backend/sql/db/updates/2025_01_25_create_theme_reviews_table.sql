-- =========================================
-- Migration: Création de la table theme_reviews pour l'audit qualité des thèmes
-- Date: 2025-01-25
-- Description: 
--   Crée la table theme_reviews pour historiser les décisions qualité sur les thèmes
--   Chaque review contient: id, theme_id, reviewer_id, action, comment, created_at
-- =========================================

SET @dbname = DATABASE();
SET @tablename = "theme_reviews";

-- =========================================
-- Créer la table theme_reviews si elle n'existe pas
-- =========================================

CREATE TABLE IF NOT EXISTS theme_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  theme_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  comment TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_theme_id (theme_id),
  INDEX idx_reviewer_id (reviewer_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Commentaires sur les colonnes
-- =========================================

-- action peut être: 'submitted', 'approved', 'rejected', 'needs_changes'
-- Ces valeurs sont contrôlées au niveau applicatif

