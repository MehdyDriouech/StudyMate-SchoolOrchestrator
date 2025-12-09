-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : dim. 23 nov. 2025 à 18:09
-- Version du serveur : 8.0.44
-- Version de PHP : 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `smso`
--

-- --------------------------------------------------------

--
-- Structure de la table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `school_id` int DEFAULT NULL,
  `event_type` varchar(100) NOT NULL,
  `payload` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `school_id`, `event_type`, `payload`, `created_at`) VALUES
(1, 3, 1, 'teacher_created_theme', '{\"title\": \"Suites numériques\", \"theme_id\": 1}', '2025-10-01 09:05:00'),
(2, 3, 1, 'teacher_published_theme', '{\"theme_id\": 1}', '2025-10-15 08:05:00'),
(3, 3, 1, 'teacher_assigned_theme_to_class', '{\"class_id\": 1, \"theme_id\": 1}', '2025-10-15 08:10:00'),
(4, 10, 1, 'student_started_assignment', '{\"assignment_id\": 1}', '2025-10-21 17:45:00'),
(5, 10, 1, 'student_completed_assignment', '{\"score\": 88.0, \"assignment_id\": 1}', '2025-10-21 18:00:00'),
(6, 1, 1, 'director_viewed_executive_dashboard', '{\"school_id\": 1}', '2025-10-24 09:00:00'),
(7, 1, 1, 'director_viewed_heatmap', '{\"school_id\": 1}', '2025-10-24 09:05:00');

-- --------------------------------------------------------

--
-- Structure de la table `admin_audit_logs`
--

CREATE TABLE `admin_audit_logs` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int NOT NULL COMMENT 'ID de l''admin qui a fait l''action',
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'CREATE_SCHOOL, UPDATE_USER, IMPORT_USERS, UPDATE_SETTINGS, etc.',
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'school, user, settings, import, etc.',
  `entity_id` int DEFAULT NULL COMMENT 'ID de l''entité concernée',
  `metadata` json DEFAULT NULL COMMENT 'Diff old/new, paramètres, etc.',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs d''audit des actions administratives';

-- --------------------------------------------------------

--
-- Structure de la table `admin_imports`
--

