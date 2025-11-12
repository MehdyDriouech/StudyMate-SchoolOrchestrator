<?php
/**
 * Service IA - Génération de contenu pédagogique
 *
 * Intégration avec Mistral AI pour générer :
 * - Thèmes complets
 * - Quiz
 * - Flashcards
 * - Fiches de révision
 */

class AIService {
    private $db;
    private $apiKey;

    public function __construct($apiKey = null) {
        $this->db = db();
        $this->apiKey = $apiKey;
    }

    /**
     * Générer un thème depuis du texte
     *
     * @param string $text Texte source
     * @param string $userId ID de l'utilisateur
     * @param string $tenantId ID du tenant
     * @param array $options Options de génération
     * @return array Résultat de la génération
     */
    public function generateThemeFromText($text, $userId, $tenantId, $options = []) {
        // Valider les paramètres
        if (empty($text)) {
            throw new Exception('Text cannot be empty');
        }

        // Calculer le hash du contenu source
        $sourceHash = hash('sha256', $text);

        // Vérifier si une génération identique existe déjà (cache)
        $existing = $this->db->queryOne(
            'SELECT id, result_json, validation_status, theme_id
             FROM ai_generations
             WHERE source_hash = :hash
               AND tenant_id = :tenant_id
               AND generation_type = :type
               AND validation_status = \'valid\'
               AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
             ORDER BY created_at DESC
             LIMIT 1',
            [
                'hash' => $sourceHash,
                'tenant_id' => $tenantId,
                'type' => $options['type'] ?? 'theme'
            ]
        );

        if ($existing && $existing['result_json']) {
            logInfo('Using cached AI generation', [
                'generation_id' => $existing['id'],
                'theme_id' => $existing['theme_id']
            ]);

            return [
                'generation_id' => $existing['id'],
                'theme_id' => $existing['theme_id'],
                'result' => json_decode($existing['result_json'], true),
                'cached' => true
            ];
        }

        // Créer un enregistrement de génération
        $generationId = generateId('aigen');

        $this->db->execute(
            'INSERT INTO ai_generations
             (id, tenant_id, user_id, generation_type, source_type, source_hash, status, created_at)
             VALUES (:id, :tenant_id, :user_id, :generation_type, :source_type, :source_hash, :status, NOW())',
            [
                'id' => $generationId,
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'generation_type' => $options['type'] ?? 'theme',
                'source_type' => 'text',
                'source_hash' => $sourceHash,
                'status' => 'processing'
            ]
        );

        // Générer via Mistral AI
        try {
            $startTime = microtime(true);

            $result = $this->callMistralAPI($text, $options);

            $processingTime = (microtime(true) - $startTime) * 1000;

            // Valider le résultat contre le schéma
            $validator = new SchemaValidator();
            $validation = $validator->validateTheme($result);

            if ($validation['valid']) {
                // Créer le thème
                $themeId = $this->createThemeFromGeneration($result, $userId, $tenantId);

                // Mettre à jour l'enregistrement de génération
                $this->db->execute(
                    'UPDATE ai_generations
                     SET result_json = :result_json,
                         validation_status = :validation_status,
                         theme_id = :theme_id,
                         status = :status,
                         processing_time_ms = :processing_time_ms,
                         updated_at = NOW()
                     WHERE id = :id',
                    [
                        'id' => $generationId,
                        'result_json' => json_encode($result),
                        'validation_status' => 'valid',
                        'theme_id' => $themeId,
                        'status' => 'completed',
                        'processing_time_ms' => (int)$processingTime
                    ]
                );

                logInfo('AI theme generated successfully', [
                    'generation_id' => $generationId,
                    'theme_id' => $themeId,
                    'processing_time_ms' => (int)$processingTime
                ]);

                return [
                    'generation_id' => $generationId,
                    'theme_id' => $themeId,
                    'result' => $result,
                    'validation' => $validation,
                    'processing_time_ms' => (int)$processingTime
                ];

            } else {
                // Validation échouée
                $this->db->execute(
                    'UPDATE ai_generations
                     SET result_json = :result_json,
                         validation_status = :validation_status,
                         validation_errors = :validation_errors,
                         status = :status,
                         processing_time_ms = :processing_time_ms,
                         updated_at = NOW()
                     WHERE id = :id',
                    [
                        'id' => $generationId,
                        'result_json' => json_encode($result),
                        'validation_status' => 'invalid',
                        'validation_errors' => json_encode($validation['errors']),
                        'status' => 'completed',
                        'processing_time_ms' => (int)$processingTime
                    ]
                );

                logWarn('AI generation validation failed', [
                    'generation_id' => $generationId,
                    'errors' => $validation['errors']
                ]);

                return [
                    'generation_id' => $generationId,
                    'result' => $result,
                    'validation' => $validation,
                    'processing_time_ms' => (int)$processingTime
                ];
            }

        } catch (Exception $e) {
            // Erreur lors de la génération
            $this->db->execute(
                'UPDATE ai_generations
                 SET status = :status,
                     error_message = :error_message,
                     updated_at = NOW()
                 WHERE id = :id',
                [
                    'id' => $generationId,
                    'status' => 'error',
                    'error_message' => $e->getMessage()
                ]
            );

            logError('AI generation failed', [
                'generation_id' => $generationId,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Appeler l'API Mistral
     */
    private function callMistralAPI($text, $options = []) {
        // En mode MOCK, retourner un thème de test
        if (defined('MOCK_MODE') && MOCK_MODE === true) {
            return $this->generateMockTheme($text, $options);
        }

        if (!$this->apiKey) {
            throw new Exception('Mistral API key not configured');
        }

        $type = $options['type'] ?? 'theme';
        $difficulty = $options['difficulty'] ?? 'intermediate';

        // Construire le prompt
        $prompt = $this->buildPrompt($text, $type, $difficulty);

        // Appeler Mistral API
        $ch = curl_init('https://api.mistral.ai/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => 'mistral-medium',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Tu es un assistant pédagogique expert. Tu génères du contenu éducatif de haute qualité au format JSON.'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 4000
        ]));
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception('Mistral API error: HTTP ' . $httpCode);
        }

        $data = json_decode($response, true);

        if (!isset($data['choices'][0]['message']['content'])) {
            throw new Exception('Invalid Mistral API response');
        }

        // Parser le JSON depuis la réponse
        $content = $data['choices'][0]['message']['content'];

        // Extraire le JSON (peut être entouré de ```json ... ```)
        if (preg_match('/```json\s*(.*?)\s*```/s', $content, $matches)) {
            $jsonStr = $matches[1];
        } else {
            $jsonStr = $content;
        }

        $result = json_decode($jsonStr, true);

        if (!$result) {
            throw new Exception('Failed to parse AI response as JSON');
        }

        return $result;
    }

    /**
     * Construire le prompt pour Mistral
     */
    private function buildPrompt($text, $type, $difficulty) {
        $prompts = [
            'theme' => "Génère un thème pédagogique complet au format JSON à partir du texte suivant.
Le thème doit contenir :
- Un titre accrocheur
- Une description claire
- Au moins 10 questions de type QCM avec 4 choix et une seule bonne réponse
- Au moins 10 flashcards avec une face (question) et un verso (réponse)
- Une fiche de révision structurée avec les points clés

Format JSON attendu :
{
  \"title\": \"Titre du thème\",
  \"description\": \"Description\",
  \"difficulty\": \"$difficulty\",
  \"questions\": [
    {\"id\": \"q1\", \"text\": \"Question?\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"correctAnswer\": 0, \"explanation\": \"Explication\"}
  ],
  \"flashcards\": [
    {\"id\": \"f1\", \"front\": \"Question\", \"back\": \"Réponse\"}
  ],
  \"fiche\": {
    \"sections\": [
      {\"title\": \"Section 1\", \"content\": \"Contenu\", \"keyPoints\": [\"Point 1\", \"Point 2\"]}
    ]
  }
}

Texte source :
$text",

            'quiz' => "Génère un quiz de 15 questions QCM au format JSON à partir du texte suivant...",

            'flashcards' => "Génère 20 flashcards au format JSON à partir du texte suivant..."
        ];

        return $prompts[$type] ?? $prompts['theme'];
    }

