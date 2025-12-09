/**
 * FakeRouter - Simulateur d'API pour le mode démo
 * Intercepte les appels API et retourne des données mockées
 */

import { getActiveSchoolId } from '../features/features-control/store-multischool.js';

// Données mockées pour le dashboard
const MOCK_STATS_OVERVIEW = {
  kpis: {
    totalStudents: 245,
    totalClasses: 8,
    activeAssignments: 23,
    completionRate: 78.5,
    averageGrade: 13.2
  },
  topSubjects: [
    { name: 'Mathématiques', assignmentsCount: 8, avgCompletion: 82.3 },
    { name: 'Philosophie', assignmentsCount: 7, avgCompletion: 71.5 },
    { name: 'Histoire-Géographie', assignmentsCount: 8, avgCompletion: 80.1 }
  ],
  recentActivity: [
    {
      type: 'assignment_completed',
      studentName: 'Emma L.',
      assignmentTitle: 'DM - Fonctions exponentielles',
      subject: 'Mathématiques',
      grade: 15,
      timestamp: '2024-11-15T14:30:00'
    },
    {
      type: 'assignment_submitted',
      studentName: 'Lucas M.',
      assignmentTitle: 'Dissertation - Le bonheur',
      subject: 'Philosophie',
      timestamp: '2024-11-15T11:20:00'
    },
    {
      type: 'assignment_created',
      teacherName: 'Vous',
      assignmentTitle: 'Analyse - La Seconde Guerre Mondiale',
      subject: 'Histoire-Géographie',
      timestamp: '2024-11-14T16:45:00'
    }
  ]
};

// Mock assignments avec le format complet (nouveau modèle)
const MOCK_ASSIGNMENTS = [
  {
    id: 1,
    class_id: 1, // Terminale 2 – Spé Maths
    title: 'DM - Suites numériques',
    description: 'Exercices sur les suites arithmétiques et géométriques. Faire les exercices 1 à 10 du chapitre 3.',
    subject: 'Mathématiques',
    due_date: '2024-11-25T23:59:59Z',
    available_at: '2024-11-20T08:00:00Z',
    status: 'published',
    created_at: '2024-11-10T09:00:00Z',
    updated_at: '2024-11-10T09:00:00Z'
  },
  {
    id: 2,
    class_id: 1, // Terminale 2 – Spé Maths
    title: 'Dissertation - La conscience',
    description: 'Rédiger une dissertation de 4 pages sur le thème de la conscience. Sujet: "La conscience est-elle le propre de l\'homme ?"',
    subject: 'Philosophie',
    due_date: '2024-11-22T23:59:59Z',
    available_at: '2024-11-15T08:00:00Z',
    status: 'published',
    created_at: '2024-11-08T09:00:00Z',
    updated_at: '2024-11-08T09:00:00Z'
  },
  {
    id: 3,
    class_id: 2, // Terminale 3 – Physique
    title: 'Analyse de documents - Guerre Froide',
    description: 'Analyser les documents fournis sur la Guerre Froide et répondre aux questions posées.',
    subject: 'Histoire-Géographie',
    due_date: '2024-11-20T23:59:59Z',
    available_at: null, // Pas de date de disponibilité
    status: 'published',
    created_at: '2024-11-05T09:00:00Z',
    updated_at: '2024-11-05T09:00:00Z'
  },
  {
    id: 4,
    class_id: 3, // 1ère ST2S
    title: 'Problèmes - Probabilités',
    description: 'Résoudre les problèmes de probabilités conditionnelles. Exercices 1 à 5 du manuel.',
    subject: 'Mathématiques',
    due_date: '2024-11-28T23:59:59Z',
    available_at: '2024-11-25T08:00:00Z',
    status: 'published',
    created_at: '2024-11-12T09:00:00Z',
    updated_at: '2024-11-12T09:00:00Z'
  },
  {
    id: 5,
    class_id: 1, // Terminale 2 – Spé Maths
    title: 'Étude de texte - Descartes',
    description: 'Lire et analyser le texte de Descartes sur le cogito. Questions à répondre: 1, 2, 3.',
    subject: 'Philosophie',
    due_date: '2024-11-18T23:59:59Z',
    available_at: '2024-11-10T08:00:00Z',
    status: 'archived', // Archivé (ne doit pas apparaître dans sync)
    created_at: '2024-11-01T09:00:00Z',
    updated_at: '2024-11-15T09:00:00Z'
  },
  {
    id: 6,
    class_id: 4, // 2nde Générale A
    title: 'Carte mentale - Révolution française',
    description: 'Créer une carte mentale sur la Révolution française avec les dates clés et les personnages importants.',
    subject: 'Histoire-Géographie',
    due_date: '2024-11-19T23:59:59Z',
    available_at: '2024-11-12T08:00:00Z',
    status: 'published',
    created_at: '2024-11-07T09:00:00Z',
    updated_at: '2024-11-07T09:00:00Z'
  },
  {
    id: 7,
    class_id: 1, // Terminale 2 – Spé Maths
    title: 'Exercices - Dérivées',
    description: 'Exercices sur les dérivées. À faire: exercices 1 à 8.',
    subject: 'Mathématiques',
    due_date: '2024-11-30T23:59:59Z',
    available_at: null,
    status: 'draft', // Brouillon (ne doit pas apparaître dans sync)
    created_at: '2024-11-13T09:00:00Z',
    updated_at: '2024-11-13T09:00:00Z'
  },
  {
    id: 8,
    class_id: 2, // Terminale 3 – Physique
    title: 'Rédaction - Mythe et réalité',
    description: 'Rédiger un texte argumentatif de 3 pages sur le thème "Mythe et réalité".',
    subject: 'Philosophie',
    due_date: '2024-12-05T23:59:59Z',
    available_at: '2024-11-28T08:00:00Z',
    status: 'published',
    created_at: '2024-11-14T09:00:00Z',
    updated_at: '2024-11-14T09:00:00Z'
  }
];

