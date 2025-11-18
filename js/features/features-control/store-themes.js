/**
 * Store centralisé pour la gestion des thèmes (pipeline IA → Qualité → Publication)
 * Gère l'état global des thèmes à travers tout le workflow
 */

import ActivityTimelineStore from './store-timeline.js';

// Structure de stockage centralisée
const themesStore = {
  // Thème en cours d'édition dans AI Theme Studio
  current: null,
  
  // Thèmes sauvegardés localement par l'enseignant
  saved: [],
  
  // Thèmes soumis à validation qualité
  submitted: [],
  
  // Thèmes validés, prêts à être publiés
  approved: [],
  
  // Thèmes publiés par classe
  published: {},
  
  // Thèmes rejetés ou nécessitant des corrections
  rejected: []
};

/**
 * Initialise le store avec des données mockées si nécessaire
 */
function initStore() {
  // Pas d'initialisation nécessaire pour l'instant
  // Les données seront ajoutées dynamiquement
}

/**
 * Soumet un thème à la validation qualité
 * @param {object} theme - Thème à soumettre
 * @returns {object}
 */
export function submitThemeForQuality(theme) {
  if (!theme || !theme.id) {
    throw new Error('Thème invalide pour soumission');
  }
  
  const submittedTheme = {
    ...theme,
    status: 'pending_review',
    submittedAt: new Date().toISOString(),
    origin: 'ai_theme_studio',
    author: getCurrentUser()?.name || 'Enseignant'
  };
  
  // Retirer de saved si présent
  themesStore.saved = themesStore.saved.filter(t => t.id !== theme.id);
  
  // Ajouter dans submitted
  themesStore.submitted.push(submittedTheme);
  
  console.log('[Store Themes] ✅ Thème soumis à validation:', submittedTheme.id);
  
  return submittedTheme;
}

/**
 * Valide un thème (passe de pending_review à approved)
 * @param {string} themeId - ID du thème
 * @returns {object}
 */
export function approveTheme(themeId) {
  const theme = themesStore.submitted.find(t => t.id === themeId);
  if (!theme) {
    throw new Error(`Thème ${themeId} introuvable dans les soumissions`);
  }
  
  const approvedTheme = {
    ...theme,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: getCurrentUser()?.name || 'Directeur pédagogique'
  };
  
  // Retirer de submitted
  themesStore.submitted = themesStore.submitted.filter(t => t.id !== themeId);
  
  // Ajouter dans approved
  themesStore.approved.push(approvedTheme);
  
  console.log('[Store Themes] ✅ Thème approuvé:', themeId);
  
  return approvedTheme;
}

/**
 * Rejette un thème ou demande une correction
 * @param {string} themeId - ID du thème
 * @param {string} reason - Raison du rejet
 * @param {string} newStatus - 'rejected' ou 'needs_revision'
 * @returns {object}
 */
export function rejectTheme(themeId, reason = '', newStatus = 'rejected') {
  const theme = themesStore.submitted.find(t => t.id === themeId);
  if (!theme) {
    throw new Error(`Thème ${themeId} introuvable`);
  }
  
  const rejectedTheme = {
    ...theme,
    status: newStatus,
    rejectedAt: new Date().toISOString(),
    rejectedBy: getCurrentUser()?.name || 'Directeur pédagogique',
    rejectionReason: reason
  };
  
  // Retirer de submitted
  themesStore.submitted = themesStore.submitted.filter(t => t.id !== themeId);
  
  // Ajouter dans rejected
  themesStore.rejected.push(rejectedTheme);
  
  console.log('[Store Themes] ⚠️ Thème rejeté:', themeId, newStatus);
  
  return rejectedTheme;
}

/**
 * Publie un thème pour une ou plusieurs classes
 * @param {string} themeId - ID du thème
 * @param {Array<string>} classIds - IDs des classes cibles
 * @returns {object}
 */
