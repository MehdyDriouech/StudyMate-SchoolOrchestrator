<?php
/**
 * Sprint 11 - Content Creation Suite
 * Service: ThemeLinterService
 * Description: Analyse qualité et validation pédagogique via IA
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/AIProvider.php';

class ThemeLinterService {
    private $db;
    private $aiProvider;

    public function __construct($db) {
        $this->db = $db;
        $this->aiProvider = new AIProvider($db);
    }

    /**
     * Analyser la qualité pédagogique d'un thème
     */
    public function analyzeTheme($themeData) {
        $analysis = [
            'overall_score' => 0,
            'difficulty_consistency' => true,
            'warnings' => [],
            'suggestions' => [],
            'estimated_level' => 'normal',
            'details' => []
        ];

        // 1. Analyser les questions
        if (!empty($themeData['questions'])) {
            $questionsAnalysis = $this->analyzeQuestions($themeData['questions']);
            $analysis['details']['questions'] = $questionsAnalysis;
            $analysis['warnings'] = array_merge($analysis['warnings'], $questionsAnalysis['warnings']);
        }

        // 2. Analyser les flashcards
        if (!empty($themeData['flashcards'])) {
            $flashcardsAnalysis = $this->analyzeFlashcards($themeData['flashcards']);
            $analysis['details']['flashcards'] = $flashcardsAnalysis;
            $analysis['warnings'] = array_merge($analysis['warnings'], $flashcardsAnalysis['warnings']);
        }

        // 3. Analyser la fiche
        if (!empty($themeData['fiche'])) {
            $ficheAnalysis = $this->analyzeFiche($themeData['fiche']);
            $analysis['details']['fiche'] = $ficheAnalysis;
            $analysis['warnings'] = array_merge($analysis['warnings'], $ficheAnalysis['warnings']);
        }

        // 4. Vérifier la cohérence globale de difficulté
        $analysis['difficulty_consistency'] = $this->checkDifficultyConsistency($themeData);

        // 5. Estimation du niveau global
        $analysis['estimated_level'] = $this->estimateOverallLevel($themeData);

        // 6. Calculer le score global
        $analysis['overall_score'] = $this->calculateOverallScore($analysis);

        return $analysis;
    }

    /**
     * Analyser les questions d'un quiz
     */
    private function analyzeQuestions($questions) {
        $warnings = [];
        $scores = [];

        foreach ($questions as $question) {
            $qWarnings = [];

            // Vérifier la longueur de la question
            $textLength = strlen($question['text']);
            if ($textLength > 500) {
                $qWarnings[] = [
                    'type' => 'question_too_long',
                    'question_id' => $question['id'],
                    'message' => "Question trop longue ({$textLength} caractères). Recommandé: < 500 caractères."
                ];
            }

            if ($textLength < 10) {
                $qWarnings[] = [
                    'type' => 'question_too_short',
                    'question_id' => $question['id'],
                    'message' => "Question trop courte ({$textLength} caractères). Minimum recommandé: 10 caractères."
                ];
            }

            // Vérifier le nombre de choix
            $choicesCount = count($question['choices']);
            if ($choicesCount < 2) {
                $qWarnings[] = [
                    'type' => 'insufficient_choices',
                    'question_id' => $question['id'],
                    'message' => "Nombre de choix insuffisant ({$choicesCount}). Minimum: 2, recommandé: 4."
                ];
            }

            // Vérifier la présence d'une explication
            if (empty($question['explanation'])) {
                $qWarnings[] = [
                    'type' => 'missing_explanation',
                    'question_id' => $question['id'],
                    'message' => "Explication manquante. Recommandé pour la pédagogie."
                ];
            }

            // Détecter les réponses ambiguës (longueurs très similaires)
            $choiceLengths = array_map('strlen', $question['choices']);
            $avgLength = array_sum($choiceLengths) / count($choiceLengths);
            $variance = 0;
            foreach ($choiceLengths as $length) {
                $variance += pow($length - $avgLength, 2);
            }
            $variance /= count($choiceLengths);

            if ($variance < 10 && $choicesCount >= 3) {
                $qWarnings[] = [
                    'type' => 'similar_choice_lengths',
                    'question_id' => $question['id'],
                    'message' => "Les choix ont des longueurs très similaires. Cela peut faciliter la détection de la bonne réponse.",
                    'severity' => 'low'
                ];
            }

            // Détecter correctAnswer hors limites
            if ($question['correctAnswer'] < 0 || $question['correctAnswer'] >= $choicesCount) {
                $qWarnings[] = [
                    'type' => 'invalid_correct_answer',
                    'question_id' => $question['id'],
                    'message' => "Index de réponse correcte invalide: {$question['correctAnswer']}",
                    'severity' => 'critical'
                ];
            }

            $warnings = array_merge($warnings, $qWarnings);
            $scores[] = max(0, 100 - (count($qWarnings) * 15));
        }

        $avgScore = !empty($scores) ? array_sum($scores) / count($scores) : 0;

        return [
            'count' => count($questions),
            'avg_quality_score' => round($avgScore, 2),
            'warnings' => $warnings
        ];
    }

    /**
     * Analyser les flashcards
     */
    private function analyzeFlashcards($flashcards) {
        $warnings = [];
        $scores = [];

        foreach ($flashcards as $flashcard) {
            $fWarnings = [];

            // Vérifier la longueur du recto
            $frontLength = strlen($flashcard['front']);
            if ($frontLength > 200) {
                $fWarnings[] = [
                    'type' => 'flashcard_front_too_long',
                    'flashcard_id' => $flashcard['id'],
                    'message' => "Recto trop long ({$frontLength} caractères). Recommandé: < 200 caractères."
                ];
            }

            // Vérifier la longueur du verso
            $backLength = strlen($flashcard['back']);
            if ($backLength > 1000) {
                $fWarnings[] = [
                    'type' => 'flashcard_back_too_long',
                    'flashcard_id' => $flashcard['id'],
                    'message' => "Verso trop long ({$backLength} caractères). Recommandé: < 1000 caractères."
                ];
            }

            // Détecter les flashcards inversées (back plus court que front)
            if ($backLength < $frontLength / 2) {
                $fWarnings[] = [
                    'type' => 'flashcard_potentially_inverted',
                    'flashcard_id' => $flashcard['id'],
                    'message' => "Le verso est beaucoup plus court que le recto. Vérifier l'orientation.",
                    'severity' => 'low'
                ];
            }

            $warnings = array_merge($warnings, $fWarnings);
            $scores[] = max(0, 100 - (count($fWarnings) * 15));
        }

        $avgScore = !empty($scores) ? array_sum($scores) / count($scores) : 0;

        return [
            'count' => count($flashcards),
            'avg_quality_score' => round($avgScore, 2),
            'warnings' => $warnings
        ];
    }

    /**
     * Analyser la fiche de révision
     */
    private function analyzeFiche($fiche) {
        $warnings = [];
        $score = 100;

        // Vérifier le nombre de sections
        $sectionCount = count($fiche['sections'] ?? []);
        if ($sectionCount === 0) {
            $warnings[] = [
                'type' => 'fiche_no_sections',
                'message' => "La fiche ne contient aucune section.",
                'severity' => 'critical'
            ];
            $score -= 50;
        } elseif ($sectionCount > 15) {
            $warnings[] = [
                'type' => 'fiche_too_many_sections',
                'message' => "La fiche contient {$sectionCount} sections. Recommandé: < 15 sections pour une meilleure lisibilité.",
                'severity' => 'medium'
            ];
            $score -= 10;
        }

        // Analyser chaque section
        foreach ($fiche['sections'] ?? [] as $section) {
            $contentLength = strlen($section['content'] ?? '');

            if ($contentLength < 20) {
                $warnings[] = [
                    'type' => 'fiche_section_too_short',
                    'section_title' => $section['title'],
                    'message' => "Section '{$section['title']}' trop courte ({$contentLength} caractères).",
                    'severity' => 'medium'
                ];
                $score -= 5;
            }

            if ($contentLength > 4000) {
                $warnings[] = [
                    'type' => 'fiche_section_too_long',
                    'section_title' => $section['title'],
                    'message' => "Section '{$section['title']}' trop longue ({$contentLength} caractères). Recommandé: < 4000 caractères.",
                    'severity' => 'low'
                ];
                $score -= 3;
            }

            // Vérifier les points clés
            if (empty($section['keyPoints'])) {
                $warnings[] = [
                    'type' => 'fiche_section_no_keypoints',
                    'section_title' => $section['title'],
                    'message' => "Section '{$section['title']}' sans points clés. Recommandé pour faciliter la révision.",
                    'severity' => 'low'
                ];
            }
        }

        // Vérifier le résumé global
        if (empty($fiche['summary'])) {
            $warnings[] = [
                'type' => 'fiche_no_summary',
                'message' => "Pas de résumé global. Recommandé pour la synthèse.",
                'severity' => 'medium'
            ];
            $score -= 10;
        }

        return [
            'section_count' => $sectionCount,
            'quality_score' => max(0, $score),
            'warnings' => $warnings
        ];
    }

    /**
     * Vérifier la cohérence de difficulté
     */
    private function checkDifficultyConsistency($themeData) {
        $difficulties = [];

        // Collecter les difficultés déclarées
        if (!empty($themeData['questions'])) {
            foreach ($themeData['questions'] as $q) {
                if (!empty($q['difficulty'])) {
                    $difficulties[] = $q['difficulty'];
                }
            }
        }

        if (!empty($themeData['flashcards'])) {
            foreach ($themeData['flashcards'] as $f) {
                if (!empty($f['difficulty'])) {
                    $difficulties[] = $f['difficulty'];
                }
            }
        }

        if (empty($difficulties)) {
            return true; // Pas de données de difficulté
        }

        // Vérifier l'homogénéité
        $unique = array_unique($difficulties);
        $distribution = array_count_values($difficulties);

        // Si plus de 70% des éléments ont la même difficulté, c'est cohérent
        $maxCount = max($distribution);
        $consistency = ($maxCount / count($difficulties)) >= 0.7;

        return $consistency;
    }

    /**
     * Estimer le niveau global du thème
     */
    private function estimateOverallLevel($themeData) {
        $difficulties = [];

        // Collecter les difficultés
        if (!empty($themeData['questions'])) {
            foreach ($themeData['questions'] as $q) {
                $difficulties[] = $q['difficulty'] ?? 'medium';
            }
        }

        if (!empty($themeData['flashcards'])) {
            foreach ($themeData['flashcards'] as $f) {
                $difficulties[] = $f['difficulty'] ?? 'medium';
            }
        }

        if (empty($difficulties)) {
            return 'normal';
        }

        // Calculer le niveau moyen
        $mapping = ['easy' => 1, 'medium' => 2, 'hard' => 3];
        $scores = array_map(fn($d) => $mapping[$d] ?? 2, $difficulties);
        $avgScore = array_sum($scores) / count($scores);

        if ($avgScore <= 1.3) {
            return 'easy';
        } elseif ($avgScore >= 2.5) {
            return 'expert';
        } else {
            return 'normal';
        }
    }

    /**
     * Calculer le score global de qualité
     */
    private function calculateOverallScore($analysis) {
        $scores = [];

        if (!empty($analysis['details']['questions'])) {
            $scores[] = $analysis['details']['questions']['avg_quality_score'];
        }

        if (!empty($analysis['details']['flashcards'])) {
            $scores[] = $analysis['details']['flashcards']['avg_quality_score'];
        }

        if (!empty($analysis['details']['fiche'])) {
            $scores[] = $analysis['details']['fiche']['quality_score'];
        }

        if (empty($scores)) {
            return 0;
        }

        $avgScore = array_sum($scores) / count($scores);

        // Pénalité pour incohérence de difficulté
        if (!$analysis['difficulty_consistency']) {
            $avgScore -= 10;
        }

        // Pénalité pour warnings critiques
        $criticalWarnings = array_filter($analysis['warnings'], fn($w) => ($w['severity'] ?? 'medium') === 'critical');
        $avgScore -= count($criticalWarnings) * 15;

        return max(0, min(100, round($avgScore, 2)));
    }

    /**
     * Améliorer un élément via IA
     */
    public function improveElement($elementType, $elementId, $originalText, $action, $context = []) {
        $validActions = ['simplify', 'complexify', 'clarify', 'shorten', 'expand'];
        if (!in_array($action, $validActions)) {
            return ['success' => false, 'error' => 'Invalid action'];
        }

        $prompts = [
            'simplify' => "Simplifie le texte suivant pour le rendre plus accessible sans perdre l'information principale",
            'complexify' => "Rends le texte suivant plus détaillé et complexe pour un niveau avancé",
            'clarify' => "Reformule le texte suivant pour le rendre plus clair et sans ambiguïté",
            'shorten' => "Raccourcis le texte suivant tout en gardant l'essentiel",
            'expand' => "Développe le texte suivant avec plus de détails et d'explications"
        ];

        $systemPrompt = "Tu es un assistant pédagogique expert. {$prompts[$action]}.";

        if ($elementType === 'question') {
            $systemPrompt .= " Il s'agit d'une question de quiz.";
        } elseif ($elementType === 'explanation') {
            $systemPrompt .= " Il s'agit d'une explication de réponse.";
        } elseif ($elementType === 'flashcard') {
            $systemPrompt .= " Il s'agit d'une flashcard (recto ou verso).";
        }

        $systemPrompt .= " Réponds UNIQUEMENT avec le texte amélioré, sans introduction ni commentaire.";

        try {
            $result = $this->aiProvider->generate([
                'system_prompt' => $systemPrompt,
                'user_prompt' => $originalText,
                'max_tokens' => 500,
                'temperature' => 0.7
            ]);

            if ($result['success']) {
                return [
                    'success' => true,
                    'original_text' => $originalText,
                    'improved_text' => trim($result['text']),
                    'action' => $action,
                    'element_type' => $elementType,
                    'element_id' => $elementId
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'AI generation failed: ' . $result['error']
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Exception: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Générer des suggestions d'amélioration pour un thème complet
     */
    public function generateSuggestions($themeData) {
        $analysis = $this->analyzeTheme($themeData);
        $suggestions = [];

        // Suggestions basées sur les warnings
        foreach ($analysis['warnings'] as $warning) {
            switch ($warning['type']) {
                case 'question_too_long':
                    $suggestions[] = [
                        'element_id' => $warning['question_id'],
                        'type' => 'question',
                        'action' => 'shorten',
                        'reason' => $warning['message']
                    ];
                    break;

                case 'missing_explanation':
                    $suggestions[] = [
                        'element_id' => $warning['question_id'],
                        'type' => 'explanation',
                        'action' => 'generate',
                        'reason' => 'Ajouter une explication pédagogique'
                    ];
                    break;

                case 'flashcard_front_too_long':
                    $suggestions[] = [
                        'element_id' => $warning['flashcard_id'],
                        'type' => 'flashcard',
                        'action' => 'shorten',
                        'reason' => $warning['message']
                    ];
                    break;
            }
        }

        return [
            'analysis' => $analysis,
            'suggestions' => $suggestions
        ];
    }
}
