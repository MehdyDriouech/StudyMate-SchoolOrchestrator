/**
 * Store Stats - Gestion des statistiques (overview et multi-écoles)
 * Gère l'état des statistiques et les appels API
 */

import api from '../../app-service.js';

// État interne
const state = {
  schoolStats: [], // Stats par école
  overview: null, // Stats overview (mono-école)
  loading: {
    schools: false,
    overview: false
  },
  errors: {
    schools: null,
    overview: null
  }
};

/**
 * Récupère les statistiques par établissement (multi-écoles)
 * @returns {Promise<Array>}
 */
export async function fetchSchoolStats() {
  state.loading.schools = true;
  state.errors.schools = null;

  try {
    const response = await api.get('/stats/schools');
    
    if (response.success && Array.isArray(response.data)) {
      state.schoolStats = response.data;
      return response.data;
    } else {
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error('[Store Stats] Erreur lors de la récupération des stats écoles:', error);
    state.errors.schools = error.message || 'Erreur lors du chargement des statistiques';
    throw error;
  } finally {
    state.loading.schools = false;
  }
}

/**
 * Récupère les statistiques d'aperçu (mono-école)
 * @returns {Promise<object>}
 */
export async function fetchOverviewStats() {
  state.loading.overview = true;
  state.errors.overview = null;

  try {
    const response = await api.get('/stats/overview');
    
    if (response.success && response.data) {
      state.overview = response.data;
      return response.data;
    } else {
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error('[Store Stats] Erreur lors de la récupération des stats overview:', error);
    state.errors.overview = error.message || 'Erreur lors du chargement des statistiques';
    throw error;
  } finally {
    state.loading.overview = false;
  }
}

/**
 * Récupère les stats écoles depuis le state (sans appel API)
 * @returns {Array}
 */
export function getSchoolStats() {
  return [...state.schoolStats];
}

/**
 * Récupère les stats overview depuis le state (sans appel API)
 * @returns {object|null}
 */
export function getOverviewStats() {
  return state.overview ? { ...state.overview } : null;
}

/**
 * Vérifie si les stats écoles sont en cours de chargement
 * @returns {boolean}
 */
export function isLoadingSchools() {
  return state.loading.schools === true;
}

/**
 * Vérifie si les stats overview sont en cours de chargement
 * @returns {boolean}
 */
export function isLoadingOverview() {
  return state.loading.overview === true;
}

/**
 * Récupère l'erreur éventuelle pour les stats écoles
 * @returns {string|null}
 */
export function getSchoolsError() {
  return state.errors.schools || null;
}

/**
 * Récupère l'erreur éventuelle pour les stats overview
 * @returns {string|null}
 */
export function getOverviewError() {
  return state.errors.overview || null;
}

/**
 * Réinitialise le state
 */
export function clearStats() {
  state.schoolStats = [];
  state.overview = null;
  state.loading = { schools: false, overview: false };
  state.errors = { schools: null, overview: null };
}

export default {
  fetchSchoolStats,
  fetchOverviewStats,
  getSchoolStats,
  getOverviewStats,
  isLoadingSchools,
  isLoadingOverview,
  getSchoolsError,
  getOverviewError,
  clearStats
};

