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
  const now = new Date();
  const classId = 'class_term_spe_maths'; // Classe principale Tle2 – Spé Maths
  
  // 3 thèmes récents (7 derniers jours)
  const recent1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // -2 jours
  const recent2 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // -4 jours
  const recent3 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // -6 jours
  
  // 2 thèmes anciens (1-2 mois)
  const old1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // -30 jours
  const old2 = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // -45 jours
  
  // Thèmes récents (actifs)
  assignmentsStore.assignments.push({
    id: 'assignment_suites_recent',
    themeId: 'theme_suites_numeriques',
    classId: classId,
    startAt: recent1.toISOString(),
    endAt: new Date(recent1.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(recent1.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    createdBy: 'martin@ecole.fr',
    createdAt: recent1.toISOString(),
    publishedAt: recent1.toISOString(),
    updatedAt: recent1.toISOString()
  });
  
  assignmentsStore.assignments.push({
    id: 'assignment_fonctions_recent',
    themeId: 'theme_fonctions_derivees',
    classId: classId,
    startAt: recent2.toISOString(),
    endAt: new Date(recent2.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(recent2.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    createdBy: 'martin@ecole.fr',
    createdAt: recent2.toISOString(),
    publishedAt: recent2.toISOString(),
    updatedAt: recent2.toISOString()
  });
  
  assignmentsStore.assignments.push({
    id: 'assignment_probabilites_recent',
    themeId: 'theme_probabilites',
    classId: classId,
    startAt: recent3.toISOString(),
    endAt: new Date(recent3.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(recent3.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    createdBy: 'martin@ecole.fr',
    createdAt: recent3.toISOString(),
    publishedAt: recent3.toISOString(),
    updatedAt: recent3.toISOString()
  });
  
  // Thèmes anciens (passés)
  assignmentsStore.assignments.push({
    id: 'assignment_logarithmes_old',
    themeId: 'theme_logarithmes',
    classId: classId,
    startAt: old1.toISOString(),
    endAt: new Date(old1.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(old1.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    createdBy: 'martin@ecole.fr',
    createdAt: old1.toISOString(),
    publishedAt: old1.toISOString(),
    updatedAt: old1.toISOString()
  });
  
  assignmentsStore.assignments.push({
    id: 'assignment_geometrie_old',
    themeId: 'theme_geometrie',
    classId: classId,
    startAt: old2.toISOString(),
    endAt: new Date(old2.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(old2.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    createdBy: 'martin@ecole.fr',
    createdAt: old2.toISOString(),
    publishedAt: old2.toISOString(),
    updatedAt: old2.toISOString()
  });
  
  // Assignation future
  assignmentsStore.assignments.push({
    id: 'assignment_ondes_future',
    themeId: 'theme_ondes',
    classId: classId,
    startAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    createdBy: 'martin@ecole.fr',
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
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

