/**
 * Store Class Theme Assignments - Gestion des assignations de thèmes aux classes
 * Permet d'associer un thème à une classe avec une période d'accessibilité
 */

// Structure de stockage
const assignmentsStore = {
  assignments: []
};

/**
 * Initialise le store avec des données mockées pour la démo
 */
function initStore() {
  // Données mockées pour tester le catalogue étudiant
  const now = new Date();
  const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // -10 jours
  const futureDate = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // +20 jours
  const pastDueDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // -5 jours (date de rendu passée)
  const futureDueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // +15 jours (date de rendu future)
  
  // Assignation passée (annales)
  assignmentsStore.assignments.push({
    id: 'assignment_demo_past_001',
    themeId: 'theme_suites_001', // Thème de la bibliothèque
    classId: 'terminale_s1',
    startAt: pastDate.toISOString(),
    endAt: new Date(pastDate.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueAt: pastDueDate.toISOString(),
    status: 'published',
    createdBy: 'teacher@ecole.fr',
    createdAt: pastDate.toISOString(),
    publishedAt: pastDate.toISOString(),
    updatedAt: pastDate.toISOString()
  });
  
  // Assignation future (à faire)
  assignmentsStore.assignments.push({
    id: 'assignment_demo_future_001',
    themeId: 'theme_derivation_002', // Thème de la bibliothèque
    classId: 'terminale_s1',
    startAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // +5 jours
    endAt: futureDate.toISOString(),
    dueAt: futureDueDate.toISOString(),
    status: 'published',
    createdBy: 'teacher@ecole.fr',
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  // Assignation en cours (à faire)
  assignmentsStore.assignments.push({
    id: 'assignment_demo_current_001',
    themeId: 'theme_conscience_003', // Thème de la bibliothèque
    classId: 'terminale_s1',
    startAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // -3 jours (déjà commencé)
    endAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // +10 jours
    dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 jours
    status: 'published',
    createdBy: 'teacher@ecole.fr',
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  console.log('[Store Class Theme Assignments] ✅ Store initialisé avec', assignmentsStore.assignments.length, 'assignations mockées');
}

// Initialiser le store au chargement
initStore();

/**
 * Crée un brouillon d'assignation
 * @param {object} params - Paramètres
 * @param {string} params.themeId - ID du thème
 * @param {string} params.classId - ID de la classe
 * @param {string} params.startAt - Date de début (ISO string)
 * @param {string} params.endAt - Date de fin (ISO string)
 * @param {string} params.dueAt - Date de rendu (ISO string)
 * @param {string} params.createdBy - Utilisateur créateur
 * @returns {object}
 */
export function createDraftAssignment({ themeId, classId, startAt, endAt, dueAt, createdBy }) {
  if (!themeId || !classId) {
    throw new Error('themeId et classId sont requis');
  }
  
  // Calculer dueAt par défaut si non fourni (milieu de la période)
  let calculatedDueAt = dueAt;
  if (!calculatedDueAt) {
    const start = startAt ? new Date(startAt) : new Date();
    const end = endAt ? new Date(endAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    calculatedDueAt = new Date((start.getTime() + end.getTime()) / 2).toISOString();
  }
  
  const assignment = {
    id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    themeId,
    classId,
    startAt: startAt || new Date().toISOString(),
    endAt: endAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 jours par défaut
    dueAt: calculatedDueAt,
    status: 'draft',
    createdBy: createdBy || 'teacher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  assignmentsStore.assignments.push(assignment);
  
  console.log('[Store Class Theme Assignments] ✅ Brouillon créé:', assignment.id);
  
  return assignment;
}

/**
 * Crée ou met à jour une assignation
 * @param {object} params - Paramètres
 * @param {string} params.themeId - ID du thème
 * @param {string} params.classId - ID de la classe
 * @param {string} params.startAt - Date de début (ISO string)
 * @param {string} params.endAt - Date de fin (ISO string)
 * @param {string} params.dueAt - Date de rendu (ISO string)
 * @param {string} params.createdBy - Utilisateur créateur
 * @returns {object}
 */
export function upsertAssignment({ themeId, classId, startAt, endAt, dueAt, createdBy }) {
  if (!themeId || !classId) {
    throw new Error('themeId et classId sont requis');
  }
  
  // Chercher un brouillon existant pour ce thème et cette classe
  const existingDraft = assignmentsStore.assignments.find(
    a => a.themeId === themeId && a.classId === classId && a.status === 'draft'
  );
  
  if (existingDraft) {
    // Mettre à jour le brouillon existant
    existingDraft.startAt = startAt || existingDraft.startAt;
    existingDraft.endAt = endAt || existingDraft.endAt;
    existingDraft.dueAt = dueAt || existingDraft.dueAt;
    existingDraft.updatedAt = new Date().toISOString();
    existingDraft.createdBy = createdBy || existingDraft.createdBy;
    
    console.log('[Store Class Theme Assignments] ✅ Brouillon mis à jour:', existingDraft.id);
    
    return existingDraft;
  } else {
    // Créer un nouveau brouillon
    return createDraftAssignment({ themeId, classId, startAt, endAt, dueAt, createdBy });
  }
}

/**
 * Publie une assignation
 * @param {string} assignmentId - ID de l'assignation
 * @returns {object}
 */
export function publishAssignment(assignmentId) {
  const assignment = assignmentsStore.assignments.find(a => a.id === assignmentId);
  
  if (!assignment) {
    throw new Error(`Assignation ${assignmentId} introuvable`);
  }
  
  if (assignment.status === 'published') {
    console.warn('[Store Class Theme Assignments] Assignation déjà publiée:', assignmentId);
    return assignment;
  }
  
  assignment.status = 'published';
  assignment.publishedAt = new Date().toISOString();
  assignment.updatedAt = new Date().toISOString();
  
  console.log('[Store Class Theme Assignments] ✅ Assignation publiée:', assignmentId);
  
  return assignment;
}

/**
 * Récupère les assignations par classe
 * @param {string} classId - ID de la classe
 * @param {object} options - Options
 * @param {Date|string} options.now - Date de référence pour le filtrage temporel
 * @param {boolean} options.includeDraft - Inclure les brouillons
 * @returns {Array}
 */
export function getAssignmentsByClass(classId, options = {}) {
  const { now, includeDraft = false } = options;
  
  let assignments = assignmentsStore.assignments.filter(a => a.classId === classId);
  
  // Filtrer par statut
  if (!includeDraft) {
    assignments = assignments.filter(a => a.status === 'published');
  }
  
  // Filtrer par date si now est fourni
  if (now) {
    const nowDate = typeof now === 'string' ? new Date(now) : now;
    assignments = assignments.filter(a => {
      const startAt = new Date(a.startAt);
      const endAt = new Date(a.endAt);
      return startAt <= nowDate && nowDate <= endAt;
    });
  }
  
  // Trier par date de début (plus récent en premier)
  assignments.sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
  
  return assignments;
}

/**
 * Récupère toutes les assignations d'un thème
 * @param {string} themeId - ID du thème
 * @param {boolean} includeDraft - Inclure les brouillons
 * @returns {Array}
 */
export function getAssignmentsByTheme(themeId, includeDraft = false) {
  let assignments = assignmentsStore.assignments.filter(a => a.themeId === themeId);
  
  if (!includeDraft) {
    assignments = assignments.filter(a => a.status === 'published');
  }
  
  return assignments;
}

/**
 * Récupère une assignation par son ID
 * @param {string} assignmentId - ID de l'assignation
 * @returns {object|null}
 */
export function getAssignmentById(assignmentId) {
  return assignmentsStore.assignments.find(a => a.id === assignmentId) || null;
}

/**
 * Récupère toutes les assignations (pour debug/admin)
 * @param {boolean} includeDraft - Inclure les brouillons
 * @returns {Array}
 */
export function getAllAssignments(includeDraft = false) {
  if (includeDraft) {
    return [...assignmentsStore.assignments];
  }
  return assignmentsStore.assignments.filter(a => a.status === 'published');
}

/**
 * Supprime une assignation (uniquement les brouillons)
 * @param {string} assignmentId - ID de l'assignation
 * @returns {boolean}
 */
export function deleteAssignment(assignmentId) {
  const assignment = assignmentsStore.assignments.find(a => a.id === assignmentId);
  
  if (!assignment) {
    return false;
  }
  
  if (assignment.status === 'published') {
    throw new Error('Impossible de supprimer une assignation publiée');
  }
  
  const index = assignmentsStore.assignments.indexOf(assignment);
  assignmentsStore.assignments.splice(index, 1);
  
  console.log('[Store Class Theme Assignments] ✅ Assignation supprimée:', assignmentId);
  
  return true;
}

export default {
  createDraftAssignment,
  upsertAssignment,
  publishAssignment,
  getAssignmentsByClass,
  getAssignmentsByTheme,
  getAssignmentById,
  getAllAssignments,
  deleteAssignment
};

