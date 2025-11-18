/**
 * Feature Social - Gestion des interactions sociales entre élèves
 * Store centralisé pour les données sociales (amis, classements, comparaisons)
 */

// TODO: future api.get('/social/...')
// Intégration API future prévue ici

import { getActiveSchoolId } from './store-multischool.js';

const socialState = {
  self: {
    uuid: null, // Sera récupéré depuis localStorage ou généré
    displayName: "Moi"
  },
  friends: [
    { uuid: "uuid-nathan-001", displayName: "Nathan", score: 85, avgTime: 12.5 },
    { uuid: "uuid-sarah-002", displayName: "Sarah", score: 92, avgTime: 10.2 },
    { uuid: "uuid-omar-003", displayName: "Omar", score: 78, avgTime: 15.8 },
    { uuid: "uuid-ines-004", displayName: "Inès", score: 95, avgTime: 9.5 },
    { uuid: "uuid-lucas-005", displayName: "Lucas", score: 88, avgTime: 11.3 },
    { uuid: "uuid-marie-006", displayName: "Marie", score: 82, avgTime: 13.7 }
  ],
  lastQuizSocialStats: {
    quizId: "quiz_suites",
    quizLabel: "Suites numériques",
    rank: 3,
    total: 7,
    fasterThan: ["Nathan", "Sarah"],
    slowerThan: ["Omar", "Inès"],
    percentile: 65,
    myScore: 87,
    myAvgTime: 11.8,
    classAverage: 82,
    friendsAverage: 86
  },
  classSocialDynamics: {
    progressingRegularly: 60, // %
    fastLearners: 3,
    belowGroup: 2,
    totalStudents: 28
  },
  source: "ErgoMate (mock)"
};

/**
 * Stats sociales globales par classe et par établissement
 * Structure: { schoolId: { classId: { ...stats } } }
 */
const socialStats = {
  "school_01": {
    "class_term_spe_maths": {
      avgScore: 14.2,
      medianScore: 13.5,
      avgResponseTime: 52,
      topPerformers: [
        { name: "Nathan Leroy", score: 18, time: 40 },
        { name: "Sarah Benali", score: 17, time: 42 },
        { name: "Julien Morel", score: 16, time: 45 }
      ],
      struggling: [
        { name: "Sofiane Madi", score: 9, time: 75 },
        { name: "Lina Haddad", score: 10, time: 70 }
      ],
      socialDistribution: {
        top20: 2,
        middle60: 6,
        bottom20: 2
      }
    },
    "class_term_l": {
      avgScore: 13.8,
      medianScore: 13.5,
      avgResponseTime: 58,
      topPerformers: [
        { name: "Sophie", score: 17, time: 45 },
        { name: "Lucas", score: 16, time: 48 }
      ],
      struggling: [
        { name: "Marie", score: 10, time: 80 }
      ],
      socialDistribution: {
        top20: 2,
        middle60: 20,
        bottom20: 3
      }
    },
    "class_prem_es2": {
      avgScore: 14.1,
      medianScore: 14,
      avgResponseTime: 55,
      topPerformers: [
        { name: "Inès", score: 18, time: 38 },
        { name: "Thomas", score: 17, time: 40 }
      ],
      struggling: [
        { name: "Paul", score: 8, time: 85 }
      ],
      socialDistribution: {
        top20: 4,
        middle60: 19,
        bottom20: 3
      }
    },
    "class_seconde4": {
      avgScore: 13.5,
      medianScore: 13,
      avgResponseTime: 60,
      topPerformers: [
        { name: "Emma", score: 16, time: 50 },
        { name: "Léo", score: 15, time: 52 }
      ],
      struggling: [
        { name: "Alex", score: 9, time: 90 }
      ],
      socialDistribution: {
        top20: 3,
        middle60: 16,
        bottom20: 4
      }
    }
  },
  "school_02": {
    "class_term_s2": {
      avgScore: 14.5,
      medianScore: 14,
      avgResponseTime: 50,
      topPerformers: [
        { name: "Emma", score: 18, time: 38 },
        { name: "Thomas", score: 17, time: 40 }
      ],
      struggling: [
        { name: "Lucas", score: 10, time: 70 }
      ],
      socialDistribution: {
        top20: 4,
        middle60: 20,
        bottom20: 3
      }
    },
    "class_prem_s1": {
      avgScore: 13.9,
      medianScore: 13.5,
      avgResponseTime: 56,
      topPerformers: [
        { name: "Marie", score: 17, time: 42 },
        { name: "Pierre", score: 16, time: 45 }
      ],
      struggling: [
        { name: "Julie", score: 9, time: 78 }
      ],
      socialDistribution: {
        top20: 3,
        middle60: 17,
        bottom20: 3
      }
    },
    "class_seconde1": {
      avgScore: 13.2,
      medianScore: 13,
      avgResponseTime: 62,
      topPerformers: [
        { name: "Antoine", score: 16, time: 52 },
        { name: "Camille", score: 15, time: 54 }
      ],
      struggling: [
        { name: "Maxime", score: 8, time: 88 }
      ],
      socialDistribution: {
        top20: 2,
        middle60: 16,
        bottom20: 4
      }
    }
  }
};