    /**
     * Générer un thème mock pour les tests
     */
    private function generateMockTheme($text, $options = []) {
        return [
            'title' => 'Thème généré par IA (MOCK)',
            'description' => 'Ceci est un thème de test généré automatiquement.',
            'difficulty' => $options['difficulty'] ?? 'intermediate',
            'questions' => [
                [
                    'id' => 'q1',
                    'text' => 'Question de test 1 ?',
                    'choices' => ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
                    'correctAnswer' => 0,
                    'explanation' => 'Explication de la réponse correcte'
                ],
                [
                    'id' => 'q2',
                    'text' => 'Question de test 2 ?',
                    'choices' => ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
                    'correctAnswer' => 1,
                    'explanation' => 'Explication de la réponse correcte'
                ]
            ],
            'flashcards' => [
                [
                    'id' => 'f1',
                    'front' => 'Qu\'est-ce que X ?',
                    'back' => 'X est...'
                ],
                [
                    'id' => 'f2',
                    'front' => 'Définir Y',
                    'back' => 'Y se définit comme...'
                ]
            ],
            'fiche' => [
                'sections' => [
                    [
                        'title' => 'Introduction',
                        'content' => 'Contenu de l\'introduction',
                        'keyPoints' => ['Point clé 1', 'Point clé 2']
                    ],
                    [
                        'title' => 'Concepts principaux',
                        'content' => 'Explication des concepts',
                        'keyPoints' => ['Concept A', 'Concept B']
                    ]
                ]
            ]
        ];
    }

