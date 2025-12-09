-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : mer. 19 nov. 2025 à 12:46
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
-- Structure de la table `assignments`
--

CREATE TABLE `assignments` (
  `id` int NOT NULL,
  `class_id` int NOT NULL,
  `theme_id` int NOT NULL,
  `assigned_by` int NOT NULL,
  `start_at` datetime NOT NULL,
  `end_at` datetime DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `assignments`
--

INSERT INTO `assignments` (`id`, `class_id`, `theme_id`, `assigned_by`, `start_at`, `end_at`, `due_at`, `created_at`) VALUES
(1, 1, 1, 4, '2025-10-15 08:00:00', '2025-11-30 23:59:59', '2025-10-22 23:59:59', '2025-10-15 08:00:00'),
(2, 1, 2, 3, '2025-10-20 08:00:00', '2025-12-05 23:59:59', '2025-10-28 23:59:59', '2025-10-20 08:00:00'),
(3, 2, 4, 4, '2025-10-18 08:00:00', '2025-11-25 23:59:59', '2025-10-25 23:59:59', '2025-10-18 08:00:00'),
(4, 3, 6, 3, '2025-10-19 08:00:00', '2025-11-20 23:59:59', '2025-10-27 23:59:59', '2025-10-19 08:00:00'),
(6, 1, 1, 3, '2025-12-01 08:00:00', NULL, NULL, '2025-11-19 10:47:49'),
(7, 1, 1, 3, '2025-09-27 18:00:00', NULL, NULL, '2025-11-19 10:51:08');

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
  `city` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `schools`
--

INSERT INTO `schools` (`id`, `name`, `city`, `created_at`) VALUES
(1, 'Lycée Hoche', 'Versailles', '2025-11-19 10:01:46');

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
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `submissions`
--

INSERT INTO `submissions` (`id`, `assignment_id`, `student_id`, `score`, `completed_at`, `duration_seconds`, `raw_response`, `created_at`) VALUES
(1, 1, 10, 88.00, '2025-10-21 18:00:00', 900, '{\"attempt\": 1}', '2025-10-21 18:00:00'),
(2, 1, 11, 92.00, '2025-10-21 19:00:00', 1100, '{\"attempt\": 1}', '2025-10-21 19:00:00'),
(3, 1, 12, 76.00, '2025-10-22 17:30:00', 1300, '{\"attempt\": 1}', '2025-10-22 17:30:00'),
(4, 1, 13, 61.00, '2025-10-22 20:15:00', 1600, '{\"attempt\": 1}', '2025-10-22 20:15:00'),
(5, 1, 14, 54.00, '2025-10-23 16:00:00', 1400, '{\"attempt\": 1}', '2025-10-23 16:00:00'),
(6, 1, 15, 81.00, '2025-10-21 21:00:00', 1000, '{\"attempt\": 1}', '2025-10-21 21:00:00'),
(7, 1, 16, 69.00, '2025-10-23 18:45:00', 1500, '{\"attempt\": 1}', '2025-10-23 18:45:00'),
(8, 1, 17, 95.00, '2025-10-21 17:00:00', 800, '{\"attempt\": 1}', '2025-10-21 17:00:00'),
(9, 1, 18, 72.00, '2025-10-22 15:30:00', 1200, '{\"attempt\": 1}', '2025-10-22 15:30:00'),
(10, 1, 19, 64.00, '2025-10-23 19:15:00', 1350, '{\"attempt\": 1}', '2025-10-23 19:15:00'),
(11, 2, 10, 84.00, '2025-10-27 18:30:00', 1000, '{\"attempt\": 1}', '2025-10-27 18:30:00'),
(12, 2, 11, 89.00, '2025-10-27 19:10:00', 1050, '{\"attempt\": 1}', '2025-10-27 19:10:00'),
(13, 2, 12, 71.00, '2025-10-28 16:00:00', 1300, '{\"attempt\": 1}', '2025-10-28 16:00:00'),
(14, 3, 10, 80.00, '2025-10-24 17:00:00', 1100, '{\"attempt\": 1}', '2025-10-24 17:00:00'),
(15, 3, 11, 78.00, '2025-10-24 17:20:00', 1150, '{\"attempt\": 1}', '2025-10-24 17:20:00'),
(16, 4, 12, 83.00, '2025-10-26 10:00:00', 900, '{\"attempt\": 1}', '2025-10-26 10:00:00'),
(17, 4, 13, 79.00, '2025-10-26 11:10:00', 950, '{\"attempt\": 1}', '2025-10-26 11:10:00'),
(18, 4, 14, 68.00, '2025-10-26 12:30:00', 1200, '{\"attempt\": 1}', '2025-10-26 12:30:00');

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
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `school_id` int DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','teacher','director','pedago') NOT NULL,
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
  ADD KEY `assignment_id` (`assignment_id`),
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
-- AUTO_INCREMENT pour la table `social_stats`
--
ALTER TABLE `social_stats`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

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
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
