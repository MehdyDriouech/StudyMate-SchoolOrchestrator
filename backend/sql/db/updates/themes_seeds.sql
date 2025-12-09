-- themes_seeds.sql
-- Données de test pour les thèmes avec le nouveau format JSON
-- À exécuter après db.sql et seeds.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer les anciennes données de thèmes pour repartir proprement
DELETE FROM theme_questions;
DELETE FROM themes;

-- Remettre les compteurs AUTO_INCREMENT
ALTER TABLE theme_questions AUTO_INCREMENT = 1;
ALTER TABLE themes AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================
-- THÈMES avec le nouveau format
-- =========================================
INSERT INTO themes (id, school_id, created_by, title, description, subject, type, status, source, source_file_name, created_at, updated_at)
VALUES
  (1, 1, 3,
    'Suites numériques',
    'Introduction aux suites arithmétiques et géométriques avec exercices progressifs.',
    'Maths', 'quiz', 'published', 'ai_studio', NULL,
    '2025-10-01 09:00:00', '2025-10-01 09:00:00'),

  (2, 1, 3,
    'Fonctions dérivées',
    'Rappels sur la dérivation, variations, tangentes et interprétation graphique.',
    'Maths', 'quiz', 'published', 'pdf_import', 'Derivees_Sujets_2024.pdf',
    '2025-10-05 09:00:00', '2025-10-05 09:00:00'),

  (3, 1, 3,
    'Probabilités conditionnelles',
    'Notions de conditionnement, arbres, exemples type Bac.',
    'Maths', 'quiz', 'approved', 'ai_studio', NULL,
    '2025-10-10 09:00:00', '2025-10-10 09:00:00'),

  (4, 1, 4,
    'Ondes mécaniques',
    'Propagation, célérité, exemples d\'ondes sonores.',
    'Physique', 'quiz', 'published', 'ai_studio', NULL,
    '2025-10-03 09:00:00', '2025-10-03 09:00:00'),

  (5, 1, 4,
    'Lois de Newton',
    'Forces, dynamique du point, exemples concrets.',
    'Physique', 'sheet', 'published', 'manual', NULL,
    '2025-10-08 09:00:00', '2025-10-08 09:00:00'),

  (6, 1, 3,
    'Organisation et système de santé (intro)',
    'Notions d\'organisation et d\'acteurs en ST2S.',
    'ST2S', 'flashcards', 'published', 'ai_studio', NULL,
    '2025-10-12 09:00:00', '2025-10-12 09:00:00');

-- =========================================
-- QUESTIONS DE THÈME avec le nouveau format JSON
-- Format: { "id": "q001", "type": "mcq", "prompt": "...", "choices": [...], "answer": "a", "rationale": "...", "tags": [...] }
-- =========================================

-- Thème 1: Suites numériques
INSERT INTO theme_questions (theme_id, question_type, prompt, data, order_index)
VALUES
  (1, 'mcq',
    'Une suite arithmétique se définit par :',
    JSON_OBJECT(
      'id', 'q001',
      'type', 'mcq',
      'prompt', 'Une suite arithmétique se définit par :',
      'choices', JSON_ARRAY(
        JSON_OBJECT('id', 'a', 'label', 'Un terme initial et une raison'),
        JSON_OBJECT('id', 'b', 'label', 'Un terme initial et un rapport'),
        JSON_OBJECT('id', 'c', 'label', 'Une limite et une raison'),
        JSON_OBJECT('id', 'd', 'label', 'Un rapport et une limite')
      ),
      'answer', 'a',
      'rationale', 'Une suite arithmétique est définie par son premier terme u₀ et sa raison r. La relation de récurrence est uₙ₊₁ = uₙ + r.',
      'tags', JSON_ARRAY('définition', 'suite arithmétique')
    ),
    1),

  (1, 'true_false',
    'Toute suite géométrique est strictement croissante.',
    JSON_OBJECT(
      'id', 'q002',
      'type', 'true_false',
      'prompt', 'Toute suite géométrique est strictement croissante.',
      'answer', false,
      'rationale', 'Une suite géométrique peut être croissante, décroissante ou constante selon la valeur de sa raison q. Si q < 0, la suite alterne. Si 0 < q < 1, elle est décroissante. Si q > 1, elle est croissante.',
      'tags', JSON_ARRAY('suite géométrique', 'variation')
    ),
    2),

  (1, 'mcq',
    'Pour une suite géométrique de raison q = 2 et de premier terme u₀ = 3, le terme u₃ vaut :',
    JSON_OBJECT(
      'id', 'q003',
      'type', 'mcq',
      'prompt', 'Pour une suite géométrique de raison q = 2 et de premier terme u₀ = 3, le terme u₃ vaut :',
      'choices', JSON_ARRAY(
        JSON_OBJECT('id', 'a', 'label', '6'),
        JSON_OBJECT('id', 'b', 'label', '12'),
        JSON_OBJECT('id', 'c', 'label', '24'),
        JSON_OBJECT('id', 'd', 'label', '48')
      ),
      'answer', 'c',
      'rationale', 'Pour une suite géométrique, uₙ = u₀ × qⁿ. Donc u₃ = 3 × 2³ = 3 × 8 = 24.',
      'tags', JSON_ARRAY('calcul', 'suite géométrique')
    ),
    3);

