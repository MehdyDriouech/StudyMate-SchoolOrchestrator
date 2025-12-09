/**
 * Store Theme Reviews - Gestion des reviews qualité des thèmes
 * Gère l'état des reviews et les appels API
 */

import api from '../../app-service.js';

// État interne
const state = {
  themeReviews: {}, // { [themeId]: [review, ...] }
  loading: {}, // { [themeId]: boolean }
  errors: {} // { [themeId]: string }
};

/**
 * Récupère les reviews d'un thème
 * @param {number} themeId - ID du thème
 * @returns {Promise<Array>}
 */
export async function fetchThemeReviews(themeId) {
  if (!themeId) {
    throw new Error('Theme ID requis');
  }

  state.loading[themeId] = true;
  state.errors[themeId] = null;

  try {
    const response = await api.get(`/themes/${themeId}/reviews`);
    
    if (response.success && Array.isArray(response.data)) {
      state.themeReviews[themeId] = response.data;
      return response.data;
    } else {
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error(`[Store Theme Reviews] Erreur lors de la récupération des reviews pour le thème ${themeId}:`, error);
    state.errors[themeId] = error.message || 'Erreur lors du chargement des reviews';
    throw error;
  } finally {
    state.loading[themeId] = false;
  }
}

/**
 * Crée une nouvelle review pour un thème
 * @param {number} themeId - ID du thème
 * @param {object} payload - { action, comment }
 * @returns {Promise<object>}
 */
export async function createThemeReview(themeId, payload) {
  if (!themeId) {
    throw new Error('Theme ID requis');
  }

  if (!payload || !payload.action) {
    throw new Error('Action requise');
  }

  const allowedActions = ['submitted', 'approved', 'rejected', 'needs_changes'];
  if (!allowedActions.includes(payload.action)) {
    throw new Error(`Action invalide. Valeurs autorisées: ${allowedActions.join(', ')}`);
  }

  state.loading[themeId] = true;
  state.errors[themeId] = null;

  try {
    const response = await api.post(`/themes/${themeId}/reviews`, {
      action: payload.action,
      comment: payload.comment || null
    });

    if (response.success && response.data) {
      // Ajouter la review au state (optimistic update)
      if (!state.themeReviews[themeId]) {
        state.themeReviews[themeId] = [];
      }
      state.themeReviews[themeId].unshift(response.data); // Ajouter au début
      
      return response.data;
    } else {
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error(`[Store Theme Reviews] Erreur lors de la création de la review pour le thème ${themeId}:`, error);
    state.errors[themeId] = error.message || 'Erreur lors de la création de la review';
    throw error;
  } finally {
    state.loading[themeId] = false;
  }
}

/**
 * Récupère les reviews d'un thème depuis le state (sans appel API)
 * @param {number} themeId - ID du thème
 * @returns {Array}
 */
export function getThemeReviews(themeId) {
  return state.themeReviews[themeId] || [];
}

/**
 * Vérifie si les reviews sont en cours de chargement
 * @param {number} themeId - ID du thème
 * @returns {boolean}
 */
export function isLoading(themeId) {
  return state.loading[themeId] === true;
}

/**
 * Récupère l'erreur éventuelle pour un thème
 * @param {number} themeId - ID du thème
 * @returns {string|null}
 */
export function getError(themeId) {
  return state.errors[themeId] || null;
}

/**
 * Réinitialise le state pour un thème
 * @param {number} themeId - ID du thème
 */
export function clearThemeReviews(themeId) {
  delete state.themeReviews[themeId];
  delete state.loading[themeId];
  delete state.errors[themeId];
}

export default {
  fetchThemeReviews,
  createThemeReview,
  getThemeReviews,
  isLoading,
  getError,
  clearThemeReviews
};

