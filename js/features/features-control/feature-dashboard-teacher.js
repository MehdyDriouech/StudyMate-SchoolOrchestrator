/**
 * Feature Dashboard Teacher - Logique du dashboard enseignant
 */

import api from '../../app-service.js';
import { getClasses, getActiveSchool } from './store-multischool.js';

let assignmentsCache = [];
let classOptionsCache = [];

/**
 * Charge les données du dashboard
 * @returns {Promise<object>}
 */
export async function loadDashboardData() {
  console.log('[Dashboard Teacher] Chargement des données');
  
  try {
    // Appels API parallèles pour optimiser le chargement
    const [statsResponse, assignmentsResponse] = await Promise.all([
      api.get('/stats/overview'),
      api.get('/assignments')
    ]);
    
    // Extraction des données
    const stats = statsResponse.data;
    const assignments = (assignmentsResponse.data || []).map(a => ({
      ...a,
      isNew: false
    }));
    assignmentsCache = assignments;
    classOptionsCache = extractClassOptions(assignments);
    
    // Traitement et formatage des données
    const processedData = {
      kpis: stats.kpis,
      topSubjects: stats.topSubjects,
      recentActivity: stats.recentActivity,
      assignments: getAssignmentsSnapshot(),
      // Calculs supplémentaires
      urgentAssignments: getUrgentAssignments(assignmentsCache),
      assignmentsByStatus: groupAssignmentsByStatus(assignmentsCache)
    };
    
    console.log('[Dashboard Teacher] ✅ Données chargées', processedData);
    return processedData;
    
  } catch (error) {
    console.error('[Dashboard Teacher] ❌ Erreur lors du chargement:', error);
    throw error;
  }
}

/**
 * Retourne les devoirs urgents (échéance < 3 jours)
 * @param {Array} assignments - Liste des devoirs
 * @returns {Array}
 */
function getUrgentAssignments(assignments) {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  return assignments
    .filter(a => {
      if (a.status !== 'active') return false;
      const dueDate = new Date(a.dueDate);
      return dueDate <= threeDaysFromNow && dueDate >= now;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

/**
 * Groupe les devoirs par statut
 * @param {Array} assignments - Liste des devoirs
 * @returns {object}
 */
function groupAssignmentsByStatus(assignments) {
  const groups = {
    active: [],
    completed: [],
    draft: []
  };
  
  assignments.forEach(assignment => {
    if (groups[assignment.status]) {
      groups[assignment.status].push(assignment);
    }
  });
  
  return groups;
}

/**
 * Formate une date en français
 * @param {string} dateString - Date ISO
 * @returns {string}
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
}

/**
 * Formate une date relative (il y a X jours)
 * @param {string} dateString - Date ISO
 * @returns {string}
 */
export function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 60) {
    return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else {
    return formatDate(dateString);
  }
}

/**
 * Calcule le pourcentage de complétion
 * @param {number} submitted - Nombre de soumissions
 * @param {number} total - Nombre total d'élèves
 * @returns {number}
 */
export function calculateCompletionRate(submitted, total) {
  if (total === 0) return 0;
  return Math.round((submitted / total) * 100);
}

/**
 * Retourne la couleur du badge selon le taux de complétion
 * @param {number} rate - Taux de complétion (0-100)
 * @returns {string}
 */
export function getCompletionColor(rate) {
  if (rate >= 80) return 'var(--accent)';
  if (rate >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

/**
 * Retourne un snapshot des devoirs courants
 */
export function getAssignmentsSnapshot() {
  return assignmentsCache.map(a => ({ ...a }));
}

/**
 * Liste des classes disponibles (issue des devoirs existants)
 */
export function getTeacherClassOptions() {
  return [...classOptionsCache];
}

/**
 * Recalcule les métriques liées aux devoirs (urgent/statuts)
 */
export function getAssignmentMetrics() {
  return {
    urgentAssignments: getUrgentAssignments(assignmentsCache),
    assignmentsByStatus: groupAssignmentsByStatus(assignmentsCache)
  };
}

/**
 * Crée un nouveau devoir (mode démo uniquement)
 * @param {object} payload
 */
export function createDemoAssignment(payload) {
  const now = new Date();
  const dueDate = payload?.dueDate || now.toISOString().slice(0, 10);
  const selectedClass = payload?.className || payload?.class || (classOptionsCache[0] || 'Terminale S1');
  const newAssignment = {
    id: `assign-${Date.now()}`,
    title: payload?.title || 'Nouveau devoir',
    subject: payload?.subject || 'Mathématiques',
    class: selectedClass,
    dueDate,
    status: 'active',
    submittedCount: 0,
    totalStudents: Number(payload?.studentCount) || 28,
    avgGrade: null,
    description: payload?.description || '',
    attachmentName: payload?.attachmentName || null,
    createdAt: now.toISOString(),
    isNew: true
  };

  assignmentsCache = [newAssignment, ...assignmentsCache];
  classOptionsCache = extractClassOptions(assignmentsCache);

  return newAssignment;
}

function extractClassOptions(assignments = []) {
  const options = new Set();
  assignments.forEach(a => {
    if (a.class) {
      options.add(a.class);
    }
  });
  return Array.from(options);
}

export default {
  loadDashboardData,
  formatDate,
  formatRelativeDate,
  calculateCompletionRate,
  getCompletionColor,
  getAssignmentsSnapshot,
  getTeacherClassOptions,
  getAssignmentMetrics,
  createDemoAssignment
};
