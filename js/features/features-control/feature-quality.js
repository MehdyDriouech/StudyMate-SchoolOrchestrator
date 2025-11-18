/**
 * Feature Qualité - Workflow de validation des contenus
 */

import {
  getSubmittedThemes,
  getApprovedThemes,
  approveTheme,
  rejectTheme,
  getThemeById as getThemeByIdFromStore
} from './store-themes.js';
import ActivityTimelineStore from './store-timeline.js';
import { getCurrentUser } from './feature-auth.js';

const QUALITY_THEMES = [
  {
    id: 'quality_math_sequences',
    title: 'Suites numériques - Terminale 2',
    subject: 'Mathématiques',
    author: 'Prof. Martin',
    status: 'pending_review',
    updatedAt: '2024-11-15T10:00:00Z',
    preview: 'Introduction aux suites arithmétiques et géométriques avec exemples progressifs.',
    timeline: [
      { status: 'draft', label: 'Créé par Prof. Martin', at: '2024-11-12T08:00:00Z' },
      { status: 'pending_review', label: 'Soumis à validation', at: '2024-11-15T10:00:00Z' }
    ]
  },
  {
    id: 'quality_philo_conscience',
    title: 'Philo - La conscience',
    subject: 'Philosophie',
    author: 'Prof. Lenoir',
    status: 'draft',
    updatedAt: '2024-11-14T09:20:00Z',
    preview: 'Plan détaillé + citations pour structurer un débat sur la conscience.',
    timeline: [
      { status: 'draft', label: 'Brouillon enregistré', at: '2024-11-14T09:20:00Z' }
    ]
  },
  {
    id: 'quality_history_europe',
    title: 'Histoire - Construction européenne',
    subject: 'Histoire-Géo',
    author: 'Prof. Durand',
    status: 'approved',
    updatedAt: '2024-11-13T15:45:00Z',
    preview: 'Frise chronologique interactive sur les grandes dates de l’UE.',
    timeline: [
      { status: 'draft', at: '2024-11-10T08:00:00Z', label: 'Création' },
      { status: 'pending_review', at: '2024-11-11T11:00:00Z', label: 'Soumis au pédago' },
      { status: 'approved', at: '2024-11-13T15:45:00Z', label: 'Validé et prêt à publier' }
    ]
  },
  {
    id: 'quality_stats_probabilities',
    title: 'Statistiques - Probabilités conditionnelles',
    subject: 'Mathématiques',
    author: 'Prof. Chen',
    status: 'published',
    updatedAt: '2024-11-12T07:40:00Z',
    preview: 'Fiche synthèse + quiz interactif sur les probabilités conditionnelles.',
    timeline: [
      { status: 'draft', label: 'Créé', at: '2024-11-08T08:00:00Z' },
      { status: 'pending_review', label: 'Soumis', at: '2024-11-09T12:00:00Z' },
      { status: 'approved', label: 'Validé', at: '2024-11-10T17:00:00Z' },
      { status: 'published', label: 'Publié pour les classes S', at: '2024-11-12T07:40:00Z' }
    ]
  }
];

let themesState = QUALITY_THEMES.map(theme => ({ ...theme }));

/**
 * Combine les thèmes mockés avec les thèmes soumis depuis AI Theme Studio
 */
function enrichThemeFromStore(storeTheme) {
  return {
    ...storeTheme,
    preview: storeTheme.description || 'Thème généré via AI Theme Studio',
    timeline: [
      { status: 'draft', label: 'Créé via AI Theme Studio', at: storeTheme.generatedAt || storeTheme.createdAt },
      { status: 'pending_review', label: 'Soumis à validation', at: storeTheme.submittedAt }
    ],
    origin: storeTheme.origin || 'ai_theme_studio',
    classes: storeTheme.classes || []
  };
}

export function getQualityThemes() {
  // Récupérer les thèmes soumis depuis AI Theme Studio
  const submittedFromAI = getSubmittedThemes().map(enrichThemeFromStore);
  
  // Combiner avec les thèmes mockés existants
  const allThemes = [
    ...themesState.map(theme => ({ ...theme, timeline: theme.timeline.map(item => ({ ...item })) })),
    ...submittedFromAI
  ];
  
  return allThemes;
}

export function getQualityStats() {
  const submittedFromAI = getSubmittedThemes();
  const allThemes = [...themesState, ...submittedFromAI];
  
  return allThemes.reduce(
    (acc, theme) => {
      acc[theme.status] = (acc[theme.status] || 0) + 1;
      return acc;
    },
    { draft: 0, pending_review: 0, approved: 0, published: 0, needs_revision: 0, rejected: 0 }
  );
}

export function getThemeById(themeId) {
  // Chercher d'abord dans le store (thèmes soumis depuis AI)
  const storeTheme = getThemeByIdFromStore(themeId);
  if (storeTheme) {
    return enrichThemeFromStore(storeTheme);
  }
  
  // Sinon chercher dans les thèmes mockés
  const theme = themesState.find(t => t.id === themeId);
  if (!theme) return null;
  return { ...theme, timeline: theme.timeline.map(item => ({ ...item })) };
}

export function updateThemeStatus(themeId, nextStatus, note = '') {
  const labels = {
    draft: 'Rebasculé en brouillon',
    pending_review: 'Repassé en révision',
    approved: 'Validé par la direction',
    published: 'Publié dans le catalogue',
    needs_revision: 'Correction demandée',
    rejected: 'Rejeté'
  };

  // Vérifier si c'est un thème du store (soumis depuis AI)
  const storeTheme = getThemeByIdFromStore(themeId);
  if (storeTheme && storeTheme.status === 'pending_review') {
    // Utiliser le store pour les thèmes soumis depuis AI
    if (nextStatus === 'approved') {
      const approved = approveTheme(themeId);
      const currentUser = getCurrentUser();
      if (currentUser) {
        ActivityTimelineStore.logEvent('theme_approved', currentUser.email, currentUser.role, {
          themeId: themeId,
          themeTitle: approved.title || storeTheme.title
        });
      }
      return getThemeById(themeId);
    } else if (nextStatus === 'rejected' || nextStatus === 'needs_revision') {
      const rejected = rejectTheme(themeId, note, nextStatus);
      const currentUser = getCurrentUser();
      if (currentUser) {
        ActivityTimelineStore.logEvent('theme_rejected', currentUser.email, currentUser.role, {
          themeId: themeId,
          themeTitle: rejected.title || storeTheme.title,
          reason: note
        });
      }
      return getThemeById(themeId);
    }
  }

  // Pour les thèmes mockés, utiliser l'ancienne logique
  themesState = themesState.map(theme => {
    if (theme.id !== themeId) return theme;
    const updated = {
      ...theme,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...theme.timeline,
        {
          status: nextStatus,
          label: note || labels[nextStatus] || 'Mise à jour du statut',
          at: new Date().toISOString()
        }
      ]
    };
    return updated;
  });
  return getThemeById(themeId);
}

export default {
  getQualityThemes,
  getQualityStats,
  getThemeById,
  updateThemeStatus
};

