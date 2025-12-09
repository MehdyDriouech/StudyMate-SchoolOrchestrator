<?php
/**
 * Service Submission - Logique métier
 * Gère la validation et les règles métier pour les soumissions
 */

namespace Services;

use Models\Submission;
use Repositories\SubmissionRepository;
use Repositories\AssignmentRepository;

class SubmissionService
{
    private SubmissionRepository $repository;
    private AssignmentRepository $assignmentRepository;

    public function __construct(
        SubmissionRepository $repository = null,
        AssignmentRepository $assignmentRepository = null
    ) {
        $this->repository = $repository ?? new SubmissionRepository();
        $this->assignmentRepository = $assignmentRepository ?? new AssignmentRepository();
    }

    /**
     * Crée ou met à jour une soumission
     * 
     * @param array $data Données de la soumission
     * @param int|null $studentId ID de l'étudiant (peut être dérivé du token)
     * @return Submission
     * @throws \InvalidArgumentException Si les données sont invalides
     */
    public function createOrUpdateSubmission(array $data, ?int $studentId = null): Submission
    {
        // Utiliser student_id depuis les données ou le paramètre
        $studentId = $data['student_id'] ?? $studentId;
        
        if ($studentId === null || $studentId <= 0) {
            throw new \InvalidArgumentException('student_id is required');
        }

        // Valider les données requises
        if (empty($data['assignment_id'])) {
            throw new \InvalidArgumentException('assignment_id is required');
        }

        $assignmentId = (int) $data['assignment_id'];

        // Vérifier que l'assignment existe
        $assignment = $this->assignmentRepository->findById($assignmentId);
        if ($assignment === null) {
            throw new \InvalidArgumentException('Assignment not found');
        }

        // Vérifier que l'étudiant existe
        if (!$this->repository->studentExists($studentId)) {
            throw new \InvalidArgumentException('Student not found');
        }

        // Créer le modèle Submission
        $submission = new Submission(
            null, // id sera généré par la DB
            $assignmentId,
            $studentId,
            isset($data['score']) ? (float) $data['score'] : null,
            isset($data['duration']) ? (int) $data['duration'] : null,
            $data['responses'] ?? null, // raw_response
            date('Y-m-d\TH:i:s') // completed_at (maintenant)
        );

        // Valider le modèle
        $errors = $submission->validate();
        if (!empty($errors)) {
            throw new \InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        // Sauvegarder (UPSERT)
        return $this->repository->upsert($submission);
    }

    /**
     * Récupère toutes les soumissions pour un assignment avec les informations des étudiants
     * Format: compatible avec FakeRouter.js pour le gradebook
     * 
     * @param int $assignmentId
     * @param int $classId ID de la classe de l'assignment (pour récupérer tous les étudiants)
     * @return array Format: [{student_id, student_name, status, score, submitted_at, details}]
     */
    public function getSubmissionsForGradebook(int $assignmentId, int $classId): array
    {
        // Récupérer l'assignment pour vérifier qu'il existe
        $assignment = $this->assignmentRepository->findById($assignmentId);
        if ($assignment === null) {
            throw new \InvalidArgumentException('Assignment not found');
        }

        // Récupérer tous les étudiants de la classe
        $classesRepo = new \Repositories\ClassesRepository();
        $students = $classesRepo->findStudentsByClassId($classId);

        // Récupérer toutes les soumissions pour cet assignment
        $submissions = $this->repository->findByAssignmentId($assignmentId);
        
        // Créer un index par student_id pour accès rapide
        $submissionsByStudent = [];
        foreach ($submissions as $submission) {
            $submissionsByStudent[$submission->studentId] = $submission;
        }

        // Construire le résultat : tous les étudiants avec leur statut de soumission
        $result = [];
        foreach ($students as $student) {
            $submission = $submissionsByStudent[$student['id']] ?? null;

            $result[] = [
                'student_id' => $student['id'],
                'student_name' => $student['name'],
                'status' => $submission !== null ? 'submitted' : 'pending',
                'score' => $submission?->score,
                'submitted_at' => $submission?->completedAt 
                    ? $this->formatDateTimeForApi($submission->completedAt) 
                    : null,
                'details' => $submission?->rawResponse ?? null
            ];
        }

        return $result;
    }

    /**
     * Formate une date pour l'API (format MySQL vers ISO 8601)
     */
    private function formatDateTimeForApi(?string $datetime): ?string
    {
        if ($datetime === null) {
            return null;
        }

        // Si déjà au format ISO, retourner tel quel
        if (strpos($datetime, 'T') !== false) {
            return $datetime;
        }

        // Convertir depuis MySQL DATETIME
        $dt = \DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
        if ($dt === false) {
            return $datetime;
        }

        return $dt->format('Y-m-d\TH:i:s');
    }
}

