<?php
/**
 * Service Theme - Logique métier
 * Valide les données et orchestre les opérations
 */

namespace Services;

use Models\Theme;
use Repositories\ThemeRepository;
use Repositories\ThemeReviewRepository;

class ThemeService
{
    private ThemeRepository $repository;
    private ThemeReviewRepository $reviewRepository;

    public function __construct(ThemeRepository $repository)
    {
        $this->repository = $repository;
        $this->reviewRepository = new ThemeReviewRepository();
    }

    /**
     * Récupère tous les thèmes selon le rôle de l'utilisateur
     * 
     * Règles :
     * - student : tous les thèmes publiés de son établissement
     * - teacher : tous les thèmes de son établissement (y compris les siens en draft)
     * - pedago : tous les thèmes de son établissement
     * - director : tous les thèmes de son établissement
     * 
     * @param array $user - Utilisateur authentifié
     * @return array
     */
    public function getThemesForUser(array $user): array
    {
        $role = $user['role'] ?? 'student';
        $userId = (int) ($user['id'] ?? 0);
        $schoolId = (int) ($user['school_id'] ?? 0);

        switch ($role) {
            case 'student':
                // Uniquement les thèmes publiés de l'établissement
                $themes = $this->repository->findBySchoolId($schoolId);
                return array_filter($themes, function ($theme) {
                    return $theme->status === 'published';
                });
            
            case 'teacher':
                // Tous les thèmes de l'établissement, mais on peut voir ses propres drafts
                $themes = $this->repository->findBySchoolId($schoolId);
                return array_filter($themes, function ($theme) use ($userId) {
                    // Voir tous les thèmes publiés/approuvés OU ses propres thèmes
                    return $theme->status === 'published' || 
                           $theme->status === 'approved' || 
                           ($theme->createdBy === $userId);
                });
            
            case 'pedago':
            case 'director':
                // Tous les thèmes de l'établissement
                return $this->repository->findBySchoolId($schoolId);
            
            default:
                return [];
        }
    }

    /**
     * Récupère un thème par ID avec ses questions
     */
    public function getThemeById(int $id, array $user): ?Theme
    {
        $theme = $this->repository->findById($id);
        
        if ($theme === null) {
            return null;
        }

        // Vérifier les permissions selon le rôle
        $role = $user['role'] ?? 'student';
        $userId = (int) ($user['id'] ?? 0);
        $schoolId = (int) ($user['school_id'] ?? 0);

        // Vérifier que le thème appartient au même établissement
        if ($theme->schoolId !== $schoolId) {
            return null;
        }

        // Vérifier les permissions selon le statut
        if ($role === 'student' && $theme->status !== 'published') {
            return null; // Les étudiants ne voient que les thèmes publiés
        }

        // Charger les questions
        $dbQuestions = $this->repository->findQuestionsByThemeId($id);
        $theme->questions = Theme::convertQuestionsFromDb($dbQuestions);

        return $theme;
    }