/**
 * Initialise le profil social de l'utilisateur
 */
function initSocialProfile() {
  // Récupérer l'UUID social depuis localStorage
  const storedUUID = localStorage.getItem('SM_SO_SOCIAL_UUID');
  if (storedUUID) {
    socialState.self.uuid = storedUUID;
  } else {
    // Générer un UUID par défaut si absent
    socialState.self.uuid = `uuid-student-${Date.now()}`;
  }
}

/**
 * Retourne le profil social de l'utilisateur
 * @returns {object}
 */
export function getSocialProfile() {
  if (!socialState.self.uuid) {
    initSocialProfile();
  }
  return {
    ...socialState.self,
    friendsCount: socialState.friends.length
  };
}

/**
 * Retourne la liste des amis
 * @returns {Array}
 */
export function getFriends() {
  return [...socialState.friends];
}

/**
 * Ajoute un ami via son UUID
 * @param {string} uuid - UUID de l'ami
 * @param {string} displayName - Nom d'affichage (optionnel)
 * @returns {object|null}
 */
export function addFriendByUuid(uuid, displayName = null) {
  // Vérifier que ce n'est pas soi-même
  if (uuid === socialState.self.uuid) {
    throw new Error('Vous ne pouvez pas vous ajouter vous-même comme ami.');
  }
  
  // Vérifier que l'ami n'existe pas déjà
  const existingFriend = socialState.friends.find(f => f.uuid === uuid);
  if (existingFriend) {
    throw new Error('Cet ami est déjà dans votre liste.');
  }
  
  // Générer un nom d'affichage si non fourni
  const name = displayName || `Ami-${uuid.slice(-4)}`;
  
  // Ajouter l'ami avec des stats mockées
  const newFriend = {
    uuid,
    displayName: name,
    score: Math.floor(Math.random() * 20) + 75, // Score entre 75 et 95
    avgTime: (Math.random() * 10 + 8).toFixed(1) // Temps entre 8 et 18 secondes
  };
  
  socialState.friends.push(newFriend);
  
  console.log('[Social] ✅ Ami ajouté:', newFriend);
  
  return newFriend;
}

/**
 * Retourne les statistiques sociales du dernier quiz
 * @returns {object}
 */
export function getLastQuizSocialStats() {
  return { ...socialState.lastQuizSocialStats };
}

/**
 * Retourne la dynamique sociale de la classe
 * @returns {object}
 */
export function getClassSocialDynamics() {
  return { ...socialState.classSocialDynamics };
}

/**
 * Retourne le leaderboard social de la classe
 * @returns {Array}
 */