CREATE TABLE `admin_imports` (
  `id` int UNSIGNED NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'users_students, users_teachers, users_directors, etc.',
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','running','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_by` int NOT NULL COMMENT 'ID de l''utilisateur qui a créé l''import',
  `summary` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON avec stats et erreurs',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Suivi des imports utilisateurs';

-- --------------------------------------------------------

--
-- Structure de la table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `id` int UNSIGNED NOT NULL,
  `key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci COMMENT 'Valeur JSON ou texte simple',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Paramètres globaux de l''administration';

--
-- Déchargement des données de la table `admin_settings`
--

INSERT INTO `admin_settings` (`id`, `key`, `value`, `description`, `updated_at`) VALUES
(1, 'feature_social_enabled', 'true', 'Active/désactive la fonctionnalité Social', NULL),
(2, 'feature_ai_theme_studio_enabled', 'true', 'Active/désactive l\'AI Theme Studio', NULL),
(3, 'feature_demo_mode_enabled', 'false', 'Active/désactive le mode démo', NULL),
(4, 'data_retention_years', '5', 'Durée de rétention des données en années', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `assignments`
--

CREATE TABLE `assignments` (
  `id` int NOT NULL,
  `class_id` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `subject` varchar(100) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `available_at` datetime DEFAULT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `theme_id` int DEFAULT NULL,
  `assigned_by` int NOT NULL,
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `assignments`
--

INSERT INTO `assignments` (`id`, `class_id`, `title`, `description`, `subject`, `due_date`, `available_at`, `status`, `theme_id`, `assigned_by`, `start_at`, `end_at`, `due_at`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, NULL, NULL, NULL, NULL, 'draft', 1, 4, '2025-10-15 08:00:00', '2025-11-30 23:59:59', '2025-10-22 23:59:59', '2025-10-15 08:00:00', '2025-11-20 15:08:02'),
(2, 1, NULL, NULL, NULL, NULL, NULL, 'draft', 2, 3, '2025-10-20 08:00:00', '2025-12-05 23:59:59', '2025-10-28 23:59:59', '2025-10-20 08:00:00', '2025-11-20 15:08:02'),
(3, 2, NULL, NULL, NULL, NULL, NULL, 'draft', 4, 4, '2025-10-18 08:00:00', '2025-11-25 23:59:59', '2025-10-25 23:59:59', '2025-10-18 08:00:00', '2025-11-20 15:08:02'),
(4, 3, NULL, NULL, NULL, NULL, NULL, 'draft', 6, 3, '2025-10-19 08:00:00', '2025-11-20 23:59:59', '2025-10-27 23:59:59', '2025-10-19 08:00:00', '2025-11-20 15:08:02'),
(6, 1, NULL, NULL, NULL, NULL, NULL, 'draft', 1, 3, '2025-12-01 08:00:00', NULL, NULL, '2025-11-19 10:47:49', '2025-11-20 15:08:02'),
(7, 1, NULL, NULL, NULL, NULL, NULL, 'draft', 1, 3, '2025-09-27 18:00:00', NULL, NULL, '2025-11-19 10:51:08', '2025-11-20 15:08:02');

-- --------------------------------------------------------

--
-- Structure de la table `classes`
--

CREATE TABLE `classes` (
  `id` int NOT NULL,
  `school_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `short_name` varchar(50) NOT NULL,
  `level` varchar(50) DEFAULT NULL,
  `academic_year` varchar(9) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `classes`
--

INSERT INTO `classes` (`id`, `school_id`, `name`, `short_name`, `level`, `academic_year`, `created_at`) VALUES
(1, 1, 'Terminale 2 – Spé Maths', 'Tle2', 'Terminale', '2024-2025', '2025-11-19 10:01:46'),
(2, 1, 'Terminale 3 – Physique', 'Tle3', 'Terminale', '2024-2025', '2025-11-19 10:01:46'),
(3, 1, '1ère ST2S', '1ST2S', 'Première', '2024-2025', '2025-11-19 10:01:46'),
(4, 1, '2nde Générale A', '2ndeA', 'Seconde', '2024-2025', '2025-11-19 10:01:46');

-- --------------------------------------------------------

--
-- Structure de la table `class_students`
--

CREATE TABLE `class_students` (
  `class_id` int NOT NULL,
  `student_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `class_students`
--

INSERT INTO `class_students` (`class_id`, `student_id`) VALUES
(1, 10),
(2, 10),
(1, 11),
(2, 11),
(1, 12),
(3, 12),
(1, 13),
(3, 13),
(1, 14),
(3, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(4, 18),
(1, 19),
(4, 19);

-- --------------------------------------------------------

--
-- Structure de la table `schools`
--

CREATE TABLE `schools` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL COMMENT 'Code unique de l''établissement (ex: IFER-MPL)',
  `address` varchar(255) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'FR',
  `is_active` tinyint(1) DEFAULT '1',
  `city` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `schools`
--

INSERT INTO `schools` (`id`, `name`, `code`, `address`, `postal_code`, `country`, `is_active`, `city`, `created_at`, `updated_at`) VALUES
(1, 'Lycée Hoche', NULL, NULL, NULL, 'FR', 1, 'Versailles', '2025-11-19 10:01:46', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `social_entries`
--

CREATE TABLE `social_entries` (
  `id` int NOT NULL,
  `school_id` int DEFAULT NULL COMMENT 'ID de l''établissement (NULL = global)',
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type d''entrée: rule, message, config',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Titre de l''entrée',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description détaillée',
  `payload` json DEFAULT NULL COMMENT 'Données supplémentaires (JSON)',
  `created_by` int NOT NULL COMMENT 'ID de l''utilisateur créateur',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `social_entries`
--

INSERT INTO `social_entries` (`id`, `school_id`, `type`, `title`, `description`, `payload`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 1, 'message', 'Message de bienvenue', 'Bienvenue dans le système social de l\'établissement.', '{\"priority\": \"normal\", \"display_duration\": 7}', 1, '2025-11-20 14:08:40', '2025-11-20 14:08:40'),
(3, 1, 'config', 'Configuration Social', 'Paramètres globaux du système social.', '{\"leaderboard_enabled\": true, \"notifications_enabled\": true}', 1, '2025-11-20 14:08:40', '2025-11-20 14:08:40'),
(4, NULL, 'rule', 'Classement hebdomadaire activé', 'Les scores de cette semaine comptent pour le classement social.', '{\"enabled\": true, \"ranking_period\": \"week\"}', 1, '2025-11-20 14:08:43', '2025-11-20 14:08:43'),
(5, NULL, 'rule', 'Classement hebdomadaire activé', 'Les scores de cette semaine comptent pour le classement social.', '{\"enabled\": true, \"ranking_period\": \"week\"}', 1, '2025-11-20 16:01:30', '2025-11-20 16:01:30'),
(6, NULL, 'rule', 'Classement hebdomadaire activé', 'Les scores de cette semaine comptent pour le classement social.', '{\"enabled\": true, \"ranking_period\": \"week\"}', 1, '2025-11-20 16:21:07', '2025-11-20 16:21:07'),
(7, NULL, 'rule', 'Classement hebdomadaire activé', 'Les scores de cette semaine comptent pour le classement social.', '{\"enabled\": true, \"ranking_period\": \"week\"}', 1, '2025-11-23 08:44:13', '2025-11-23 08:44:13');

-- --------------------------------------------------------

--
-- Structure de la table `social_friends`
--

CREATE TABLE `social_friends` (
  `id` int UNSIGNED NOT NULL,
  `owner_user_id` int NOT NULL COMMENT 'Utilisateur qui suit/voit l''ami',
  `friend_user_id` int NOT NULL COMMENT 'Utilisateur suivi',
  `school_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Graph d''amis / relations sociales';

-- --------------------------------------------------------

--
-- Structure de la table `social_profiles`
--

CREATE TABLE `social_profiles` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int NOT NULL,
  `school_id` int DEFAULT NULL,
  `social_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Code unique style ABCD-1234-EFGH',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL COMMENT 'Date de révocation si le code est régénéré'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Profils sociaux avec codes amis';

-- --------------------------------------------------------

--
-- Structure de la table `social_stats`
--

CREATE TABLE `social_stats` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `class_id` int NOT NULL,
  `metric_date` date NOT NULL,
  `rank_in_class` int DEFAULT NULL,
  `percentile` decimal(5,2) DEFAULT NULL,
  `avg_speed_seconds` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `social_stats`
--

INSERT INTO `social_stats` (`id`, `student_id`, `class_id`, `metric_date`, `rank_in_class`, `percentile`, `avg_speed_seconds`, `created_at`) VALUES
(1, 17, 1, '2025-10-23', 1, 95.00, 900, '2025-10-23 21:00:00'),
(2, 11, 1, '2025-10-23', 2, 92.00, 1050, '2025-10-23 21:00:00'),
(3, 10, 1, '2025-10-23', 3, 88.00, 1000, '2025-10-23 21:00:00'),
(4, 12, 1, '2025-10-23', 5, 75.00, 1300, '2025-10-23 21:00:00'),
(5, 14, 1, '2025-10-23', 9, 40.00, 1500, '2025-10-23 21:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `submissions`
--

CREATE TABLE `submissions` (
  `id` int NOT NULL,
  `assignment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `submissions`
--

INSERT INTO `submissions` (`id`, `assignment_id`, `student_id`, `score`, `completed_at`, `duration_seconds`, `raw_response`, `created_at`, `updated_at`) VALUES
(1, 1, 10, 85.50, '2025-11-20 17:21:26', 300, '{\"question_1\": {\"answer\": \"a\", \"time_spent\": 30}, \"question_2\": {\"answer\": true, \"time_spent\": 20}}', '2025-10-21 18:00:00', '2025-11-20 17:21:26'),
(2, 1, 11, 92.00, '2025-10-21 19:00:00', 1100, '{\"attempt\": 1}', '2025-10-21 19:00:00', '2025-11-20 15:08:15'),
(3, 1, 12, 76.00, '2025-10-22 17:30:00', 1300, '{\"attempt\": 1}', '2025-10-22 17:30:00', '2025-11-20 15:08:15'),
(4, 1, 13, 61.00, '2025-10-22 20:15:00', 1600, '{\"attempt\": 1}', '2025-10-22 20:15:00', '2025-11-20 15:08:15'),
(5, 1, 14, 54.00, '2025-10-23 16:00:00', 1400, '{\"attempt\": 1}', '2025-10-23 16:00:00', '2025-11-20 15:08:15'),
(6, 1, 15, 81.00, '2025-10-21 21:00:00', 1000, '{\"attempt\": 1}', '2025-10-21 21:00:00', '2025-11-20 15:08:15'),
(7, 1, 16, 69.00, '2025-10-23 18:45:00', 1500, '{\"attempt\": 1}', '2025-10-23 18:45:00', '2025-11-20 15:08:15'),
(8, 1, 17, 95.00, '2025-10-21 17:00:00', 800, '{\"attempt\": 1}', '2025-10-21 17:00:00', '2025-11-20 15:08:15'),
(9, 1, 18, 72.00, '2025-10-22 15:30:00', 1200, '{\"attempt\": 1}', '2025-10-22 15:30:00', '2025-11-20 15:08:15'),
(10, 1, 19, 64.00, '2025-10-23 19:15:00', 1350, '{\"attempt\": 1}', '2025-10-23 19:15:00', '2025-11-20 15:08:15'),
(11, 2, 10, 84.00, '2025-10-27 18:30:00', 1000, '{\"attempt\": 1}', '2025-10-27 18:30:00', '2025-11-20 15:08:15'),
(12, 2, 11, 89.00, '2025-10-27 19:10:00', 1050, '{\"attempt\": 1}', '2025-10-27 19:10:00', '2025-11-20 15:08:15'),
(13, 2, 12, 71.00, '2025-10-28 16:00:00', 1300, '{\"attempt\": 1}', '2025-10-28 16:00:00', '2025-11-20 15:08:15'),
(14, 3, 10, 80.00, '2025-10-24 17:00:00', 1100, '{\"attempt\": 1}', '2025-10-24 17:00:00', '2025-11-20 15:08:15'),
(15, 3, 11, 78.00, '2025-10-24 17:20:00', 1150, '{\"attempt\": 1}', '2025-10-24 17:20:00', '2025-11-20 15:08:15'),
(16, 4, 12, 83.00, '2025-10-26 10:00:00', 900, '{\"attempt\": 1}', '2025-10-26 10:00:00', '2025-11-20 15:08:15'),
(17, 4, 13, 79.00, '2025-10-26 11:10:00', 950, '{\"attempt\": 1}', '2025-10-26 11:10:00', '2025-11-20 15:08:15'),
(18, 4, 14, 68.00, '2025-10-26 12:30:00', 1200, '{\"attempt\": 1}', '2025-10-26 12:30:00', '2025-11-20 15:08:15');

-- --------------------------------------------------------

--
-- Structure de la table `themes`
--

CREATE TABLE `themes` (
  `id` int NOT NULL,
  `school_id` int NOT NULL,
  `created_by` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `subject` varchar(100) DEFAULT NULL,
  `type` enum('quiz','flashcards','sheet') NOT NULL,
  `status` enum('draft','pending_review','approved','published') NOT NULL DEFAULT 'draft',
  `source` enum('manual','ai_studio','pdf_import') NOT NULL DEFAULT 'manual',
  `source_file_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `themes`
--

INSERT INTO `themes` (`id`, `school_id`, `created_by`, `title`, `description`, `subject`, `type`, `status`, `source`, `source_file_name`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'Suites numériques', 'Introduction aux suites arithmétiques et géométriques avec exercices progressifs.', 'Maths', 'quiz', 'published', 'ai_studio', NULL, '2025-10-01 09:00:00', '2025-11-19 10:01:46'),
(2, 1, 3, 'Fonctions dérivées', 'Rappels sur la dérivation, variations, tangentes et interprétation graphique.', 'Maths', 'quiz', 'published', 'pdf_import', 'Derivees_Sujets_2024.pdf', '2025-10-05 09:00:00', '2025-11-19 10:01:46'),
(3, 1, 3, 'Probabilités conditionnelles', 'Notions de conditionnement, arbres, exemples type Bac.', 'Maths', 'quiz', 'approved', 'ai_studio', NULL, '2025-10-10 09:00:00', '2025-11-19 10:01:46'),
(4, 1, 4, 'Ondes mécaniques', 'Propagation, célérité, exemples d’ondes sonores.', 'Physique', 'quiz', 'published', 'ai_studio', NULL, '2025-10-03 09:00:00', '2025-11-19 10:01:46'),
(5, 1, 4, 'Lois de Newton', 'Forces, dynamique du point, exemples concrets.', 'Physique', 'sheet', 'published', 'manual', NULL, '2025-10-08 09:00:00', '2025-11-19 10:01:46'),
(6, 1, 3, 'Organisation et système de santé (intro)', 'Notions d’organisation et d’acteurs en ST2S.', 'ST2S', 'flashcards', 'published', 'ai_studio', NULL, '2025-10-12 09:00:00', '2025-11-19 10:01:46');

-- --------------------------------------------------------

--
-- Structure de la table `theme_questions`
--

CREATE TABLE `theme_questions` (
  `id` int NOT NULL,
  `theme_id` int NOT NULL,
  `question_type` enum('mcq','true_false','open') NOT NULL,
  `prompt` text NOT NULL,
  `data` json DEFAULT NULL,
  `order_index` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `theme_questions`
--

INSERT INTO `theme_questions` (`id`, `theme_id`, `question_type`, `prompt`, `data`, `order_index`) VALUES
(1, 1, 'mcq', 'Une suite arithmétique se définit par :', '{\"answer\": 0, \"options\": [\"Un terme initial et une raison\", \"Un terme initial et un rapport\", \"Une limite et une raison\", \"Un rapport et une limite\"]}', 1),
(2, 1, 'true_false', 'Toute suite géométrique est strictement croissante.', '{\"answer\": false}', 2),
(3, 2, 'mcq', 'La dérivée de x^2 est :', '{\"answer\": 0, \"options\": [\"2x\", \"x\", \"x^3\", \"1\"]}', 1),
(4, 4, 'mcq', 'La célérité d’une onde dépend :', '{\"answer\": 0, \"options\": [\"Du milieu de propagation\", \"De la masse du milieu uniquement\", \"De la couleur de l’onde\", \"Uniquement de la température\"]}', 1),
(5, 6, 'mcq', 'Le système de santé comprend :', '{\"answer\": 1, \"options\": [\"Uniquement les hôpitaux\", \"Les hôpitaux, les professionnels libéraux et les structures médico-sociales\", \"Uniquement les médecins généralistes\", \"Uniquement les services d’urgences\"]}', 1);

-- --------------------------------------------------------

--
-- Structure de la table `theme_reviews`
--

CREATE TABLE `theme_reviews` (
  `id` int NOT NULL,
  `theme_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `action` varchar(50) NOT NULL,
  `comment` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `theme_reviews`
--

INSERT INTO `theme_reviews` (`id`, `theme_id`, `reviewer_id`, `action`, `comment`, `created_at`) VALUES
(1, 1, 1, 'approved', 'Cohérent avec le référentiel P2, RAS.', '2025-11-20 15:08:51'),
(2, 1, 1, 'approved', 'Cohérent avec le référentiel P2, RAS.', '2025-11-20 16:20:08'),
(3, 1, 1, 'approved', 'Cohérent avec le référentiel P2, RAS.', '2025-11-20 17:01:36'),
(4, 1, 1, 'approved', 'Cohérent avec le référentiel P2, RAS.', '2025-11-20 17:02:44'),
(5, 1, 1, 'approved', 'Cohérent avec le référentiel P2, RAS.', '2025-11-20 17:21:19');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `school_id` int DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','teacher','director','pedago','campus_admin') NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `social_uuid` varchar(64) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `school_id`, `email`, `password_hash`, `role`, `full_name`, `social_uuid`, `created_at`) VALUES
(1, 1, 'directeur@ecole.fr', '$2y$10$3er1QQlTWNPe1yJ1mY5GZuzAfkEQVq2oWop2C2.EWQVWdMvz6AlRC', 'director', 'Jean Dupont', NULL, '2025-11-19 10:01:46'),
(2, 1, 'pedago@ecole.fr', '$2y$10$Tbsv/bynpiQS2pNabPhlHeot/nKewxHAMhmV8X00WqCGYTfxn1Ox.', 'pedago', 'Claire Martin', NULL, '2025-11-19 10:01:46'),
(3, 1, 'enseignant@ecole.fr', '$2y$10$1iA3Ze7H0bEuMtbpiDKhqefwVNvqlOK6eeSA3fobVzrcVAXHytzaq', 'teacher', 'Marc Bernard', NULL, '2025-11-19 10:01:46'),
(4, 1, 'prof2@ecole.fr', '$2y$10$Kym.JVxHlyY5sBidW6/gvuKkRyekUEK4vAYpdvngM5IEaP/jUp662', 'teacher', 'Sophie Laurent', NULL, '2025-11-19 10:01:46'),
(10, 1, 'nathan@eleve.fr', '$2y$10$2Dozmoz2ityRMV8/0zLHFeYpVbQIaOBXEFIRWp6gTTFbjst.Ma/iu', 'student', 'Nathan Leroy', 'uuid-nathan', '2025-11-19 10:01:46'),
(11, 1, 'sarah@eleve.fr', '$2y$10$5ayh8BFEGUlNN6gKXNFtDuL/9GM3FxaJ2PseXPTr5b3r1RZdV7UbS', 'student', 'Sarah Benali', 'uuid-sarah', '2025-11-19 10:01:46'),
(12, 1, 'julien@eleve.fr', '$2y$10$/vpS49twxF32mSDEwvOrCOYRxBh/IjH73g4fN1GioQAjUP0EWsdlm', 'student', 'Julien Morel', 'uuid-julien', '2025-11-19 10:01:46'),
(13, 1, 'amina@eleve.fr', '$2y$10$QqPEiKdM05y0YGjyYsEJdO8C7/NHirGjiCtoYiNjrm6qU/8cGRXAi', 'student', 'Amina Karim', 'uuid-amina', '2025-11-19 10:01:46'),
(14, 1, 'hugo@eleve.fr', '$2y$10$H5C.Po82iu9DREfmsF0dgOmK7EpiTuxgQgyV2G0re.vtVoM5VAGaS', 'student', 'Hugo Lemoine', 'uuid-hugo', '2025-11-19 10:01:46'),
(15, 1, 'lina@eleve.fr', '$2y$10$hgTeh6fdrH9uTMD3ir4kPO68V8zNaUPJCN0OcKg7hqbPdO/pNqzFm', 'student', 'Lina Haddad', 'uuid-lina', '2025-11-19 10:01:46'),
(16, 1, 'sofiane@eleve.fr', '$2y$10$dQPP41Nqzp6NoG6ejGbMV.FCu6IydnhRJ5o7q2TxU1Gs//P2y5a7G', 'student', 'Sofiane Madi', 'uuid-sofiane', '2025-11-19 10:01:46'),
(17, 1, 'clara@eleve.fr', '$2y$10$dbg63PUWKFM4QMwYx07OhePyaFCBOt/DEGxaCL6tMZF.bFSzw7LHu', 'student', 'Clara Perrot', 'uuid-clara', '2025-11-19 10:01:46'),
(18, 1, 'leo@eleve.fr', '$2y$10$i9Wi04XX8dSpDI84KFlPuert5zkVakrG6H3KIMzi7dsWpILmd.LCC', 'student', 'Léo Marques', 'uuid-leo', '2025-11-19 10:01:46'),
(19, 1, 'selma@eleve.fr', '$2y$10$.E3FXwiZ2NvQluKmHEB04uCC/D.HM7VNAYiGYbNo.d5ykCUb0mkPa', 'student', 'Selma Rami', 'uuid-selma', '2025-11-19 10:01:46');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `school_id` (`school_id`);

--
-- Index pour la table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `admin_imports`
--
ALTER TABLE `admin_imports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_type` (`type`);

--
-- Index pour la table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`),
  ADD UNIQUE KEY `unique_key` (`key`);

--
-- Index pour la table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `theme_id` (`theme_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Index pour la table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `school_id` (`school_id`);

--
-- Index pour la table `class_students`
--
ALTER TABLE `class_students`
  ADD PRIMARY KEY (`class_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Index pour la table `schools`
--
ALTER TABLE `schools`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `social_entries`
--
ALTER TABLE `social_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_school_id` (`school_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Index pour la table `social_friends`
--
ALTER TABLE `social_friends`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_friendship` (`owner_user_id`,`friend_user_id`),
  ADD KEY `idx_owner_user_id` (`owner_user_id`),
  ADD KEY `idx_friend_user_id` (`friend_user_id`),
  ADD KEY `idx_school_id` (`school_id`);

--
-- Index pour la table `social_profiles`
--
ALTER TABLE `social_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_social_code` (`social_code`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_school_id` (`school_id`),
  ADD KEY `idx_active_profile` (`user_id`,`revoked_at`);

--
-- Index pour la table `social_stats`
--
ALTER TABLE `social_stats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `class_id` (`class_id`);

--
-- Index pour la table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_assignment_student` (`assignment_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Index pour la table `themes`
--
ALTER TABLE `themes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `school_id` (`school_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `theme_questions`
--
ALTER TABLE `theme_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `theme_id` (`theme_id`);

--
-- Index pour la table `theme_reviews`
--
ALTER TABLE `theme_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_theme_id` (`theme_id`),
  ADD KEY `idx_reviewer_id` (`reviewer_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `school_id` (`school_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `admin_imports`
--
ALTER TABLE `admin_imports`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `admin_settings`
--
ALTER TABLE `admin_settings`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `schools`
--
ALTER TABLE `schools`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `social_entries`
--
ALTER TABLE `social_entries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `social_friends`
--
ALTER TABLE `social_friends`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `social_profiles`
--
ALTER TABLE `social_profiles`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `social_stats`
--
ALTER TABLE `social_stats`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT pour la table `themes`
--
ALTER TABLE `themes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `theme_questions`
--
ALTER TABLE `theme_questions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `theme_reviews`
--
ALTER TABLE `theme_reviews`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD CONSTRAINT `fk_admin_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Contraintes pour la table `admin_imports`
--
ALTER TABLE `admin_imports`
  ADD CONSTRAINT `fk_admin_imports_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Contraintes pour la table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`id`),
  ADD CONSTRAINT `assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);

--
-- Contraintes pour la table `class_students`
--
ALTER TABLE `class_students`
  ADD CONSTRAINT `class_students_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `class_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `social_entries`
--
ALTER TABLE `social_entries`
  ADD CONSTRAINT `social_entries_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `social_entries_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

--
-- Contraintes pour la table `social_friends`
--
ALTER TABLE `social_friends`
  ADD CONSTRAINT `fk_social_friends_friend` FOREIGN KEY (`friend_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_social_friends_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_social_friends_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `social_profiles`
--
ALTER TABLE `social_profiles`
  ADD CONSTRAINT `fk_social_profiles_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_social_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `social_stats`
--
ALTER TABLE `social_stats`
  ADD CONSTRAINT `social_stats_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `social_stats_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`);

--
-- Contraintes pour la table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`),
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `themes`
--
ALTER TABLE `themes`
  ADD CONSTRAINT `themes_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`),
  ADD CONSTRAINT `themes_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `theme_questions`
--
ALTER TABLE `theme_questions`
  ADD CONSTRAINT `theme_questions_ibfk_1` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`id`);

--
-- Contraintes pour la table `theme_reviews`
--
ALTER TABLE `theme_reviews`
  ADD CONSTRAINT `theme_reviews_ibfk_1` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `theme_reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
