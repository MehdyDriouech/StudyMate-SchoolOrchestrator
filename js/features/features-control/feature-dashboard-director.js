/**
 * Feature Dashboard Director - Logique du dashboard directeur
 */

import {
  getClasses,
  getTeachers,
  getThemesPublished,
  getActiveSchool,
  createSchool,
  createUser
} from './store-multischool.js';

// Données mockées par établissement (seront remplacées par les données du store)
let MOCK_CLASSES_COMPARISON = [
  {
    className: 'Terminale S1',
    completionRate: 82.3,
    sequencesLate: 1,
    avgGrade: 14.3,
    studentsCount: 28,
    teacher: 'Prof. Martin'
  },
  {
    className: 'Terminale L',
    completionRate: 71.5,
    sequencesLate: 3,
    avgGrade: 13.8,
    studentsCount: 25,
    teacher: 'Prof. Dubois'
  },
  {
    className: 'Première ES2',
    completionRate: 80.1,
    sequencesLate: 0,
    avgGrade: 14.1,
    studentsCount: 32,
    teacher: 'Prof. Bernard'
  },
  {
    className: 'Première S3',
    completionRate: 16.7,
    sequencesLate: 5,
    avgGrade: 11.2,
    studentsCount: 30,
    teacher: 'Prof. Petit'
  },
  {
    className: 'Seconde 4',
    completionRate: 71.4,
    sequencesLate: 2,
    avgGrade: 13.5,
    studentsCount: 28,
    teacher: 'Prof. Robert'
  },
  {
    className: 'Terminale ES',
    completionRate: 11.1,
    sequencesLate: 4,
    avgGrade: 12.8,
    studentsCount: 27,
    teacher: 'Prof. Durand'
  }
];

const MOCK_TEACHERS_PERFORMANCE = [
  {
    name: 'Prof. Martin',
    classesCount: 2,
    avgCompletionRate: 82.3,
    pendingValidations: 1,
    avgResponseTime: '2.3 jours'
  },
  {
    name: 'Prof. Dubois',
    classesCount: 1,
    avgCompletionRate: 71.5,
    pendingValidations: 3,
    avgResponseTime: '3.1 jours'
  },
  {
    name: 'Prof. Bernard',
    classesCount: 1,
    avgCompletionRate: 80.1,
    pendingValidations: 0,
    avgResponseTime: '1.8 jours'
  },
  {
    name: 'Prof. Petit',
    classesCount: 1,
    avgCompletionRate: 16.7,
    pendingValidations: 5,
    avgResponseTime: '4.5 jours'
  },
  {
    name: 'Prof. Robert',
    classesCount: 1,
    avgCompletionRate: 71.4,
    pendingValidations: 2,
    avgResponseTime: '2.7 jours'
  }
];

const MOCK_TIMELINE = [
  {
    date: '2024-11-16T10:30:00',
    type: 'school_added',
    message: 'Nouvel établissement ajouté : Lycée Jean Moulin'
  },
  {
    date: '2024-11-15T14:20:00',
    type: 'validation_pending',
    message: '4 contenus en attente de validation'
  },
  {
    date: '2024-11-14T09:15:00',
    type: 'teacher_joined',
    message: 'Nouvel enseignant : Prof. Moreau'
  },
  {
    date: '2024-11-13T16:45:00',
    type: 'school_added',
    message: 'Nouvel établissement ajouté : Collège Victor Hugo'
  }
];

// Les établissements et utilisateurs sont maintenant gérés par store-multischool.js

/**
 * Charge les données du dashboard directeur
 * @returns {Promise<object>}
 */
export async function loadDirectorDashboardData() {
  console.log('[Dashboard Director] Chargement des données');
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Récupérer les données de l'établissement actif
  const activeSchool = getActiveSchool();
  const classes = getClasses();
  const teachers = getTeachers();
  const themesPublished = getThemesPublished();
  
  // Générer les données de comparaison des classes à partir des classes réelles
  const classesComparison = classes.map(cls => ({
    className: cls.name,
    completionRate: Math.floor(Math.random() * 30) + 60, // Mock entre 60-90%
    sequencesLate: Math.floor(Math.random() * 5),
    avgGrade: Math.random() * 3 + 12, // Mock entre 12-15 (nombre, pas chaîne)
    studentsCount: cls.students,
    teacher: teachers.find(t => t.className === cls.name)?.name || 'Non assigné'
  }));
  
  // Générer les performances des enseignants
  const teachersPerformance = teachers.map(teacher => {
    const teacherClasses = classes.filter(c => c.name === teacher.className);
    return {
      name: teacher.name,
      classesCount: teacherClasses.length || 1,
      avgCompletionRate: Math.floor(Math.random() * 30) + 60,
      pendingValidations: Math.floor(Math.random() * 5),
      avgResponseTime: `${(Math.random() * 3 + 1.5).toFixed(1)} jours`
    };
  });
  
  // Timeline avec les thèmes publiés
  const timeline = themesPublished.slice(0, 4).map(theme => ({
    date: theme.publishedAt || new Date().toISOString(),
    type: 'theme_published',
    message: `Thème publié : ${theme.title}`
  }));
  
  // Ajouter des événements récents
  timeline.unshift({
    date: new Date().toISOString(),
    type: 'school_active',
    message: `Établissement actif : ${activeSchool?.name || 'Inconnu'}`
  });
  
  return {
    classesComparison,
    teachersPerformance,
    timeline: timeline.slice(0, 4),
    establishments: [activeSchool].filter(Boolean),
    users: teachers,
    stats: {
      totalClasses: classes.length,
      totalTeachers: teachers.length,
      avgCompletionRate: calculateAvgCompletionRate(classesComparison),
      pendingValidations: calculateTotalPendingValidations(teachersPerformance)
    }
  };
}

/**
 * Calcule le taux de complétion moyen
 */
function calculateAvgCompletionRate(classesComparison) {
  if (!classesComparison || classesComparison.length === 0) return '0';
  const total = classesComparison.reduce((acc, c) => acc + c.completionRate, 0);
  return (total / classesComparison.length).toFixed(1);
}

/**
 * Calcule le total des validations en attente
 */
function calculateTotalPendingValidations(teachersPerformance) {
  if (!teachersPerformance || teachersPerformance.length === 0) return 0;
  return teachersPerformance.reduce((acc, t) => acc + t.pendingValidations, 0);
}

/**
 * Ajoute un établissement (délégué au store)
 * @param {object} establishmentData - Données de l'établissement
 * @returns {object}
 */
export function addEstablishment(establishmentData) {
  console.log('[Dashboard Director] Ajout établissement:', establishmentData);
  const newSchool = createSchool(establishmentData);
  return {
    success: true,
    establishment: newSchool
  };
}

/**
 * Ajoute un utilisateur (délégué au store)
 * @param {object} userData - Données de l'utilisateur
 * @returns {object}
 */
export function addUser(userData) {
  console.log('[Dashboard Director] Ajout utilisateur:', userData);
  const newUser = createUser(userData);
  return {
    success: true,
    user: newUser
  };
}

/**
 * Retourne la couleur selon le taux de complétion
 * @param {number} rate - Taux de complétion
 * @returns {string}
 */
export function getCompletionColor(rate) {
  if (rate >= 75) return 'var(--accent)';
  if (rate >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

/**
 * Formate une date relative
 * @param {string} dateString - Date ISO
 * @returns {string}
 */
export function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}

export default {
  loadDirectorDashboardData,
  addEstablishment,
  addUser,
  getCompletionColor,
  formatRelativeDate
};