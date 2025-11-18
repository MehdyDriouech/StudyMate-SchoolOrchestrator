/**
 * Feature Class Summary - Logique métier pour le résumé de classe
 * Calcule les KPIs, identifie les élèves en difficulté/avancés, etc.
 */

import { getCurrentUser } from './feature-auth.js';
import { getClasses, getActiveSchoolId } from './store-multischool.js';
import { getAssignmentsByClass } from './store-class-theme-assignments.js';
import StudentSubmissionsStore from './store-submissions.js';
import { getClassSocialStats } from './feature-social.js';
import { getPublishedThemesByClass, getThemeById } from './store-themes.js';

/**
 * Charge les données du résumé de classe
 * @param {string} classId - ID de la classe (optionnel, utilise la première classe si non fourni)
 * @returns {Promise<object>}
 */
export async function loadClassSummaryData(classId = null) {
  console.log('[Class Summary] Chargement des données pour la classe:', classId);
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const user = getCurrentUser();
  const activeSchoolId = getActiveSchoolId();
  const classes = getClasses();
  
  // Si pas de classId fourni, utiliser la première classe de l'établissement
  if (!classId && classes.length > 0) {
    classId = classes[0].id;
  }
  
  // Si toujours pas de classId, utiliser 'class_term_s1' par défaut pour la démo
  if (!classId) {
    classId = 'class_term_s1';
  }
  
  let classInfo = classes.find(c => c.id === classId);
  if (!classInfo) {
    // Si la classe n'est pas trouvée, créer un objet par défaut pour la démo
    classInfo = {
      id: classId,
      name: classId.replace('class_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Classe',
      students: 28
    };
  }
  
  // Récupérer les assignations de la classe
  // Essayer d'abord avec l'ID exact, puis avec l'ID compatible
  let assignments = getAssignmentsByClass(classId, { now: new Date() });
  if (assignments.length === 0) {
    const compatibleClassId = classId.replace('class_', '');
    assignments = getAssignmentsByClass(compatibleClassId, { now: new Date() });
  }
  
  // Récupérer les soumissions pour cette classe
  // Note: les assignments peuvent utiliser 'terminale_s1' alors que les classes utilisent 'class_term_s1'
  // On filtre par classId ou par un ID compatible
  const allSubmissions = StudentSubmissionsStore.getSubmissionsForTeacher(user?.email || 'teacher@ecole.fr');
  const compatibleClassId = classId.replace('class_', ''); // 'class_term_s1' -> 'terminale_s1'
  const classSubmissions = allSubmissions.filter(s => 
    s.classId === classId || s.classId === compatibleClassId
  );
  
  // Récupérer les stats sociales de la classe
  const socialStats = getClassSocialStats(classId, activeSchoolId);
  
  // Calculer les KPIs
  const kpis = calculateKPIs(assignments, classSubmissions, classInfo, socialStats);
  
  // Identifier les élèves en difficulté et avancés
  const studentsData = identifyStudents(classSubmissions, socialStats, classInfo);
  
  // Récupérer les thèmes récents
  const recentThemes = getRecentThemes(assignments, classSubmissions);
  
  // Préparer les données pour les graphiques
  const chartData = prepareChartData(classSubmissions, socialStats, classInfo);
  
  return {
    classInfo,
    kpis,
    studentsData,
    recentThemes,
    chartData
  };
}

/**
 * Calcule les KPIs principaux
 * @param {Array} assignments - Assignations de la classe
 * @param {Array} submissions - Soumissions de la classe
 * @param {object} classInfo - Informations de la classe
 * @param {object} socialStats - Stats sociales
 * @returns {object}
 */
function calculateKPIs(assignments, submissions, classInfo, socialStats) {
  const totalStudents = classInfo.students || 28;
  
  // Taux de rendus moyen
  const activeAssignments = assignments.filter(a => {
    const now = new Date();
    const startAt = new Date(a.startAt);
    const endAt = new Date(a.endAt);
    return startAt <= now && now <= endAt;
  });
  
  let totalSubmissions = 0;
  let totalExpected = 0;
  
  activeAssignments.forEach(assignment => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
    totalSubmissions += assignmentSubmissions.length;
    totalExpected += totalStudents;
  });
  
  const submissionRate = totalExpected > 0 ? Math.round((totalSubmissions / totalExpected) * 100) : 0;
  
  // Nombre de thèmes actifs cette semaine
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeThemesThisWeek = assignments.filter(a => {
    const publishedAt = new Date(a.publishedAt || a.createdAt);
    return publishedAt >= oneWeekAgo;
  }).length;
  
  // Score moyen de la classe
  const gradedSubmissions = submissions.filter(s => s.score !== null && s.status === 'graded');
  const avgScore = gradedSubmissions.length > 0
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length)
    : (socialStats?.avgScore ? Math.round(socialStats.avgScore * 5) : 0); // Convertir /20 si nécessaire
  
  // Pourcentage d'élèves en difficulté (score < 10/20)
  const strugglingThreshold = 10;
  const strugglingCount = socialStats?.struggling?.length || 0;
  const strugglingPercentage = Math.round((strugglingCount / totalStudents) * 100);
  
  return {
    submissionRate,
    activeThemesCount: activeAssignments.length,
    activeThemesThisWeek,
    avgScore,
    strugglingPercentage,
    totalStudents
  };
}

