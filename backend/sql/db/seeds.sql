-- seed_demo.sql
-- Données de démo pour StudyMate School Orchestrator

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- On vide toutes les tables
DELETE FROM activity_logs;
DELETE FROM social_stats;
DELETE FROM submissions;
DELETE FROM assignments;
DELETE FROM theme_questions;
DELETE FROM themes;
DELETE FROM class_students;
DELETE FROM classes;
DELETE FROM users;
DELETE FROM schools;

-- On remet les compteurs AUTO_INCREMENT à 1
ALTER TABLE activity_logs     AUTO_INCREMENT = 1;
ALTER TABLE social_stats      AUTO_INCREMENT = 1;
ALTER TABLE submissions       AUTO_INCREMENT = 1;
ALTER TABLE assignments       AUTO_INCREMENT = 1;
ALTER TABLE theme_questions   AUTO_INCREMENT = 1;
ALTER TABLE themes            AUTO_INCREMENT = 1;
ALTER TABLE classes           AUTO_INCREMENT = 1;
ALTER TABLE users             AUTO_INCREMENT = 1;
ALTER TABLE schools           AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================
-- ÉTABLISSEMENTS
-- =========================================
INSERT INTO schools (id, name, city)
VALUES
  (1, 'Lycée Hoche', 'Versailles');

-- =========================================
-- UTILISATEURS (profs, direction, pédago, élèves)
-- (password_hash = placeholder à remplacer par de vrais hash)
-- =========================================
INSERT INTO users (id, school_id, email, password_hash, role, full_name, social_uuid)
VALUES
  (1, 1, 'directeur@ecole.fr',   '$2y$10$fakehashDIRECTEUR', 'director', 'Jean Dupont',   NULL),
  (2, 1, 'pedago@ecole.fr',      '$2y$10$fakehashPEDAGO',    'pedago',   'Claire Martin',  NULL),
  (3, 1, 'enseignant@ecole.fr',  '$2y$10$fakehashPROF1',     'teacher',  'Marc Bernard',   NULL),
  (4, 1, 'prof2@ecole.fr',       '$2y$10$fakehashPROF2',     'teacher',  'Sophie Laurent', NULL),

  -- élèves Tle2 / Tle3 / autres
  (10, 1, 'nathan@eleve.fr',     '$2y$10$fakehashELEVES',    'student',  'Nathan Leroy',   'uuid-nathan'),
  (11, 1, 'sarah@eleve.fr',      '$2y$10$fakehashELEVES',    'student',  'Sarah Benali',   'uuid-sarah'),
  (12, 1, 'julien@eleve.fr',     '$2y$10$fakehashELEVES',    'student',  'Julien Morel',   'uuid-julien'),
  (13, 1, 'amina@eleve.fr',      '$2y$10$fakehashELEVES',    'student',  'Amina Karim',    'uuid-amina'),
  (14, 1, 'hugo@eleve.fr',       '$2y$10$fakehashELEVES',    'student',  'Hugo Lemoine',   'uuid-hugo'),
  (15, 1, 'lina@eleve.fr',       '$2y$10$fakehashELEVES',    'student',  'Lina Haddad',    'uuid-lina'),
  (16, 1, 'sofiane@eleve.fr',    '$2y$10$fakehashELEVES',    'student',  'Sofiane Madi',   'uuid-sofiane'),
  (17, 1, 'clara@eleve.fr',      '$2y$10$fakehashELEVES',    'student',  'Clara Perrot',   'uuid-clara'),
  (18, 1, 'leo@eleve.fr',        '$2y$10$fakehashELEVES',    'student',  'Léo Marques',    'uuid-leo'),
  (19, 1, 'selma@eleve.fr',      '$2y$10$fakehashELEVES',    'student',  'Selma Rami',     'uuid-selma');

-- =========================================
-- CLASSES
-- =========================================
INSERT INTO classes (id, school_id, name, short_name, level, academic_year)
VALUES
  (1, 1, 'Terminale 2 – Spé Maths',    'Tle2', 'Terminale', '2024-2025'),
  (2, 1, 'Terminale 3 – Physique',     'Tle3', 'Terminale', '2024-2025'),
  (3, 1, '1ère ST2S',                  '1ST2S','Première',  '2024-2025'),
  (4, 1, '2nde Générale A',            '2ndeA','Seconde',   '2024-2025');

-- =========================================
-- INSCRIPTIONS ÉLÈVES / CLASSES
-- (on met tous les élèves en Tle2 pour la démo principale + quelques répartitions)
-- =========================================
INSERT INTO class_students (class_id, student_id)
VALUES
  (1, 10),
  (1, 11),
  (1, 12),
  (1, 13),
  (1, 14),
  (1, 15),
  (1, 16),
  (1, 17),
  (1, 18),
  (1, 19),

  -- 2 élèves aussi en Tle3 (multiclasses pour la démo)
  (2, 10),
  (2, 11),

  -- 3 élèves en 1ère ST2S
  (3, 12),
  (3, 13),
  (3, 14),

  -- 2 élèves en 2nde A
  (4, 18),
  (4, 19);