const MOCK_CURRICULUM = {
  subjects: [
    {
      id: 'math-term',
      name: 'Mathématiques Terminale',
      level: 'Terminale',
      chapters: [
        { id: 'ch1', title: 'Suites numériques', progress: 85 },
        { id: 'ch2', title: 'Fonctions exponentielles', progress: 60 },
        { id: 'ch3', title: 'Probabilités conditionnelles', progress: 30 }
      ]
    },
    {
      id: 'philo-term',
      name: 'Philosophie Terminale',
      level: 'Terminale',
      chapters: [
        { id: 'ch1', title: 'La conscience', progress: 100 },
        { id: 'ch2', title: 'Le bonheur', progress: 70 },
        { id: 'ch3', title: 'La vérité', progress: 40 }
      ]
    }
  ]
};

// Classes mockées
const MOCK_CLASSES = [
  {
    id: 1,
    name: 'Terminale 2 – Spé Maths',
    short_name: 'Tle2',
    level: 'Terminale',
    academic_year: '2024-2025',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  },
  {
    id: 2,
    name: 'Terminale 3 – Physique',
    short_name: 'Tle3',
    level: 'Terminale',
    academic_year: '2024-2025',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  },
  {
    id: 3,
    name: '1ère ST2S',
    short_name: '1ST2S',
    level: 'Première',
    academic_year: '2024-2025',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  },
  {
    id: 4,
    name: '2nde Générale A',
    short_name: '2ndeA',
    level: 'Seconde',
    academic_year: '2024-2025',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  }
];

// Étudiants mockés
const MOCK_STUDENTS = [
  {
    id: 10,
    name: 'Nathan Leroy',
    email: 'nathan@eleve.fr',
    social_uuid: 'uuid-nathan',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  },
  {
    id: 11,
    name: 'Sarah Benali',
    email: 'sarah@eleve.fr',
    social_uuid: 'uuid-sarah',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  },
  {
    id: 12,
    name: 'Julien Morel',
    email: 'julien@eleve.fr',
    social_uuid: 'uuid-julien',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  },
  {
    id: 13,
    name: 'Amina Karim',
    email: 'amina@eleve.fr',
    social_uuid: 'uuid-amina',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  },
  {
    id: 14,
    name: 'Hugo Lemoine',
    email: 'hugo@eleve.fr',
    social_uuid: 'uuid-hugo',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  },
  {
    id: 15,
    name: 'Lina Haddad',
    email: 'lina@eleve.fr',
    social_uuid: 'uuid-lina',
    school_id: 1,
    created_at: '2025-10-01T09:00:00'
  }
];

// Relation classes ↔ étudiants (class_id → [student_ids])
const MOCK_CLASS_STUDENTS = {
  1: [10, 11, 12, 13, 14, 15], // Tle2
  2: [10, 11], // Tle3
  3: [12, 13, 14], // 1ère ST2S
  4: [18, 19] // 2nde A
};

// Soumissions mockées (submissions)
// Format: { assignment_id: { student_id: { score, duration_seconds, raw_response, completed_at } } }
let MOCK_SUBMISSIONS = {
  1: { // Assignment ID 1
    10: {
      score: 85.5,
      duration_seconds: 450,
      raw_response: {
        question_1: { answer: 'a', time_spent: 30 },
        question_2: { answer: true, time_spent: 20 }
      },
      completed_at: '2024-11-20T10:30:00Z'
    },
    11: {
      score: 92.0,
      duration_seconds: 380,
      raw_response: {
        question_1: { answer: 'a', time_spent: 25 },
        question_2: { answer: false, time_spent: 15 }
      },
      completed_at: '2024-11-20T11:15:00Z'
    },
    12: {
      score: 78.5,
      duration_seconds: 520,
      raw_response: {
        question_1: { answer: 'b', time_spent: 40 },
        question_2: { answer: true, time_spent: 30 }
      },
      completed_at: '2024-11-21T09:00:00Z'
    }
    // Les étudiants 13, 14, 15 n'ont pas encore soumis (status: "pending")
  },
  2: { // Assignment ID 2
    10: {
      score: 88.0,
      duration_seconds: 600,
      raw_response: {
        essay: 'La conscience est le propre de l\'homme...',
        word_count: 850
      },
      completed_at: '2024-11-18T14:20:00Z'
    }
    // Les autres étudiants n'ont pas encore soumis
  },
  3: { // Assignment ID 3
    12: {
      score: 75.0,
      duration_seconds: 420,
      raw_response: {
        document_analysis: 'Les documents montrent que...',
        answers: ['A', 'B', 'C']
      },
      completed_at: '2024-11-19T16:45:00Z'
    }
  }
};

// Reviews de thèmes mockées (theme_reviews)
let MOCK_THEME_REVIEWS = [
  {
    id: 1,
    theme_id: 1,
    reviewer_id: 101,
    action: 'approved',
    comment: 'Cohérent avec le référentiel P2, RAS.',
    created_at: '2025-11-01T09:00:00Z'
  },
  {
    id: 2,
    theme_id: 1,
    reviewer_id: 102,
    action: 'submitted',
    comment: 'Soumis pour validation qualité.',
    created_at: '2025-10-28T14:30:00Z'
  },
  {
    id: 3,
    theme_id: 2,
    reviewer_id: 101,
    action: 'needs_changes',
    comment: 'Quelques ajustements nécessaires sur les questions 3 et 5.',
    created_at: '2025-11-05T10:15:00Z'
  }
];

// Profils sociaux mockés (social_profiles)
let MOCK_SOCIAL_PROFILES = [
  {
    id: 1,
    user_id: 10,
    school_id: 1,
    social_code: 'AAAA-1111-BBBB',
    created_at: '2025-11-20T09:00:00Z',
    revoked_at: null
  },
  {
    id: 2,
    user_id: 11,
    school_id: 1,
    social_code: 'CCCC-2222-DDDD',
    created_at: '2025-11-20T09:05:00Z',
    revoked_at: null
  },
  {
    id: 3,
    user_id: 12,
    school_id: 1,
    social_code: 'EEEE-3333-FFFF',
    created_at: '2025-11-20T09:10:00Z',
    revoked_at: null
  }
];