/**
 * Identifie les élèves en difficulté et les élèves moteurs
 * @param {Array} submissions - Soumissions de la classe
 * @param {object} socialStats - Stats sociales
 * @param {object} classInfo - Informations de la classe
 * @returns {object}
 */
function identifyStudents(submissions, socialStats, classInfo) {
  // Utiliser les stats sociales si disponibles
  // Les scores individuels restent sur 20 (ne pas convertir)
  const struggling = (socialStats?.struggling || []).map(s => ({
    name: s.name,
    avgScore: s.score || 0, // Score sur 20
    missingSubmissions: Math.floor(Math.random() * 3) + 1 // Mock
  }));
  
  const topPerformers = (socialStats?.topPerformers || []).map(s => ({
    name: s.name,
    avgScore: s.score || 0, // Score sur 20
    avgTime: s.time || 0
  }));
  
  // Si pas de stats sociales, générer des données mockées (scores sur 20)
  if (struggling.length === 0) {
    struggling.push(
      { name: 'Omar', avgScore: 9, missingSubmissions: 2 },
      { name: 'Paul', avgScore: 8, missingSubmissions: 3 },
      { name: 'Marie', avgScore: 10, missingSubmissions: 1 }
    );
  }
  
  if (topPerformers.length === 0) {
    topPerformers.push(
      { name: 'Nathan', avgScore: 18, avgTime: 40 },
      { name: 'Sarah', avgScore: 17, avgTime: 42 },
      { name: 'Inès', avgScore: 18, avgTime: 38 }
    );
  }
  
  return {
    struggling: struggling.slice(0, 5), // Top 5
    topPerformers: topPerformers.slice(0, 5) // Top 5
  };
}

/**
 * Récupère les thèmes récents avec leurs stats
 * @param {Array} assignments - Assignations
 * @param {Array} submissions - Soumissions
 * @returns {Array}
 */
function getRecentThemes(assignments, submissions) {
  // Trier les assignations par date de publication (plus récentes en premier)
  const sortedAssignments = [...assignments].sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt);
    const dateB = new Date(b.publishedAt || b.createdAt);
    return dateB - dateA;
  });
  
  // Prendre les 5 plus récents
  const recentAssignments = sortedAssignments.slice(0, 5);
  
  return recentAssignments.map(assignment => {
    const theme = getThemeById(assignment.themeId);
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
    
    // Calculer le taux de complétion
    const totalStudents = 28; // Mock, devrait venir de classInfo
    const completionRate = totalStudents > 0
      ? Math.round((assignmentSubmissions.length / totalStudents) * 100)
      : 0;
    
    return {
      id: assignment.id,
      themeId: assignment.themeId,
      title: theme?.title || 'Thème inconnu',
      dueDate: assignment.dueAt,
      publishedAt: assignment.publishedAt || assignment.createdAt,
      completionRate,
      totalSubmissions: assignmentSubmissions.length,
      totalStudents
    };
  });
}

