/**
 * Store Usage Heatmap - Gestion des données de heatmap d'usage des contenus
 * Génère des données mockées cohérentes pour la heatmap d'activité pédagogique
 */

import { getActiveSchoolId, getActiveSchool } from '../features/features-control/store-multischool.js';

// Configuration des semaines (8-12 semaines)
const CURRENT_YEAR = 2024;
const START_WEEK = 39; // Semaine 39
const NUM_WEEKS = 10; // 10 semaines (S39 à S48)

/**
 * Génère les numéros de semaines
 * @returns {Array<number>}
 */
function generateWeeks() {
  const weeks = [];
  for (let i = 0; i < NUM_WEEKS; i++) {
    weeks.push(START_WEEK + i);
  }
  return weeks;
}

/**
 * Calcule l'activité pour une classe et une semaine donnée
 * Règles de cohérence :
 * - Tle2 (classe principale) = activité élevée
 * - Tle3 = activité variable
 * - 1ère ST2S = activité moyenne
 * - 2nde A = activité faible
 * - Semaines proches des vacances (S42, S45) = plus faibles
 * - Semaine 42 : pic d'activités (thème publié)
 * - Semaine 45 : baisse (vacances)
 * - Semaine 46 : reprise
 * 
 * @param {string} classId - ID de la classe
 * @param {string} className - Nom de la classe
 * @param {number} weekNumber - Numéro de semaine
 * @returns {number} Activité (0-25)
 */
function calculateActivity(classId, className, weekNumber) {
  // Base d'activité selon la classe
  let baseActivity = 8;
  
  if (className.includes('Tle2') || className.includes('Terminale S1') || className.includes('Terminale S2')) {
    baseActivity = 18; // Classe principale = activité élevée
  } else if (className.includes('Tle3') || className.includes('Terminale')) {
    baseActivity = 12; // Activité variable
  } else if (className.includes('1ère') || className.includes('Première')) {
    baseActivity = 10; // Activité moyenne
  } else if (className.includes('2nde') || className.includes('Seconde')) {
    baseActivity = 6; // Activité faible
  }
  
  // Variations selon la semaine
  let variation = 0;
  
  // Semaine 42 : pic d'activités (thème publié)
  if (weekNumber === 42) {
    variation = 5;
  }
  // Semaine 45 : baisse (vacances)
  else if (weekNumber === 45) {
    variation = -8;
  }
  // Semaine 46 : reprise
  else if (weekNumber === 46) {
    variation = 3;
  }
  // Variations aléatoires légères pour les autres semaines
  else {
    variation = Math.floor(Math.random() * 5) - 2; // -2 à +2
  }
  
  // Appliquer la variation
  let activity = baseActivity + variation;
  
  // Ajouter un peu de bruit aléatoire
  activity += Math.floor(Math.random() * 3) - 1; // -1 à +1
  
  // Limiter entre 0 et 25
  activity = Math.max(0, Math.min(25, activity));
  
  return activity;
}

/**
 * Génère les données de heatmap pour l'établissement actif
 * @returns {object} { weeks, classes, activity }
 */
export function generateHeatmapData() {
  const school = getActiveSchool();
  if (!school || !school.classes) {
    return {
      weeks: generateWeeks(),
      classes: [],
      activity: {}
    };
  }
  
  const weeks = generateWeeks();
  const classes = school.classes.map(cls => ({
    id: cls.id,
    name: cls.name
  }));
  
  // Générer les données d'activité
  const activity = {};
  
  classes.forEach(cls => {
    activity[cls.id] = {};
    weeks.forEach(week => {
      activity[cls.id][week] = calculateActivity(cls.id, cls.name, week);
    });
  });
  
  return {
    weeks,
    classes,
    activity
  };
}

/**
 * Récupère les données de heatmap pour l'établissement actif
 * @returns {object} { weeks, classes, activity }
 */
export function getHeatmapData() {
  return generateHeatmapData();
}

/**
 * Récupère l'activité pour une classe et une semaine spécifiques
 * @param {string} classId - ID de la classe
 * @param {number} weekNumber - Numéro de semaine
 * @returns {number} Activité (0-25)
 */
export function getActivityForClassWeek(classId, weekNumber) {
  const data = getHeatmapData();
  return data.activity[classId]?.[weekNumber] || 0;
}

/**
 * Calcule la complétion moyenne pour une classe et une semaine
 * (Mock basé sur l'activité)
 * @param {string} classId - ID de la classe
 * @param {number} weekNumber - Numéro de semaine
 * @returns {number} Complétion moyenne (0-100)
 */
export function getAverageCompletion(classId, weekNumber) {
  const activity = getActivityForClassWeek(classId, weekNumber);
  // Complétion = activité * 4 + base de 20%
  const completion = Math.min(100, 20 + (activity * 4));
  return Math.round(completion);
}

export default {
  generateHeatmapData,
  getHeatmapData,
  getActivityForClassWeek,
  getAverageCompletion
};

