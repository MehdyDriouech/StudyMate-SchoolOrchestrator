/**
 * Feature Curriculum Builder - Logique du curriculum (version simplifiée)
 */

import { getAssignmentsByClass } from './store-class-theme-assignments.js';
import { getThemeById } from './store-themes.js';
import { getCurrentTheme } from './feature-ai-theme-studio.js';

// Données mockées pour le curriculum
const MOCK_CURRICULUM_DATA = {
  subjects: [
    { id: 'math', name: 'Mathématiques', active: true },
    { id: 'philo', name: 'Philosophie', active: false },
    { id: 'hg', name: 'Histoire-Géographie', active: false }
  ],
  periods: [
    {
      id: 'period-1',
      name: 'Période 1',
      dates: 'Sept - Oct',
      sequences: [
        {
          id: 'seq-1-1',
          title: 'Suites numériques',
          duration: '4 semaines',
          status: 'completed',
          skills: ['Raisonner', 'Calculer']
        },
        {
          id: 'seq-1-2',
          title: 'Fonctions de référence',
          duration: '3 semaines',
          status: 'completed',
          skills: ['Modéliser', 'Représenter']
        }
      ]
    },
    {
      id: 'period-2',
      name: 'Période 2',
      dates: 'Nov - Déc',
      sequences: [
        {
          id: 'seq-2-1',
          title: 'Dérivation',
          duration: '4 semaines',
          status: 'in_progress',
          skills: ['Calculer', 'Raisonner']
        },
        {
          id: 'seq-2-2',
          title: 'Fonctions exponentielles',
          duration: '3 semaines',
          status: 'planned',
          skills: ['Modéliser', 'Calculer']
        }
      ]
    },
    {
      id: 'period-3',
      name: 'Période 3',
      dates: 'Jan - Fév',
      sequences: [
        {
          id: 'seq-3-1',
          title: 'Probabilités conditionnelles',
          duration: '4 semaines',
          status: 'planned',
          skills: ['Raisonner', 'Modéliser']
        },
        {
          id: 'seq-3-2',
          title: 'Primitives et intégration',
          duration: '5 semaines',
          status: 'planned',
          skills: ['Calculer', 'Raisonner']
        }
      ]
    }
  ]
};

/**
 * Charge les données du curriculum
 * @returns {Promise<object>}
 */
export async function loadCurriculumData() {
  console.log('[Feature Curriculum] Chargement du curriculum');
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return MOCK_CURRICULUM_DATA;
}

/**
 * Crée un nouveau chapitre (stub)
 * @param {object} chapterData - Données du chapitre
 * @returns {object}
 */
export function createChapter(chapterData) {
  console.log('[Feature Curriculum] Création de chapitre', chapterData);
  return { 
    success: true, 
    id: `chapter-${Date.now()}`,
    ...chapterData
  };
}

/**
 * Crée une nouvelle séquence (stub)
 * @param {string} periodId - ID de la période
 * @param {object} sequenceData - Données de la séquence
 * @returns {object}
 */
export function createSequence(periodId, sequenceData) {
  console.log('[Feature Curriculum] Création de séquence dans', periodId, sequenceData);
  return {
    success: true,
    id: `seq-${Date.now()}`,
    periodId,
    ...sequenceData
  };
}

/**
 * Déplace une séquence d'une période à une autre (stub)
 * @param {string} sequenceId - ID de la séquence
 * @param {string} fromPeriodId - Période source
 * @param {string} toPeriodId - Période destination
 * @returns {object}
 */
export function moveSequence(sequenceId, fromPeriodId, toPeriodId) {
  console.log('[Feature Curriculum] Déplacement séquence', sequenceId, 'de', fromPeriodId, 'vers', toPeriodId);
  return {
    success: true,
    message: 'Séquence déplacée (démo uniquement)'
  };
}

/**
 * Récupère les thèmes assignés pour une classe
 * @param {string} classId - ID de la classe
 * @returns {Array}
 */
export function getAssignedThemesForClass(classId) {
  if (!classId) return [];
  
  const now = new Date();
  const assignments = getAssignmentsByClass(classId, {
    now: now,
    includeDraft: false
  });
  
  // Enrichir avec les données du thème
  const themes = assignments.map(assignment => {
    // Chercher le thème dans store-themes
    let theme = getThemeById(assignment.themeId);
    
    // Si pas trouvé, chercher dans le thème courant de AI Studio
    if (!theme) {
      const currentTheme = getCurrentTheme();
      if (currentTheme && currentTheme.id === assignment.themeId) {
        theme = currentTheme;
      }
    }
    
    return {
      ...theme,
      assignmentId: assignment.id,
      startAt: assignment.startAt,
      endAt: assignment.endAt,
      classId: assignment.classId
    };
  }).filter(t => t.id); // Filtrer les thèmes valides
  
  return themes;
}

export default { 
  loadCurriculumData, 
  createChapter,
  createSequence,
  moveSequence,
  getAssignedThemesForClass
};
