/**
 * Feature AI Theme Studio - Logique métier pour la génération et l'édition de thèmes IA (mode démo)
 */

import { api } from '../../app-service.js';
import { submitThemeForQuality } from './store-themes.js';
import {
  upsertAssignment,
  publishAssignment,
  getAssignmentsByTheme
} from './store-class-theme-assignments.js';
import { getClasses, getActiveSchoolId } from './store-multischool.js';
import { getCurrentUser } from './feature-auth.js';
import ActivityTimelineStore from './store-timeline.js';

const AVAILABLE_CLASSES = [
  { id: 'terminale_2_spe_math', label: 'Terminale 2 – spé Maths' },
  { id: 'terminale_s1', label: 'Terminale S1' },
  { id: 'terminale_l', label: 'Terminale L' },
  { id: 'terminale_es2', label: 'Terminale ES2' },
  { id: 'premiere_s3', label: 'Première S3' },
  { id: 'seconde_4', label: 'Seconde 4' }
];

let currentTheme = createEmptyTheme();
let savedThemes = [];

/**
 * Crée un squelette de thème par défaut
 * @param {Partial<object>} overrides
 * @returns {object}
 */
function createEmptyTheme(overrides = {}) {
  return ensureThemeDefaults({
    id: null,
    title: '',
    description: '',
    classes: [],
    contentTypes: {
      quiz: true,
      flashcards: true,
      revision_sheet: true
    },
    quiz: [],
    flashcards: [],
    revision_sheet: {
      blocks: [
        { id: 'rev-title', type: 'title', text: '' },
        { id: 'rev-body', type: 'paragraph', text: '' }
      ]
    },
    status: 'demo',
    ...overrides
  });
}

/**
 * S'assure que toutes les propriétés nécessaires existent dans le thème
 * @param {object} theme
 * @returns {object}
 */
function ensureThemeDefaults(theme = {}) {
  return {
    id: theme.id ?? null,
    title: theme.title ?? '',
    description: theme.description ?? '',
    classes: Array.isArray(theme.classes) ? theme.classes : [],
    contentTypes: {
      quiz: theme?.contentTypes?.quiz ?? true,
      flashcards: theme?.contentTypes?.flashcards ?? true,
      revision_sheet: theme?.contentTypes?.revision_sheet ?? true
    },
    quiz: Array.isArray(theme.quiz) ? theme.quiz : [],
    flashcards: Array.isArray(theme.flashcards) ? theme.flashcards : [],
    revision_sheet: theme.revision_sheet ?? { blocks: [] },
    status: theme.status ?? 'demo',
    generatedAt: theme.generatedAt ?? null,
    updatedAt: new Date().toISOString()
  };
}

export function getAvailableClasses() {
  // Récupérer les classes de l'établissement actif
  const activeSchoolId = getActiveSchoolId();
  if (activeSchoolId) {
    const schoolClasses = getClasses(activeSchoolId);
    if (schoolClasses && schoolClasses.length > 0) {
      return schoolClasses.map(c => ({
        id: c.id,
        label: c.name
      }));
    }
  }
  // Fallback sur les classes mockées
  return [...AVAILABLE_CLASSES];
}

export function getCurrentTheme() {
  return currentTheme;
}

export function setCurrentTheme(theme) {
  currentTheme = ensureThemeDefaults(theme);
  return currentTheme;
}

export function updateThemeMeta(partial = {}) {
  currentTheme = ensureThemeDefaults({
    ...currentTheme,
    ...partial
  });
  
  // Logger l'événement de mise à jour si le thème a un ID
  if (currentTheme.id) {
    const currentUser = getCurrentUser();
    if (currentUser) {
      ActivityTimelineStore.logEvent('theme_updated', currentUser.email, currentUser.role, {
        themeId: currentTheme.id,
        themeTitle: currentTheme.title
      });
    }
  }
  
  return currentTheme;
}

export function updateThemePart(part, data) {
  if (!['quiz', 'flashcards', 'revision_sheet'].includes(part)) {
    console.warn('[AI Theme Studio] Partie inconnue:', part);
    return currentTheme;
  }
  currentTheme = ensureThemeDefaults({
    ...currentTheme,
    [part]: data
  });
  return currentTheme;
}

export async function generateThemeFromDescription(payload) {
  const body = {
    persona: 'teacher',
    ...payload
  };

  const response = await api.post('/api/ai/themes/generate', body);
  const themeData = response?.data ?? response;

  currentTheme = ensureThemeDefaults({
    ...themeData,
    status: 'demo',
    generatedAt: new Date().toISOString()
  });

  if (!currentTheme.id) {
    currentTheme.id = `theme_${Date.now()}`;
  }

  // Logger l'événement de création
  const currentUser = getCurrentUser();
  if (currentUser) {
    ActivityTimelineStore.logEvent('theme_created', currentUser.email, currentUser.role, {
      themeId: currentTheme.id,
      themeTitle: currentTheme.title,
      subject: currentTheme.subject || 'Non spécifié'
    });
  }

  return currentTheme;
}

