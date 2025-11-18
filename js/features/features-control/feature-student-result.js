/**
 * Feature Student Result - Logique métier pour le résultat du devoir étudiant
 */

import { getCurrentUser } from './feature-auth.js';
import { getAssignmentWithThemeById } from './feature-student-catalog.js';
import StudentSubmissionsStore from './store-submissions.js';

/**
 * Charge les données du résultat
 * @returns {object|null}
 */
export function loadResultData() {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'student') {
    console.warn('[Student Result] Aucun étudiant connecté');
    return null;
  }
  
  // Récupérer l'ID de l'assignation depuis l'URL
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const assignmentId = urlParams.get('assignmentId');
  
  if (!assignmentId) {
    console.warn('[Student Result] Aucun assignmentId fourni');
    return null;
  }
  
  // Récupérer l'assignation
  const assignment = getAssignmentWithThemeById(assignmentId);
  if (!assignment) {
    console.warn('[Student Result] Assignation introuvable:', assignmentId);
    return null;
  }
  
  // Récupérer la soumission
  const submission = StudentSubmissionsStore.getSubmission(currentUser.email, assignmentId);
  if (!submission) {
    console.warn('[Student Result] Soumission introuvable');
    return null;
  }
  
  return {
    assignment,
    submission,
    theme: assignment.theme
  };
}

export default {
  loadResultData
};