-- =========================================
-- THÈMES (Maths / Physique / ST2S / Transverses)
-- =========================================
INSERT INTO themes (id, school_id, created_by, title, description, subject, type, status, source, source_file_name, created_at)
VALUES
  (1, 1, 3,
    'Suites numériques',
    'Introduction aux suites arithmétiques et géométriques avec exercices progressifs.',
    'Maths', 'quiz', 'published', 'ai_studio', NULL,
    '2025-10-01 09:00:00'),

  (2, 1, 3,
    'Fonctions dérivées',
    'Rappels sur la dérivation, variations, tangentes et interprétation graphique.',
    'Maths', 'quiz', 'published', 'pdf_import', 'Derivees_Sujets_2024.pdf',
    '2025-10-05 09:00:00'),

  (3, 1, 3,
    'Probabilités conditionnelles',
    'Notions de conditionnement, arbres, exemples type Bac.',
    'Maths', 'quiz', 'approved', 'ai_studio', NULL,
    '2025-10-10 09:00:00'),

  (4, 1, 4,
    'Ondes mécaniques',
    'Propagation, célérité, exemples d’ondes sonores.',
    'Physique', 'quiz', 'published', 'ai_studio', NULL,
    '2025-10-03 09:00:00'),

  (5, 1, 4,
    'Lois de Newton',
    'Forces, dynamique du point, exemples concrets.',
    'Physique', 'sheet', 'published', 'manual', NULL,
    '2025-10-08 09:00:00'),

  (6, 1, 3,
    'Organisation et système de santé (intro)',
    'Notions d’organisation et d’acteurs en ST2S.',
    'ST2S', 'flashcards', 'published', 'ai_studio', NULL,
    '2025-10-12 09:00:00');

-- =========================================
-- QUESTIONS DE THÈME (exemple simplifié)
-- =========================================
INSERT INTO theme_questions (theme_id, question_type, prompt, data, order_index)
VALUES
  (1, 'mcq',
    'Une suite arithmétique se définit par :',
    JSON_OBJECT('options', JSON_ARRAY(
                'Un terme initial et une raison',
                'Un terme initial et un rapport',
                'Une limite et une raison',
                'Un rapport et une limite'),
                'answer', 0),
    1),
  (1, 'true_false',
    'Toute suite géométrique est strictement croissante.',
    JSON_OBJECT('answer', false),
    2),

  (2, 'mcq',
    'La dérivée de x^2 est :',
    JSON_OBJECT('options', JSON_ARRAY('2x','x','x^3','1'), 'answer', 0),
    1),

  (4, 'mcq',
    'La célérité d’une onde dépend :',
    JSON_OBJECT('options', JSON_ARRAY(
                'Du milieu de propagation',
                'De la masse du milieu uniquement',
                'De la couleur de l’onde',
                'Uniquement de la température'),
                'answer', 0),
    1),

  (6, 'mcq',
    'Le système de santé comprend :',
    JSON_OBJECT('options', JSON_ARRAY(
                'Uniquement les hôpitaux',
                'Les hôpitaux, les professionnels libéraux et les structures médico-sociales',
                'Uniquement les médecins généralistes',
                'Uniquement les services d’urgences'),
                'answer', 1),
    1);

-- =========================================
-- ASSIGNATIONS DE THÈMES AUX CLASSES
-- =========================================
INSERT INTO assignments (id, class_id, theme_id, assigned_by, start_at, end_at, due_at, created_at)
VALUES
  -- Tle2 – Spé Maths : thème "Suites numériques"
  (1, 1, 1, 3,
    '2025-10-15 08:00:00',
    '2025-11-30 23:59:59',
    '2025-10-22 23:59:59',
    '2025-10-15 08:00:00'),

  -- Tle2 – Spé Maths : "Fonctions dérivées"
  (2, 1, 2, 3,
    '2025-10-20 08:00:00',
    '2025-12-05 23:59:59',
    '2025-10-28 23:59:59',
    '2025-10-20 08:00:00'),

  -- Tle3 – Physique : "Ondes mécaniques"
  (3, 2, 4, 4,
    '2025-10-18 08:00:00',
    '2025-11-25 23:59:59',
    '2025-10-25 23:59:59',
    '2025-10-18 08:00:00'),

  -- 1ère ST2S : "Organisation et système de santé"
  (4, 3, 6, 3,
    '2025-10-19 08:00:00',
    '2025-11-20 23:59:59',
    '2025-10-27 23:59:59',
    '2025-10-19 08:00:00');

