<?php
/**
 * Modèle Assignment
 * Représente un devoir assigné à une classe
 */

namespace Models;

class Assignment
{
    public ?int $id;
    public int $classId;
    public string $title;
    public string $description;
    public string $subject;
    public string $dueDate; // due_date
    public ?string $availableAt; // available_at (nullable)
    public string $status; // enum: 'draft', 'published', 'archived'
    public ?string $createdAt;
    public ?string $updatedAt;
    
    // Champs optionnels pour compatibilité avec l'ancien modèle
    public ?int $themeId = null;
    public ?int $assignedBy = null;
    public ?string $startAt = null;
    public ?string $endAt = null;
    public ?string $dueAt = null; // Alias pour dueDate

    public function __construct(
        ?int $id = null,
        int $classId = 0,
        string $title = '',
        string $description = '',
        string $subject = '',
        string $dueDate = '',
        ?string $availableAt = null,
        string $status = 'draft',
        ?string $createdAt = null,
        ?string $updatedAt = null
    ) {
        $this->id = $id;
        $this->classId = $classId;
        $this->title = $title;
        $this->description = $description;
        $this->subject = $subject;
        $this->dueDate = $dueDate;
        $this->dueAt = $dueDate; // Alias pour compatibilité
        $this->availableAt = $availableAt;
        $this->status = $status;
        $this->createdAt = $createdAt;
        $this->updatedAt = $updatedAt;
    }

    /**
     * Crée un Assignment à partir d'un tableau associatif (résultat DB)
     */
    public static function fromArray(array $data): self
    {
        $assignment = new self(
            $data['id'] ?? null,
            $data['class_id'] ?? 0,
            $data['title'] ?? '',
            $data['description'] ?? '',
            $data['subject'] ?? '',
            $data['due_date'] ?? $data['due_at'] ?? '',
            $data['available_at'] ?? null,
            $data['status'] ?? 'draft',
            $data['created_at'] ?? null,
            $data['updated_at'] ?? null
        );
        
        // Compatibilité avec l'ancien modèle
        if (isset($data['theme_id'])) {
            $assignment->themeId = $data['theme_id'];
        }
        if (isset($data['assigned_by'])) {
            $assignment->assignedBy = $data['assigned_by'];
        }
        if (isset($data['start_at'])) {
            $assignment->startAt = $data['start_at'];
        }
        if (isset($data['end_at'])) {
            $assignment->endAt = $data['end_at'];
        }
        
        return $assignment;
    }

    /**
     * Convertit l'Assignment en tableau pour JSON
     * Formate les dates au format ISO 8601
     */
    public function toArray(): array
    {
        $result = [
            'id' => $this->id,
            'class_id' => $this->classId,
            'title' => $this->title,
            'description' => $this->description,
            'subject' => $this->subject,
            'due_date' => $this->formatDateTime($this->dueDate),
            'available_at' => $this->formatDateTime($this->availableAt),
            'status' => $this->status,
            'created_at' => $this->formatDateTime($this->createdAt),
            'updated_at' => $this->formatDateTime($this->updatedAt),
        ];
        
        // Ajouter les champs optionnels s'ils existent
        if ($this->themeId !== null) {
            $result['theme_id'] = $this->themeId;
        }
        if ($this->assignedBy !== null) {
            $result['assigned_by'] = $this->assignedBy;
        }
        if ($this->startAt !== null) {
            $result['start_at'] = $this->formatDateTime($this->startAt);
        }
        if ($this->endAt !== null) {
            $result['end_at'] = $this->formatDateTime($this->endAt);
        }
        
        return $result;
    }
    
    /**
     * Convertit l'Assignment au format de synchronisation ErgoMate
     * Retourne un tableau avec les clés: title, date, matiere, description, available_at
     * Les dates sont au format ISO 8601 avec Z (ex: 2023-11-25T10:00:00Z)
     */
    public function toSyncArray(): array
    {
        // Formater les dates au format ISO 8601 avec Z
        $formatDateForSync = function(?string $datetime): ?string {
            if ($datetime === null) {
                return null;
            }
            
            // Si déjà au format ISO avec Z, retourner tel quel
            if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $datetime)) {
                return $datetime;
            }
            
            // Convertir depuis MySQL DATETIME ou ISO sans Z
            $dt = \DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
            if ($dt === false) {
                $dt = \DateTime::createFromFormat('Y-m-d\TH:i:s', $datetime);
            }
            if ($dt === false) {
                return $datetime; // Retourner tel quel si échec
            }
            
            // Retourner au format ISO 8601 avec Z
            return $dt->format('Y-m-d\TH:i:s\Z');
        };
        
        return [
            'title' => $this->title,
            'date' => $formatDateForSync($this->dueDate),
            'matiere' => $this->subject,
            'description' => $this->description,
            'available_at' => $formatDateForSync($this->availableAt)
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
     * Valide les données de l'Assignment
     */
    public function validate(): array
    {
        $errors = [];

        if ($this->classId <= 0) {
            $errors[] = 'class_id must be a positive integer';
        }

        if (empty(trim($this->title))) {
            $errors[] = 'title is required';
        }

        if (empty(trim($this->description))) {
            $errors[] = 'description is required';
        }

        if (empty(trim($this->subject))) {
            $errors[] = 'subject is required';
        }

        if (empty(trim($this->dueDate))) {
            $errors[] = 'due_date is required';
        }

        if (!in_array($this->status, ['draft', 'published', 'archived'], true)) {
            $errors[] = 'status must be one of: draft, published, archived';
        }

        if ($this->dueDate !== null && !$this->isValidDateTime($this->dueDate)) {
            $errors[] = 'due_date must be a valid datetime (ISO 8601 or MySQL format)';
        }

        if ($this->availableAt !== null && !$this->isValidDateTime($this->availableAt)) {
            $errors[] = 'available_at must be a valid datetime (ISO 8601 or MySQL format)';
        }

        return $errors;
    }

    /**
     * Vérifie si une chaîne est une date valide
     */
    private function isValidDateTime(string $datetime): bool
    {
        // Accepter format ISO 8601 ou MySQL DATETIME
        $formats = ['Y-m-d\TH:i:s', 'Y-m-d H:i:s', 'Y-m-d\TH:i:sP'];
        
        foreach ($formats as $format) {
            $dt = \DateTime::createFromFormat($format, $datetime);
            if ($dt !== false) {
                return true;
            }
        }

        return false;
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

