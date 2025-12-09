/**
 * Store Social Entries - Gestion des entrées sociales
 * Gère l'état des entrées sociales et les appels API
 */

import api from '../../app-service.js';

// État interne
const state = {
  entries: [], // Liste des entrées
  entryById: {}, // Cache par ID
  loading: false,
  error: null
};

/**
 * Récupère toutes les entrées sociales
 * @returns {Promise<Array>}
 */
export async function fetchSocialEntries() {
  state.loading = true;
  state.error = null;

  try {
    const response = await api.get('/social');
    
    if (response.success && Array.isArray(response.data)) {
      state.entries = response.data;
      // Mettre à jour le cache par ID
      state.entryById = {};
      response.data.forEach(entry => {
        state.entryById[entry.id] = entry;
      });
      return response.data;
    } else {
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error('[Store Social Entries] Erreur lors de la récupération des entrées:', error);
    state.error = error.message || 'Erreur lors du chargement des entrées sociales';
    throw error;
  } finally {
    state.loading = false;
  }
}

/**
 * Récupère une entrée sociale par ID
 * @param {number} id - ID de l'entrée
 * @returns {Promise<object>}
 */
export async function fetchSocialEntry(id) {
  if (!id) {
    throw new Error('ID requis');
  }

  // Vérifier le cache
  if (state.entryById[id]) {
    return state.entryById[id];
  }

  state.loading = true;
  state.error = null;

  try {
    const response = await api.get(`/social/${id}`);
    
    if (response.success && response.data) {
      state.entryById[id] = response.data;
      return response.data;
    } else {
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error(`[Store Social Entries] Erreur lors de la récupération de l'entrée ${id}:`, error);
    state.error = error.message || 'Erreur lors du chargement de l\'entrée sociale';
    throw error;
  } finally {
    state.loading = false;
  }
}

/**
 * Crée une nouvelle entrée sociale
 * @param {object} payload - { type, title, description, payload, school_id }
 * @returns {Promise<object>}
 */
export async function createSocialEntry(payload) {
  if (!payload || !payload.title || !payload.type) {
    throw new Error('title et type sont requis');
  }

  const allowedTypes = ['rule', 'message', 'config'];
  if (!allowedTypes.includes(payload.type)) {
    throw new Error(`Type invalide. Valeurs autorisées: ${allowedTypes.join(', ')}`);
  }

  state.loading = true;
  state.error = null;

  try {
    const response = await api.post('/social', payload);
    
    if (response.success && response.data) {
      // Ajouter à la liste et au cache
      state.entries.unshift(response.data);
      state.entryById[response.data.id] = response.data;
      return response.data;
    } else {
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error('[Store Social Entries] Erreur lors de la création de l\'entrée:', error);
    state.error = error.message || 'Erreur lors de la création de l\'entrée sociale';
    throw error;
  } finally {
    state.loading = false;
  }
}

/**
 * Met à jour une entrée sociale
 * @param {number} id - ID de l'entrée
 * @param {object} payload - Données à mettre à jour
 * @returns {Promise<object>}
 */
export async function updateSocialEntry(id, payload) {
  if (!id) {
    throw new Error('ID requis');
  }

  state.loading = true;
  state.error = null;

  try {
    const response = await api.put(`/social/${id}`, payload);
    
    if (response.success && response.data) {
      // Mettre à jour dans la liste et le cache
      const index = state.entries.findIndex(e => e.id === id);
      if (index !== -1) {
        state.entries[index] = response.data;
      }
      state.entryById[id] = response.data;
      return response.data;
    } else {
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error(`[Store Social Entries] Erreur lors de la mise à jour de l'entrée ${id}:`, error);
    state.error = error.message || 'Erreur lors de la mise à jour de l\'entrée sociale';
    throw error;
  } finally {
    state.loading = false;
  }
}

/**
 * Supprime une entrée sociale
 * @param {number} id - ID de l'entrée
 * @returns {Promise<void>}
 */
export async function deleteSocialEntry(id) {
  if (!id) {
    throw new Error('ID requis');
  }

  state.loading = true;
  state.error = null;

  try {
    const response = await api.delete(`/social/${id}`);
    
    if (response.success) {
      // Retirer de la liste et du cache
      state.entries = state.entries.filter(e => e.id !== id);
      delete state.entryById[id];
      return;
    } else {
      throw new Error('Format de réponse invalide');
    }
  } catch (error) {
    console.error(`[Store Social Entries] Erreur lors de la suppression de l'entrée ${id}:`, error);
    state.error = error.message || 'Erreur lors de la suppression de l\'entrée sociale';
    throw error;
  } finally {
    state.loading = false;
  }
}

/**
 * Récupère les entrées depuis le state (sans appel API)
 * @returns {Array}
 */
export function getSocialEntries() {
  return [...state.entries];
}

/**
 * Récupère une entrée par ID depuis le state (sans appel API)
 * @param {number} id - ID de l'entrée
 * @returns {object|null}
 */
export function getSocialEntryById(id) {
  return state.entryById[id] || null;
}

/**
 * Vérifie si les entrées sont en cours de chargement
 * @returns {boolean}
 */
export function isLoading() {
  return state.loading === true;
}

/**
 * Récupère l'erreur éventuelle
 * @returns {string|null}
 */
export function getError() {
  return state.error || null;
}

/**
 * Réinitialise le state
 */
export function clearSocialEntries() {
  state.entries = [];
  state.entryById = {};
  state.loading = false;
  state.error = null;
}

export default {
  fetchSocialEntries,
  fetchSocialEntry,
  createSocialEntry,
  updateSocialEntry,
  deleteSocialEntry,
  getSocialEntries,
  getSocialEntryById,
  isLoading,
  getError,
  clearSocialEntries
};