// Relations d'amitié mockées (social_friends)
let MOCK_SOCIAL_FRIENDS = [
  {
    id: 1,
    owner_user_id: 10,
    friend_user_id: 11,
    school_id: 1,
    created_at: '2025-11-20T10:00:00Z'
  },
  {
    id: 2,
    owner_user_id: 10,
    friend_user_id: 12,
    school_id: 1,
    created_at: '2025-11-20T10:05:00Z'
  }
];

// Entrées sociales mockées (social_entries)
let MOCK_SOCIAL_ENTRIES = [
  {
    id: 1,
    school_id: 1,
    type: 'rule',
    title: 'Classement hebdomadaire activé',
    description: 'Les scores de cette semaine comptent pour le classement social.',
    payload: { ranking_period: 'week', enabled: true },
    created_by: 101,
    created_at: '2025-11-01T09:00:00Z',
    updated_at: '2025-11-01T09:00:00Z'
  },
  {
    id: 2,
    school_id: null,
    type: 'message',
    title: 'Message de bienvenue',
    description: 'Bienvenue dans le système social de l\'établissement.',
    payload: { priority: 'normal', display_duration: 7 },
    created_by: 1,
    created_at: '2025-11-05T10:00:00Z',
    updated_at: '2025-11-05T10:00:00Z'
  },
  {
    id: 3,
    school_id: 1,
    type: 'config',
    title: 'Configuration Social',
    description: 'Paramètres globaux du système social.',
    payload: { leaderboard_enabled: true, notifications_enabled: true },
    created_by: 1,
    created_at: '2025-11-10T14:00:00Z',
    updated_at: '2025-11-10T14:00:00Z'
  }
];

// Thèmes mockés avec le nouveau format JSON
const MOCK_THEMES = [
  {
    id: 1,
    title: 'Suites numériques',
    description: 'Introduction aux suites arithmétiques et géométriques avec exercices progressifs.',
    tags: ['maths', 'suites', 'terminale'],
    subject: 'Maths',
    type: 'quiz',
    status: 'published',
    source: 'ai_studio',
    source_file_name: null,
    created_at: '2025-10-01T09:00:00',
    updated_at: '2025-10-01T09:00:00',
    questions: [
      {
        id: 'q001',
        type: 'mcq',
        prompt: 'Une suite arithmétique se définit par :',
        choices: [
          { id: 'a', label: 'Un terme initial et une raison' },
          { id: 'b', label: 'Un terme initial et un rapport' },
          { id: 'c', label: 'Une limite et une raison' },
          { id: 'd', label: 'Un rapport et une limite' }
        ],
        answer: 'a',
        rationale: 'Une suite arithmétique est définie par son premier terme u₀ et sa raison r. La relation de récurrence est uₙ₊₁ = uₙ + r.',
        tags: ['définition', 'suite arithmétique']
      },
      {
        id: 'q002',
        type: 'true_false',
        prompt: 'Toute suite géométrique est strictement croissante.',
        answer: false,
        rationale: 'Une suite géométrique peut être croissante, décroissante ou constante selon la valeur de sa raison q.',
        tags: ['suite géométrique', 'variation']
      }
    ],
    revision: {
      sections: [
        {
          id: 'section_001',
          title: 'Résumé',
          order: 1,
          cards: [
            {
              id: 'rev_summary_001',
              type: 'summary',
              title: 'Points clés',
              content: 'Les suites arithmétiques et géométriques sont des outils fondamentaux en mathématiques.',
              items: [
                { title: 'Suite arithmétique', content: 'uₙ₊₁ = uₙ + r' },
                { title: 'Suite géométrique', content: 'uₙ₊₁ = q × uₙ' }
              ],
              keyPoints: ['Définition', 'Formule explicite', 'Applications'],
              tags: ['synthèse'],
              relatedQuestions: ['q001']
            }
          ]
        }
      ]
    }
  },
  {
    id: 2,
    title: 'Fonctions dérivées',
    description: 'Rappels sur la dérivation, variations, tangentes et interprétation graphique.',
    tags: ['maths', 'dérivation', 'terminale'],
    subject: 'Maths',
    type: 'quiz',
    status: 'published',
    source: 'pdf_import',
    source_file_name: 'Derivees_Sujets_2024.pdf',
    created_at: '2025-10-05T09:00:00',
    updated_at: '2025-10-05T09:00:00',
    questions: [
      {
        id: 'q001',
        type: 'mcq',
        prompt: 'La dérivée de x² est :',
        choices: [
          { id: 'a', label: '2x' },
          { id: 'b', label: 'x' },
          { id: 'c', label: 'x³' },
          { id: 'd', label: '1' }
        ],
        answer: 'a',
        rationale: 'La dérivée de xⁿ est n×xⁿ⁻¹. Donc la dérivée de x² est 2×x¹ = 2x.',
        tags: ['dérivée', 'règle de base']
      }
    ],
    revision: null
  },
  {
    id: 3,
    title: 'Probabilités conditionnelles',
    description: 'Notions de conditionnement, arbres, exemples type Bac.',
    tags: ['maths', 'probabilités', 'terminale'],
    subject: 'Maths',
    type: 'quiz',
    status: 'approved',
    source: 'ai_studio',
    source_file_name: null,
    created_at: '2025-10-10T09:00:00',
    updated_at: '2025-10-10T09:00:00',
    questions: [],
    revision: null
  }
];

