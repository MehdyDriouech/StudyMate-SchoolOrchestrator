-- Migration: Ajout de la table social_stats
-- Date: 2025-01-23
-- Description: Table pour stocker les statistiques sociales des classes

CREATE TABLE IF NOT EXISTS `social_stats` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` INT(11) UNSIGNED NOT NULL,
  `metric_date` DATE NOT NULL,
  `collaboration_score` DECIMAL(5,2) DEFAULT NULL COMMENT 'Score de collaboration (0-100)',
  `participation_rate` DECIMAL(5,2) DEFAULT NULL COMMENT 'Taux de participation (0-100)',
  `engagement_level` ENUM('low', 'medium', 'high') DEFAULT NULL COMMENT 'Niveau d''engagement',
  `notes` TEXT DEFAULT NULL COMMENT 'Notes additionnelles',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_date` (`class_id`, `metric_date`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_metric_date` (`metric_date`),
  CONSTRAINT `fk_social_stats_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Statistiques sociales des classes';

