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

const MOCK_ASSIGNMENTS = [
  {
    id: 'assign-001',
    title: 'DM - Suites numériques',
    subject: 'Mathématiques',
    class: 'Terminale S1',
    dueDate: '2024-11-25',
    status: 'active',
    submittedCount: 18,
    totalStudents: 28,
    avgGrade: 12.5,
    createdAt: '2024-11-10'
  },
  {
    id: 'assign-002',
    title: 'Dissertation - La conscience',
    subject: 'Philosophie',
    class: 'Terminale L',
    dueDate: '2024-11-22',
    status: 'active',
    submittedCount: 22,
    totalStudents: 25,
    avgGrade: 14.2,
    createdAt: '2024-11-08'
  },
  {
    id: 'assign-003',
    title: 'Analyse de documents - Guerre Froide',
    subject: 'Histoire-Géographie',
    class: 'Première ES2',
    dueDate: '2024-11-20',
    status: 'active',
    submittedCount: 30,
    totalStudents: 32,
    avgGrade: 13.8,
    createdAt: '2024-11-05'
  },
  {
    id: 'assign-004',
    title: 'Problèmes - Probabilités',
    subject: 'Mathématiques',
    class: 'Première S3',
    dueDate: '2024-11-28',
    status: 'active',
    submittedCount: 5,
    totalStudents: 30,
    avgGrade: null,
    createdAt: '2024-11-12'
  },
  {
    id: 'assign-005',
    title: 'Étude de texte - Descartes',
    subject: 'Philosophie',
    class: 'Terminale L',
    dueDate: '2024-11-18',
    status: 'completed',
    submittedCount: 25,
    totalStudents: 25,
    avgGrade: 13.5,
    createdAt: '2024-11-01'
  },
  {
    id: 'assign-006',
    title: 'Carte mentale - Révolution française',
    subject: 'Histoire-Géographie',
    class: 'Seconde 4',
    dueDate: '2024-11-19',
    status: 'active',
    submittedCount: 20,
    totalStudents: 28,
    avgGrade: 14.1,
    createdAt: '2024-11-07'
  },
  {
    id: 'assign-007',
    title: 'Exercices - Dérivées',
    subject: 'Mathématiques',
    class: 'Première S1',
    dueDate: '2024-11-30',
    status: 'draft',
    submittedCount: 0,
    totalStudents: 29,
    avgGrade: null,
    createdAt: '2024-11-13'
  },
  {
    id: 'assign-008',
    title: 'Rédaction - Mythe et réalité',
    subject: 'Philosophie',
    class: 'Terminale ES',
    dueDate: '2024-12-05',
    status: 'active',
    submittedCount: 3,
    totalStudents: 27,
    avgGrade: null,
    createdAt: '2024-11-14'
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
    curriculum: MOCK_CURRICULUM
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
  
  // GET /assignments
  if (method === 'GET' && normalizedPath === '/assignments') {
    return { success: true, data: mockData.assignments };
  }
  
  // GET /curriculum
  if (method === 'GET' && normalizedPath === '/curriculum') {
    return { success: true, data: mockData.curriculum };
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
    return {
      success: true,
      data: {
        id: `assign-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString()
      },
      message: 'Devoir créé avec succès'
    };
  }

  // POST /api/ai/themes/generate
  if (method === 'POST' && normalizedPath === '/ai/themes/generate') {
    return {
      success: true,
      data: buildAiThemeResponse(body)
    };
  }
  
  // PUT /assignments/:id (mise à jour)
  if (method === 'PUT' && normalizedPath.match(/^\/assignments\/[^/]+$/)) {
    return {
      success: true,
      data: { ...body, updatedAt: new Date().toISOString() },
      message: 'Devoir mis à jour avec succès'
    };
  }
  
  // DELETE /assignments/:id
  if (method === 'DELETE' && normalizedPath.match(/^\/assignments\/[^/]+$/)) {
    return {
      success: true,
      message: 'Devoir supprimé avec succès'
    };
  }
  
  // Route non trouvée
  throw new Error(`Route non implémentée: ${method} ${normalizedPath}`);
}

function buildAiThemeResponse(payload = {}) {
  const clone = JSON.parse(JSON.stringify(MOCK_AI_THEME));

  const selectedClasses = Array.isArray(payload.classes) && payload.classes.length
    ? payload.classes
    : clone.classes;

  const contentTypes = {
    quiz: payload?.contentTypes?.quiz !== false,
    flashcards: payload?.contentTypes?.flashcards !== false,
    revision_sheet: payload?.contentTypes?.revision_sheet !== false
  };

  return {
    ...clone,
    id: payload?.title ? `theme_${Date.now()}` : clone.id,
    title: payload?.title?.trim() || clone.title,
    description: payload?.description?.trim() || clone.description,
    classes: selectedClasses,
    contentTypes,
    quiz: contentTypes.quiz ? clone.quiz : [],
    flashcards: contentTypes.flashcards ? clone.flashcards : [],
    revision_sheet: contentTypes.revision_sheet ? clone.revision_sheet : { blocks: [] },
    generatedAt: new Date().toISOString()
  };
}

export default { fakeRequest };