/**
 * Prépare les données pour les graphiques
 * @param {Array} submissions - Soumissions
 * @param {object} socialStats - Stats sociales
 * @param {object} classInfo - Informations de la classe
 * @returns {object}
 */
function prepareChartData(submissions, socialStats, classInfo) {
  // Graphique de distribution des scores
  const scoreDistribution = calculateScoreDistribution(submissions, socialStats);
  
  // Graphique de rendus par thème
  const submissionsByTheme = calculateSubmissionsByTheme(submissions);
  
  return {
    scoreDistribution,
    submissionsByTheme
  };
}

/**
 * Calcule la distribution des scores
 * @param {Array} submissions - Soumissions
 * @param {object} socialStats - Stats sociales
 * @returns {object}
 */
function calculateScoreDistribution(submissions, socialStats) {
  // Utiliser les stats sociales si disponibles
  if (socialStats?.socialDistribution) {
    return {
      labels: ['Top 20%', 'Milieu 60%', 'Bas 20%'],
      data: [
        socialStats.socialDistribution.top20 || 0,
        socialStats.socialDistribution.middle60 || 0,
        socialStats.socialDistribution.bottom20 || 0
      ]
    };
  }
  
  // Sinon, calculer depuis les soumissions
  const gradedSubmissions = submissions.filter(s => s.score !== null);
  
  if (gradedSubmissions.length === 0) {
    // Données mockées par défaut
    return {
      labels: ['Top 20%', 'Milieu 60%', 'Bas 20%'],
      data: [6, 16, 6]
    };
  }
  
  const scores = gradedSubmissions.map(s => s.score);
  const total = scores.length;
  const sorted = [...scores].sort((a, b) => b - a);
  
  const top20 = Math.ceil(total * 0.2);
  const bottom20 = Math.ceil(total * 0.2);
  
  return {
    labels: ['Top 20%', 'Milieu 60%', 'Bas 20%'],
    data: [
      top20,
      total - top20 - bottom20,
      bottom20
    ]
  };
}

/**
 * Calcule les rendus par thème
 * @param {Array} submissions - Soumissions
 * @returns {object}
 */
function calculateSubmissionsByTheme(submissions) {
  // Grouper par assignmentId
  const byAssignment = {};
  
  submissions.forEach(sub => {
    if (!byAssignment[sub.assignmentId]) {
      byAssignment[sub.assignmentId] = {
        assignmentId: sub.assignmentId,
        themeId: sub.themeId,
        count: 0
      };
    }
    byAssignment[sub.assignmentId].count++;
  });
  
  // Récupérer les thèmes pour les labels
  const themes = Object.values(byAssignment).map(item => {
    const theme = getThemeById(item.themeId);
    return {
      label: theme?.title || `Thème ${item.themeId.slice(-4)}`,
      count: item.count,
      totalStudents: 28 // Mock
    };
  });
  
  // Trier par nombre de soumissions (décroissant) et prendre les 5 premiers
  const sorted = themes.sort((a, b) => b.count - a.count).slice(0, 5);
  
  return {
    labels: sorted.map(t => t.label),
    data: sorted.map(t => Math.round((t.count / t.totalStudents) * 100)),
    counts: sorted.map(t => t.count)
  };
}

/**
 * Formate une date pour l'affichage
 * @param {string} dateString - Date ISO string
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formate une date relative (ex: "il y a 3 jours")
 * @param {string} dateString - Date ISO string
 * @returns {string}
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  return formatDate(dateString);
}

export default {
  loadClassSummaryData,
  formatDate,
  formatRelativeDate
};