export function saveThemeLocally() {
  if (!currentTheme) {
    return { success: false, message: 'Aucun thème à enregistrer' };
  }

  const themeToSave = {
    ...currentTheme,
    status: 'non_publie_demo',
    savedAt: new Date().toISOString()
  };

  savedThemes = [themeToSave, ...savedThemes];

  // Logger l'événement de sauvegarde
  const currentUser = getCurrentUser();
  if (currentUser) {
    ActivityTimelineStore.logEvent('theme_saved_draft', currentUser.email, currentUser.role, {
      themeId: currentTheme.id,
      themeTitle: currentTheme.title
    });
  }

  return {
    success: true,
    message: 'Thème enregistré dans votre bibliothèque locale (démo)',
    data: themeToSave
  };
}

export function getSavedThemes() {
  return [...savedThemes];
}

export function resetTheme() {
  currentTheme = createEmptyTheme();
  return currentTheme;
}

/**
 * Soumet le thème courant à la validation qualité
 * @returns {object}
 */
export function submitThemeToQuality() {
  if (!currentTheme || !currentTheme.id) {
    throw new Error('Aucun thème à soumettre. Générez d\'abord un thème.');
  }
  
  if (!currentTheme.title || !currentTheme.title.trim()) {
    throw new Error('Le thème doit avoir un titre pour être soumis.');
  }
  
  if (!currentTheme.classes || currentTheme.classes.length === 0) {
    throw new Error('Veuillez sélectionner au moins une classe cible.');
  }
  
  const submitted = submitThemeForQuality(currentTheme);
  
  // Mettre à jour le thème courant
  currentTheme = {
    ...currentTheme,
    status: 'pending_review',
    submittedAt: submitted.submittedAt
  };
  
  // Logger l'événement de soumission
  const currentUser = getCurrentUser();
  if (currentUser) {
    ActivityTimelineStore.logEvent('theme_submitted_quality', currentUser.email, currentUser.role, {
      themeId: currentTheme.id,
      themeTitle: currentTheme.title
    });
  }
  
  console.log('[AI Theme Studio] ✅ Thème soumis à validation:', currentTheme.id);
  
  return submitted;
}

/**
 * Enregistre une assignation (brouillon) pour le thème courant
 * @param {string} classId - ID de la classe
 * @param {string} startAt - Date de début (ISO string)
 * @param {string} endAt - Date de fin (ISO string)
 * @param {string} dueAt - Date de rendu (ISO string, optionnel)
 * @returns {object}
 */
export function saveThemeAssignment(classId, startAt, endAt, dueAt) {
  if (!currentTheme || !currentTheme.id) {
    throw new Error('Aucun thème à assigner. Générez d\'abord un thème.');
  }
  
  if (!classId) {
    throw new Error('Veuillez sélectionner une classe');
  }
  
  const currentUser = getCurrentUser();
  const createdBy = currentUser?.email || 'teacher';
  
  const assignment = upsertAssignment({
    themeId: currentTheme.id,
    classId,
    startAt,
    endAt,
    dueAt,
    createdBy
  });
  
  console.log('[AI Theme Studio] ✅ Assignation enregistrée (brouillon):', assignment.id);
  
  return assignment;
}

/**
 * Publie le thème pour une classe
 * @param {string} classId - ID de la classe
 * @param {string} startAt - Date de début (ISO string)
 * @param {string} endAt - Date de fin (ISO string)
 * @param {string} dueAt - Date de rendu (ISO string, optionnel)
 * @returns {object}
 */
export function publishThemeForClass(classId, startAt, endAt, dueAt) {
  if (!currentTheme || !currentTheme.id) {
    throw new Error('Aucun thème à publier. Générez d\'abord un thème.');
  }
  
  if (!classId) {
    throw new Error('Veuillez sélectionner une classe');
  }
  
  // S'assurer qu'une assignation existe (créer ou mettre à jour)
  const assignment = saveThemeAssignment(classId, startAt, endAt, dueAt);
  
  // Publier l'assignation
  const published = publishAssignment(assignment.id);
  
  // Logger l'événement d'assignation
  const currentUser = getCurrentUser();
  if (currentUser) {
    ActivityTimelineStore.logEvent('theme_assigned_to_class', currentUser.email, currentUser.role, {
      themeId: currentTheme.id,
      themeTitle: currentTheme.title,
      classId: classId,
      startAt: startAt,
      endAt: endAt,
      dueAt: dueAt
    });
  }
  
  console.log('[AI Theme Studio] ✅ Thème publié pour la classe:', classId);
  
  return published;
}

/**
 * Récupère les assignations du thème courant
 * @param {boolean} includeDraft - Inclure les brouillons
 * @returns {Array}
 */
export function getCurrentThemeAssignments(includeDraft = false) {
  if (!currentTheme || !currentTheme.id) {
    return [];
  }
  
  return getAssignmentsByTheme(currentTheme.id, includeDraft);
}

export default {
  getAvailableClasses,
  getCurrentTheme,
  setCurrentTheme,
  updateThemeMeta,
  updateThemePart,
  generateThemeFromDescription,
  saveThemeLocally,
  getSavedThemes,
  resetTheme,
  submitThemeToQuality,
  saveThemeAssignment,
  publishThemeForClass,
  getCurrentThemeAssignments
};