// Ancien format pour compatibilité (sera converti au nouveau format)
const MOCK_AI_THEME = {
  id: 'theme_math_terminale_2_suites',
  title: 'Math appliqués - Suites numériques (Terminale 2 spé maths)',
  description: 'Introduction aux suites arithmétiques et géométriques.',
  classes: [
    { id: 'terminale_2_spe_math', label: 'Terminale 2 – spé Maths' }
  ],
  quiz: [
    {
      id: 'q1',
      prompt: 'Une suite (uₙ) est dite arithmétique si :',
      choices: [
        'uₙ₊₁ = uₙ + r',
        'uₙ₊₁ = q × uₙ',
        'uₙ = n²',
        'uₙ = 1 / n'
      ],
      answer: 0
    },
    {
      id: 'q2',
      prompt: 'Pour une suite géométrique, la raison est notée :',
      choices: ['r', 'q', 'n', 'g'],
      answer: 1
    }
  ],
  flashcards: [
    {
      id: 'f1',
      front: 'Suite arithmétique',
      back: 'Suite telle que uₙ₊₁ = uₙ + r (r constant).'
    },
    {
      id: 'f2',
      front: 'Suite géométrique',
      back: 'Suite telle que uₙ₊₁ = q × uₙ (q constant).'
    }
  ],
  revision_sheet: {
    blocks: [
      { id: 'rev-title', type: 'title', text: 'Suites arithmétiques' },
      {
        id: 'rev-paragraph-1',
        type: 'paragraph',
        text: 'Une suite arithmétique est définie par uₙ₊₁ = uₙ + r. On retient uₙ = u₀ + n × r.'
      },
      {
        id: 'rev-paragraph-2',
        type: 'paragraph',
        text: 'Une suite géométrique est définie par uₙ₊₁ = q × uₙ. Formule explicite : uₙ = u₀ × qⁿ.'
      }
    ]
  },
  contentTypes: {
    quiz: true,
    flashcards: true,
    revision_sheet: true
  },
  status: 'demo'
};

/**
 * Simule une requête API avec délai réseau
 * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
 * @param {string} path - Chemin de l'endpoint
 * @param {any} body - Corps de la requête (pour POST/PUT)
 * @returns {Promise<any>}
 */
export async function fakeRequest(method, path, body = null) {
  console.log(`[FakeRouter] ${method} ${path}`, body || '');
  
  // Simuler un délai réseau (150-300ms)
  const delay = 150 + Math.random() * 150;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Router les requêtes
  try {
    const result = routeRequest(method, path, body);
    console.log(`[FakeRouter] ✅ Réponse:`, result);
    return result;
  } catch (error) {
    console.error(`[FakeRouter] ❌ Erreur:`, error);
    throw error;
  }
}

/**
 * Retourne les données mockées filtrées par établissement
 * @param {string} schoolId - ID de l'établissement
 * @returns {object}
 */
function getMockBySchoolId(schoolId) {
  // Pour l'instant, on retourne les mêmes données mockées
  // mais on pourrait avoir des données différentes par établissement
  return {
    stats: MOCK_STATS_OVERVIEW,
    assignments: MOCK_ASSIGNMENTS,
    curriculum: MOCK_CURRICULUM,
    themes: MOCK_THEMES,
    classes: MOCK_CLASSES,
    students: MOCK_STUDENTS,
    classStudents: MOCK_CLASS_STUDENTS
  };
}

/**
 * Route les requêtes vers les bonnes données mockées
 * @param {string} method - Méthode HTTP
 * @param {string} path - Chemin
 * @param {any} body - Corps
 * @returns {any}
 */