-- Thème 2: Fonctions dérivées
INSERT INTO theme_questions (theme_id, question_type, prompt, data, order_index)
VALUES
  (2, 'mcq',
    'La dérivée de x² est :',
    JSON_OBJECT(
      'id', 'q001',
      'type', 'mcq',
      'prompt', 'La dérivée de x² est :',
      'choices', JSON_ARRAY(
        JSON_OBJECT('id', 'a', 'label', '2x'),
        JSON_OBJECT('id', 'b', 'label', 'x'),
        JSON_OBJECT('id', 'c', 'label', 'x³'),
        JSON_OBJECT('id', 'd', 'label', '1')
      ),
      'answer', 'a',
      'rationale', 'La dérivée de xⁿ est n×xⁿ⁻¹. Donc la dérivée de x² est 2×x¹ = 2x.',
      'tags', JSON_ARRAY('dérivée', 'règle de base')
    ),
    1),

  (2, 'mcq',
    'La dérivée de f(x) = 3x³ - 2x + 5 est :',
    JSON_OBJECT(
      'id', 'q002',
      'type', 'mcq',
      'prompt', 'La dérivée de f(x) = 3x³ - 2x + 5 est :',
      'choices', JSON_ARRAY(
        JSON_OBJECT('id', 'a', 'label', '9x² - 2'),
        JSON_OBJECT('id', 'b', 'label', '9x² - 2x'),
        JSON_OBJECT('id', 'c', 'label', '3x² - 2'),
        JSON_OBJECT('id', 'd', 'label', '9x² + 2')
      ),
      'answer', 'a',
      'rationale', 'La dérivée de 3x³ est 9x², la dérivée de -2x est -2, et la dérivée d\'une constante (5) est 0. Donc f\'(x) = 9x² - 2.',
      'tags', JSON_ARRAY('dérivée', 'polynôme')
    ),
    2);

-- Thème 4: Ondes mécaniques
INSERT INTO theme_questions (theme_id, question_type, prompt, data, order_index)
VALUES
  (4, 'mcq',
    'La célérité d\'une onde dépend :',
    JSON_OBJECT(
      'id', 'q001',
      'type', 'mcq',
      'prompt', 'La célérité d\'une onde dépend :',
      'choices', JSON_ARRAY(
        JSON_OBJECT('id', 'a', 'label', 'Du milieu de propagation'),
        JSON_OBJECT('id', 'b', 'label', 'De la masse du milieu uniquement'),
        JSON_OBJECT('id', 'c', 'label', 'De la couleur de l\'onde'),
        JSON_OBJECT('id', 'd', 'label', 'Uniquement de la température')
      ),
      'answer', 'a',
      'rationale', 'La célérité d\'une onde mécanique dépend principalement des propriétés du milieu de propagation (masse volumique, élasticité, etc.), mais aussi de la fréquence pour certaines ondes.',
      'tags', JSON_ARRAY('célérité', 'onde mécanique')
    ),
    1);

-- Thème 6: ST2S - Organisation et système de santé
INSERT INTO theme_questions (theme_id, question_type, prompt, data, order_index)
VALUES
  (6, 'mcq',
    'Le système de santé comprend :',
    JSON_OBJECT(
      'id', 'q001',
      'type', 'mcq',
      'prompt', 'Le système de santé comprend :',
      'choices', JSON_ARRAY(
        JSON_OBJECT('id', 'a', 'label', 'Uniquement les hôpitaux'),
        JSON_OBJECT('id', 'b', 'label', 'Les hôpitaux, les professionnels libéraux et les structures médico-sociales'),
        JSON_OBJECT('id', 'c', 'label', 'Uniquement les médecins généralistes'),
        JSON_OBJECT('id', 'd', 'label', 'Uniquement les services d\'urgences')
      ),
      'answer', 'b',
      'rationale', 'Le système de santé français est composé de trois piliers : le secteur hospitalier, les professionnels de santé libéraux (médecins, infirmiers, etc.) et les structures médico-sociales (EHPAD, établissements pour personnes handicapées, etc.).',
      'tags', JSON_ARRAY('système de santé', 'organisation')
    ),
    1);

-- Note: Les données de révision (revision.sections) seront stockées dans un champ JSON supplémentaire
-- ou dans une table séparée selon l'architecture finale. Pour l'instant, on se concentre sur les questions.

