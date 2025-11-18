/**
 * Feature Director Usage Heatmap - Logique métier pour la heatmap d'usage des contenus
 */

import { getHeatmapData, getActivityForClassWeek, getAverageCompletion } from '../../stores/UsageHeatmapStore.js';
import { getActiveSchoolId } from './store-multischool.js';
import ActivityTimelineStore from './store-timeline.js';
import { getCurrentUser } from './feature-auth.js';

/**
 * Charge les données de la heatmap
 * @returns {object} { weeks, classes, activity }
 */
export function loadUsageHeatmapData() {
  const schoolId = getActiveSchoolId();
  const data = getHeatmapData();
  
  // Logger l'événement de consultation
  const currentUser = getCurrentUser();
  if (currentUser) {
    ActivityTimelineStore.logEvent(
      'director_viewed_heatmap',
      currentUser.email,
      currentUser.role,
      { schoolId }
    );
  }
  
  return data;
}

/**
 * Filtre les données de heatmap selon les critères
 * @param {object} filters - { classId?, weekStart?, weekEnd? }
 * @returns {object} Données filtrées
 */
export function filterHeatmapData(filters = {}) {
  const data = getHeatmapData();
  const currentUser = getCurrentUser();
  
  // Logger l'événement de filtrage
  if (currentUser) {
    ActivityTimelineStore.logEvent(
      'director_filtered_heatmap',
      currentUser.email,
      currentUser.role,
      { filter: filters }
    );
  }
  
  let filteredClasses = data.classes;
  let filteredWeeks = data.weeks;
  
  // Filtrer par classe
  if (filters.classId) {
    filteredClasses = data.classes.filter(cls => cls.id === filters.classId);
  }
  
  // Filtrer par période
  if (filters.weekStart || filters.weekEnd) {
    filteredWeeks = data.weeks.filter(week => {
      if (filters.weekStart && week < filters.weekStart) return false;
      if (filters.weekEnd && week > filters.weekEnd) return false;
      return true;
    });
  }
  
  // Reconstruire les données d'activité filtrées
  const filteredActivity = {};
  filteredClasses.forEach(cls => {
    filteredActivity[cls.id] = {};
    filteredWeeks.forEach(week => {
      filteredActivity[cls.id][week] = data.activity[cls.id]?.[week] || 0;
    });
  });
  
  return {
    weeks: filteredWeeks,
    classes: filteredClasses,
    activity: filteredActivity
  };
}

/**
 * Récupère les statistiques pour une cellule de la heatmap
 * @param {string} classId - ID de la classe
 * @param {number} weekNumber - Numéro de semaine
 * @returns {object} { activity, completion, className }
 */
export function getCellStats(classId, weekNumber) {
  const activity = getActivityForClassWeek(classId, weekNumber);
  const completion = getAverageCompletion(classId, weekNumber);
  
  // Récupérer le nom de la classe
  const data = getHeatmapData();
  const classInfo = data.classes.find(cls => cls.id === classId);
  const className = classInfo?.name || 'Classe inconnue';
  
  return {
    activity,
    completion,
    className
  };
}

/**
 * Détermine la couleur selon le niveau d'activité
 * @param {number} activity - Niveau d'activité (0-25)
 * @returns {string} Code couleur hex
 */
export function getActivityColor(activity) {
  if (activity === 0) {
    return '#e5e7eb'; // Gris clair = aucune activité
  } else if (activity >= 1 && activity <= 5) {
    return '#bbf7d0'; // Vert très clair = faible activité
  } else if (activity >= 6 && activity <= 12) {
    return '#86efac'; // Vert clair = activité modérée
  } else if (activity >= 13 && activity <= 20) {
    return '#4ade80'; // Vert moyen = activité modérée-élevée
  } else {
    return '#16a34a'; // Vert foncé = forte activité
  }
}

export default {
  loadUsageHeatmapData,
  filterHeatmapData,
  getCellStats,
  getActivityColor
};

