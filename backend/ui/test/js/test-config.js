/**
 * Configuration des features et endpoints pour SMSO Tester
 * Extrait et unifié depuis testendpoint.html et smsotester.html
 */

export const TEST_CONFIG = {
    API_BASE_URL_DEFAULT: '/SMSO/backend/public/api',
    AUTH_SESSION_KEY: 'smso_auth_session',
    TOKEN_TRANSPORT_DEFAULT: 'query' // 'query' ou 'header'
};

/**
 * Configuration complète des features avec leurs endpoints
 * Structure modulaire : ajoutez simplement une nouvelle feature ici pour l'exposer automatiquement
 */
export const TEST_FEATURES = [
    {
        id: 'stats',
        label: 'Stats',
        icon: '📊',
        endpoints: [
            {
                id: 'stats-overview',
                label: 'Dashboard global',
                method: 'GET',
                path: '/stats/overview',
                body: '',
                description: 'Vue exécutive des indicateurs pour un établissement.',
                requiresAuth: true
            },
            {
                id: 'stats-schools',
                label: 'Analytics multi-écoles',
                method: 'GET',
                path: '/stats/schools',
                body: '',
                description: 'Retourne les indicateurs clés agrégés par établissement pour les dashboards direction. Rôles: director, pedago uniquement.',
                requiresAuth: true
            }
        ]
    },
    {
        id: 'assignments',
        label: 'Assignments',
        icon: '📋',
        endpoints: [
            {
                id: 'assignments-list',
                label: 'Liste des assignments (Admin)',
                method: 'GET',
                path: '/assignments',
                body: '',
                description: 'Liste tous les assignments visibles pour l\'utilisateur courant (filtrage par rôle).',
                requiresAuth: true
            },
            {
                id: 'assignments-sync',
                label: '🚨 Simuler ErgoMate Sync',
                method: 'GET',
                path: '/assignments/sync',
                body: '',
                description: 'Simule la synchronisation pour l\'app ErgoMate. Retourne uniquement les assignments publiés (status="published") pour les classes de l\'étudiant.',
                requiresAuth: true,
                note: '⚠️ Simule la vue Student App. Ne montre que les assignments publiés dans le format JSON spécifique.'
            },
            {
                id: 'assignments-get',
                label: 'Récupérer un assignment',
                method: 'GET',
                path: '/assignments/1',
                body: '',
                description: 'Récupère un assignment par ID.',
                requiresAuth: true
            },
            {
                id: 'assignments-create',
                label: 'Créer un assignment',
                method: 'POST',
                path: '/assignments',
                body: JSON.stringify({
                    class_id: 1,
                    title: 'Math Homework 1',
                    description: 'Exercises 1 to 10 from chapter 3. Show all your work.',
                    subject: 'Mathematics',
                    due_date: '2025-11-25T23:59:59Z',
                    available_at: '2025-11-20T08:00:00Z',
                    status: 'draft'
                }, null, 2),
                description: 'Création d\'un nouvel assignment avec tous les champs (title, description, subject, due_date, available_at, status). Rôles: teacher/pedago.',
                requiresAuth: true
            },
            {
                id: 'assignments-publish',
                label: 'Publier un assignment',
                method: 'PUT',
                path: '/assignments/1',
                body: JSON.stringify({
                    status: 'published'
                }, null, 2),
                description: 'Change le statut d\'un assignment de "draft" à "published" pour qu\'il apparaisse dans la sync ErgoMate.',
                requiresAuth: true
            },
            {
                id: 'assignments-update',
                label: 'Mettre à jour un assignment',
                method: 'PUT',
                path: '/assignments/1',
                body: JSON.stringify({
                    title: 'Math Homework 1 - Updated',
                    description: 'Exercises 1 to 15 from chapter 3 and 4.',
                    due_date: '2025-11-30T23:59:59Z',
                    available_at: '2025-11-25T08:00:00Z'
                }, null, 2),
                description: 'Mise à jour d\'un assignment existant (teacher/pedago).',
                requiresAuth: true
            },
            {
                id: 'assignments-delete',
                label: 'Supprimer un assignment',
                method: 'DELETE',
                path: '/assignments/1',
                body: '',
                description: 'Suppression d\'un assignment (teacher/pedago).',
                requiresAuth: true
            }
        ]
    },
    {
        id: 'curriculum',
        label: 'Curriculum',
        icon: '📚',
        endpoints: [
            {
                id: 'curriculum-overview',
                label: 'Vue globale du curriculum',
                method: 'GET',
                path: '/curriculum',
                body: '',
                description: 'Récupère le curriculum complet avec toutes les matières et leurs chapitres.',
                requiresAuth: true
            },
            {
                id: 'curriculum-subjects',
                label: 'Liste des matières',
                method: 'GET',
                path: '/curriculum/subjects',
                body: '',
                description: 'Liste toutes les matières du curriculum avec un résumé (nombre de chapitres, progression moyenne).',
                requiresAuth: true
            },
            {
                id: 'curriculum-subject-by-id',
                label: 'Récupérer une matière',
                method: 'GET',
                path: '/curriculum/subjects/math-term',
                body: '',
                description: 'Récupère une matière spécifique avec tous ses chapitres. Exemple: math-term, philo-term.',
                requiresAuth: true
            },
            {
                id: 'curriculum-chapter-by-id',
                label: 'Récupérer un chapitre',
                method: 'GET',
                path: '/curriculum/subjects/math-term/chapters/ch1',
                body: '',
                description: 'Récupère un chapitre spécifique d\'une matière. Exemple: math-term/ch1, philo-term/ch2.',
                requiresAuth: true
            },
            {
                id: 'curriculum-update-chapter',
                label: 'Mettre à jour la progression',
                method: 'PUT',
                path: '/curriculum/subjects/math-term/chapters/ch1',
                body: JSON.stringify({
                    progress: 90
                }, null, 2),
                description: 'Met à jour la progression d\'un chapitre (0-100). Réservé aux rôles teacher, pedago, director.',
                requiresAuth: true
            }
        ]
    },
    {
        id: 'aiThemes',
        label: 'AI Themes',
        icon: '🤖',
        endpoints: [
            {
                id: 'ai-themes-generate',
                label: 'Générer un thème IA',
                method: 'POST',
                path: '/ai/themes/generate',
                body: JSON.stringify({
                    title: 'Math appliqués - Suites numériques',
                    description: 'Introduction aux suites arithmétiques et géométriques.',
                    classes: [{ id: 'terminale_2_spe_math', label: 'Terminale 2 – spé Maths' }],
                    contentTypes: {
                        quiz: true,
                        flashcards: true,
                        revision_sheet: true
                    }
                }, null, 2),
                description: 'Génère un thème IA avec quiz, flashcards et fiche de révision.',
                requiresAuth: true
            }
        ]
    },
    {
        id: 'social',
        label: 'Social Stats',
        icon: '👥',
        endpoints: [
            {
                id: 'social-stats-list',
                label: 'Liste des stats sociales',
                method: 'GET',
                path: '/social/stats',
                body: '',
                description: 'Récupère les stats sociales de l\'établissement.',
                requiresAuth: true
            },
            {
                id: 'social-stats-get',
                label: 'Récupérer une stat sociale',
                method: 'GET',
                path: '/social/stats/1',
                body: '',
                description: 'Récupère une stat sociale par ID.',
                requiresAuth: true
            },
            {
                id: 'social-stats-create',
                label: 'Créer/Mettre à jour une stat sociale',
                method: 'POST',
                path: '/social/stats',
                body: JSON.stringify({
                    class_id: 1,
                    metric_date: '2025-10-23',
                    collaboration_score: 85.5,
                    participation_rate: 92.0,
                    engagement_level: 'high',
                    notes: 'Très bonne dynamique de groupe cette semaine'
                }, null, 2),
                description: 'Crée ou met à jour une stat sociale pour une classe (teacher/pedago).',
                requiresAuth: true
            },
            {
                id: 'social-stats-update',
                label: 'Mettre à jour une stat sociale',
                method: 'PUT',
                path: '/social/stats/1',
                body: JSON.stringify({
                    collaboration_score: 88.0,
                    participation_rate: 95.0,
                    engagement_level: 'high'
                }, null, 2),
                description: 'Met à jour une stat sociale existante (teacher/pedago).',
                requiresAuth: true
            },
            {
                id: 'social-stats-delete',
                label: 'Supprimer une stat sociale',
                method: 'DELETE',
                path: '/social/stats/1',
                body: '',
                description: 'Supprime une stat sociale (teacher/pedago).',
                requiresAuth: true
            }
        ]
    },
    {
        id: 'socialFriends',
        label: 'Social – Friend Code & Friends',
        icon: '👫',
        endpoints: [
            {
                id: 'social-friend-code-generate',
                label: 'Générer / Régénérer friend code',
                method: 'POST',
                path: '/social/friend-code',
                body: JSON.stringify({
                    regenerate: false
                }, null, 2),
                description: 'Génère ou régénère le "code ami" de l\'utilisateur courant. Rôle: student.',
                requiresAuth: true
            },
            {
                id: 'social-friend-code-get',
                label: 'Récupérer le friend code actuel',
                method: 'GET',
                path: '/social/friend-code',
                body: '',
                description: 'Récupère le code ami actuel de l\'utilisateur courant. Si aucun code n\'existe, en génère un automatiquement. Rôle: student.',
                requiresAuth: true
            },
            {
                id: 'social-friends-add',
                label: 'Ajouter un ami par code',
                method: 'POST',
                path: '/social/friends',
                body: JSON.stringify({
                    social_code: 'AAAA-1111-BBBB'
                }, null, 2),
                description: 'Ajoute un ami à partir de son friend code. Rôle: student. Erreurs possibles: code introuvable (404), auto-ajout (400), déjà ami (409).',
                requiresAuth: true
            },
            {
                id: 'social-friends-list',
                label: 'Liste des amis',
                method: 'GET',
                path: '/social/friends',
                body: '',
                description: 'Liste les amis de l\'utilisateur courant (pour les leaderboards / écrans Social). Rôle: student.',
                requiresAuth: true
            },
            {
                id: 'social-friends-remove',
                label: 'Retirer un ami',
                method: 'DELETE',
                path: '/social/friends/1',
                body: '',
                description: 'Retire un ami de sa liste. Rôle: student. Vérifie que la relation appartient à l\'utilisateur courant.',
                requiresAuth: true
            }
        ]
    },
    {
        id: 'socialEntries',
        label: 'Social Entries',
        icon: '⚙️',
        endpoints: [
            {
                id: 'social-entries-list',
                label: 'Liste des entrées sociales',
                method: 'GET',
                path: '/social',
                body: '',
                description: 'Récupère toutes les entrées sociales visibles (configurations, règles, messages). Tous les rôles authentifiés peuvent lire.',
                requiresAuth: true
            },
            {
                id: 'social-entries-get',
                label: 'Récupérer une entrée sociale',
                method: 'GET',
                path: '/social/1',
                body: '',
                description: 'Récupère une entrée sociale par ID.',
                requiresAuth: true
            },
            {
                id: 'social-entries-create',
                label: 'Créer une entrée sociale',
                method: 'POST',
                path: '/social',
                body: JSON.stringify({
                    type: 'rule',
                    title: 'Classement hebdomadaire activé',
                    description: 'Les scores de cette semaine comptent pour le classement social.',
                    payload: { ranking_period: 'week', enabled: true }
                }, null, 2),
                description: 'Crée une nouvelle entrée sociale (rule, message, config). Rôles: director, admin, pedago.',
                requiresAuth: true
            },
            {
                id: 'social-entries-update',
                label: 'Modifier une entrée sociale',
                method: 'PUT',
                path: '/social/1',
                body: JSON.stringify({
                    title: 'Classement hebdomadaire activé (modifié)',
                    description: 'Description mise à jour'
                }, null, 2),
                description: 'Met à jour une entrée sociale. RÉSERVÉ AU DIRECTEUR UNIQUEMENT.',
                requiresAuth: true
            },
            {
                id: 'social-entries-delete',
                label: 'Supprimer une entrée sociale',
                method: 'DELETE',
                path: '/social/1',
                body: '',
                description: 'Supprime une entrée sociale. RÉSERVÉ AU DIRECTEUR UNIQUEMENT.',
                requiresAuth: true
            }
        ]
    },
    {
        id: 'themes',
        label: 'Themes',
        icon: '📚',
        endpoints: [
            {
                id: 'themes-list',
                label: 'Liste des thèmes',
                method: 'GET',
                path: '/themes',
                body: '',
                description: 'Liste tous les thèmes selon le rôle de l\'utilisateur.',
                requiresAuth: true
            },
            {
                id: 'themes-get',
                label: 'Récupérer un thème',
                method: 'GET',
                path: '/themes/1',
                body: '',
                description: 'Récupère un thème par ID avec ses questions et révision.',
                requiresAuth: true
            },
            {
                id: 'themes-create',
                label: 'Créer un thème',
                method: 'POST',
                path: '/themes',
                body: JSON.stringify({
                    title: 'Titre du thème',
                    description: 'Description concise (1-2 phrases)',
                    tags: ['tag1', 'tag2', 'tag3'],
                    subject: 'Maths',
                    type: 'quiz',
                    status: 'draft',
                    source: 'manual',
                    questions: [
                        {
                            id: 'q001',
                            type: 'mcq',
                            prompt: 'Question ?',
                            choices: [
                                { id: 'a', label: 'Option A' },
                                { id: 'b', label: 'Option B' },
                                { id: 'c', label: 'Option C' },
                                { id: 'd', label: 'Option D' }
                            ],
                            answer: 'a',
                            rationale: 'Explication détaillée',
                            tags: ['concept']
                        }
                    ],
                    revision: {
                        sections: [
                            {
                                id: 'section_001',
                                title: 'Titre section',
                                order: 1,
                                cards: [
                                    {
                                        id: 'rev_summary_001',
                                        type: 'summary',
                                        title: 'Titre résumé',
                                        content: 'Contenu',
                                        items: [{ title: 'Item', content: 'Description' }],
                                        keyPoints: ['Point 1', 'Point 2'],
                                        tags: ['synthèse'],
                                        relatedQuestions: ['q001']
                                    }
                                ]
                            }
                        ]
                    }
                }, null, 2),
                description: 'Crée un nouveau thème manuel (teacher/pedago).',
                requiresAuth: true
            },
            {
                id: 'themes-update',
                label: 'Mettre à jour un thème',
                method: 'PUT',
                path: '/themes/1',
                body: JSON.stringify({
                    title: 'Titre modifié',
                    description: 'Description mise à jour',
                    tags: ['tag1', 'tag2'],
                    status: 'published'
                }, null, 2),
                description: 'Met à jour un thème existant (teacher/pedago).',
                requiresAuth: true
            },
            {
                id: 'themes-delete',
                label: 'Supprimer un thème',
                method: 'DELETE',
                path: '/themes/1',
                body: '',
                description: 'Supprime un thème (teacher/pedago).',
                requiresAuth: true
            },
            {
                id: 'themes-generate',
                label: 'Générer un thème IA',
                method: 'POST',
                path: '/themes/generate',
                body: JSON.stringify({
                    title: 'Math appliqués - Suites numériques',
                    description: 'Introduction aux suites arithmétiques et géométriques.',
                    subject: 'Maths',
                    tags: ['maths', 'suites', 'terminale']
                }, null, 2),
                description: 'Génère un thème via IA avec questions et révision (teacher/pedago).',
                requiresAuth: true
            },
            {
                id: 'themes-import',
                label: 'Importer un thème depuis PDF',
                method: 'POST',
                path: '/themes/import',
                body: JSON.stringify({
                    title: 'Thème importé depuis PDF',
                    description: 'Thème importé depuis un fichier PDF',
                    file_name: 'document.pdf',
                    subject: 'Maths',
                    tags: ['import', 'pdf']
                }, null, 2),
                description: 'Importe un thème depuis un PDF (mock, teacher/pedago).',
                requiresAuth: true
            },
            {
                id: 'themes-reviews-list',
                label: 'Liste des reviews d\'un thème',
                method: 'GET',
                path: '/themes/1/reviews',
                body: '',
                description: 'Récupère l\'historique des reviews (audit qualité) d\'un thème. Tous les rôles authentifiés peuvent consulter.',
                requiresAuth: true
            },
            {
                id: 'themes-reviews-create',
                label: 'Créer une review (audit qualité)',
                method: 'POST',
                path: '/themes/1/reviews',
                body: JSON.stringify({
                    action: 'approved',
                    comment: 'Cohérent avec le référentiel P2, RAS.'
                }, null, 2),
                description: 'Crée une review pour un thème. Actions possibles: submitted, approved, rejected, needs_changes. Rôles: teacher, pedago, director.',
                requiresAuth: true
            }
        ]
    },
    {
        id: 'classes',
        label: 'Classes',
        icon: '🏫',
        endpoints: [
            {
                id: 'classes-list',
                label: 'Liste des classes',
                method: 'GET',
                path: '/classes',
                body: '',
                description: 'Liste toutes les classes de l\'établissement de l\'utilisateur.',
                requiresAuth: true
            },
            {
                id: 'classes-get',
                label: 'Récupérer une classe',
                method: 'GET',
                path: '/classes/1',
                body: '',
                description: 'Récupère les informations d\'une classe par ID.',
                requiresAuth: true
            },
            {
                id: 'classes-students',
                label: 'Étudiants d\'une classe',
                method: 'GET',
                path: '/classes/1/students',
                body: '',
                description: 'Récupère la liste des étudiants d\'une classe.',
                requiresAuth: true
            },
            {
                id: 'students-get',
                label: 'Récupérer un étudiant',
                method: 'GET',
                path: '/students/10',
                body: '',
                description: 'Récupère les informations d\'un étudiant par ID.',
                requiresAuth: true
            }
        ]
    },
    {
        id: 'submissions',
        label: 'Submissions',
        icon: '📝',
        endpoints: [
            {
                id: 'submissions-create',
                label: 'Envoyer une soumission (ErgoMate)',
                method: 'POST',
                path: '/submissions',
                body: JSON.stringify({
                    assignment_id: 1,
                    student_id: 10,
                    score: 85.5,
                    duration: 300,
                    responses: {
                        question_1: { answer: 'a', time_spent: 30 },
                        question_2: { answer: true, time_spent: 20 }
                    }
                }, null, 2),
                description: 'Crée ou met à jour une soumission d\'un étudiant pour un assignment. Utilisé par l\'app ErgoMate. Si l\'utilisateur est un étudiant, student_id est automatiquement dérivé du token.',
                requiresAuth: true
            },
            {
                id: 'assignments-submissions',
                label: 'Gradebook - Voir les soumissions',
                method: 'GET',
                path: '/assignments/1/submissions',
                body: '',
                description: 'Récupère toutes les soumissions pour un assignment (vue gradebook pour les enseignants). Retourne tous les étudiants de la classe avec leur statut (submitted/pending), score, et détails.',
                requiresAuth: true
            }
        ]
    }
];

