<?php
/**
 * Modèle Theme
 * Représente un thème d'apprentissage avec questions et révision
 */

namespace Models;

class Theme
{
    public ?int $id;
    public int $schoolId;
    public int $createdBy;
    public string $title;
    public ?string $description;
    public ?string $subject;
    public string $type; // 'quiz', 'flashcards', 'sheet'
    public string $status; // 'draft', 'pending_review', 'approved', 'published'
    public string $source; // 'manual', 'ai_studio', 'pdf_import'
    public ?string $sourceFileName;
    public ?string $createdAt;
    public ?string $updatedAt;

    // Données enrichies (non stockées directement en DB)
    public array $tags = [];
    public array $questions = [];
    public ?array $revision = null;

    public function __construct(
        ?int $id = null,
        int $schoolId = 0,
        int $createdBy = 0,
        string $title = '',
        ?string $description = null,
        ?string $subject = null,
        string $type = 'quiz',
        string $status = 'draft',
        string $source = 'manual',
        ?string $sourceFileName = null,
        ?string $createdAt = null,
        ?string $updatedAt = null
    ) {
        $this->id = $id;
        $this->schoolId = $schoolId;
        $this->createdBy = $createdBy;
        $this->title = $title;
        $this->description = $description;
        $this->subject = $subject;
        $this->type = $type;
        $this->status = $status;
        $this->source = $source;
        $this->sourceFileName = $sourceFileName;
        $this->createdAt = $createdAt;
        $this->updatedAt = $updatedAt;
    }

    /**
     * Crée un Theme à partir d'un tableau associatif (résultat DB)
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['id'] ?? null,
            $data['school_id'] ?? 0,
            $data['created_by'] ?? 0,
            $data['title'] ?? '',
            $data['description'] ?? null,
            $data['subject'] ?? null,
            $data['type'] ?? 'quiz',
            $data['status'] ?? 'draft',
            $data['source'] ?? 'manual',
            $data['source_file_name'] ?? null,
            $data['created_at'] ?? null,
            $data['updated_at'] ?? null
        );
    }

    /**
     * Convertit le Theme en tableau pour JSON (format API)
     * Inclut les questions et la révision si présentes
     */
    public function toArray(): array
    {
        $result = [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'tags' => $this->tags,
            'subject' => $this->subject,
            'type' => $this->type,
            'status' => $this->status,
            'source' => $this->source,
            'source_file_name' => $this->sourceFileName,
            'created_at' => $this->formatDateTime($this->createdAt),
            'updated_at' => $this->formatDateTime($this->updatedAt),
        ];

        // Ajouter les questions si présentes
        if (!empty($this->questions)) {
            $result['questions'] = $this->questions;
        }

        // Ajouter la révision si présente
        if ($this->revision !== null) {
            $result['revision'] = $this->revision;
        }

        return $result;
    }

    /**
     * Formate une date MySQL en ISO 8601 (2025-09-01T08:00:00)
     */
    private function formatDateTime(?string $datetime): ?string
    {
        if ($datetime === null) {
            return null;
        }

        // Si déjà au format ISO, retourner tel quel
        if (strpos($datetime, 'T') !== false) {
            return $datetime;
        }

        // Convertir depuis MySQL DATETIME (2025-09-01 08:00:00) vers ISO 8601
        $dt = \DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
        if ($dt === false) {
            return $datetime; // Retourner tel quel si échec
        }

        return $dt->format('Y-m-d\TH:i:s');
    }

    /**
     * Valide les données du Theme
     */
    public function validate(bool $requireTitle = true): array
    {
        $errors = [];

        if ($requireTitle && empty(trim($this->title))) {
            $errors[] = 'title is required';
        }

        if ($this->schoolId <= 0) {
            $errors[] = 'school_id must be a positive integer';
        }

        if ($this->createdBy <= 0) {
            $errors[] = 'created_by must be a positive integer';
        }

        $validTypes = ['quiz', 'flashcards', 'sheet'];
        if (!in_array($this->type, $validTypes, true)) {
            $errors[] = 'type must be one of: ' . implode(', ', $validTypes);
        }

        $validStatuses = ['draft', 'pending_review', 'approved', 'published'];
        if (!in_array($this->status, $validStatuses, true)) {
            $errors[] = 'status must be one of: ' . implode(', ', $validStatuses);
        }

        $validSources = ['manual', 'ai_studio', 'pdf_import'];
        if (!in_array($this->source, $validSources, true)) {
            $errors[] = 'source must be one of: ' . implode(', ', $validSources);
        }

        return $errors;
    }

    /**
     * Convertit les questions depuis le format DB (theme_questions) vers le format API
     * 
     * @param array $dbQuestions - Tableau de lignes theme_questions
     * @return array - Questions au format API
     */
    public static function convertQuestionsFromDb(array $dbQuestions): array
    {
        $questions = [];

        foreach ($dbQuestions as $row) {
            $data = json_decode($row['data'] ?? '{}', true);
            if (!is_array($data)) {
                $data = [];
            }

            // Construire la question au format API
            $question = [
                'id' => $data['id'] ?? 'q' . str_pad($row['id'], 3, '0', STR_PAD_LEFT),
                'type' => $row['question_type'] ?? 'mcq',
                'prompt' => $row['prompt'] ?? '',
            ];

            // Ajouter les choix si MCQ
            if ($row['question_type'] === 'mcq' && isset($data['choices'])) {
                $question['choices'] = $data['choices'];
            }

            // Ajouter la réponse
            if (isset($data['answer'])) {
                $question['answer'] = $data['answer'];
            }

            // Ajouter la rationale si présente
            if (isset($data['rationale'])) {
                $question['rationale'] = $data['rationale'];
            }

            // Ajouter les tags si présents
            if (isset($data['tags']) && is_array($data['tags'])) {
                $question['tags'] = $data['tags'];
            }

            $questions[] = $question;
        }

        return $questions;
    }

    /**
     * Convertit les questions depuis le format API vers le format DB
     * 
     * @param array $apiQuestions - Questions au format API
     * @return array - Tableau de tableaux pour insertion en DB
     */
    public static function convertQuestionsToDb(array $apiQuestions): array
    {
        $dbQuestions = [];

        foreach ($apiQuestions as $index => $question) {
            $data = [
                'id' => $question['id'] ?? 'q' . str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                'type' => $question['type'] ?? 'mcq',
                'prompt' => $question['prompt'] ?? '',
            ];

            // Ajouter les choix si MCQ
            if (($question['type'] ?? 'mcq') === 'mcq' && isset($question['choices'])) {
                $data['choices'] = $question['choices'];
            }

            // Ajouter la réponse
            if (isset($question['answer'])) {
                $data['answer'] = $question['answer'];
            }

            // Ajouter la rationale si présente
            if (isset($question['rationale'])) {
                $data['rationale'] = $question['rationale'];
            }

            // Ajouter les tags si présents
            if (isset($question['tags']) && is_array($question['tags'])) {
                $data['tags'] = $question['tags'];
            }

            $dbQuestions[] = [
                'question_type' => $question['type'] ?? 'mcq',
                'prompt' => $question['prompt'] ?? '',
                'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
                'order_index' => $index + 1
            ];
        }

        return $dbQuestions;
    }
}

