<?php
/**
 * Modèle Submission
 * Représente une soumission d'un étudiant pour un assignment
 */

namespace Models;

class Submission
{
    public ?int $id;
    public int $assignmentId;
    public int $studentId;
    public ?float $score; // DECIMAL(5,2) - peut être 0-100 ou 0-20
    public ?int $durationSeconds;
    public ?array $rawResponse; // JSON
    public ?string $completedAt;
    public ?string $createdAt;
    public ?string $updatedAt;

    public function __construct(
        ?int $id = null,
        int $assignmentId = 0,
        int $studentId = 0,
        ?float $score = null,
        ?int $durationSeconds = null,
        ?array $rawResponse = null,
        ?string $completedAt = null,
        ?string $createdAt = null,
        ?string $updatedAt = null
    ) {
        $this->id = $id;
        $this->assignmentId = $assignmentId;
        $this->studentId = $studentId;
        $this->score = $score;
        $this->durationSeconds = $durationSeconds;
        $this->rawResponse = $rawResponse;
        $this->completedAt = $completedAt;
        $this->createdAt = $createdAt;
        $this->updatedAt = $updatedAt;
    }

    /**
     * Crée un Submission à partir d'un tableau associatif (résultat DB)
     */
    public static function fromArray(array $data): self
    {
        // Décoder raw_response si c'est une chaîne JSON
        $rawResponse = $data['raw_response'] ?? null;
        if (is_string($rawResponse)) {
            $decoded = json_decode($rawResponse, true);
            $rawResponse = $decoded !== null ? $decoded : null;
        }

        return new self(
            $data['id'] ?? null,
            $data['assignment_id'] ?? 0,
            $data['student_id'] ?? 0,
            $data['score'] !== null ? (float) $data['score'] : null,
            $data['duration_seconds'] !== null ? (int) $data['duration_seconds'] : null,
            $rawResponse,
            $data['completed_at'] ?? null,
            $data['created_at'] ?? null,
            $data['updated_at'] ?? null
        );
    }

    /**
     * Convertit le Submission en tableau pour JSON
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'assignment_id' => $this->assignmentId,
            'student_id' => $this->studentId,
            'score' => $this->score,
            'duration_seconds' => $this->durationSeconds,
            'raw_response' => $this->rawResponse,
            'completed_at' => $this->formatDateTime($this->completedAt),
            'created_at' => $this->formatDateTime($this->createdAt),
            'updated_at' => $this->formatDateTime($this->updatedAt),
        ];
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
     * Valide les données du Submission
     */
    public function validate(): array
    {
        $errors = [];

        if ($this->assignmentId <= 0) {
            $errors[] = 'assignment_id must be a positive integer';
        }

        if ($this->studentId <= 0) {
            $errors[] = 'student_id must be a positive integer';
        }

        if ($this->score !== null && ($this->score < 0 || $this->score > 100)) {
            $errors[] = 'score must be between 0 and 100';
        }

        if ($this->durationSeconds !== null && $this->durationSeconds < 0) {
            $errors[] = 'duration_seconds must be a positive integer';
        }

        return $errors;
    }

    /**
     * Convertit une date ISO 8601 en format MySQL DATETIME
     */
    public static function isoToMysql(?string $iso): ?string
    {
        if ($iso === null) {
            return null;
        }

        // Si déjà au format MySQL, retourner tel quel
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $iso)) {
            return $iso;
        }

        // Convertir depuis ISO 8601
        $dt = \DateTime::createFromFormat('Y-m-d\TH:i:s', $iso);
        if ($dt === false) {
            // Essayer avec timezone
            $dt = \DateTime::createFromFormat(\DateTime::ISO8601, $iso);
        }

        if ($dt === false) {
            return $iso; // Retourner tel quel si échec
        }

        return $dt->format('Y-m-d H:i:s');
    }
}

