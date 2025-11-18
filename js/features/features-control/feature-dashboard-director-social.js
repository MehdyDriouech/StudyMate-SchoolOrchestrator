/**
 * Feature Dashboard Director Social - Logique du dashboard social directeur
 */

import {
  getClasses,
  getActiveSchoolId,
  getActiveSchool
} from './store-multischool.js';
import {
  getClassSocialStats,
  getGlobalSocialDistribution,
  getAllSchoolsSocialStats
} from './feature-social.js';

/**
 * Charge les données du dashboard social directeur
 * @returns {Promise<object>}
 */
export async function loadDirectorSocialData() {
  console.log('[Dashboard Director Social] Chargement des données');
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const activeSchool = getActiveSchool();
  const classes = getClasses();
  const activeSchoolId = getActiveSchoolId();
  
  // Récupérer les stats sociales pour chaque classe
  const classesSocialStats = classes.map(cls => {
    const stats = getClassSocialStats(cls.id, activeSchoolId);
    const distribution = getGlobalSocialDistribution(cls.id, activeSchoolId);
    
    return {
      classId: cls.id,
      className: cls.name,
      avgScore: stats?.avgScore || 0,
      avgResponseTime: stats?.avgResponseTime || 0,
      top20Percent: distribution?.top20 || 0,
      bottom20Percent: distribution?.bottom20 || 0,
      totalStudents: cls.students || 0
    };
  });
  
  // Calculer la cohésion sociale (mock)
  const socialCohesion = calculateSocialCohesion(classesSocialStats);
  
  // Récupérer les stats de tous les établissements pour comparaison
  const allSchoolsStats = getAllSchoolsSocialStats();
  
  return {
    classesSocialStats,
    socialCohesion,
    allSchoolsStats,
    activeSchool: activeSchool?.name || 'Inconnu'
  };
}

/**
 * Calcule la cohésion sociale de l'établissement (mock)
 * @param {Array} classesStats - Stats des classes
 * @returns {object}
 */
function calculateSocialCohesion(classesStats) {
  if (!classesStats || classesStats.length === 0) {
    return { percentage: 0, level: 'faible' };
  }
  
  // Calculer la moyenne des écarts entre top20 et bottom20
  let totalGap = 0;
  classesStats.forEach(cls => {
    const gap = cls.top20Percent - cls.bottom20Percent;
    totalGap += gap;
  });
  
  const avgGap = totalGap / classesStats.length;
  
  // Cohésion basée sur l'écart (plus l'écart est faible, plus la cohésion est forte)
  // Normaliser entre 0 et 100
  const cohesionPercentage = Math.max(0, Math.min(100, 100 - (avgGap * 5)));
  
  let level = 'faible';
  if (cohesionPercentage > 80) {
    level = 'forte';
  } else if (cohesionPercentage >= 60) {
    level = 'moyenne';
  }
  
  return {
    percentage: Math.round(cohesionPercentage),
    level
  };
}

/**
 * Retourne la couleur selon le niveau de cohésion
 * @param {string} level - Niveau de cohésion
 * @returns {string}
 */
export function getCohesionColor(level) {
  switch (level) {
    case 'forte':
      return 'var(--accent)';
    case 'moyenne':
      return 'var(--warning)';
    default:
      return 'var(--danger)';
  }
}

export default {
  loadDirectorSocialData,
  getCohesionColor
};

