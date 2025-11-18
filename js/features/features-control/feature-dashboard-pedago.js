/**
 * Feature Dashboard Pedago - Logique métier pour le directeur pédagogique
 */

import { loadCurriculumData } from './feature-curriculum-builder.js';
import { getSavedThemes as getAiStudioSavedThemes } from './feature-ai-theme-studio.js';

const SUBJECT_DEFINITIONS = [
  { id: 'math', label: 'Mathématiques', color: '#0ea5e9' },
  { id: 'philo', label: 'Philosophie', color: '#f97316' },
  { id: 'hg', label: 'Histoire-Géo', color: '#8b5cf6' }
];

const QUALITY_THEMES_BASE = [
  {
    id: 'theme_suites',
    title: 'Suites numériques et convergence',
    subject: 'Mathématiques',
    author: 'Prof. Martin',
    status: 'pending_review',
    lastAction: '2024-11-16T10:00:00Z'
  },
  {
    id: 'theme_philo_bonheur',
    title: 'Philosophie - Le bonheur et la vérité',
    subject: 'Philosophie',
    author: 'Prof. Lenoir',
    status: 'draft',
    lastAction: '2024-11-15T08:30:00Z'
  },
  {
    id: 'theme_hg_guerre',
    title: 'Histoire - La guerre froide',
    subject: 'Histoire-Géo',
    author: 'Prof. Durand',
    status: 'approved',
    lastAction: '2024-11-14T17:45:00Z'
  },
  {
    id: 'theme_stats_leq',
    title: 'Maths appliqués - Lois exponentielles',
    subject: 'Mathématiques',
    author: 'Prof. Chen',
    status: 'published',
    lastAction: '2024-11-13T11:10:00Z'
  }
];

const THEME_TIMELINES = {
  theme_suites: [
    { status: 'draft', label: 'Création du brouillon', at: '2024-11-12T09:00:00Z' },
    { status: 'pending_review', label: 'Soumis à validation', at: '2024-11-16T10:00:00Z' }
  ],
  theme_philo_bonheur: [
    { status: 'draft', label: 'Brouillon initial', at: '2024-11-15T08:30:00Z' }
  ],
  theme_hg_guerre: [
    { status: 'draft', label: 'Création du thème', at: '2024-11-10T15:10:00Z' },
    { status: 'pending_review', label: 'Envoyé pour validation', at: '2024-11-12T11:00:00Z' },
    { status: 'approved', label: 'Validé par le pédago', at: '2024-11-14T17:45:00Z' }
  ],
  theme_stats_leq: [
    { status: 'draft', label: 'Création', at: '2024-11-09T08:40:00Z' },
    { status: 'pending_review', label: 'Attente validation', at: '2024-11-10T13:20:00Z' },
    { status: 'approved', label: 'Validé', at: '2024-11-11T10:00:00Z' },
    { status: 'published', label: 'Publié sur le catalogue', at: '2024-11-13T11:10:00Z' }
  ]
};

const AI_THEME_PIPELINE = [
  {
    id: 'ai_theme_math_sequences',
    title: 'Suites numériques - Terminale 2',
    creator: 'Prof. Martin',
    status: 'pending_review',
    classes: ['Terminale 2 – spé Maths'],
    updatedAt: '2024-11-15T14:00:00Z'
  },
  {
    id: 'ai_theme_philo_conscience',
    title: 'Philo - La conscience',
    creator: 'Prof. Lenoir',
    status: 'draft',
    classes: ['Terminale L'],
    updatedAt: '2024-11-14T09:20:00Z'
  },
  {
    id: 'ai_theme_hg_europe',
    title: 'Histoire - Construction européenne',
    creator: 'Prof. Durand',
    status: 'approved',
    classes: ['Première ES2'],
    updatedAt: '2024-11-13T17:05:00Z'
  }
];

let curriculumSnapshot = null;
let qualityThemesState = QUALITY_THEMES_BASE.map(theme => ({
  ...theme,
  timeline: THEME_TIMELINES[theme.id] ? [...THEME_TIMELINES[theme.id]] : []
}));

/**
 * Retourne la couverture du curriculum (périodes, matières, progrès)
 * @returns {Promise<object>}
 */
export async function getCurriculumCoverage() {
  if (!curriculumSnapshot) {
    try {
      curriculumSnapshot = await loadCurriculumData();
    } catch (error) {
      console.warn('[Dashboard Pedago] Impossible de charger le curriculum, fallback données locales', error);
      curriculumSnapshot = null;
    }
  }

  return computeCoverageFromSnapshot(curriculumSnapshot);
}