export function publishTheme(themeId, classIds) {
  const theme = themesStore.approved.find(t => t.id === themeId);
  if (!theme) {
    throw new Error(`Thème ${themeId} introuvable dans les thèmes approuvés`);
  }
  
  const publishedTheme = {
    ...theme,
    status: 'published',
    publishedAt: new Date().toISOString(),
    publishedBy: getCurrentUser()?.name || 'Directeur d\'établissement',
    publishedForClasses: classIds
  };
  
  // Retirer de approved
  themesStore.approved = themesStore.approved.filter(t => t.id !== themeId);
  
  // Ajouter dans published par classe
  classIds.forEach(classId => {
    if (!themesStore.published[classId]) {
      themesStore.published[classId] = [];
    }
    themesStore.published[classId].push(publishedTheme);
  });
  
  // Logger l'événement de publication
  const currentUser = getCurrentUser();
  if (currentUser) {
    ActivityTimelineStore.logEvent('theme_published', currentUser.email, currentUser.role, {
      themeId: themeId,
      themeTitle: theme.title,
      classIds: classIds
    });
  }
  
  console.log('[Store Themes] 🚀 Thème publié:', themeId, 'pour classes:', classIds);
  
  return publishedTheme;
}

/**
 * Retourne tous les thèmes soumis à validation
 * @returns {Array}
 */
export function getSubmittedThemes() {
  return [...themesStore.submitted];
}

/**
 * Retourne tous les thèmes approuvés (prêts à publier)
 * @returns {Array}
 */
export function getApprovedThemes() {
  return [...themesStore.approved];
}

/**
 * Retourne les thèmes publiés pour une classe donnée
 * @param {string} classId - ID de la classe
 * @returns {Array}
 */
export function getPublishedThemesByClass(classId) {
  return themesStore.published[classId] ? [...themesStore.published[classId]] : [];
}

/**
 * Retourne tous les thèmes publiés (toutes classes confondues)
 * @returns {Array}
 */
export function getAllPublishedThemes() {
  const all = [];
  Object.values(themesStore.published).forEach(classThemes => {
    all.push(...classThemes);
  });
  // Dédupliquer par ID
  const unique = {};
  all.forEach(theme => {
    if (!unique[theme.id]) {
      unique[theme.id] = theme;
    }
  });
  return Object.values(unique);
}

/**
 * Retourne un thème par son ID (cherche dans tous les états)
 * @param {string} themeId - ID du thème
 * @returns {object|null}
 */
export function getThemeById(themeId) {
  const allThemes = [
    ...themesStore.submitted,
    ...themesStore.approved,
    ...themesStore.rejected,
    ...getAllPublishedThemes()
  ];
  
  return allThemes.find(t => t.id === themeId) || null;
}

/**
 * Retourne l'utilisateur courant (helper)
 * @returns {object|null}
 */
function getCurrentUser() {
  try {
    const role = localStorage.getItem('SM_SO_USER_ROLE');
    const email = localStorage.getItem('SM_SO_USER_EMAIL');
    if (!role || !email) return null;
    
    const nameMap = {
      'teacher': 'Prof. Martin',
      'director': 'Directeur Dupont',
      'pedago': 'Référent pédagogique',
      'student': 'Élève Sophie'
    };
    
    return {
      role,
      email,
      name: nameMap[role] || 'Utilisateur'
    };
  } catch {
    return null;
  }
}

/**
 * Retourne les statistiques du store
 * @returns {object}
 */
export function getThemesStats() {
  return {
    submitted: themesStore.submitted.length,
    approved: themesStore.approved.length,
    published: getAllPublishedThemes().length,
    rejected: themesStore.rejected.length
  };
}

// Initialiser le store au chargement
initStore();

export default {
  submitThemeForQuality,
  approveTheme,
  rejectTheme,
  publishTheme,
  getSubmittedThemes,
  getApprovedThemes,
  getPublishedThemesByClass,
  getAllPublishedThemes,
  getThemeById,
  getThemesStats
};

