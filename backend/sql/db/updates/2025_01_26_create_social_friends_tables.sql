-- Migration: Ajout des tables social_profiles et social_friends
-- Date: 2025-01-26
-- Description: Tables pour gérer les codes amis et le graph d'amis

-- Table social_profiles : stocke le "code ami" social de chaque utilisateur
CREATE TABLE IF NOT EXISTS `social_profiles` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `school_id` INT(11) DEFAULT NULL,
  `social_code` VARCHAR(20) NOT NULL COMMENT 'Code unique style ABCD-1234-EFGH',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` DATETIME DEFAULT NULL COMMENT 'Date de révocation si le code est régénéré',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_social_code` (`social_code`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_school_id` (`school_id`),
  KEY `idx_active_profile` (`user_id`, `revoked_at`),
  CONSTRAINT `fk_social_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_social_profiles_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Profils sociaux avec codes amis';

-- Table social_friends : graph d'amis / suivi social
CREATE TABLE IF NOT EXISTS `social_friends` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` INT(11) NOT NULL COMMENT 'Utilisateur qui suit/voit l''ami',
  `friend_user_id` INT(11) NOT NULL COMMENT 'Utilisateur suivi',
  `school_id` INT(11) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_friendship` (`owner_user_id`, `friend_user_id`),
  KEY `idx_owner_user_id` (`owner_user_id`),
  KEY `idx_friend_user_id` (`friend_user_id`),
  KEY `idx_school_id` (`school_id`),
  CONSTRAINT `fk_social_friends_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_social_friends_friend` FOREIGN KEY (`friend_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_social_friends_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
  -- Note: La validation owner_user_id != friend_user_id est gérée au niveau applicatif
  -- MySQL ne permet pas d'utiliser des colonnes de foreign key dans une contrainte CHECK
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Graph d''amis / relations sociales';

