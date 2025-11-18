/**
 * Feature Dashboard Student - Logique du dashboard étudiant
 */

import { getActiveSchool, getStudents } from './store-multischool.js';
import { getCurrentUser } from './feature-auth.js';

// Données mockées pour l'étudiant
const MOCK_STUDENT_ASSIGNMENTS = [
  {
    id: 'assign-001',
    title: 'DM - Suites numériques',
    subject: 'Mathématiques',
    dueDate: '2024-11-25',
    status: 'todo',
    priority: 'high'
  },
  {
    id: 'assign-002',
    title: 'Dissertation - La conscience',
    subject: 'Philosophie',
    dueDate: '2024-11-22',
    status: 'in_progress',
    priority: 'high'
  },
  {
    id: 'assign-003',
    title: 'Analyse - Guerre Froide',
    subject: 'Histoire-Géographie',
    dueDate: '2024-11-28',
    status: 'todo',
    priority: 'medium'
  },
  {
    id: 'assign-004',
    title: 'Exercices - Probabilités',
    subject: 'Mathématiques',
    dueDate: '2024-12-05',
    status: 'todo',
    priority: 'low'
  },
  {
    id: 'assign-005',
    title: 'Étude de texte - Descartes',
    subject: 'Philosophie',
    dueDate: '2024-11-18',
    status: 'completed',
    grade: 15,
    priority: 'medium'
  }
];

const MOCK_STUDENT_STATS = {
  assignmentsCompleted: 12,
  assignmentsTotal: 17,
  avgGrade: 14.2,
  classRanking: 'Top 20%',
  currentStreak: 5 // jours consécutifs de travail
};

/**
 * Charge les données du dashboard étudiant
 * @returns {Promise<object>}
 */
export async function loadStudentDashboardData() {
  console.log('[Dashboard Student] Chargement des données');
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Récupérer l'établissement de l'étudiant (défini par son login)
  const currentUser = getCurrentUser();
  const activeSchool = getActiveSchool();
  
  // Pour un étudiant, utiliser les données de son établissement
  // Les devoirs sont filtrés selon l'établissement actif
  const assignments = MOCK_STUDENT_ASSIGNMENTS.map(assignment => ({
    ...assignment,
    schoolId: activeSchool?.id || currentUser?.schoolId
  }));
  
  return {
    assignments,
    stats: MOCK_STUDENT_STATS,
    progressPercentage: calculateProgressPercentage(MOCK_STUDENT_STATS),
    school: activeSchool
  };
}

/**
 * Calcule le pourcentage de progression
 * @param {object} stats - Statistiques
 * @returns {number}
 */
function calculateProgressPercentage(stats) {
  return Math.round((stats.assignmentsCompleted / stats.assignmentsTotal) * 100);
}

/**
 * Génère un UUID social
 * @returns {string}
 */
export function generateSocialUUID() {
  // Utiliser crypto.randomUUID() si disponible
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback simple
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Sauvegarde l'UUID social dans localStorage
 * @param {string} uuid - UUID à sauvegarder
 */
export function saveSocialUUID(uuid) {
  localStorage.setItem('SM_SO_SOCIAL_UUID', uuid);
  console.log('[Dashboard Student] UUID social sauvegardé:', uuid);
}

/**
 * Récupère l'UUID social depuis localStorage
 * @returns {string|null}
 */
export function getSocialUUID() {
  return localStorage.getItem('SM_SO_SOCIAL_UUID');
}

/**
 * Retourne la couleur selon la priorité
 * @param {string} priority - Priorité (high, medium, low)
 * @returns {string}
 */
export function getPriorityColor(priority) {
  const colors = {
    'high': 'var(--danger)',
    'medium': 'var(--warning)',
    'low': 'var(--accent)'
  };
  return colors[priority] || 'var(--muted)';
}

/**
 * Retourne le libellé de statut
 * @param {string} status - Statut (todo, in_progress, completed)
 * @returns {string}
 */
export function getStatusLabel(status) {
  const labels = {
    'todo': 'À faire',
    'in_progress': 'En cours',
    'completed': 'Terminé'
  };
  return labels[status] || status;
}

/**
 * Formate une date d'échéance
 * @param {string} dateString - Date ISO
 * @returns {string}
 */
export function formatDueDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Échue';
  } else if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return 'Demain';
  } else if (diffDays <= 7) {
    return `Dans ${diffDays} jours`;
  } else {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  }
}

export default {
  loadStudentDashboardData,
  generateSocialUUID,
  saveSocialUUID,
  getSocialUUID,
  getPriorityColor,
  getStatusLabel,
  formatDueDate
};
