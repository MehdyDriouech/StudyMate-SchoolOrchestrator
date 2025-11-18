/**
 * Feature Student Catalog - Logique métier pour le catalogue & annales des élèves
 */

import { getCurrentUser } from './feature-auth.js';
import { getAssignmentsByClass } from './store-class-theme-assignments.js';
import { getThemeById } from './store-themes.js';
import { getCurrentTheme } from './feature-ai-theme-studio.js';
import ActivityTimelineStore from './store-timeline.js';

/**
 * Récupère la classe de l'étudiant courant
 * @returns {string|null}
 */
function getStudentClassId() {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'student') {
    return null;
  }
  
  // Pour la démo, on utilise une classe par défaut selon l'email
  // Dans une vraie implémentation, on récupérerait classId depuis le profil utilisateur
  const email = currentUser.email || '';
  
  // Mapping simple pour la démo
  if (email.includes('etudiant') || email.includes('student')) {
    return 'terminale_s1'; // Classe par défaut pour la démo
  }
  
  return 'terminale_s1'; // Fallback
}

/**
 * Récupère toutes les assignations enrichies avec les thèmes pour l'étudiant courant
 * @returns {Array}
 */
export function getAllEnrichedAssignments() {
  const classId = getStudentClassId();
  
  if (!classId) {
    console.warn('[Student Catalog] Aucune classe trouvée pour l\'étudiant');
    return [];
  }
  
  const now = new Date();
  const assignments = getAssignmentsByClass(classId, {
    now: now,
    includeDraft: false
  });
  
  // Enrichir chaque assignation avec son thème
  const enrichedAssignments = assignments.map(assignment => {
    // Chercher le thème dans store-themes
    let theme = getThemeById(assignment.themeId);
    
    // Si pas trouvé, chercher dans le thème courant de AI Studio
    if (!theme) {
      const currentTheme = getCurrentTheme();
      if (currentTheme && currentTheme.id === assignment.themeId) {
        theme = currentTheme;
      }
    }
    
    // Si toujours pas trouvé, créer un thème minimal pour la démo
    if (!theme) {
      theme = {
        id: assignment.themeId,
        title: 'Thème sans titre',
        description: '',
        subject: 'Non spécifié',
        level: 'Non spécifié',
        questions: []
      };
    }
    
    return {
      ...assignment,
      theme: theme
    };
  });
  
  return enrichedAssignments;
}

/**
 * Récupère les assignations "à faire" (now <= dueAt)
 * @returns {Array}
 */
export function getAssignmentsToDo() {
  const now = new Date();
  const allAssignments = getAllEnrichedAssignments();
  
  return allAssignments.filter(assignment => {
    if (!assignment.dueAt) return false;
    const dueDate = new Date(assignment.dueAt);
    return now <= dueDate;
  }).sort((a, b) => {
    // Trier par date de rendu (plus proche en premier)
    const dueA = new Date(a.dueAt);
    const dueB = new Date(b.dueAt);
    return dueA - dueB;
  });
}

/**
 * Récupère les assignations "annales" (now > dueAt)
 * @returns {Array}
 */
export function getAssignmentsAnnals() {
  const now = new Date();
  const allAssignments = getAllEnrichedAssignments();
  const currentUser = getCurrentUser();
  
  const annals = allAssignments.filter(assignment => {
    if (!assignment.dueAt) return false;
    const dueDate = new Date(assignment.dueAt);
    const isPastDue = now > dueDate;
    
    // Logger l'événement de passage en Annales si c'est la première fois qu'on détecte
    if (isPastDue && currentUser) {
      // Vérifier si l'événement n'a pas déjà été logué pour cette assignation
      const existingEvents = ActivityTimelineStore.getEventsForUser(currentUser.email);
      const alreadyLogged = existingEvents.some(
        e => e.type === 'assignment_due_passed' && e.payload.assignmentId === assignment.id
      );
      
      if (!alreadyLogged) {
        ActivityTimelineStore.logEvent('assignment_due_passed', currentUser.email, currentUser.role, {
          assignmentId: assignment.id,
          themeId: assignment.themeId,
          themeTitle: assignment.theme?.title || assignment.themeId,
          dueAt: assignment.dueAt
        });
      }
    }
    
    return isPastDue;
  }).sort((a, b) => {
    // Trier par date de rendu (plus récent en premier)
    const dueA = new Date(a.dueAt);
    const dueB = new Date(b.dueAt);
    return dueB - dueA;
  });
  
  return annals;
}

/**
 * Enregistre la consultation d'un thème par un étudiant
 * @param {string} assignmentId - ID de l'assignation
 */
export function logAssignmentViewed(assignmentId) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'student') {
    return;
  }
  
  const assignment = getAssignmentWithThemeById(assignmentId);
  if (!assignment) {
    return;
  }
  
  // Vérifier si l'événement n'a pas déjà été logué pour cette assignation
  const existingEvents = ActivityTimelineStore.getEventsForUser(currentUser.email);
  const alreadyLogged = existingEvents.some(
    e => e.type === 'assignment_viewed' && e.payload.assignmentId === assignmentId
  );
  
  if (!alreadyLogged) {
    ActivityTimelineStore.logEvent('assignment_viewed', currentUser.email, currentUser.role, {
      assignmentId: assignmentId,
      themeId: assignment.themeId,
      themeTitle: assignment.theme?.title || assignment.themeId
    });
  }
}

/**
 * Enregistre la soumission d'un devoir par un étudiant
 * @param {string} assignmentId - ID de l'assignation
 * @param {number} score - Score obtenu (optionnel)
 */
export function logAssignmentSubmitted(assignmentId, score = null) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'student') {
    return;
  }
  
  const assignment = getAssignmentWithThemeById(assignmentId);
  if (!assignment) {
    return;
  }
  
  ActivityTimelineStore.logEvent('student_submitted_assignment', currentUser.email, currentUser.role, {
    assignmentId: assignmentId,
    themeId: assignment.themeId,
    themeTitle: assignment.theme?.title || assignment.themeId
  });
  
  // Simuler une correction automatique (fake)
  if (score !== null) {
    setTimeout(() => {
      ActivityTimelineStore.logEvent('student_auto_graded', currentUser.email, currentUser.role, {
        assignmentId: assignmentId,
        themeId: assignment.themeId,
        themeTitle: assignment.theme?.title || assignment.themeId,
        score: score
      });
    }, 1000);
  }
}

/**
 * Récupère une assignation enrichie par son ID
 * @param {string} assignmentId - ID de l'assignation
 * @returns {object|null}
 */
export function getAssignmentWithThemeById(assignmentId) {
  const allAssignments = getAllEnrichedAssignments();
  return allAssignments.find(a => a.id === assignmentId) || null;
}

/**
 * Vérifie si l'utilisateur courant est un étudiant
 * @returns {boolean}
 */
export function isStudent() {
  const currentUser = getCurrentUser();
  return currentUser?.role === 'student';
}

/**
 * Récupère la classe de l'étudiant courant
 * @returns {string|null}
 */
export function getStudentClass() {
  return getStudentClassId();
}

export default {
  getAllEnrichedAssignments,
  getAssignmentsToDo,
  getAssignmentsAnnals,
  getAssignmentWithThemeById,
  isStudent,
  getStudentClass,
  logAssignmentViewed,
  logAssignmentSubmitted
};