export function getClassSocialLeaderboard() {
  // Simuler un leaderboard avec les amis + quelques autres élèves
  const leaderboard = [
    { name: "Inès", score: 95, avgTime: 9.5, socialRank: 1 },
    { name: "Sarah", score: 92, avgTime: 10.2, socialRank: 2 },
    { name: "Moi", score: 87, avgTime: 11.8, socialRank: 3 },
    { name: "Lucas", score: 88, avgTime: 11.3, socialRank: 4 },
    { name: "Nathan", score: 85, avgTime: 12.5, socialRank: 5 },
    { name: "Marie", score: 82, avgTime: 13.7, socialRank: 6 },
    { name: "Omar", score: 78, avgTime: 15.8, socialRank: 7 }
  ];
  
  return leaderboard;
}

/**
 * Retourne les données pour un graphique de comparaison sociale
 * @returns {object}
 */
export function getSocialComparisonData() {
  return {
    labels: ['Moi', 'Moyenne amis', 'Moyenne classe'],
    scores: [
      socialState.lastQuizSocialStats.myScore,
      socialState.lastQuizSocialStats.friendsAverage,
      socialState.lastQuizSocialStats.classAverage
    ],
    times: [
      socialState.lastQuizSocialStats.myAvgTime,
      11.5, // Moyenne amis
      12.8  // Moyenne classe
    ],
    source: socialState.source
  };
}

/**
 * Retourne les données pour un graphique de classement entre amis
 * @returns {object}
 */
export function getFriendsRankingData() {
  // Trier les amis par score décroissant
  const sortedFriends = [...socialState.friends]
    .sort((a, b) => b.score - a.score);
  
  // Ajouter "Moi" dans le classement
  const myRank = socialState.lastQuizSocialStats.rank;
  const allRanked = sortedFriends.map((friend, idx) => ({
    name: friend.displayName,
    score: friend.score,
    rank: idx + 1
  }));
  
  // Insérer "Moi" à la bonne position
  allRanked.splice(myRank - 1, 0, {
    name: "Moi",
    score: socialState.lastQuizSocialStats.myScore,
    rank: myRank
  });
  
  return {
    labels: allRanked.map(r => r.name),
    scores: allRanked.map(r => r.score),
    myRank: myRank
  };
}

/**
 * Retourne les statistiques sociales d'une classe
 * @param {string} classId - ID de la classe
 * @param {string} schoolId - ID de l'établissement (optionnel, utilise l'établissement actif si non fourni)
 * @returns {object|null}
 */
export function getClassSocialStats(classId, schoolId = null) {
  const activeSchoolId = schoolId || getActiveSchoolId();
  if (!activeSchoolId || !socialStats[activeSchoolId]) {
    console.warn('[Social] Établissement introuvable:', activeSchoolId);
    return null;
  }
  
  const schoolStats = socialStats[activeSchoolId];
  if (!schoolStats[classId]) {
    console.warn('[Social] Classe introuvable:', classId);
    return null;
  }
  
  return { ...schoolStats[classId] };
}

/**
 * Retourne la distribution sociale globale d'une classe
 * @param {string} classId - ID de la classe
 * @param {string} schoolId - ID de l'établissement (optionnel)
 * @returns {object|null}
 */
export function getGlobalSocialDistribution(classId, schoolId = null) {
  const stats = getClassSocialStats(classId, schoolId);
  if (!stats) return null;
  
  return { ...stats.socialDistribution };
}

/**
 * Retourne les données de progression moyenne d'une classe (pour graphique)
 * @param {string} classId - ID de la classe
 * @param {string} schoolId - ID de l'établissement (optionnel)
 * @returns {object|null}
 */