function routeRequest(method, path, body) {
  // Normaliser le path (enlever /api si présent)
  const normalizedPath = path.replace(/^\/api/, '');
  
  // Récupérer l'établissement actif
  const activeSchoolId = getActiveSchoolId();
  const mockData = getMockBySchoolId(activeSchoolId);
  
  // GET /stats/overview
  if (method === 'GET' && normalizedPath === '/stats/overview') {
    return { success: true, data: mockData.stats };
  }

  // GET /stats/schools
  if (method === 'GET' && normalizedPath === '/stats/schools') {
    const MOCK_SCHOOL_STATS = [
      {
        school_id: 1,
        school_name: 'Demo School A',
        avg_score: 14.5,
        completion_rate: 0.8,
        active_students: 100,
        classes_count: 5
      },
      {
        school_id: 2,
        school_name: 'Demo School B',
        avg_score: 12.9,
        completion_rate: 0.7,
        active_students: 80,
        classes_count: 4
      }
    ];
    return { success: true, data: MOCK_SCHOOL_STATS };
  }
  
  // GET /assignments/sync (doit être avant /assignments pour éviter les conflits)
  if (method === 'GET' && normalizedPath === '/assignments/sync') {
    // Simuler un étudiant (on peut utiliser le premier étudiant de la classe 1 par défaut)
    // En production, cela viendrait du token/context
    const simulatedStudentClassId = 1; // Classe de l'étudiant simulé
    
    // Filtrer: class_id correspond ET status = 'published'
    // Les drafts et archived ne doivent JAMAIS apparaître dans sync
    const syncedAssignments = mockData.assignments
      .filter(a => a.class_id === simulatedStudentClassId && a.status === 'published')
      .map(a => {
        // S'assurer que les dates sont au format ISO 8601 avec Z
        const formatDate = (dateStr) => {
          if (!dateStr) return null;
          // Si déjà au format avec Z, retourner tel quel
          if (dateStr.endsWith('Z')) return dateStr;
          // Sinon, ajouter Z si c'est déjà ISO, ou convertir
          if (dateStr.includes('T')) {
            return dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
          }
          // Convertir depuis un autre format si nécessaire
          return dateStr;
        };
        
        return {
          title: a.title,
          date: formatDate(a.due_date),
          matiere: a.subject,
          description: a.description,
          available_at: formatDate(a.available_at)
        };
      });
    
    return { success: true, data: syncedAssignments };
  }
  
  // GET /assignments
  if (method === 'GET' && normalizedPath === '/assignments') {
    return { success: true, data: mockData.assignments };
  }
  
  // GET /curriculum
  if (method === 'GET' && normalizedPath === '/curriculum') {
    return { success: true, data: mockData.curriculum };
  }

  // GET /curriculum/subjects
  if (method === 'GET' && normalizedPath === '/curriculum/subjects') {
    const subjects = mockData.curriculum.subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      level: subject.level,
      chapters_count: subject.chapters.length,
      average_progress: subject.chapters.reduce((sum, ch) => sum + ch.progress, 0) / subject.chapters.length
    }));
    return { success: true, data: { subjects } };
  }

  // GET /curriculum/subjects/:id
  if (method === 'GET' && normalizedPath.match(/^\/curriculum\/subjects\/[^/]+$/)) {
    const subjectId = normalizedPath.split('/')[3];
    const subject = mockData.curriculum.subjects.find(s => s.id === subjectId);
    if (subject) {
      return { success: true, data: subject };
    }
    throw new Error(`Subject ${subjectId} introuvable`);
  }

  // GET /curriculum/subjects/:subjectId/chapters/:chapterId
  if (method === 'GET' && normalizedPath.match(/^\/curriculum\/subjects\/[^/]+\/chapters\/[^/]+$/)) {
    const parts = normalizedPath.split('/');
    const subjectId = parts[3];
    const chapterId = parts[5];
    const subject = mockData.curriculum.subjects.find(s => s.id === subjectId);
    if (subject) {
      const chapter = subject.chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        return { success: true, data: chapter };
      }
      throw new Error(`Chapter ${chapterId} introuvable dans la matière ${subjectId}`);
    }
    throw new Error(`Subject ${subjectId} introuvable`);
  }

  // PUT /curriculum/subjects/:subjectId/chapters/:chapterId
  if (method === 'PUT' && normalizedPath.match(/^\/curriculum\/subjects\/[^/]+\/chapters\/[^/]+$/)) {
    const parts = normalizedPath.split('/');
    const subjectId = parts[3];
    const chapterId = parts[5];
    // Modifier directement MOCK_CURRICULUM pour que les changements persistent
    const subject = MOCK_CURRICULUM.subjects.find(s => s.id === subjectId);
    if (subject) {
      const chapter = subject.chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        if (!body || typeof body.progress !== 'number') {
          throw new Error('Le body doit contenir un champ "progress" (0-100)');
        }
        if (body.progress < 0 || body.progress > 100) {
          throw new Error('La progression doit être entre 0 et 100');
        }
        chapter.progress = body.progress;
        return {
          success: true,
          data: { ...chapter },
          message: 'Progression du chapitre mise à jour avec succès'
        };
      }
      throw new Error(`Chapter ${chapterId} introuvable dans la matière ${subjectId}`);
    }
    throw new Error(`Subject ${subjectId} introuvable`);
  }
  
  // GET /assignments/:id
  if (method === 'GET' && normalizedPath.match(/^\/assignments\/[^/]+$/)) {
    const id = normalizedPath.split('/')[2];
    const assignment = mockData.assignments.find(a => a.id === id);
    if (assignment) {
      return { success: true, data: assignment };
    }
    throw new Error(`Assignment ${id} introuvable`);
  }
  
  // POST /assignments (création)
  if (method === 'POST' && normalizedPath === '/assignments') {
    const newAssignment = {
      id: MOCK_ASSIGNMENTS.length + 1,
      class_id: body.class_id || 1,
      title: body.title || 'Nouveau devoir',
      description: body.description || '',
      subject: body.subject || 'Mathématiques',
      due_date: body.due_date || body.dueDate || new Date().toISOString(),
      available_at: body.available_at || body.availableAt || null,
      status: body.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Ajouter au mock (pour que les prochaines requêtes le voient)
    MOCK_ASSIGNMENTS.push(newAssignment);
    
    return {
      success: true,
      data: newAssignment,
      message: 'Devoir créé avec succès'
    };
  }

  // GET /themes
  if (method === 'GET' && normalizedPath === '/themes') {
    return { success: true, data: mockData.themes };
  }

  // GET /themes/:id/reviews (doit être avant /themes/:id pour éviter les conflits)
  if (method === 'GET' && normalizedPath.match(/^\/themes\/[^/]+\/reviews$/)) {
    const themeId = parseInt(normalizedPath.split('/')[2]);
    const reviews = MOCK_THEME_REVIEWS
      .filter(r => r.theme_id === themeId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { success: true, data: reviews };
  }

  // POST /themes/:id/reviews (doit être avant /themes/:id pour éviter les conflits)
  if (method === 'POST' && normalizedPath.match(/^\/themes\/[^/]+\/reviews$/)) {
    const themeId = parseInt(normalizedPath.split('/')[2]);
    
    // Vérifier que le thème existe
    const theme = mockData.themes.find(t => t.id === themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} introuvable`);
    }

    if (!body || !body.action) {
      throw new Error('Le body doit contenir un champ "action"');
    }

    const allowedActions = ['submitted', 'approved', 'rejected', 'needs_changes'];
    if (!allowedActions.includes(body.action)) {
      throw new Error(`Action invalide. Valeurs autorisées: ${allowedActions.join(', ')}`);
    }

    // Créer une nouvelle review
    const newReview = {
      id: MOCK_THEME_REVIEWS.length + 1,
      theme_id: themeId,
      reviewer_id: 101, // Simulé (en production, viendrait du token)
      action: body.action,
      comment: body.comment || null,
      created_at: new Date().toISOString()
    };

    MOCK_THEME_REVIEWS.push(newReview);

    return {
      success: true,
      data: newReview,
      message: 'Review créée avec succès'
    };
  }

  // GET /themes/:id
  if (method === 'GET' && normalizedPath.match(/^\/themes\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const theme = mockData.themes.find(t => t.id === id);
    if (theme) {
      return { success: true, data: theme };
    }
    throw new Error(`Theme ${id} introuvable`);
  }

  // POST /themes (création)
  if (method === 'POST' && normalizedPath === '/themes') {
    const newTheme = {
      id: mockData.themes.length + 1,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: body.status || 'draft',
      source: body.source || 'manual'
    };
    return {
      success: true,
      data: newTheme,
      message: 'Thème créé avec succès'
    };
  }

  // PUT /themes/:id (mise à jour)
  if (method === 'PUT' && normalizedPath.match(/^\/themes\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const theme = mockData.themes.find(t => t.id === id);
    if (theme) {
      const updatedTheme = {
        ...theme,
        ...body,
        updated_at: new Date().toISOString()
      };
      return {
        success: true,
        data: updatedTheme,
        message: 'Thème mis à jour avec succès'
      };
    }
    throw new Error(`Theme ${id} introuvable`);
  }

  // DELETE /themes/:id
  if (method === 'DELETE' && normalizedPath.match(/^\/themes\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const theme = mockData.themes.find(t => t.id === id);
    if (theme) {
      return {
        success: true,
        message: 'Thème supprimé avec succès'
      };
    }
    throw new Error(`Theme ${id} introuvable`);
  }

  // POST /themes/generate (génération IA)
  if (method === 'POST' && normalizedPath === '/themes/generate') {
    return {
      success: true,
      data: buildAiThemeResponse(body)
    };
  }

  // POST /themes/import (import PDF)
  if (method === 'POST' && normalizedPath === '/themes/import') {
    const importedTheme = {
      id: mockData.themes.length + 1,
      title: body.title || 'Thème importé depuis PDF',
      description: body.description || `Thème importé depuis ${body.file_name || 'fichier.pdf'}`,
      tags: body.tags || ['import'],
      subject: body.subject || 'Maths',
      type: 'quiz',
      status: 'draft',
      source: 'pdf_import',
      source_file_name: body.file_name || 'imported.pdf',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: [],
      revision: null
    };
    return {
      success: true,
      data: importedTheme,
      message: 'Thème importé avec succès'
    };
  }

  // POST /api/ai/themes/generate (redirection vers /themes/generate pour compatibilité)
  if (method === 'POST' && normalizedPath === '/ai/themes/generate') {
    return {
      success: true,
      data: buildAiThemeResponse(body)
    };
  }

  // GET /classes
  if (method === 'GET' && normalizedPath === '/classes') {
    return { success: true, data: mockData.classes };
  }

  // GET /classes/:id/students (doit être vérifié AVANT /classes/:id)
  if (method === 'GET' && normalizedPath.match(/^\/classes\/[^/]+\/students$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const studentIds = mockData.classStudents[id] || [];
    const students = mockData.students.filter(s => studentIds.includes(s.id));
    return { success: true, data: students };
  }

  // GET /classes/:id
  if (method === 'GET' && normalizedPath.match(/^\/classes\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const classItem = mockData.classes.find(c => c.id === id);
    if (classItem) {
      return { success: true, data: classItem };
    }
    throw new Error(`Classe ${id} introuvable`);
  }

  // GET /students/:id
  if (method === 'GET' && normalizedPath.match(/^\/students\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const student = mockData.students.find(s => s.id === id);
    if (student) {
      return { success: true, data: student };
    }
    throw new Error(`Étudiant ${id} introuvable`);
  }
  
  // PUT /assignments/:id (mise à jour)
  if (method === 'PUT' && normalizedPath.match(/^\/assignments\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const assignment = mockData.assignments.find(a => a.id === id);
    
    if (assignment) {
      // Mettre à jour l'assignment dans le mock
      Object.assign(assignment, {
        ...body,
        updated_at: new Date().toISOString()
      });
      
      return {
        success: true,
        data: assignment,
        message: 'Devoir mis à jour avec succès'
      };
    }
    
    throw new Error(`Assignment ${id} introuvable`);
  }
  
  // DELETE /assignments/:id
  if (method === 'DELETE' && normalizedPath.match(/^\/assignments\/[^/]+$/)) {
    return {
      success: true,
      message: 'Devoir supprimé avec succès'
    };
  }

  // GET /assignments/:id/submissions (Gradebook Teacher)
  if (method === 'GET' && normalizedPath.match(/^\/assignments\/[^/]+\/submissions$/)) {
    const assignmentId = parseInt(normalizedPath.split('/')[2]);
    const assignment = mockData.assignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} introuvable`);
    }

    // Récupérer les étudiants de la classe
    const classId = assignment.class_id;
    const studentIds = mockData.classStudents[classId] || [];
    const students = mockData.students.filter(s => studentIds.includes(s.id));

    // Récupérer les soumissions pour cet assignment
    const submissions = MOCK_SUBMISSIONS[assignmentId] || {};

    // Construire le résultat au format gradebook
    const result = students.map(student => {
      const submission = submissions[student.id];
      
      return {
        student_id: student.id,
        student_name: student.name,
        status: submission ? 'submitted' : 'pending',
        score: submission?.score ?? null,
        submitted_at: submission?.completed_at ?? null,
        details: submission?.raw_response ?? null
      };
    });

    return { success: true, data: result };
  }

  // POST /submissions (ErgoMate App - Student Submission)
  if (method === 'POST' && normalizedPath === '/submissions') {
    if (!body || !body.assignment_id || !body.student_id) {
      throw new Error('assignment_id et student_id sont requis');
    }

    const assignmentId = body.assignment_id;
    const studentId = body.student_id;

    // Initialiser la structure si nécessaire
    if (!MOCK_SUBMISSIONS[assignmentId]) {
      MOCK_SUBMISSIONS[assignmentId] = {};
    }

    // Créer ou mettre à jour la soumission
    MOCK_SUBMISSIONS[assignmentId][studentId] = {
      score: body.score ?? null,
      duration_seconds: body.duration ?? null,
      raw_response: body.responses ?? null,
      completed_at: new Date().toISOString()
    };

    return {
      success: true,
      data: {
        assignment_id: assignmentId,
        student_id: studentId,
        score: body.score,
        duration_seconds: body.duration,
        raw_response: body.responses,
        completed_at: MOCK_SUBMISSIONS[assignmentId][studentId].completed_at
      },
      message: 'Soumission enregistrée avec succès'
    };
  }

  // GET /social
  if (method === 'GET' && normalizedPath === '/social') {
    // Filtrer par school_id si nécessaire (simulation basique)
    const filtered = MOCK_SOCIAL_ENTRIES.filter(entry => 
      entry.school_id === null || entry.school_id === activeSchoolId
    );
    return { success: true, data: filtered };
  }

  // GET /social/:id
  if (method === 'GET' && normalizedPath.match(/^\/social\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const entry = MOCK_SOCIAL_ENTRIES.find(e => e.id === id);
    if (entry) {
      return { success: true, data: entry };
    }
    throw new Error(`Social entry ${id} introuvable`);
  }

  // POST /social
  if (method === 'POST' && normalizedPath === '/social') {
    if (!body || !body.title || !body.type) {
      throw new Error('title et type sont requis');
    }

    const allowedTypes = ['rule', 'message', 'config'];
    if (!allowedTypes.includes(body.type)) {
      throw new Error(`Type invalide. Valeurs autorisées: ${allowedTypes.join(', ')}`);
    }

    const newEntry = {
      id: MOCK_SOCIAL_ENTRIES.length + 1,
      school_id: body.school_id ?? activeSchoolId,
      type: body.type,
      title: body.title,
      description: body.description || null,
      payload: body.payload || null,
      created_by: 101, // Simulé (en production, viendrait du token)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    MOCK_SOCIAL_ENTRIES.push(newEntry);
    return {
      success: true,
      data: newEntry,
      message: 'Entrée sociale créée avec succès'
    };
  }

  // PUT /social/:id
  if (method === 'PUT' && normalizedPath.match(/^\/social\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const entry = MOCK_SOCIAL_ENTRIES.find(e => e.id === id);
    
    if (!entry) {
      throw new Error(`Social entry ${id} introuvable`);
    }

    // Simuler la vérification de rôle (director uniquement)
    // En production, cela viendrait du token
    const simulatedRole = 'director'; // Pour le mock, on simule un directeur
    if (simulatedRole !== 'director') {
      throw new Error('Forbidden: Only directors can update social entries');
    }

    // Mettre à jour les champs
    if (body.type) entry.type = body.type;
    if (body.title) entry.title = body.title;
    if (body.description !== undefined) entry.description = body.description;
    if (body.payload !== undefined) entry.payload = body.payload;
    entry.updated_at = new Date().toISOString();

    return {
      success: true,
      data: entry,
      message: 'Entrée sociale mise à jour avec succès'
    };
  }

  // DELETE /social/:id
  if (method === 'DELETE' && normalizedPath.match(/^\/social\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[2]);
    const entryIndex = MOCK_SOCIAL_ENTRIES.findIndex(e => e.id === id);
    
    if (entryIndex === -1) {
      throw new Error(`Social entry ${id} introuvable`);
    }

    // Simuler la vérification de rôle (director uniquement)
    const simulatedRole = 'director'; // Pour le mock, on simule un directeur
    if (simulatedRole !== 'director') {
      throw new Error('Forbidden: Only directors can delete social entries');
    }

    MOCK_SOCIAL_ENTRIES.splice(entryIndex, 1);
    return {
      success: true,
      message: 'Entrée sociale supprimée avec succès'
    };
  }

  // POST /social/friend-code (doit être avant /social/{id})
  if (method === 'POST' && normalizedPath === '/social/friend-code') {
    // Simuler un user_id depuis le token (pour le mock, on utilise user_id 10)
    const simulatedUserId = 10;
    const simulatedSchoolId = 1;
    const requestBody = body || {};
    const regenerate = requestBody.regenerate === true;

    // Trouver le profil actif existant
    let existingProfile = MOCK_SOCIAL_PROFILES.find(
      p => p.user_id === simulatedUserId && p.revoked_at === null
    );

    if (regenerate && existingProfile) {
      // Révoquer l'ancien profil
      existingProfile.revoked_at = new Date().toISOString();
    }

    // Générer un nouveau code
    const generateCode = () => {
      const part1 = Math.random().toString(36).slice(2, 6).toUpperCase();
      const part2 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const part3 = Math.random().toString(36).slice(2, 6).toUpperCase();
      return `${part1}-${part2}-${part3}`;
    };

    let newCode = generateCode();
    // S'assurer que le code est unique
    while (MOCK_SOCIAL_PROFILES.some(p => p.social_code === newCode)) {
      newCode = generateCode();
    }

    // Créer le nouveau profil
    const newProfile = {
      id: MOCK_SOCIAL_PROFILES.length + 1,
      user_id: simulatedUserId,
      school_id: simulatedSchoolId,
      social_code: newCode,
      created_at: new Date().toISOString(),
      revoked_at: null
    };

    MOCK_SOCIAL_PROFILES.push(newProfile);

    return {
      success: true,
      data: {
        user_id: newProfile.user_id,
        school_id: newProfile.school_id,
        social_code: newProfile.social_code,
        created_at: newProfile.created_at
      }
    };
  }

  // GET /social/friend-code (doit être avant /social/{id})
  if (method === 'GET' && normalizedPath === '/social/friend-code') {
    const simulatedUserId = 10;
    
    // Trouver le profil actif
    let profile = MOCK_SOCIAL_PROFILES.find(
      p => p.user_id === simulatedUserId && p.revoked_at === null
    );

    // Si aucun profil, en créer un automatiquement
    if (!profile) {
      const generateCode = () => {
        const part1 = Math.random().toString(36).slice(2, 6).toUpperCase();
        const part2 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const part3 = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `${part1}-${part2}-${part3}`;
      };

      let newCode = generateCode();
      while (MOCK_SOCIAL_PROFILES.some(p => p.social_code === newCode)) {
        newCode = generateCode();
      }

      profile = {
        id: MOCK_SOCIAL_PROFILES.length + 1,
        user_id: simulatedUserId,
        school_id: 1,
        social_code: newCode,
        created_at: new Date().toISOString(),
        revoked_at: null
      };

      MOCK_SOCIAL_PROFILES.push(profile);
    }

    return {
      success: true,
      data: {
        social_code: profile.social_code
      }
    };
  }

  // POST /social/friends (doit être avant /social/{id})
  if (method === 'POST' && normalizedPath === '/social/friends') {
    if (!body || !body.social_code) {
      throw new Error('social_code est requis');
    }

    const simulatedOwnerUserId = 10;
    const socialCode = body.social_code.trim();

    // Trouver le profil correspondant au code
    const profile = MOCK_SOCIAL_PROFILES.find(
      p => p.social_code === socialCode && p.revoked_at === null
    );

    if (!profile) {
      throw new Error('Code social introuvable');
    }

    const friendUserId = profile.user_id;

    // Vérifier qu'on ne s'ajoute pas soi-même
    if (simulatedOwnerUserId === friendUserId) {
      throw new Error('Vous ne pouvez pas vous ajouter vous-même comme ami');
    }

    // Vérifier si la relation existe déjà
    const existingFriendship = MOCK_SOCIAL_FRIENDS.find(
      f => f.owner_user_id === simulatedOwnerUserId && f.friend_user_id === friendUserId
    );

    if (existingFriendship) {
      throw new Error('Cet utilisateur est déjà dans votre liste d\'amis');
    }

    // Trouver le nom de l'ami
    const friend = MOCK_STUDENTS.find(s => s.id === friendUserId);
    const friendName = friend ? friend.name : 'Ami';

    // Créer la relation
    const newFriendship = {
      id: MOCK_SOCIAL_FRIENDS.length + 1,
      owner_user_id: simulatedOwnerUserId,
      friend_user_id: friendUserId,
      school_id: 1,
      created_at: new Date().toISOString()
    };

    MOCK_SOCIAL_FRIENDS.push(newFriendship);

    return {
      success: true,
      data: {
        id: newFriendship.id,
        owner_user_id: newFriendship.owner_user_id,
        friend_user_id: newFriendship.friend_user_id,
        created_at: newFriendship.created_at
      }
    };
  }

  // GET /social/friends (doit être avant /social/{id})
  if (method === 'GET' && normalizedPath === '/social/friends') {
    const simulatedOwnerUserId = 10;

    // Récupérer les amis de l'utilisateur
    const friendships = MOCK_SOCIAL_FRIENDS.filter(
      f => f.owner_user_id === simulatedOwnerUserId
    );

    // Enrichir avec les infos des utilisateurs
    const friends = friendships.map(f => {
      const friend = MOCK_STUDENTS.find(s => s.id === f.friend_user_id);
      return {
        id: f.id,
        friend_user_id: f.friend_user_id,
        friend_name: friend ? friend.name : 'Ami',
        school_id: f.school_id,
        created_at: f.created_at
      };
    });

    return {
      success: true,
      data: friends
    };
  }

  // DELETE /social/friends/:id (doit être avant /social/{id})
  if (method === 'DELETE' && normalizedPath.match(/^\/social\/friends\/[^/]+$/)) {
    const id = parseInt(normalizedPath.split('/')[3]);
    const simulatedOwnerUserId = 10;

    const friendshipIndex = MOCK_SOCIAL_FRIENDS.findIndex(
      f => f.id === id && f.owner_user_id === simulatedOwnerUserId
    );

    if (friendshipIndex === -1) {
      throw new Error('Relation d\'amitié introuvable');
    }

    MOCK_SOCIAL_FRIENDS.splice(friendshipIndex, 1);

    return {
      success: true
    };
  }
  
  // Route non trouvée
  throw new Error(`Route non implémentée: ${method} ${normalizedPath}`);
}

function buildAiThemeResponse(payload = {}) {
  // Convertir l'ancien format vers le nouveau format JSON
  const title = payload?.title?.trim() || 'Thème généré par IA';
  const description = payload?.description?.trim() || 'Description générée automatiquement';
  const subject = payload?.subject || 'Maths';
  const tags = payload?.tags || ['ia', 'généré'];

  // Générer des questions mockées
  const questions = [
    {
      id: 'q001',
      type: 'mcq',
      prompt: `${title} - Question 1`,
      choices: [
        { id: 'a', label: 'Option A' },
        { id: 'b', label: 'Option B' },
        { id: 'c', label: 'Option C' },
        { id: 'd', label: 'Option D' }
      ],
      answer: 'a',
      rationale: 'Explication générée par IA',
      tags: ['concept']
    },
    {
      id: 'q002',
      type: 'true_false',
      prompt: `${title} - Affirmation`,
      answer: true,
      rationale: 'Explication générée par IA',
      tags: ['fait']
    }
  ];

  // Générer une révision mockée
  const revision = {
    sections: [
      {
        id: 'section_001',
        title: 'Résumé',
        order: 1,
        cards: [
          {
            id: 'rev_summary_001',
            type: 'summary',
            title: 'Points clés',
            content: 'Contenu généré par IA',
            items: [
              { title: 'Item', content: 'Description' }
            ],
            keyPoints: ['Point 1', 'Point 2'],
            tags: ['synthèse'],
            relatedQuestions: ['q001']
          }
        ]
      }
    ]
  };

  return {
    id: Date.now(),
    title,
    description,
    tags,
    subject,
    type: 'quiz',
    status: 'draft',
    source: 'ai_studio',
    source_file_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions,
    revision
  };
}

export default { fakeRequest };
