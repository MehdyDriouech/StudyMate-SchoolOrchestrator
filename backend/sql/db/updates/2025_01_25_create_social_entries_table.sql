-- Migration: Création de la table social_entries
-- Date: 2025-01-25
-- Description: Table pour gérer les entrées sociales (configurations, règles, messages)

CREATE TABLE IF NOT EXISTS social_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NULL COMMENT 'ID de l\'établissement (NULL = global)',
  type VARCHAR(50) NOT NULL COMMENT 'Type d\'entrée: rule, message, config',
  title VARCHAR(255) NOT NULL COMMENT 'Titre de l\'entrée',
  description TEXT NULL COMMENT 'Description détaillée',
  payload JSON NULL COMMENT 'Données supplémentaires (JSON)',
  created_by INT NOT NULL COMMENT 'ID de l\'utilisateur créateur',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_school_id (school_id),
  INDEX idx_type (type),
  INDEX idx_created_by (created_by),
  
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de données de test
INSERT INTO social_entries (school_id, type, title, description, payload, created_by) VALUES
(1, 'rule', 'Classement hebdomadaire activé', 'Les scores de cette semaine comptent pour le classement social.', '{"ranking_period": "week", "enabled": true}', 1),
(1, 'message', 'Message de bienvenue', 'Bienvenue dans le système social de l\'établissement.', '{"priority": "normal", "display_duration": 7}', 1),
(1, 'config', 'Configuration Social', 'Paramètres globaux du système social.', '{"leaderboard_enabled": true, "notifications_enabled": true}', 1);