export function getClassProgressionData(classId, schoolId = null) {
  const stats = getClassSocialStats(classId, schoolId);
  if (!stats) return null;
  
  // Générer des données de progression mockées (8 dernières semaines)
  const weeks = [];
  const scores = [];
  const now = new Date();
  
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7));
    weeks.push(`S${i + 1}`);
    
    // Progression simulée autour de la moyenne
    const baseScore = stats.avgScore;
    const variation = (Math.random() - 0.5) * 2; // -1 à +1
    scores.push(Math.max(10, Math.min(20, baseScore + variation)));
  }
  
  return {
    labels: weeks,
    scores,
    avgScore: stats.avgScore
  };
}

/**
 * Retourne les données pour un heatmap scores × temps de réponse
 * @param {string} classId - ID de la classe
 * @param {string} schoolId - ID de l'établissement (optionnel)
 * @returns {object|null}
 */
export function getHeatmapData(classId, schoolId = null) {
  const stats = getClassSocialStats(classId, schoolId);
  if (!stats) return null;
  
  // Générer des données mockées pour le heatmap
  const timeRanges = ['0-30s', '30-45s', '45-60s', '60-75s', '75s+'];
  const scoreRanges = ['0-10', '10-12', '12-14', '14-16', '16-18', '18-20'];
  
  const data = [];
  scoreRanges.forEach((scoreRange, scoreIdx) => {
    timeRanges.forEach((timeRange, timeIdx) => {
      // Générer des valeurs aléatoires mais cohérentes
      const value = Math.floor(Math.random() * 5);
      if (value > 0) {
        data.push({
          x: timeRange,
          y: scoreRange,
          v: value
        });
      }
    });
  });
  
  return {
    timeRanges,
    scoreRanges,
    data
  };
}

/**
 * Retourne le leaderboard filtré d'une classe
 * @param {string} classId - ID de la classe
 * @param {string} filter - 'top' | 'struggling' | 'fast' | 'all'
 * @param {string} schoolId - ID de l'établissement (optionnel)
 * @returns {Array}
 */
export function getFilteredLeaderboard(classId, filter = 'all', schoolId = null) {
  const stats = getClassSocialStats(classId, schoolId);
  if (!stats) return [];
  
  switch (filter) {
    case 'top':
      return [...stats.topPerformers];
    case 'struggling':
      return [...stats.struggling];
    case 'fast':
      // Retourner les élèves avec le meilleur ratio score/temps
      const allStudents = [...stats.topPerformers, ...stats.struggling];
      return allStudents
        .map(s => ({ ...s, ratio: s.score / s.time }))
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 5);
    default:
      return [...stats.topPerformers, ...stats.struggling];
  }
}

/**
 * Retourne les stats sociales de tous les établissements (pour comparaison)
 * @returns {Array}
 */
export function getAllSchoolsSocialStats() {
  const allStats = [];
  
  Object.keys(socialStats).forEach(schoolId => {
    const schoolData = socialStats[schoolId];
    const classIds = Object.keys(schoolData);
    
    // Calculer la moyenne de toutes les classes de l'établissement
    let totalScore = 0;
    let totalTime = 0;
    let classCount = 0;
    
    classIds.forEach(classId => {
      const classStats = schoolData[classId];
      totalScore += classStats.avgScore;
      totalTime += classStats.avgResponseTime;
      classCount++;
    });
    
    allStats.push({
      schoolId,
      avgScore: totalScore / classCount,
      avgResponseTime: totalTime / classCount,
      classesCount: classCount
    });
  });
  
  return allStats;
}

// Initialiser le profil au chargement
initSocialProfile();

export default {
  getSocialProfile,
  getFriends,
  addFriendByUuid,
  getLastQuizSocialStats,
  getClassSocialDynamics,
  getClassSocialLeaderboard,
  getSocialComparisonData,
  getFriendsRankingData,
  getClassSocialStats,
  getGlobalSocialDistribution,
  getClassProgressionData,
  getHeatmapData,
  getFilteredLeaderboard,
  getAllSchoolsSocialStats
};

