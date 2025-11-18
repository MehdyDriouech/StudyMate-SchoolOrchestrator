/**
 * Feature Teacher Submissions - Logique métier pour les soumissions enseignant
 */

import { getCurrentUser } from './feature-auth.js';
import StudentSubmissionsStore from './store-submissions.js';
import { getAssignmentById } from './store-class-theme-assignments.js';
import { getThemeById } from './store-themes.js';
import { getClasses, getActiveSchool } from './store-multischool.js';

/**
 * Charge les données des soumissions pour l'enseignant
 * @param {string} classId - ID de la classe à filtrer (optionnel)
 * @returns {Array}
 */
export function loadSubmissionsData(classId = null) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'teacher') {
    console.warn('[Teacher Submissions] Aucun enseignant connecté');
    return [];
  }
  
  // Récupérer toutes les soumissions
  let submissions = StudentSubmissionsStore.getSubmissionsForTeacher(currentUser.email);
  
  // Filtrer par classe si classId est fourni
  if (classId) {
    const compatibleClassId = classId.replace('class_', ''); // 'class_term_s1' -> 'terminale_s1'
    submissions = submissions.filter(s => 
      s.classId === classId || s.classId === compatibleClassId
    );
  }
  
  // Enrichir avec les informations des assignations et thèmes
  const enrichedSubmissions = submissions.map(submission => {
    const assignment = getAssignmentById(submission.assignmentId);
    const theme = assignment ? getThemeById(assignment.themeId) : null;
    
    // Récupérer le nom de la classe
    const activeSchool = getActiveSchool();
    const classInfo = activeSchool?.classes?.find(c => 
      c.id === submission.classId || c.id === `class_${submission.classId}`
    );
    
    // Récupérer le nom de l'étudiant (fake pour la démo)
    const studentName = getStudentName(submission.studentId);
    
    return {
      ...submission,
      themeTitle: theme?.title || assignment?.themeId || 'Thème inconnu',
      themeSubject: theme?.subject || null,
      className: classInfo?.name || submission.classId,
      studentName: studentName
    };
  });
  
  return enrichedSubmissions;
}

/**
 * Retourne le nom d'un étudiant (fake pour la démo)
 * @param {string} studentId - ID de l'étudiant (email)
 * @returns {string}
 */
function getStudentName(studentId) {
  const nameMap = {
    'etudiant@ecole.fr': 'Élève Sophie',
    'etudiant@condorcet.fr': 'Élève Emma',
    'student@ecole.fr': 'Élève Sophie'
  };
  
  return nameMap[studentId] || studentId;
}

export default {
  loadSubmissionsData
};