function computeCoverageFromSnapshot(snapshot) {
  if (!snapshot) {
    return {
      periods: [],
      subjects: SUBJECT_DEFINITIONS,
      heatmap: [],
      totals: { totalSequences: 0, completedSequences: 0, delayedPeriods: 0, completionRate: 0 },
      lastUpdated: new Date().toISOString()
    };
  }

  const subjectCounts = SUBJECT_DEFINITIONS.reduce((acc, subj) => ({ ...acc, [subj.id]: 0 }), {});
  let totalSequences = 0;
  let completedSequences = 0;

  const periodSummaries = snapshot.periods.map(period => {
    const total = period.sequences.length;
    const completed = period.sequences.filter(seq => seq.status === 'completed').length;
    const inProgress = period.sequences.filter(seq => seq.status === 'in_progress').length;
    const delayed = period.sequences.some(seq => seq.status === 'planned');
    const subjectDistribution = SUBJECT_DEFINITIONS.reduce((acc, subj) => ({ ...acc, [subj.id]: 0 }), {});

    period.sequences.forEach(seq => {
      const subjectId = inferSubjectFromTitle(seq.title);
      subjectDistribution[subjectId] = (subjectDistribution[subjectId] || 0) + 1;
      subjectCounts[subjectId] = (subjectCounts[subjectId] || 0) + 1;
    });

    totalSequences += total;
    completedSequences += completed;

    return {
      id: period.id,
      name: period.name,
      total,
      completed,
      inProgress,
      delayed,
      progress: total ? Math.round((completed / total) * 100) : 0,
      subjectDistribution
    };
  });

  const heatmap = periodSummaries.map(period => ({
    periodId: period.id,
    periodLabel: period.name,
    cells: SUBJECT_DEFINITIONS.map(subject => ({
      subjectId: subject.id,
      value: period.subjectDistribution[subject.id] || 0
    }))
  }));

  const delayedPeriods = periodSummaries.filter(p => p.delayed).length;
  const completionRate = totalSequences ? Math.round((completedSequences / totalSequences) * 100) : 0;

  return {
    periods: periodSummaries,
    subjects: SUBJECT_DEFINITIONS,
    heatmap,
    totals: { totalSequences, completedSequences, delayedPeriods, completionRate },
    lastUpdated: new Date().toISOString()
  };
}

function inferSubjectFromTitle(title = '') {
  const lower = title.toLowerCase();
  if (lower.includes('suite') || lower.includes('fonctions') || lower.includes('probabilit') || lower.includes('math')) {
    return 'math';
  }
  if (lower.includes('philo') || lower.includes('conscience') || lower.includes('bonheur')) {
    return 'philo';
  }
  return 'hg';
}

/**
 * Retourne la liste des thèmes du workflow qualité
 * @returns {{themes: Array, stats: object}}
 */
export function getQualityWorkflowSummary() {
  const stats = qualityThemesState.reduce(
    (acc, theme) => {
      acc[theme.status] = (acc[theme.status] || 0) + 1;
      return acc;
    },
    { draft: 0, pending_review: 0, approved: 0, published: 0 }
  );

  return {
    themes: qualityThemesState,
    stats,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Retourne les détails d'un thème (timeline, statut)
 * @param {string} themeId
 */
export function getThemeDetails(themeId) {
  return qualityThemesState.find(theme => theme.id === themeId) || null;
}

/**
 * Met à jour le statut d'un thème et journalise la timeline
 * @param {string} themeId
 * @param {string} newStatus
 */
export function changeThemeStatus(themeId, newStatus) {
  const allowedStatuses = ['draft', 'pending_review', 'approved', 'published'];
  if (!allowedStatuses.includes(newStatus)) {
    console.warn('[Dashboard Pedago] Statut invalide', newStatus);
    return getThemeDetails(themeId);
  }

  qualityThemesState = qualityThemesState.map(theme => {
    if (theme.id !== themeId) return theme;
    const updated = {
      ...theme,
      status: newStatus,
      lastAction: new Date().toISOString(),
      timeline: [
        ...(theme.timeline || []),
        {
          status: newStatus,
          label: `Statut passé à ${statusLabel(newStatus)}`,
          at: new Date().toISOString()
        }
      ]
    };
    return updated;
  });

  return getThemeDetails(themeId);
}

/**
 * Résumé des thèmes générés via AI Theme Studio
 */
export function getAiThemesSummary() {
  const savedThemes = getAiStudioSavedThemes();

  const savedFromStudio = savedThemes.map(theme => ({
    id: theme.id || `ai_theme_${Date.now()}`,
    title: theme.title || 'Thème sans titre',
    creator: 'AI Theme Studio',
    status: theme.status || 'draft',
    classes: theme.classes?.map(cls => cls.label) || [],
    updatedAt: theme.savedAt || theme.generatedAt || new Date().toISOString()
  }));

  const combined = [...AI_THEME_PIPELINE, ...savedFromStudio];
  return combined;
}

function statusLabel(status) {
  const labels = {
    draft: 'Brouillon',
    pending_review: 'À valider',
    approved: 'Validé',
    published: 'Publié'
  };
  return labels[status] || status;
}

export default {
  getCurriculumCoverage,
  getQualityWorkflowSummary,
  getThemeDetails,
  changeThemeStatus,
  getAiThemesSummary
};


