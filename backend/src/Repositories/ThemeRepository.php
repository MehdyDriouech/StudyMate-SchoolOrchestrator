<?php
/**
 * Repository Theme - Accès aux données
 * Gère toutes les opérations CRUD sur la table themes et theme_questions
 */

namespace Repositories;

use Config\Database;
use Models\Theme;
use PDO;
use PDOException;

class ThemeRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère tous les thèmes
     */
    public function findAll(): array
    {
        try {
            $stmt = $this->db->query('SELECT * FROM themes ORDER BY created_at DESC');
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function ($row) {
                return Theme::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('ThemeRepository::findAll error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch themes', 0, $e);
        }
    }

    /**
     * Récupère un thème par son ID
     */
    public function findById(int $id): ?Theme
    {
        try {
            $stmt = $this->db->prepare('SELECT * FROM themes WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row === false) {
                return null;
            }

            return Theme::fromArray($row);
        } catch (PDOException $e) {
            error_log('ThemeRepository::findById error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch theme', 0, $e);
        }
    }

    /**
     * Récupère les thèmes pour un établissement
     */
    public function findBySchoolId(int $schoolId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM themes 
                WHERE school_id = :school_id 
                ORDER BY created_at DESC
            ');
            $stmt->execute(['school_id' => $schoolId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function ($row) {
                return Theme::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('ThemeRepository::findBySchoolId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch themes for school', 0, $e);
        }
    }

    /**
     * Récupère les thèmes créés par un utilisateur
     */
    public function findByCreatorId(int $creatorId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM themes 
                WHERE created_by = :created_by 
                ORDER BY created_at DESC
            ');
            $stmt->execute(['created_by' => $creatorId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function ($row) {
                return Theme::fromArray($row);
            }, $rows);
        } catch (PDOException $e) {
            error_log('ThemeRepository::findByCreatorId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch themes for creator', 0, $e);
        }
    }

    /**
     * Crée un nouveau thème
     */
    public function create(Theme $theme): Theme
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO themes (school_id, created_by, title, description, subject, type, status, source, source_file_name)
                VALUES (:school_id, :created_by, :title, :description, :subject, :type, :status, :source, :source_file_name)
            ');

            $stmt->execute([
                'school_id' => $theme->schoolId,
                'created_by' => $theme->createdBy,
                'title' => $theme->title,
                'description' => $theme->description,
                'subject' => $theme->subject,
                'type' => $theme->type,
                'status' => $theme->status,
                'source' => $theme->source,
                'source_file_name' => $theme->sourceFileName,
            ]);

            $theme->id = (int) $this->db->lastInsertId();

            // Récupérer le thème créé avec les valeurs par défaut (created_at, updated_at)
            return $this->findById($theme->id);
        } catch (PDOException $e) {
            error_log('ThemeRepository::create error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to create theme', 0, $e);
        }
    }

    /**
     * Met à jour un thème existant
     */
    public function update(Theme $theme): ?Theme
    {
        if ($theme->id === null) {
            throw new \InvalidArgumentException('Theme ID is required for update');
        }

        try {
            // Construire dynamiquement la requête UPDATE avec seulement les champs fournis
            $fields = [];
            $params = ['id' => $theme->id];

            if (!empty($theme->title)) {
                $fields[] = 'title = :title';
                $params['title'] = $theme->title;
            }

            if ($theme->description !== null) {
                $fields[] = 'description = :description';
                $params['description'] = $theme->description;
            }

            if ($theme->subject !== null) {
                $fields[] = 'subject = :subject';
                $params['subject'] = $theme->subject;
            }

            if (!empty($theme->type)) {
                $fields[] = 'type = :type';
                $params['type'] = $theme->type;
            }

            if (!empty($theme->status)) {
                $fields[] = 'status = :status';
                $params['status'] = $theme->status;
            }

            if (!empty($theme->source)) {
                $fields[] = 'source = :source';
                $params['source'] = $theme->source;
            }

            if ($theme->sourceFileName !== null) {
                $fields[] = 'source_file_name = :source_file_name';
                $params['source_file_name'] = $theme->sourceFileName;
            }

            if (empty($fields)) {
                // Aucun champ à mettre à jour
                return $this->findById($theme->id);
            }

            $sql = 'UPDATE themes SET ' . implode(', ', $fields) . ' WHERE id = :id';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $this->findById($theme->id);
        } catch (PDOException $e) {
            error_log('ThemeRepository::update error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to update theme', 0, $e);
        }
    }

    /**
     * Supprime un thème
     */
    public function delete(int $id): bool
    {
        try {
            // Supprimer d'abord les questions associées
            $stmt = $this->db->prepare('DELETE FROM theme_questions WHERE theme_id = :theme_id');
            $stmt->execute(['theme_id' => $id]);

            // Puis supprimer le thème
            $stmt = $this->db->prepare('DELETE FROM themes WHERE id = :id');
            $stmt->execute(['id' => $id]);
            
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('ThemeRepository::delete error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to delete theme', 0, $e);
        }
    }

    /**
     * Récupère les questions d'un thème
     */
    public function findQuestionsByThemeId(int $themeId): array
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM theme_questions 
                WHERE theme_id = :theme_id 
                ORDER BY order_index ASC, id ASC
            ');
            $stmt->execute(['theme_id' => $themeId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('ThemeRepository::findQuestionsByThemeId error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch questions for theme', 0, $e);
        }
    }

    /**
     * Sauvegarde les questions d'un thème
     * Supprime les anciennes questions et insère les nouvelles
     */
    public function saveQuestions(int $themeId, array $questions): void
    {
        try {
            $this->db->beginTransaction();

            // Supprimer les anciennes questions
            $stmt = $this->db->prepare('DELETE FROM theme_questions WHERE theme_id = :theme_id');
            $stmt->execute(['theme_id' => $themeId]);

            // Insérer les nouvelles questions
            if (!empty($questions)) {
                $stmt = $this->db->prepare('
                    INSERT INTO theme_questions (theme_id, question_type, prompt, data, order_index)
                    VALUES (:theme_id, :question_type, :prompt, :data, :order_index)
                ');

                foreach ($questions as $question) {
                    $stmt->execute([
                        'theme_id' => $themeId,
                        'question_type' => $question['question_type'],
                        'prompt' => $question['prompt'],
                        'data' => $question['data'],
                        'order_index' => $question['order_index'],
                    ]);
                }
            }

            $this->db->commit();
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log('ThemeRepository::saveQuestions error: ' . $e->getMessage());
            throw new \RuntimeException('Failed to save questions', 0, $e);
        }
    }
}