    /**
     * Créer un thème à partir d'une génération IA
     */
    private function createThemeFromGeneration($data, $userId, $tenantId) {
        $themeId = generateId('theme');

        $this->db->execute(
            'INSERT INTO themes
             (id, tenant_id, created_by, title, description, content, difficulty, source, status, created_at)
             VALUES (:id, :tenant_id, :created_by, :title, :description, :content, :difficulty, :source, :status, NOW())',
            [
                'id' => $themeId,
                'tenant_id' => $tenantId,
                'created_by' => $userId,
                'title' => $data['title'] ?? 'Thème sans titre',
                'description' => $data['description'] ?? '',
                'content' => json_encode($data),
                'difficulty' => $data['difficulty'] ?? 'intermediate',
                'source' => 'pdf_mistral',
                'status' => 'draft'
            ]
        );

        return $themeId;
    }
}

/**
 * Validateur de schéma JSON
 */
class SchemaValidator {
    /**
     * Valider un thème contre le schéma ErgoMate
     */
    public function validateTheme($data) {
        $errors = [];

        // Vérifier les champs obligatoires
        if (empty($data['title'])) {
            $errors[] = 'Missing required field: title';
        }

        if (empty($data['description'])) {
            $errors[] = 'Missing required field: description';
        }

        if (empty($data['difficulty'])) {
            $errors[] = 'Missing required field: difficulty';
        } elseif (!in_array($data['difficulty'], ['beginner', 'intermediate', 'advanced'])) {
            $errors[] = 'Invalid difficulty value';
        }

        // Valider les questions
        if (isset($data['questions'])) {
            foreach ($data['questions'] as $i => $q) {
                if (empty($q['id'])) {
                    $errors[] = "Question $i: missing id";
                }
                if (empty($q['text'])) {
                    $errors[] = "Question $i: missing text";
                }
                if (!isset($q['choices']) || count($q['choices']) < 2) {
                    $errors[] = "Question $i: must have at least 2 choices";
                }
                if (!isset($q['correctAnswer']) || !is_int($q['correctAnswer'])) {
                    $errors[] = "Question $i: missing or invalid correctAnswer";
                }
            }
        }

        // Valider les flashcards
        if (isset($data['flashcards'])) {
            foreach ($data['flashcards'] as $i => $f) {
                if (empty($f['id'])) {
                    $errors[] = "Flashcard $i: missing id";
                }
                if (empty($f['front'])) {
                    $errors[] = "Flashcard $i: missing front";
                }
                if (empty($f['back'])) {
                    $errors[] = "Flashcard $i: missing back";
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
}