-- =========================================
-- SUBMISSIONS (rendus élèves sur Tle2 – Suites & Dérivées)
-- =========================================
INSERT INTO submissions (assignment_id, student_id, score, completed_at, duration_seconds, raw_response, created_at)
VALUES
  -- Assignment 1 : Suites numériques
  (1, 10, 88.0, '2025-10-21 18:00:00', 900, JSON_OBJECT('attempt',1), '2025-10-21 18:00:00'),
  (1, 11, 92.0, '2025-10-21 19:00:00', 1100, JSON_OBJECT('attempt',1), '2025-10-21 19:00:00'),
  (1, 12, 76.0, '2025-10-22 17:30:00', 1300, JSON_OBJECT('attempt',1), '2025-10-22 17:30:00'),
  (1, 13, 61.0, '2025-10-22 20:15:00', 1600, JSON_OBJECT('attempt',1), '2025-10-22 20:15:00'),
  (1, 14, 54.0, '2025-10-23 16:00:00', 1400, JSON_OBJECT('attempt',1), '2025-10-23 16:00:00'),
  (1, 15, 81.0, '2025-10-21 21:00:00', 1000, JSON_OBJECT('attempt',1), '2025-10-21 21:00:00'),
  (1, 16, 69.0, '2025-10-23 18:45:00', 1500, JSON_OBJECT('attempt',1), '2025-10-23 18:45:00'),
  (1, 17, 95.0, '2025-10-21 17:00:00', 800,  JSON_OBJECT('attempt',1), '2025-10-21 17:00:00'),
  (1, 18, 72.0, '2025-10-22 15:30:00', 1200, JSON_OBJECT('attempt',1), '2025-10-22 15:30:00'),
  (1, 19, 64.0, '2025-10-23 19:15:00', 1350, JSON_OBJECT('attempt',1), '2025-10-23 19:15:00'),

  -- Assignment 2 : Fonctions dérivées (seulement une partie rendue)
  (2, 10, 84.0, '2025-10-27 18:30:00', 1000, JSON_OBJECT('attempt',1), '2025-10-27 18:30:00'),
  (2, 11, 89.0, '2025-10-27 19:10:00', 1050, JSON_OBJECT('attempt',1), '2025-10-27 19:10:00'),
  (2, 12, 71.0, '2025-10-28 16:00:00', 1300, JSON_OBJECT('attempt',1), '2025-10-28 16:00:00'),

  -- Assignment 3 : Ondes mécaniques (Tle3, deux élèves)
  (3, 10, 80.0, '2025-10-24 17:00:00', 1100, JSON_OBJECT('attempt',1), '2025-10-24 17:00:00'),
  (3, 11, 78.0, '2025-10-24 17:20:00', 1150, JSON_OBJECT('attempt',1), '2025-10-24 17:20:00'),

  -- Assignment 4 : ST2S (trois élèves)
  (4, 12, 83.0, '2025-10-26 10:00:00', 900, JSON_OBJECT('attempt',1), '2025-10-26 10:00:00'),
  (4, 13, 79.0, '2025-10-26 11:10:00', 950, JSON_OBJECT('attempt',1), '2025-10-26 11:10:00'),
  (4, 14, 68.0, '2025-10-26 12:30:00', 1200, JSON_OBJECT('attempt',1), '2025-10-26 12:30:00');

-- =========================================
-- SOCIAL STATS (exemple Tle2)
-- =========================================
INSERT INTO social_stats (student_id, class_id, metric_date, rank_in_class, percentile, avg_speed_seconds, created_at)
VALUES
  (17, 1, '2025-10-23', 1,  95.0, 900,  '2025-10-23 21:00:00'), -- Clara top
  (11, 1, '2025-10-23', 2,  92.0, 1050, '2025-10-23 21:00:00'),
  (10, 1, '2025-10-23', 3,  88.0, 1000, '2025-10-23 21:00:00'),
  (12, 1, '2025-10-23', 5,  75.0, 1300, '2025-10-23 21:00:00'),
  (14, 1, '2025-10-23', 9,  40.0, 1500, '2025-10-23 21:00:00');

-- =========================================
-- ACTIVITY LOGS (timeline)
-- =========================================
INSERT INTO activity_logs (user_id, school_id, event_type, payload, created_at)
VALUES
  (3, 1, 'teacher_created_theme',
    JSON_OBJECT('theme_id', 1, 'title', 'Suites numériques'),
    '2025-10-01 09:05:00'),

  (3, 1, 'teacher_published_theme',
    JSON_OBJECT('theme_id', 1),
    '2025-10-15 08:05:00'),

  (3, 1, 'teacher_assigned_theme_to_class',
    JSON_OBJECT('theme_id', 1, 'class_id', 1),
    '2025-10-15 08:10:00'),

  (10, 1, 'student_started_assignment',
    JSON_OBJECT('assignment_id', 1),
    '2025-10-21 17:45:00'),

  (10, 1, 'student_completed_assignment',
    JSON_OBJECT('assignment_id', 1, 'score', 88.0),
    '2025-10-21 18:00:00'),

  (1, 1, 'director_viewed_executive_dashboard',
    JSON_OBJECT('school_id', 1),
    '2025-10-24 09:00:00'),

  (1, 1, 'director_viewed_heatmap',
    JSON_OBJECT('school_id', 1),
    '2025-10-24 09:05:00');