    /**
     * Crée un nouveau thème avec ses questions
     * 
     * @param array $data - Données du thème (format API)
     * @param array $user - Utilisateur authentifié
     * @return Theme
     */
    public function createTheme(array $data, array $user): Theme
    {
        $theme = new Theme(
            null,
            (int) ($user['school_id'] ?? 0),
            (int) ($user['id'] ?? 0),
            $data['title'] ?? '',
            $data['description'] ?? null,
            $data['subject'] ?? null,
            $data['type'] ?? 'quiz',
            $data['status'] ?? 'draft',
            $data['source'] ?? 'manual',
            $data['source_file_name'] ?? null
        );

        // Ajouter les tags si présents
        if (isset($data['tags']) && is_array($data['tags'])) {
            $theme->tags = $data['tags'];
        }

        // Validation
        $errors = $theme->validate(true);
        if (!empty($errors)) {
            throw new \InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        // Créer le thème
        $createdTheme = $this->repository->create($theme);

        // Sauvegarder les questions si présentes
        if (isset($data['questions']) && is_array($data['questions'])) {
            $dbQuestions = Theme::convertQuestionsToDb($data['questions']);
            $this->repository->saveQuestions($createdTheme->id, $dbQuestions);
            
            // Recharger les questions
            $dbQuestions = $this->repository->findQuestionsByThemeId($createdTheme->id);
            $createdTheme->questions = Theme::convertQuestionsFromDb($dbQuestions);
        }

        // Sauvegarder la révision si présente (pour l'instant on ne la stocke pas en DB, mais on la garde en mémoire)
        if (isset($data['revision'])) {
            $createdTheme->revision = $data['revision'];
        }

        return $createdTheme;
    }

    /**
     * Met à jour un thème existant
     * 
     * @param int $id - ID du thème
     * @param array $data - Nouvelles données
     * @param array $user - Utilisateur authentifié
     * @return Theme|null
     */
    public function updateTheme(int $id, array $data, array $user): ?Theme
    {
        // Vérifier que le thème existe
        $existing = $this->repository->findById($id);
        if ($existing === null) {
            return null;
        }

        // Vérifier les permissions
        $userId = (int) ($user['id'] ?? 0);
        $schoolId = (int) ($user['school_id'] ?? 0);
        $role = $user['role'] ?? 'student';

        // Vérifier que le thème appartient au même établissement
        if ($existing->schoolId !== $schoolId) {
            return null;
        }

        // Vérifier que l'utilisateur peut modifier (teacher/pedago ou créateur)
        if (!in_array($role, ['teacher', 'pedago'], true) && $existing->createdBy !== $userId) {
            return null;
        }

        // Mettre à jour les champs
        if (isset($data['title'])) {
            $existing->title = $data['title'];
        }
        if (isset($data['description'])) {
            $existing->description = $data['description'];
        }
        if (isset($data['subject'])) {
            $existing->subject = $data['subject'];
        }
        if (isset($data['type'])) {
            $existing->type = $data['type'];
        }
        if (isset($data['status'])) {
            $existing->status = $data['status'];
        }
        if (isset($data['source'])) {
            $existing->source = $data['source'];
        }
        if (isset($data['source_file_name'])) {
            $existing->sourceFileName = $data['source_file_name'];
        }
        if (isset($data['tags']) && is_array($data['tags'])) {
            $existing->tags = $data['tags'];
        }

        // Validation
        $errors = $existing->validate();
        if (!empty($errors)) {
            throw new \InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        // Mettre à jour le thème
        $updatedTheme = $this->repository->update($existing);

        // Mettre à jour les questions si présentes
        if (isset($data['questions']) && is_array($data['questions'])) {
            $dbQuestions = Theme::convertQuestionsToDb($data['questions']);
            $this->repository->saveQuestions($id, $dbQuestions);
            
            // Recharger les questions
            $dbQuestions = $this->repository->findQuestionsByThemeId($id);
            $updatedTheme->questions = Theme::convertQuestionsFromDb($dbQuestions);
        }

        // Mettre à jour la révision si présente
        if (isset($data['revision'])) {
            $updatedTheme->revision = $data['revision'];
        }

        return $updatedTheme;
    }

    /**
     * Supprime un thème
     * 
     * @param int $id - ID du thème
     * @param array $user - Utilisateur authentifié
     * @return bool
     */
    public function deleteTheme(int $id, array $user): bool
    {
        // Vérifier que le thème existe
        $existing = $this->repository->findById($id);
        if ($existing === null) {
            return false;
        }

        // Vérifier les permissions
        $userId = (int) ($user['id'] ?? 0);
        $schoolId = (int) ($user['school_id'] ?? 0);
        $role = $user['role'] ?? 'student';

        // Vérifier que le thème appartient au même établissement
        if ($existing->schoolId !== $schoolId) {
            return false;
        }

        // Vérifier que l'utilisateur peut supprimer (teacher/pedago ou créateur)
        if (!in_array($role, ['teacher', 'pedago'], true) && $existing->createdBy !== $userId) {
            return false;
        }

        return $this->repository->delete($id);
    }

    /**
     * Génère un thème via IA (mock)
     * 
     * @param array $data - Paramètres de génération
     * @param array $user - Utilisateur authentifié
     * @return Theme
     */
    public function generateTheme(array $data, array $user): Theme
    {
        // Mock de génération IA
        // En production, on appellerait un service IA réel
        
        $title = $data['title'] ?? 'Thème généré par IA';
        $description = $data['description'] ?? 'Description générée automatiquement';
        $subject = $data['subject'] ?? 'Maths';
        
        // Générer des questions mockées
        $questions = [
            [
                'id' => 'q001',
                'type' => 'mcq',
                'prompt' => $title . ' - Question 1',
                'choices' => [
                    ['id' => 'a', 'label' => 'Option A'],
                    ['id' => 'b', 'label' => 'Option B'],
                    ['id' => 'c', 'label' => 'Option C'],
                    ['id' => 'd', 'label' => 'Option D']
                ],
                'answer' => 'a',
                'rationale' => 'Explication générée par IA',
                'tags' => ['concept']
            ],
            [
                'id' => 'q002',
                'type' => 'true_false',
                'prompt' => $title . ' - Affirmation',
                'answer' => true,
                'rationale' => 'Explication générée par IA',
                'tags' => ['fait']
            ]
        ];

        // Générer une révision mockée
        $revision = [
            'sections' => [
                [
                    'id' => 'section_001',
                    'title' => 'Résumé',
                    'order' => 1,
                    'cards' => [
                        [
                            'id' => 'rev_summary_001',
                            'type' => 'summary',
                            'title' => 'Points clés',
                            'content' => 'Contenu généré par IA',
                            'items' => [['title' => 'Item', 'content' => 'Description']],
                            'keyPoints' => ['Point 1', 'Point 2'],
                            'tags' => ['synthèse'],
                            'relatedQuestions' => ['q001']
                        ]
                    ]
                ]
            ]
        ];

        // Créer le thème
        $themeData = [
            'title' => $title,
            'description' => $description,
            'subject' => $subject,
            'type' => 'quiz',
            'status' => 'draft',
            'source' => 'ai_studio',
            'tags' => $data['tags'] ?? [],
            'questions' => $questions,
            'revision' => $revision
        ];

        return $this->createTheme($themeData, $user);
    }

    /**
     * Importe un thème depuis un PDF (mock)
     * 
     * @param array $data - Données d'import (nom de fichier, etc.)
     * @param array $user - Utilisateur authentifié
     * @return Theme
     */
    public function importThemeFromPdf(array $data, array $user): Theme
    {
        // Mock d'import PDF
        // En production, on parserait le PDF réellement
        
        $fileName = $data['file_name'] ?? 'imported.pdf';
        $title = $data['title'] ?? 'Thème importé depuis PDF';
        $description = $data['description'] ?? 'Thème importé depuis ' . $fileName;

        $themeData = [
            'title' => $title,
            'description' => $description,
            'subject' => $data['subject'] ?? 'Maths',
            'type' => 'quiz',
            'status' => 'draft',
            'source' => 'pdf_import',
            'source_file_name' => $fileName,
            'tags' => $data['tags'] ?? ['import'],
            'questions' => [] // Sera rempli par le parser PDF en production
        ];

        return $this->createTheme($themeData, $user);
    }

    /**
     * Crée une review pour un thème
     * 
     * @param int $themeId - ID du thème
     * @param int $reviewerId - ID du reviewer
     * @param string $action - Action (submitted, approved, rejected, needs_changes)
     * @param string|null $comment - Commentaire optionnel
     * @return array - La review créée
     */
    public function createReview(int $themeId, int $reviewerId, string $action, ?string $comment = null): array
    {
        $review = $this->reviewRepository->create($themeId, $reviewerId, $action, $comment);
        
        // Formater la date en ISO 8601
        if (isset($review['created_at'])) {
            $date = new \DateTime($review['created_at']);
            $review['created_at'] = $date->format('c');
        }

        return $review;
    }

    /**
     * Récupère toutes les reviews d'un thème
     * 
     * @param int $themeId - ID du thème
     * @return array
     */
    public function getReviewsByThemeId(int $themeId): array
    {
        return $this->reviewRepository->findByThemeId($themeId);
    }
}

